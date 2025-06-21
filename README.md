# @iamabrom/cognito-webauthn

A TypeScript SDK for Amazon Cognito Passkey (WebAuthn) authentication and registration. This library provides a simple interface to integrate passkey authentication with Amazon Cognito User Pools.

## Features

- 🔐 **Passkey Registration**: Register new passkeys for users
- 🚀 **Passkey Authentication**: Authenticate users with existing passkeys
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🌐 **Browser Support**: Works in all modern browsers that support WebAuthn
- ⚡ **AWS SDK v3**: Built on the latest AWS SDK for JavaScript v3

## Installation

```bash
npm install @iamabrom/cognito-webauthn
```

## Prerequisites

- Amazon Cognito User Pool with WebAuthn enabled
- Modern browser with WebAuthn support
- AWS SDK for JavaScript v3

## Usage

### Authentication (Sign In)

```typescript
import { CognitoPasskeyAuth } from '@iamabrom/cognito-webauthn';

const auth = new CognitoPasskeyAuth({
  region: 'us-east-1',
  clientId: 'your-cognito-client-id',
  clientSecret: 'your-client-secret', // Optional, only if your app client has a secret
});

try {
  const tokens = await auth.signIn('username@example.com');
  if (tokens) {
    console.log('Authentication successful!');
    console.log('Access Token:', tokens.accessToken);
    console.log('ID Token:', tokens.idToken);
    console.log('Refresh Token:', tokens.refreshToken);
  }
} catch (error) {
  console.error('Authentication failed:', error);
}
```

**Note**: The SDK uses the `USER_AUTH` flow with `PREFERRED_CHALLENGE: "WEB_AUTHN"` to properly integrate with Amazon Cognito's unified authentication system.

### Registration

```typescript
import { CognitoPasskeyRegister } from '@iamabrom/cognito-webauthn';

const register = new CognitoPasskeyRegister({
  region: 'us-east-1',
});

try {
  // You need a valid access token from a logged-in user
  await register.registerWithPasskey(accessToken);
  console.log('Passkey registered successfully!');
} catch (error) {
  console.error('Registration failed:', error);
}
```

### Complete Example

```typescript
import { CognitoPasskeyAuth, CognitoPasskeyRegister } from '@iamabrom/cognito-webauthn';

// Initialize the auth client
const auth = new CognitoPasskeyAuth({
  region: 'us-east-1',
  clientId: 'your-cognito-client-id',
});

// Initialize the registration client
const register = new CognitoPasskeyRegister({
  region: 'us-east-1',
});

// Sign in with passkey
async function signInWithPasskey(username: string) {
  try {
    const tokens = await auth.signIn(username);
    return tokens;
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
}

// Register a new passkey (requires existing authentication)
async function registerPasskey(accessToken: string) {
  try {
    await register.registerWithPasskey(accessToken);
    console.log('Passkey registered successfully');
  } catch (error) {
    console.error('Passkey registration failed:', error);
    throw error;
  }
}
```

## API Reference

### CognitoPasskeyAuth

#### Constructor

```typescript
new CognitoPasskeyAuth(config: CognitoPasskeyAuthConfig)
```

**Parameters:**
- `config.region` (string): AWS region where your Cognito User Pool is located
- `config.clientId` (string): Your Cognito User Pool App Client ID
- `config.clientSecret` (string, optional): App Client Secret (if your client has one)

#### Methods

##### `signIn(username: string): Promise<AuthTokens | undefined>`

Authenticates a user using their passkey.

**Parameters:**
- `username` (string): The username/email of the user

**Returns:**
- `AuthTokens` object containing access token, ID token, and refresh token
- `undefined` if authentication fails

### CognitoPasskeyRegister

#### Constructor

```typescript
new CognitoPasskeyRegister(config: CognitoPasskeyRegisterConfig)
```

**Parameters:**
- `config.region` (string): AWS region where your Cognito User Pool is located

#### Methods

##### `registerWithPasskey(accessToken: string): Promise<void>`

Registers a new passkey for the authenticated user.

**Parameters:**
- `accessToken` (string): Valid access token from an authenticated user

## Types

### AuthTokens

```typescript
interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}
```

## Browser Support

This library requires browsers that support:
- WebAuthn API (`navigator.credentials`)
- Web Crypto API (`crypto.subtle`)
- Modern JavaScript features (ES2020+)

Supported browsers include:
- Chrome 67+
- Firefox 60+
- Safari 14+
- Edge 18+

## Error Handling

The library throws descriptive errors for various failure scenarios:

```typescript
try {
  const tokens = await auth.signIn('user@example.com');
} catch (error) {
  if (error.message.includes('WebAuthn is not supported')) {
    // Handle unsupported browser
  } else if (error.message.includes('Failed to get credential assertion')) {
    // Handle user cancellation or no passkey found
  } else {
    // Handle other errors
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/iamabrom/cognito-webauthn/issues).
