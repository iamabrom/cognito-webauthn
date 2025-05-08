export interface InitiateAuthWebAuthnChallengeResponse {
  challengeName: "WEB_AUTHN";
  session: string;
  credentialRequestOptions: PublicKeyCredentialRequestOptions;
}

export interface PublicKeyCredentialDescriptor {
  type: PublicKeyCredentialType;
  id: string; // Base64URL string
  transports?: AuthenticatorTransport[];
}

export interface PublicKeyCredentialRequestOptions {
  challenge: string; // Base64URL string
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: "required" | "preferred" | "discouraged";
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface PublicKeyCredentialUserEntity {
  id: string; // Base64URL string
  name: string;
  displayName: string;
}

export interface PublicKeyCredentialCreationOptions {
  challenge: string; // Base64URL string
  rp: {
    name: string;
    id?: string;
  };
  user: PublicKeyCredentialUserEntity;
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptor[];
  authenticatorSelection?: {
    residentKey?: "required" | "preferred" | "discouraged";
    userVerification?: "required" | "preferred" | "discouraged";
    authenticatorAttachment?: "platform" | "cross-platform";
    requireResidentKey?: boolean; // legacy alias
  };
  attestation?: "none" | "indirect" | "direct" | "enterprise";
  extensions?: AuthenticationExtensionsClientInputs;
}

// 🔐 Returned from assertion (sign-in)
export interface AuthenticationResponseJSON {
  id: string;
  rawId: string; // Base64URL
  type: string;
  response: {
    clientDataJSON: string; // Base64URL
    authenticatorData: string; // Base64URL
    signature: string; // Base64URL
    userHandle?: string; // Base64URL (optional)
  };
}

// 🔐 Returned from attestation (registration)
export interface CredentialResponseJSON {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject?: string; // optional, not used by Cognito
  };
  authenticatorAttachment?: string;
  clientExtensionResults?: any;
  transports?: string[];
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}
