import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signOut, getUser as getSupabaseUser, onAuthStateChange } from '../../services/authService';
import { handleError } from '../../utils/errorHandler';

type UserRole = 'student' | 'admin';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize current user if session exists
    (async () => {
      try {
        const supUser = await getSupabaseUser();
        if (supUser) {
          setUser({
            id: supUser.id,
            name: (supUser.user_metadata as any)?.full_name || supUser.email || null,
            email: supUser.email || null,
            role: ((supUser.user_metadata as any)?.role as UserRole) || 'student',
          });
        }
      } catch (err) {
        // ignore on init, but log in dev
        handleError(err, 'auth:init', false);
      }
    })();

    // Subscribe to auth state changes
    const subscription = onAuthStateChange((supUser) => {
      if (supUser) {
        setUser({
          id: supUser.id,
          name: (supUser.user_metadata as any)?.full_name || supUser.email || null,
          email: supUser.email || null,
          role: ((supUser.user_metadata as any)?.role as UserRole) || 'student',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    try {
      const { user } = await signIn(email, password);
      const role = (user.user_metadata?.role as UserRole) || 'student';
      return role;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      handleError(err, 'auth:logout');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
