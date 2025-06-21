import React, { useState } from 'react';
import { CognitoPasskeyRegister } from '@iamabrom/cognito-webauthn';
import type { AuthTokens } from '@iamabrom/cognito-webauthn';
import './DashboardScreen.css';
import { COGNITO_CONFIG } from '../config';

interface User {
  tokens: AuthTokens;
  firstName?: string;
  email: string;
}

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const passkeyRegister = new CognitoPasskeyRegister(COGNITO_CONFIG);

  const decodeJWT = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return { error: 'Failed to decode token' };
    }
  };

  const handleRegisterPasskey = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await passkeyRegister.registerWithPasskey(user.tokens.accessToken);
      setMessage('Passkey registered successfully! You can now use it to sign in.');
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      if (error.message.includes('WebAuthn is not supported')) {
        setError('Passkeys are not supported in this browser.');
      } else if (error.message.includes('Failed to create credential')) {
        setError('Passkey registration was cancelled or failed.');
      } else {
        setError('Failed to register passkey. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.firstName || user.email;

  return (
    <div className="dashboard-screen">
      <div className="dashboard-container">
        <div className="logo-container">
          <img 
            src="https://images.unsplash.com/photo-1662201966782-395ada85ec09?q=80&w=200&auto=format&fit=crop" 
            alt="Logo" 
            className="logo"
          />
        </div>
        
        <div className="welcome-section">
          <h1 className="welcome-message">Hello, {displayName}!</h1>
        </div>
        
        <div className="actions-section">
          <button
            onClick={handleRegisterPasskey}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Registering Passkey...' : 'Register New Passkey'}
          </button>
          
          <button
            onClick={onLogout}
            disabled={loading}
            className="btn btn-secondary logout-btn"
          >
            Logout
          </button>
        </div>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="token-info">
          <details>
            <summary>Token Information (for debugging)</summary>
            <div className="token-details">
              <div className="token-section">
                <h4>Access Token Claims:</h4>
                <pre>{JSON.stringify(decodeJWT(user.tokens.accessToken), null, 2)}</pre>
              </div>
              
              <div className="token-section">
                <h4>ID Token Claims:</h4>
                <pre>{JSON.stringify(decodeJWT(user.tokens.idToken), null, 2)}</pre>
              </div>
              
              {user.tokens.refreshToken && (
                <div className="token-section">
                  <h4>Refresh Token:</h4>
                  <p>{user.tokens.refreshToken.substring(0, 50)}... (opaque token)</p>
                </div>
              )}
              
              <div className="token-section">
                <h4>Token Metadata:</h4>
                <p><strong>Expires In:</strong> {user.tokens.expiresIn} seconds</p>
                <p><strong>Token Type:</strong> {user.tokens.tokenType || 'Bearer'}</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
