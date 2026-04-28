import { supabase } from './supabaseClient';

export type ActivitySeverity = 'info' | 'warning' | 'critical';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  severity: ActivitySeverity;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Get user's IP address (client-side approximation)
 */
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
};

/**
 * Log an activity to the audit trail
 */
export const logActivity = async (
  userId: string,
  action: string,
  resource: string,
  severity: ActivitySeverity = 'info',
  details?: Record<string, any>,
  userEmail?: string
): Promise<ActivityLog> => {
  const ipAddress = await getClientIP();
  const userAgent = navigator.userAgent;

  const { data, error } = await supabase
    .from('activity_logs')
    .insert([
      {
        user_id: userId,
        user_email: userEmail || null,
        action,
        resource,
        details: details || null,
        severity,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to log activity');

  return data as ActivityLog;
};

/**
 * Get activity logs with optional filters
 */
export const getActivityLogs = async (
  filters?: {
    userId?: string;
    action?: string;
    severity?: ActivitySeverity;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ActivityLog[]> => {
  let query = supabase.from('activity_logs').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.action) {
    query = query.ilike('action', `%${filters.action}%`);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as ActivityLog[];
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
    .select('action, severity, user_id');

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
    bySeverity: {
      info: 0,
      warning: 0,
      critical: 0,
    },
    uniqueUsers: new Set((data || []).map((log) => log.user_id)).size,
  };

  // Group by action
  (data || []).forEach((log) => {
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    stats.bySeverity[log.severity as ActivitySeverity]++;
  });

  return stats;
};

/**
 * Get recent critical activities (for admin dashboard alerts)
 */
export const getRecentCriticalActivities = async (
  limit: number = 10
): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('severity', 'critical')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as ActivityLog[];
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
    userId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<string> => {
  const logs = await getActivityLogs({
    userId: filters?.userId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    limit: 10000, // Fetch up to 10k records for export
  });

  // Create CSV header
  const headers = ['ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Resource', 'Severity', 'IP Address'];
  const rows = logs.map((log) => [
    log.id,
    log.created_at,
    log.user_id,
    log.user_email || '',
    log.action,
    log.resource,
    log.severity,
    log.ip_address || '',
  ]);

  const csv =
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

  return csv;
};
