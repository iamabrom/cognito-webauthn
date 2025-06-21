// Configuration file for Cognito settings
// Replace these values with your actual Cognito User Pool settings

export const COGNITO_CONFIG = {
  region: 'us-east-1', // Replace with your AWS region
  clientId: '1tj3gbfpqcniqkv1nbn5enep89', // Replace with your Cognito User Pool App Client ID
  clientSecret: undefined as string | undefined, // Set to your client secret if using private client
};

// Instructions for setup:
// 1. Create a Cognito User Pool in AWS Console
// 2. Enable WebAuthn in the User Pool settings
// 3. Create an App Client (public or private)
// 4. Replace the values above with your actual settings
// 5. If using a private client, uncomment and set the clientSecret
