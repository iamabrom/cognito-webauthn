import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  RespondToAuthChallengeCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { decodeBase64URL, encodeBase64URL, generateSecretHash } from "../utils";
import {
  AuthTokens,
  AuthenticationResponseJSON,
  InitiateAuthWebAuthnChallengeResponse,
  PublicKeyCredentialRequestOptions,
} from "../types";

type CognitoPasskeyAuthConfig = {
  region: string;
  clientId: string;
  clientSecret?: string;
};

type RawAuthResult = NonNullable<RespondToAuthChallengeCommandOutput["AuthenticationResult"]>;

export class CognitoPasskeyAuth {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret?: string;

  constructor(config: CognitoPasskeyAuthConfig) {
    this.client = new CognitoIdentityProviderClient({ region: config.region });
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async signIn(username: string): Promise<AuthTokens | undefined> {
    const authParams: Record<string, string> = { USERNAME: username };

    if (this.clientSecret) {
      authParams.SECRET_HASH = await generateSecretHash(username, this.clientId, this.clientSecret);
    }

    const authResponse = await this.client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_AUTH",
        AuthParameters: authParams,
        ClientId: this.clientId,
      })
    );

    if (authResponse.ChallengeName !== "WEB_AUTHN") {
      throw new Error(`Expected WEB_AUTHN challenge, received: ${authResponse.ChallengeName}`);
    }

    const session = authResponse.Session!;
    const optionsRaw = authResponse.ChallengeParameters?.CREDENTIAL_REQUEST_OPTIONS;
    if (!optionsRaw) throw new Error("Missing CREDENTIAL_REQUEST_OPTIONS");

    const options: PublicKeyCredentialRequestOptions = JSON.parse(optionsRaw);

    const parsedChallenge: InitiateAuthWebAuthnChallengeResponse = {
      challengeName: "WEB_AUTHN",
      session,
      credentialRequestOptions: options,
    };

    const assertion = await navigator.credentials.get({
      publicKey: {
        ...options,
        challenge: decodeBase64URL(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred) => ({
          ...cred,
          id: decodeBase64URL(cred.id),
        })),
      },
    });

    const credential = this.convertAssertionToResponseJSON(assertion as PublicKeyCredential);

    const finalResponse = await this.client.send(
      new RespondToAuthChallengeCommand({
        ChallengeName: "WEB_AUTHN",
        ClientId: this.clientId,
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          ANSWER: "WEB_AUTHN",
          CREDENTIAL: JSON.stringify(credential),
        },
      })
    );

    return finalResponse.AuthenticationResult
      ? this.normalizeTokens(finalResponse.AuthenticationResult)
      : undefined;
  }

  private convertAssertionToResponseJSON(credential: PublicKeyCredential): AuthenticationResponseJSON {
    const authResponse = credential.response as AuthenticatorAssertionResponse;
    return {
      id: credential.id,
      rawId: encodeBase64URL(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: encodeBase64URL(authResponse.clientDataJSON),
        authenticatorData: encodeBase64URL(authResponse.authenticatorData),
        signature: encodeBase64URL(authResponse.signature),
        userHandle: authResponse.userHandle ? encodeBase64URL(authResponse.userHandle) : undefined,
      },
    };
  }

  private normalizeTokens(result: RawAuthResult): AuthTokens {
    return {
      accessToken: result.AccessToken!,
      idToken: result.IdToken!,
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn,
      tokenType: result.TokenType,
    };
  }
}