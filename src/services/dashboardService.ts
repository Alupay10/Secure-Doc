import { supabase } from './supabaseClient';
import { handleError } from '../utils/errorHandler';

export interface DashboardStats {
  totalUsers: number;
  totalRequests: number;
  pendingApprovals: number;
  rejectionRate: number;
}

export interface TimeSeriesData {
  date: string;
  requests: number;
}

export interface StatusDistribution {
  name: 'Approved' | 'Pending' | 'Rejected';
  value: number;
  color: string;
}

export interface DocumentTypeDistribution {
  type: string;
  count: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (usersError) throw usersError;

    const { count: totalRequests, error: requestsError } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    if (requestsError) throw requestsError;

    const { count: pendingApprovals, error: pendingError } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null);

    if (pendingError) throw pendingError;

    const { count: rejectedRequests, error: rejectedError } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .is('deleted_at', null);

    if (rejectedError) throw rejectedError;

    const rejectionRate = totalRequests ?? 0 > 0 ? ((rejectedRequests ?? 0) / (totalRequests ?? 1)) * 100 : 0;

    return {
      totalUsers: totalUsers ?? 0,
      totalRequests: totalRequests ?? 0,
      pendingApprovals: pendingApprovals ?? 0,
      rejectionRate,
    };
  } catch (error) {
    handleError(error, 'Failed to fetch dashboard stats');
    return {
      totalUsers: 0,
      totalRequests: 0,
      pendingApprovals: 0,
      rejectionRate: 0,
    };
  }
};

export const getRequestsOverTime = async (): Promise<TimeSeriesData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_requests_over_time');
    if (error) throw error;
    return data.map((d: { day: string; count: number }) => ({
      date: new Date(d.day).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      requests: d.count,
    }));
  } catch (error) {
    handleError(error, 'Failed to fetch requests over time');
    return [];
  }
};

export const getStatusDistribution = async (): Promise<StatusDistribution[]> => {
  try {
    const { data, error } = await supabase.rpc('get_status_distribution');
    if (error) throw error;

    const statusMap: { [key: string]: StatusDistribution } = {
      approved: { name: 'Approved', value: 0, color: '#10b981' },
      pending: { name: 'Pending', value: 0, color: '#f59e0b' },
      rejected: { name: 'Rejected', value: 0, color: '#ef4444' },
    };

    data.forEach((item: { status: 'approved' | 'pending' | 'rejected'; count: number }) => {
      if (statusMap[item.status]) {
        statusMap[item.status].value = item.count;
      }
    });

    return Object.values(statusMap);
  } catch (error) {
    handleError(error, 'Failed to fetch status distribution');
    return [];
  }
};

export const getDocumentTypeDistribution = async (): Promise<DocumentTypeDistribution[]> => {
  try {
    const { data, error } = await supabase.rpc('get_document_type_distribution');
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Failed to fetch document type distribution');
    return [];
  }
};
