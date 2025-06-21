import React, { useState } from 'react';
import { CognitoPasskeyAuth } from '@iamabrom/cognito-webauthn';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AuthTokens } from '@iamabrom/cognito-webauthn';
import './LoginScreen.css';
import { COGNITO_CONFIG } from '../config';

interface LoginScreenProps {
  onLogin: (tokens: AuthTokens, userInfo: { firstName?: string; email: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm'>('login');
  const [showButtons, setShowButtons] = useState(false);

  const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_CONFIG.region });
  const passkeyAuth = new CognitoPasskeyAuth(COGNITO_CONFIG);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setShowButtons(isValidEmail(newEmail));
    setError('');
  };

  const parseIdToken = (idToken: string) => {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      return {
        firstName: payload.given_name,
        email: payload.email,
      };
    } catch (error) {
      console.error('Error parsing ID token:', error);
      return { email };
    }
  };

  const handlePasskeyLogin = async () => {
    if (!isValidEmail(email)) return;
    
    setLoading(true);
    setError('');
    
    try {
      const tokens = await passkeyAuth.signIn(email);
      if (tokens) {
        const userInfo = parseIdToken(tokens.idToken);
        onLogin(tokens, userInfo);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Passkey login error:', error);
      if (error.message.includes('WebAuthn is not supported')) {
        setError('Passkeys are not supported in this browser.');
      } else if (error.message.includes('Failed to get credential assertion')) {
        setError('No passkey found or authentication was cancelled.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!isValidEmail(email) || !password) return;
    
    setLoading(true);
    setError('');
    
    try {
      const authParams: Record<string, string> = {
        USERNAME: email,
        PASSWORD: password,
        PREFERRED_CHALLENGE: 'PASSWORD',
      };

      // Add SECRET_HASH if using private client
      if (COGNITO_CONFIG.clientSecret) {
        // For now, we'll implement a simple SECRET_HASH generation here
        // In a real app, you might want to expose this utility from the main package
        const encoder = new TextEncoder();
        const keyData = encoder.encode(COGNITO_CONFIG.clientSecret);
        const message = encoder.encode(email + COGNITO_CONFIG.clientId);

        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );

        const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
        authParams.SECRET_HASH = btoa(String.fromCharCode(...new Uint8Array(signature)));
      }

      const response = await cognitoClient.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_AUTH',
          AuthParameters: authParams,
          ClientId: COGNITO_CONFIG.clientId,
        })
      );

      if (response.AuthenticationResult) {
        const tokens: AuthTokens = {
          accessToken: response.AuthenticationResult.AccessToken!,
          idToken: response.AuthenticationResult.IdToken!,
          refreshToken: response.AuthenticationResult.RefreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn,
          tokenType: response.AuthenticationResult.TokenType,
        };
        
        const userInfo = parseIdToken(tokens.idToken);
        onLogin(tokens, userInfo);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Password login error:', error);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!isValidEmail(email) || !password || !firstName) return;
    
    setLoading(true);
    setError('');
    
    try {
      await cognitoClient.send(
        new SignUpCommand({
          ClientId: COGNITO_CONFIG.clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'given_name', Value: firstName },
          ],
        })
      );
      
      setMode('confirm');
      setError('');
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async () => {
    if (!confirmationCode || !email) return;
    
    setLoading(true);
    setError('');
    
    try {
      await cognitoClient.send(
        new ConfirmSignUpCommand({
          ClientId: COGNITO_CONFIG.clientId,
          Username: email,
          ConfirmationCode: confirmationCode,
        })
      );
      
      setMode('login');
      setError('');
      alert('Account confirmed! You can now log in.');
    } catch (error: any) {
      console.error('Confirmation error:', error);
      setError('Confirmation failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="logo-container">
          <img 
            src="https://images.unsplash.com/photo-1662201966782-395ada85ec09?q=80&w=200&auto=format&fit=crop" 
            alt="Logo" 
            className="logo"
          />
        </div>
        
        {mode === 'login' && (
          <>
            <div className="input-container">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={handleEmailChange}
                className="email-input"
                disabled={loading}
              />
            </div>
            
            {showButtons && (
              <div className="button-container">
                <button
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Signing in...' : 'Login with Passkey'}
                </button>
                
                <button
                  onClick={() => setMode('signup')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Create Account
                </button>
                
                <div className="password-login">
                  <input
                    type="password"
                    placeholder="Password (for password login)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="password-input"
                    disabled={loading}
                  />
                  <button
                    onClick={handlePasswordLogin}
                    disabled={loading || !password}
                    className="btn btn-tertiary"
                  >
                    Login with Password
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {mode === 'signup' && (
          <>
            <div className="input-container">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="name-input"
                disabled={loading}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                disabled={loading}
              />
            </div>
            
            <div className="button-container">
              <button
                onClick={handleSignUp}
                disabled={loading || !firstName || !isValidEmail(email) || !password}
                className="btn btn-primary"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              
              <button
                onClick={() => setMode('login')}
                disabled={loading}
                className="btn btn-secondary"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
        
        {mode === 'confirm' && (
          <>
            <div className="input-container">
              <p>Please check your email for a confirmation code.</p>
              <input
                type="text"
                placeholder="Confirmation Code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="code-input"
                disabled={loading}
              />
            </div>
            
            <div className="button-container">
              <button
                onClick={handleConfirmSignUp}
                disabled={loading || !confirmationCode}
                className="btn btn-primary"
              >
                {loading ? 'Confirming...' : 'Confirm Account'}
              </button>
              
              <button
                onClick={() => setMode('login')}
                disabled={loading}
                className="btn btn-secondary"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};
