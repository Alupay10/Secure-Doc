import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  Lock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getDashboardStats,
  getRequestsOverTime,
  getStatusDistribution,
  getDocumentTypeDistribution,
  DashboardStats,
  TimeSeriesData,
  StatusDistribution,
  DocumentTypeDistribution,
} from '../../services/dashboardService';
import { getRecentActivity, ActivityLog } from '../../services/auditService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requestsOverTime, setRequestsOverTime] = useState<TimeSeriesData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDistribution[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          statsData,
          requestsOverTimeData,
          statusDistributionData,
          docTypeData,
          activityData,
        ] = await Promise.all([
          getDashboardStats(),
          getRequestsOverTime(),
          getStatusDistribution(),
          getDocumentTypeDistribution(),
          getRecentActivity({ limit: 5 }),
        ]);

        setStats(statsData);
        setRequestsOverTime(requestsOverTimeData);
        setStatusDistribution(statusDistributionData);
        setDocumentTypes(docTypeData);
        setActivityLogs(activityData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const securityAlerts = [
    { id: 1, type: 'warning', message: 'Multiple rapid requests detected from user ID: STU-2847', time: '2 min ago', severity: 'medium' },
    { id: 2, type: 'danger', message: 'Failed login attempt from unauthorized IP', time: '15 min ago', severity: 'high' },
    { id: 3, type: 'info', message: 'Unusual access pattern detected in document downloads', time: '1 hour ago', severity: 'low' },
    { id: 4, type: 'warning', message: 'User attempted to access restricted admin panel', time: '2 hours ago', severity: 'medium' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          </div>
          <p className="text-slate-400">Real-time monitoring and analytics for the secure document system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total Users</CardDescription>
              <CardTitle className="text-3xl text-white">{stats?.totalUsers ?? 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-emerald-400 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total Requests</CardDescription>
              <CardTitle className="text-3xl text-white">{stats?.totalRequests ?? 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-indigo-400 text-sm">
                <FileText className="w-4 h-4 mr-1" />
                <span>in total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Pending Approvals</CardDescription>
              <CardTitle className="text-3xl text-amber-400">{stats?.pendingApprovals ?? 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-amber-400 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Rejection Rate</CardDescription>
              <CardTitle className="text-3xl text-white">{stats?.rejectionRate.toFixed(1) ?? 'N/A'}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-emerald-400 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>-2.3% improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Requests Over Time</CardTitle>
              <CardDescription className="text-slate-400">Daily request volume for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={requestsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Status Distribution</CardTitle>
              <CardDescription className="text-slate-400">Current request status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Requests by Document Type</CardTitle>
              <CardDescription className="text-slate-400">Most requested document categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={documentTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="type" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Security Monitoring
              </CardTitle>
              <CardDescription className="text-slate-400">Real-time security alerts and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {securityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'high'
                        ? 'bg-red-950/30 border-red-900'
                        : alert.severity === 'medium'
                        ? 'bg-amber-950/30 border-amber-900'
                        : 'bg-blue-950/30 border-blue-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 mt-0.5 ${
                        alert.severity === 'high'
                          ? 'text-red-400'
                          : alert.severity === 'medium'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Recent System Activity
            </CardTitle>
            <CardDescription className="text-slate-400">Latest actions and events across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-medium">{log.user_email || 'System'}</span> {log.action}
                      </p>
                      <p className="text-xs text-slate-400">{log.resource}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
