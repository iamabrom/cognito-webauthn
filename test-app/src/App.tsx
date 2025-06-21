import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import type { AuthTokens } from '@iamabrom/cognito-webauthn';
import './App.css';

interface User {
  tokens: AuthTokens;
  firstName?: string;
  email: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored tokens on app load
    const storedTokens = localStorage.getItem('authTokens');
    const storedUser = localStorage.getItem('userInfo');
    
    if (storedTokens && storedUser) {
      try {
        const tokens = JSON.parse(storedTokens);
        const userInfo = JSON.parse(storedUser);
        setUser({ tokens, ...userInfo });
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (tokens: AuthTokens, userInfo: { firstName?: string; email: string }) => {
    const user = { tokens, ...userInfo };
    setUser(user);
    
    // Store tokens and user info
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('userInfo');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {user ? (
        <DashboardScreen user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
