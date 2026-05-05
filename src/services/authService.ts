import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'student' | 'admin';

export interface UserProfile extends User {
  role?: UserRole;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'student' // default role for new users
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('User creation failed');

  return data.user;
};

/**
 * Sign in user with email and password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Login failed');

  return {
    user: data.user,
    session: data.session,
  };
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get current authenticated user
 */
export const getUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user || null;
};

/**
 * Get current session
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
};

/**
 * Listen for authentication state changes
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
) => {
  const { data } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session?.user || null);
    }
  );

  return data?.subscription;
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
};

/**
 * Update user metadata (e.g., role)
 */
export const updateUserMetadata = async (metadata: Record<string, any>) => {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) throw error;
  return data.user;
};

/**
 * Get user role from metadata
 */
export const getUserRole = async (): Promise<UserRole> => {
  const user = await getUser();
  const role = user?.user_metadata?.role || 'student';
  return role as UserRole;
};
