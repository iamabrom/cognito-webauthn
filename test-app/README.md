# Cognito WebAuthn Test Application

This is a comprehensive test application for the `@iamabrom/cognito-webauthn` SDK. It demonstrates both passkey authentication and registration functionality with Amazon Cognito User Pools.

## Features

- 🔐 **Passkey Authentication**: Sign in using WebAuthn/Passkeys
- 🔑 **Password Authentication**: Traditional username/password login
- 📝 **User Registration**: Create new accounts with email verification
- 🛡️ **Passkey Registration**: Register new passkeys for existing users
- 🎨 **Beautiful UI**: Modern, responsive design with fullscreen background
- 📱 **Mobile Friendly**: Responsive design that works on all devices

## Prerequisites

Before running this test application, you need:

1. **AWS Account** with access to Amazon Cognito
2. **Cognito User Pool** configured with WebAuthn enabled
3. **Modern Browser** that supports WebAuthn (Chrome 67+, Firefox 60+, Safari 14+, Edge 18+)

## Setup Instructions

### 1. Configure Cognito User Pool

1. **Create a User Pool** in AWS Cognito Console
2. **Enable WebAuthn** in the User Pool settings:
   - Go to "Sign-in experience" tab
   - Under "Multi-factor authentication", enable "Passkey (WebAuthn)"
3. **Create an App Client**:
   - Go to "App integration" tab
   - Create a new App Client (public or private)
   - Note down the Client ID (and Client Secret if private)
4. **Configure Authentication Flows**:
   - Enable "USER_AUTH" flow (handles both passkey and password authentication)

### 2. Configure the Application

1. **Update Configuration**:
   ```typescript
   // src/config.ts
   export const COGNITO_CONFIG = {
     region: 'your-aws-region', // e.g., 'us-east-1'
     clientId: 'your-client-id', // Your Cognito App Client ID
     // clientSecret: 'your-client-secret', // Uncomment if using private client
   };
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Usage Guide

### Initial Setup Flow

1. **Create Account**:
   - Enter a valid email address
   - Click "Create Account"
   - Fill in first name, email, and password
   - Check your email for verification code
   - Enter verification code to confirm account

2. **Login with Password**:
   - Enter your email address
   - Enter your password in the password field
   - Click "Login with Password"

3. **Register a Passkey**:
   - Once logged in, click "Register New Passkey"
   - Follow your browser's prompts to create a passkey
   - This will associate a passkey with your account

4. **Login with Passkey**:
   - Logout and return to login screen
   - Enter your email address
   - Click "Login with Passkey"
   - Use your device's authentication (Face ID, Touch ID, PIN, etc.)

### Testing Different Scenarios

#### Public vs Private App Client
- **Public Client**: Leave `clientSecret` commented out in config
- **Private Client**: Uncomment and set `clientSecret` in config

#### Error Handling
- Try logging in without a registered passkey
- Try using an invalid email format
- Test with WebAuthn disabled browsers
- Test network connectivity issues

#### Browser Compatibility
- Test on different browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Test with different authentication methods (biometrics, PIN, etc.)

## Application Structure

```
src/
├── components/
│   ├── LoginScreen.tsx      # Login interface with multiple auth options
│   ├── LoginScreen.css      # Styling for login screen
│   ├── DashboardScreen.tsx  # Post-login dashboard
│   └── DashboardScreen.css  # Styling for dashboard
├── (uses @iamabrom/cognito-webauthn NPM package)
├── config.ts                # Centralized configuration
├── App.tsx                  # Main application component
└── App.css                  # Global styles
```

## Key Features Demonstrated

### Authentication Methods
1. **Passkey Authentication** (using your SDK)
2. **Password Authentication** (using AWS SDK directly)
3. **Account Creation** with email verification

### SDK Integration
- **CognitoPasskeyAuth**: Demonstrates passkey sign-in
- **CognitoPasskeyRegister**: Demonstrates passkey registration
- **Error Handling**: Shows proper error handling for various scenarios
- **Token Management**: Demonstrates token storage and usage

### UI/UX Features
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Shows loading indicators during operations
- **Error Messages**: Clear error messaging for users
- **Success Feedback**: Confirmation messages for successful operations
- **Token Display**: Debug information showing token details

## Testing Checklist

Use this checklist to thoroughly test your SDK:

### Basic Functionality
- [ ] Account creation with email verification
- [ ] Password-based login
- [ ] Passkey registration for authenticated users
- [ ] Passkey-based login
- [ ] Logout functionality

### Error Scenarios
- [ ] Invalid email format handling
- [ ] Missing passkey error handling
- [ ] WebAuthn not supported error
- [ ] Network error handling
- [ ] Invalid credentials handling

### Browser Compatibility
- [ ] Chrome (desktop and mobile)
- [ ] Firefox (desktop and mobile)
- [ ] Safari (desktop and mobile)
- [ ] Edge (desktop)

### Client Types
- [ ] Public app client (no secret)
- [ ] Private app client (with secret)

### Authentication Methods
- [ ] Biometric authentication (Face ID, Touch ID)
- [ ] PIN-based authentication
- [ ] Hardware security keys

## Troubleshooting

### Common Issues

1. **"WebAuthn is not supported"**
   - Ensure you're using a modern browser
   - Check if the site is served over HTTPS (required for WebAuthn)

2. **"No passkey found"**
   - Make sure you've registered a passkey first
   - Check if the passkey is associated with the correct email

3. **Configuration errors**
   - Verify your Cognito User Pool settings
   - Check that WebAuthn is enabled in Cognito
   - Ensure the correct region and client ID are configured

4. **Network errors**
   - Check your AWS credentials and permissions
   - Verify the Cognito User Pool exists and is accessible

### Debug Information

The application includes a debug panel showing:
- Access tokens (truncated for security)
- ID tokens (truncated for security)
- Token expiration times
- User information extracted from tokens

## Next Steps

After testing, you can:

1. **Publish the SDK** to NPM if all tests pass
2. **Integrate into your production application**
3. **Customize the UI** to match your brand
4. **Add additional features** like token refresh, MFA, etc.

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Cognito configuration
3. Test with different browsers and devices
4. Review the SDK source code for debugging
