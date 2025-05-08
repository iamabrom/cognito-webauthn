import {
  CognitoIdentityProviderClient,
  StartWebAuthnRegistrationCommand,
  CompleteWebAuthnRegistrationCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { decodeBase64URL, encodeBase64URL } from "../utils";
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptions,
} from "../types";

type CognitoPasskeyRegisterConfig = {
  region: string;
};

interface ExtendedAttestationResponse extends AuthenticatorAttestationResponse {
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
}

export class CognitoPasskeyRegister {
  private client: CognitoIdentityProviderClient;

  constructor(config: CognitoPasskeyRegisterConfig) {
    this.client = new CognitoIdentityProviderClient({ region: config.region });
  }

  async registerWithPasskey(accessToken: string): Promise<void> {
    const start = await this.client.send(
      new StartWebAuthnRegistrationCommand({
        AccessToken: accessToken,
      })
    );

    if (!start.CredentialCreationOptions) {
      throw new Error("Missing CredentialCreationOptions from Cognito");
    }

    // ✅ Cast to known type so TypeScript understands its structure
    const options = start.CredentialCreationOptions as unknown as PublicKeyCredentialCreationOptions;

    const credential = await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: decodeBase64URL(options.challenge),
        user: {
          ...options.user,
          id: decodeBase64URL(options.user.id),
        },
        excludeCredentials: options.excludeCredentials?.map((cred) => ({
          ...cred,
          id: decodeBase64URL(cred.id),
        })),
      },
    });

    const credentialJSON = this.convertAttestationToResponseJSON(credential as PublicKeyCredential);

    await this.client.send(
      new CompleteWebAuthnRegistrationCommand({
        AccessToken: accessToken,
        Credential: JSON.stringify(credentialJSON),
      })
    );
  }

  private convertAttestationToResponseJSON(credential: PublicKeyCredential): AuthenticationResponseJSON {
    const attestation = credential.response as ExtendedAttestationResponse;
    return {
      id: credential.id,
      rawId: encodeBase64URL(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: encodeBase64URL(attestation.clientDataJSON),
        authenticatorData: encodeBase64URL(attestation.authenticatorData),
        signature: "", // Not used in attestation
        userHandle: undefined,
      },
    };
  }
}
