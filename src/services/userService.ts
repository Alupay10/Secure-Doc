import { supabase } from './supabaseClient';
import { handleError } from '../utils/errorHandler';
import { logActivity } from './auditService';

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'admin';
  status: 'active' | 'suspended';
}

/**
 * Fetches all user profiles from the database.
 * Requires admin privileges.
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) throw error;
    return data as UserProfile[];
  } catch (error) {
    handleError(error, 'Failed to fetch users');
    return [];
  }
};

/**
 * Updates the role of a specific user.
 * Requires admin privileges.
 */
export const updateUserRole = async (
  targetUserId: string,
  newRole: 'student' | 'admin',
  adminUser: { id: string; email: string }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', targetUserId);

    if (error) throw error;

    // Log this critical action
    await logActivity({
      user_id: adminUser.id,
      user_email: adminUser.email,
      action: 'User Role Updated',
      resource: `user:${targetUserId}`,
      details: { new_role: newRole },
      user_agent: navigator.userAgent,
    });

  } catch (error) {
    handleError(error, 'Failed to update user role');
    throw error; // Re-throw to be caught by the UI
  }
};

/**
 * Updates the status of a specific user.
 * Requires admin privileges.
 */
export const updateUserStatus = async (
  targetUserId: string,
  newStatus: 'active' | 'suspended',
  adminUser: { id: string; email: string }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ status: newStatus })
      .eq('id', targetUserId);

    if (error) throw error;

    // Log this action
    await logActivity({
      user_id: adminUser.id,
      user_email: adminUser.email,
      action: `User Access ${newStatus === 'active' ? 'Enabled' : 'Suspended'}`,
      resource: `user:${targetUserId}`,
      details: { new_status: newStatus },
      user_agent: navigator.userAgent,
    });

  } catch (error) {
    handleError(error, 'Failed to update user status');
    throw error; // Re-throw to be caught by the UI
  }
};
