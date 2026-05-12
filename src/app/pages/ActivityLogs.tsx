import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import { Activity, Search, Download, BarChart2, PieChart as PieIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { getActivityLogs, exportActivityLogs, ActivityLog } from '../../services/auditService';

// ── Tooltip styles ──────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '12px',
  },
};

// ── Component ───────────────────────────────────────────────────────────────
export default function ActivityLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'charts' | 'timeline'>('charts');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
      return;
    }

    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const { logs: data } = await getActivityLogs({});
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [user, navigate]);

  const handleExport = async () => {
    try {
      const csv = await exportActivityLogs();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  // ── Derived chart data ──────────────────────────────────────────────────────

  const activityByHour = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const hour = i + 9; // 09:00 – 16:00
      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        count: logs.filter((l) => new Date(l.created_at).getHours() === hour).length,
      };
    });
  }, [logs]);

  const topActions = useMemo(() => {
    const actionCounts: Record<string, number> = {};
    logs.forEach((l) => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
    return Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([action, count]) => ({ action: action.replace(' ', '\n'), count }));
  }, [logs]);

  const dailyActivity = useMemo(() => {
    const days: Record<string, { events: number }> = {};
    logs.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      if (!days[date]) days[date] = { events: 0 };
      days[date].events++;
    });

    return Object.entries(days)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-4) // Last 4 days
      .map(([date, counts]) => ({ date, ...counts }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = search.toLowerCase();
      const userName = (log.user_email || log.user_id || '').toLowerCase();
      const actionName = (log.action || '').toLowerCase();
      const resourceName = (log.resource || '').toLowerCase();

      const matchesSearch =
        userName.includes(searchLower) ||
        actionName.includes(searchLower) ||
        resourceName.includes(searchLower);
      return matchesSearch;
    });
  }, [logs, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-slate-400">Loading activity logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Activity & Audit Logs</h1>
          </div>
          <p className="text-slate-400">Complete system activity tracking and audit trail</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total Events</CardDescription>
              <CardTitle className="text-3xl text-white">{logs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Active Sessions</CardDescription>
              <CardTitle className="text-3xl text-white">24</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Current users online</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === 'charts'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <BarChart2 className="w-4 h-4" />
            Visualizations
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === 'timeline'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Clock className="w-4 h-4" />
            Timeline
          </button>
        </div>

        {/* ── CHARTS TAB ── */}
        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Full-width Daily Activity Card */}
            <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Daily Activity by Severity</CardTitle>
                <CardDescription className="text-slate-400">Event volume over the last 4 active days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyActivity} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Bar dataKey="events" name="Events" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Half-width Top Actions Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Top Actions</CardTitle>
                <CardDescription className="text-slate-400">Most frequent event types across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topActions} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="action" stroke="#94a3b8" fontSize={11} width={130} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Half-width Activity by Hour Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Activity by Hour</CardTitle>
                <CardDescription className="text-slate-400">When system events occur throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={activityByHour} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div className="mb-6 space-y-1">
            {logs.slice(0, 12).map((log, idx) => {
              const dotColor = 'bg-blue-400';
              const lineColor = 'border-slate-800';
              return (
                <div key={log.id} className="flex gap-4">
                  {/* Spine */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-4 shrink-0 ${dotColor}`} />
                    {idx < logs.slice(0, 12).length - 1 && (
                      <div className={`w-px flex-1 border-l-2 border-dashed ${lineColor} mt-1`} />
                    )}
                  </div>
                  {/* Card */}
                  <div className={`flex-1 mb-3 p-4 rounded-lg border bg-slate-900 border-slate-800`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{log.action}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{log.resource}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-300">{log.user_email || log.user_id}</span>
                          <span>·</span>
                          <span className="font-mono">{log.user_id}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search / filter / export */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Button onClick={handleExport} variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Audit table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-400" />
              System Audit Trail
            </CardTitle>
            <CardDescription className="text-slate-400">
              {filteredLogs.length} event(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Timestamp</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">User</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Action</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 text-sm text-white font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm text-white">{log.user_email || log.user_id}</p>
                          <p className="text-xs text-slate-400">{log.user_id}</p>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-white">{log.action}</td>
                      <td className="py-4 text-sm text-slate-400">{log.resource}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}