import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';

/**
 * AuthContext — provides the authenticated user state to the entire app.
 * Wraps AWS Amplify's auth methods for easy consumption via useAuth() hook.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userAttributes, setUserAttributes] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already signed in on app load
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      setUser(currentUser);
      setUserAttributes(attrs);
    } catch {
      setUser(null);
      setUserAttributes(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setUserAttributes(null);
  };

  const refreshUser = async () => {
    await checkCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, userAttributes, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook — use this in any component to access auth state.
 * Example: const { user, logout } = useAuth();
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
