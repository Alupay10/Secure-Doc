import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Activity, Search, Download, AlertTriangle, BarChart2, PieChart as PieIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const logs = [
  { id: 1,  timestamp: '2026-04-28 14:32:15', user: 'Admin User',     userId: 'ADM-001', action: 'Approved Request',      resource: 'Request #1247 - Transcript',          ip: '192.168.1.105', severity: 'info' },
  { id: 2,  timestamp: '2026-04-28 14:28:43', user: 'John Doe',       userId: 'STU-001', action: 'Submitted Request',      resource: 'Request #1250 - Certificate',          ip: '192.168.1.142', severity: 'info' },
  { id: 3,  timestamp: '2026-04-28 14:15:22', user: 'Admin User',     userId: 'ADM-001', action: 'Modified Permissions',   resource: 'User STU-045 Access Control',          ip: '192.168.1.105', severity: 'warning' },
  { id: 4,  timestamp: '2026-04-28 13:58:11', user: 'Unknown',        userId: 'N/A',     action: 'Failed Login Attempt',   resource: 'Admin Panel',                          ip: '203.45.12.89',  severity: 'critical' },
  { id: 5,  timestamp: '2026-04-28 13:45:33', user: 'Jane Smith',     userId: 'STU-002', action: 'Downloaded Document',    resource: 'Transcript #1240',                     ip: '192.168.1.156', severity: 'info' },
  { id: 6,  timestamp: '2026-04-28 13:22:47', user: 'Admin User',     userId: 'ADM-001', action: 'Rejected Request',       resource: 'Request #1245 - Degree Certificate',   ip: '192.168.1.105', severity: 'warning' },
  { id: 7,  timestamp: '2026-04-28 12:15:08', user: 'Bob Johnson',    userId: 'STU-003', action: 'Accessed Restricted Area', resource: 'Admin Dashboard',                   ip: '192.168.1.178', severity: 'critical' },
  { id: 8,  timestamp: '2026-04-28 11:42:19', user: 'Sarah Williams', userId: 'ADM-002', action: 'Updated User Role',       resource: 'User STU-023 Role Change',            ip: '192.168.1.112', severity: 'warning' },
  { id: 9,  timestamp: '2026-04-28 10:33:55', user: 'Alice Brown',    userId: 'STU-004', action: 'Viewed Document',         resource: 'Request #1238 Status',                ip: '192.168.1.167', severity: 'info' },
  { id: 10, timestamp: '2026-04-28 09:15:42', user: 'Admin User',     userId: 'ADM-001', action: 'System Login',            resource: 'Admin Dashboard',                     ip: '192.168.1.105', severity: 'info' },
  { id: 11, timestamp: '2026-04-27 16:45:10', user: 'John Doe',       userId: 'STU-001', action: 'Submitted Request',       resource: 'Request #1249 - Enrollment Letter',   ip: '192.168.1.142', severity: 'info' },
  { id: 12, timestamp: '2026-04-27 15:22:38', user: 'Unknown',        userId: 'N/A',     action: 'Failed Login Attempt',    resource: 'Student Portal',                      ip: '198.51.100.24', severity: 'critical' },
  { id: 13, timestamp: '2026-04-27 14:10:05', user: 'Jane Smith',     userId: 'STU-002', action: 'Submitted Request',       resource: 'Request #1248 - Certificate',         ip: '192.168.1.156', severity: 'info' },
  { id: 14, timestamp: '2026-04-27 11:55:22', user: 'Admin User',     userId: 'ADM-001', action: 'Approved Request',        resource: 'Request #1244 - Transcript',          ip: '192.168.1.105', severity: 'info' },
  { id: 15, timestamp: '2026-04-26 17:30:44', user: 'Bob Johnson',    userId: 'STU-003', action: 'Downloaded Document',     resource: 'Certificate #1241',                   ip: '192.168.1.178', severity: 'info' },
  { id: 16, timestamp: '2026-04-26 10:12:59', user: 'Sarah Williams', userId: 'ADM-002', action: 'Modified Permissions',    resource: 'User STU-067 Access Control',         ip: '192.168.1.112', severity: 'warning' },
  { id: 17, timestamp: '2026-04-25 14:08:33', user: 'Unknown',        userId: 'N/A',     action: 'Failed Login Attempt',    resource: 'Admin Panel',                         ip: '203.45.12.89',  severity: 'critical' },
  { id: 18, timestamp: '2026-04-25 09:44:17', user: 'Alice Brown',    userId: 'STU-004', action: 'Submitted Request',       resource: 'Request #1246 - Enrollment Letter',   ip: '192.168.1.167', severity: 'info' },
];

// ── Derived chart data ──────────────────────────────────────────────────────

// Activity by hour of day (bucketed from timestamps)
const activityByHour = Array.from({ length: 8 }, (_, i) => {
  const hour = i + 9; // 09:00 – 16:00
  return {
    hour: `${String(hour).padStart(2, '0')}:00`,
    count: logs.filter((l) => parseInt(l.timestamp.split(' ')[1]) === hour).length,
  };
});

// Severity distribution
const severityCounts = {
  info:     logs.filter((l) => l.severity === 'info').length,
  warning:  logs.filter((l) => l.severity === 'warning').length,
  critical: logs.filter((l) => l.severity === 'critical').length,
};
const severityData = [
  { name: 'Info',     value: severityCounts.info,     color: '#3b82f6' },
  { name: 'Warning',  value: severityCounts.warning,  color: '#f59e0b' },
  { name: 'Critical', value: severityCounts.critical, color: '#ef4444' },
];

// Top actions
const actionCounts: Record<string, number> = {};
logs.forEach((l) => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
const topActions = Object.entries(actionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([action, count]) => ({ action: action.replace(' ', '\n'), count }));

// Daily activity (last 4 days)
const dailyActivity = [
  { date: '04/25', info: 2, warning: 1, critical: 1 },
  { date: '04/26', info: 2, warning: 1, critical: 0 },
  { date: '04/27', info: 3, warning: 0, critical: 1 },
  { date: '04/28', info: 5, warning: 2, critical: 2 },
];

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

// ── Badge helper ────────────────────────────────────────────────────────────
const getSeverityBadge = (severity: string) => {
  const variants: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-300 border-red-500/30',
    warning:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    info:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return variants[severity] || variants.info;
};

// ── Component ───────────────────────────────────────────────────────────────
export default function ActivityLogs() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [search, setSearch]           = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [activeTab, setActiveTab]     = useState<'charts' | 'timeline'>('charts');

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/unauthorized');
  }, [user, navigate]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = actionFilter === 'all' || log.severity === actionFilter;
    return matchesSearch && matchesFilter;
  });

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total Events</CardDescription>
              <CardTitle className="text-3xl text-white">{logs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Last 4 days</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Critical Alerts</CardDescription>
              <CardTitle className="text-3xl text-red-400">{severityCounts.critical}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Requires attention</span>
              </div>
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Visualizations
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'timeline'
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
          <div className="space-y-6 mb-6">

            {/* Row 1: Stacked daily + severity pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Daily Activity by Severity</CardTitle>
                  <CardDescription className="text-slate-400">Event volume over the last 4 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dailyActivity} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      <Bar dataKey="info"     name="Info"     stackId="a" fill="#3b82f6" />
                      <Bar dataKey="warning"  name="Warning"  stackId="a" fill="#f59e0b" />
                      <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Severity Distribution</CardTitle>
                  <CardDescription className="text-slate-400">Proportion of events by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {severityData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-2">
                    {severityData.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name} ({s.value})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Top actions + activity by hour */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div className="mb-6 space-y-1">
            {logs.slice(0, 12).map((log, idx) => {
              const dotColor =
                log.severity === 'critical' ? 'bg-red-400'
                : log.severity === 'warning'  ? 'bg-amber-400'
                : 'bg-blue-400';
              const lineColor =
                log.severity === 'critical' ? 'border-red-900'
                : log.severity === 'warning'  ? 'border-amber-900'
                : 'border-slate-800';
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
                  <div className={`flex-1 mb-3 p-4 rounded-lg border bg-slate-900 ${
                    log.severity === 'critical'
                      ? 'border-red-900/60 bg-red-950/10'
                      : log.severity === 'warning'
                      ? 'border-amber-900/60'
                      : 'border-slate-800'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{log.action}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{log.resource}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-300">{log.user}</span>
                          <span>·</span>
                          <span className="font-mono">{log.ip}</span>
                          <span>·</span>
                          <span className="font-mono">{log.userId}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={getSeverityBadge(log.severity)}>{log.severity}</Badge>
                        <span className="text-xs text-slate-500 font-mono">{log.timestamp}</span>
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
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white cursor-pointer">
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
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">IP Address</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                        log.severity === 'critical' ? 'bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-4 text-sm text-white font-mono">{log.timestamp}</td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm text-white">{log.user}</p>
                          <p className="text-xs text-slate-400">{log.userId}</p>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-white">{log.action}</td>
                      <td className="py-4 text-sm text-slate-400">{log.resource}</td>
                      <td className="py-4 text-sm text-slate-400 font-mono">{log.ip}</td>
                      <td className="py-4">
                        <Badge className={getSeverityBadge(log.severity)}>{log.severity}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
