import {
  CognitoIdentityProviderClient,
  StartWebAuthnRegistrationCommand,
  CompleteWebAuthnRegistrationCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { decodeBase64URL, encodeBase64URL } from "../utils";
import {
  CredentialResponseJSON,
  PublicKeyCredentialCreationOptions,
} from "../types";
import { startRegistration } from "@simplewebauthn/browser";
import type { 
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON
} from "@simplewebauthn/types";

type CognitoPasskeyRegisterConfig = {
  region: string;
};

export class CognitoPasskeyRegister {
  private client: CognitoIdentityProviderClient;

  constructor(config: CognitoPasskeyRegisterConfig) {
    this.client = new CognitoIdentityProviderClient({ region: config.region });
  }

  async registerWithPasskey(accessToken: string): Promise<void> {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported in this browser");
    }

    const start = await this.client.send(
      new StartWebAuthnRegistrationCommand({
        AccessToken: accessToken,
      })
    );

    if (!start.CredentialCreationOptions) {
      throw new Error("Missing CredentialCreationOptions from Cognito");
    }

    // Cast to known type so TypeScript understands its structure
    const options = start.CredentialCreationOptions as unknown as PublicKeyCredentialCreationOptions;

    try {
      // Convert Cognito options to SimpleWebAuthn format
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptionsJSON = {
        challenge: options.challenge,
        rp: options.rp,
        user: {
          ...options.user,
          id: options.user.id,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        excludeCredentials: options.excludeCredentials?.map(cred => ({
          ...cred,
          id: cred.id,
          transports: cred.transports || [],
        })) || [],
        authenticatorSelection: options.authenticatorSelection || {
          requireResidentKey: false,
          userVerification: "preferred",
        },
        attestation: options.attestation || "none",
        extensions: options.extensions || {},
      };

      console.log("DEBUG - Using SimpleWebAuthn with options:", publicKeyCredentialCreationOptions);

      // Use SimpleWebAuthn library to handle the registration
      const registrationResponse = await startRegistration({
        optionsJSON: publicKeyCredentialCreationOptions,
      });
      
      console.log("DEBUG - SimpleWebAuthn registration response:", registrationResponse);

      // Log the raw registration response
      console.log("DEBUG - Raw registration response:", JSON.stringify(registrationResponse));
      
      // Try to format the response in a way that Cognito might expect
      const formattedResponse = {
        id: registrationResponse.id,
        rawId: registrationResponse.rawId,
        type: registrationResponse.type,
        response: {
          clientDataJSON: registrationResponse.response.clientDataJSON,
          attestationObject: registrationResponse.response.attestationObject,
        }
      };
      
      console.log("DEBUG - Formatted response:", JSON.stringify(formattedResponse));
      
      // Send the formatted response to Cognito
      await this.client.send(
        new CompleteWebAuthnRegistrationCommand({
          AccessToken: accessToken,
          Credential: JSON.stringify(formattedResponse),
        })
      );
    } catch (error) {
      console.error("Error during passkey registration:", error);
      throw error;
    }
  }

  private convertAttestationToResponseJSON(credential: PublicKeyCredential): CredentialResponseJSON {
    const attestation = credential.response as AuthenticatorAttestationResponse;
    
    // Log the raw credential for debugging
    console.log("DEBUG - Raw credential object:", credential);
    
    // Try a completely different approach - use the credential object directly
    // Create a serializable version of the credential
    const serializableCredential = {
      id: credential.id,
      rawId: credential.id, // Use the same value for both
      type: credential.type,
      response: {
        clientDataJSON: encodeBase64URL(attestation.clientDataJSON),
        attestationObject: encodeBase64URL(attestation.attestationObject),
      },
    };
    
    // Log the serialized credential
    console.log("DEBUG - Serialized credential:", JSON.stringify(serializableCredential));
    
    // Return the serialized credential
    return serializableCredential;
  }
}
