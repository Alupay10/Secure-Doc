import { supabase } from './supabaseClient';
import { handleError } from '../utils/errorHandler';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  details: any;
  user_agent: string;
  created_at: string;
}

export interface ActivityFilters {
  limit?: number;
  offset?: number;
  user_id?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export const logActivity = async (log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<void> => {
  try {
    const { error } = await supabase.from('activity_logs').insert(log);
    if (error) throw error;
  } catch (error) {
    handleError(error, 'Failed to log activity');
  }
};

export const getRecentActivity = async (filters: ActivityFilters): Promise<ActivityLog[]> => {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 10);

    const { data, error } = await query;
    if (error) throw error;
    return data as ActivityLog[];
  } catch (error) {
    handleError(error, 'Failed to fetch recent activity');
    return [];
  }
};

/**
 * Get activity logs with optional filters
 */
export const getActivityLogs = async (
  filters: ActivityFilters
): Promise<{ logs: ActivityLog[], count: number }> => {
  try {
    let query = supabase.from('activity_logs').select('*', { count: 'exact' });

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.action) query = query.ilike('action', `%${filters.action}%`);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    query = query
      .order('created_at', { ascending: false })
      .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 10) - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { logs: data as ActivityLog[], count: count ?? 0 };
  } catch (error) {
    handleError(error, 'Failed to fetch activity logs');
    return { logs: [], count: 0 };
  }
};

/**
 * Get activity log by ID
 */
export const getActivityLogById = async (logId: string): Promise<ActivityLog> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Activity log not found');

  return data as ActivityLog;
};

/**
 * Get activity statistics (for admin dashboard)
 */
export const getActivityStats = async (
  startDate?: string,
  endDate?: string
) => {
  let query = supabase
    .from('activity_logs')
    .select('action, user_id');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = {
    totalActivities: data?.length || 0,
    byAction: {} as Record<string, number>,
    uniqueUsers: new Set((data || []).map((log) => log.user_id)).size,
  };

  // Group by action
  (data || []).forEach((log) => {
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
  });

  return stats;
};



/**
 * Get activity timeline for a user
 */
export const getUserActivityTimeline = async (
  userId: string,
  limit: number = 50
): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as ActivityLog[];
};

/**
 * Export activity logs to CSV (for compliance/auditing)
 */
export const exportActivityLogs = async (
  filters?: {
    user_id?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<string> => {
  const { logs } = await getActivityLogs({
    user_id: filters?.user_id,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    limit: 10000, // Fetch up to 10k records for export
  });

  // Create CSV header
  const headers = ['ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Resource'];
  const rows = logs.map((log) => [
    log.id,
    log.created_at,
    log.user_id,
    log.user_email || '',
    log.action,
    log.resource,
  ]);

  const csv =
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

  return csv;
};
