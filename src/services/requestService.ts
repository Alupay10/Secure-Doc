import { supabase } from './supabaseClient';
import { logActivity } from './auditService';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Request {
  id: string;
  user_id: string;
  email?: string;
  type: string; // 'Official Transcript', 'Certificate of Enrollment', etc.
  status: RequestStatus;
  purpose: string; // 'Job Application', 'Visa Application', etc.
  date: string; // ISO timestamp
  remarks?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new document request
 */
export const createRequest = async (
  userId: string,
  type: string,
  purpose: string,
  email?: string
): Promise<Request> => {
  const { data, error } = await supabase.from('requests').insert([
    {
      user_id: userId,
      type,
      purpose,
      email: email || '',
      status: 'pending',
      date: new Date().toISOString(),
    },
  ]).select().single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create request');

  await logActivity({
    user_id: userId,
    user_email: email || 'unknown',
    action: 'Created Request',
    resource: 'Document Request',
    details: { requestId: data.id, type, purpose },
    severity: 'info',
    ip_address: '',
    user_agent: navigator.userAgent,
  });

  return data as Request;
};

/**
 * Get all requests for a user
 */
export const getUserRequests = async (userId: string): Promise<Request[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []) as Request[];
};

/**
 * Get request by ID
 */
export const getRequestById = async (requestId: string): Promise<Request> => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Request not found');

  return data as Request;
};

/**
 * Get all requests (admin only - RLS policy enforces this)
 */
export const getAllRequests = async (
  filters?: {
    status?: RequestStatus;
    limit?: number;
    offset?: number;
  }
): Promise<Request[]> => {
  let query = supabase.from('requests').select('*').is('deleted_at', null);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('date', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Request[];
};

/**
 * Update request status (admin only)
 */
export const updateRequestStatus = async (
  requestId: string,
  status: RequestStatus,
  adminUser: { id: string; email: string },
  remarks?: string
): Promise<Request> => {
  const { data, error } = await supabase
    .from('requests')
    .update({
      status,
      remarks: remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update request');

  await logActivity({
    user_id: adminUser.id,
    user_email: adminUser.email,
    action: `Updated Request Status to ${status}`,
    resource: 'Document Request',
    details: { requestId, remarks },
    severity: 'info',
    ip_address: '',
    user_agent: navigator.userAgent,
  });

  return data as Request;
};

/**
 * Delete request (soft delete - sets deleted_at)
 */
export const deleteRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw error;
};

/**
 * Update user-owned request details (students can update pending requests via RLS)
 */
export const updateUserRequest = async (
  requestId: string,
  updates: {
    type: string;
    purpose: string;
    remarks?: string;
  }
): Promise<Request> => {
  const { data, error } = await supabase
    .from('requests')
    .update({
      type: updates.type,
      purpose: updates.purpose,
      remarks: updates.remarks?.trim() ? updates.remarks.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update request');

  return data as Request;
};

/**
 * Get pending requests count (for dashboard)
 */
export const getPendingRequestsCount = async (userId?: string): Promise<number> => {
  let query = supabase
    .from('requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .is('deleted_at', null);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
};

/**
 * Get request statistics (for dashboard)
 */
export const getRequestStats = async (userId?: string) => {
  let query = supabase.from('requests').select('status').is('deleted_at', null);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    pending: data?.filter((r) => r.status === 'pending').length || 0,
    approved: data?.filter((r) => r.status === 'approved').length || 0,
    rejected: data?.filter((r) => r.status === 'rejected').length || 0,
  };

  return stats;
};
