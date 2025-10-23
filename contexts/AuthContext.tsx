'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, Vendor, Customer } from '@/lib/supabase';
import { signIn as authSignIn, signUp as authSignUp, getCurrentUser, decodeToken, SignUpData } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  profile: Vendor | Customer | null;
  token: string | null;
  loading: boolean;
  signIn: (mobile: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Vendor | Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && decoded.exp > Date.now()) {
        setToken(storedToken);
        getCurrentUser(decoded.id).then(data => {
          if (data) {
            setUser(data.user);
            setProfile(data.profile);
          }
          setLoading(false);
        }).catch(() => {
          localStorage.removeItem('auth_token');
          setLoading(false);
        });
      } else {
        localStorage.removeItem('auth_token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (mobile: string, password: string) => {
    const response = await authSignIn(mobile, password);
    setUser(response.user);
    setProfile(response.profile);
    setToken(response.token);
    localStorage.setItem('auth_token', response.token);
  };

  const signUp = async (data: SignUpData) => {
    const response = await authSignUp(data);
    setUser(response.user);
    setProfile(response.profile);
    setToken(response.token);
    localStorage.setItem('auth_token', response.token);
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
