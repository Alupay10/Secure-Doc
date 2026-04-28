import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Activity, Search, Filter, Download, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function ActivityLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const logs = [
    { id: 1, timestamp: '2026-04-28 14:32:15', user: 'Admin User', userId: 'ADM-001', action: 'Approved Request', resource: 'Request #1247 - Transcript', ip: '192.168.1.105', severity: 'info' },
    { id: 2, timestamp: '2026-04-28 14:28:43', user: 'John Doe', userId: 'STU-001', action: 'Submitted Request', resource: 'Request #1250 - Certificate', ip: '192.168.1.142', severity: 'info' },
    { id: 3, timestamp: '2026-04-28 14:15:22', user: 'Admin User', userId: 'ADM-001', action: 'Modified Permissions', resource: 'User STU-045 Access Control', ip: '192.168.1.105', severity: 'warning' },
    { id: 4, timestamp: '2026-04-28 13:58:11', user: 'Unknown', userId: 'N/A', action: 'Failed Login Attempt', resource: 'Admin Panel', ip: '203.45.12.89', severity: 'critical' },
    { id: 5, timestamp: '2026-04-28 13:45:33', user: 'Jane Smith', userId: 'STU-002', action: 'Downloaded Document', resource: 'Transcript #1240', ip: '192.168.1.156', severity: 'info' },
    { id: 6, timestamp: '2026-04-28 13:22:47', user: 'Admin User', userId: 'ADM-001', action: 'Rejected Request', resource: 'Request #1245 - Degree Certificate', ip: '192.168.1.105', severity: 'warning' },
    { id: 7, timestamp: '2026-04-28 12:15:08', user: 'Bob Johnson', userId: 'STU-003', action: 'Accessed Restricted Area', resource: 'Admin Dashboard', ip: '192.168.1.178', severity: 'critical' },
    { id: 8, timestamp: '2026-04-28 11:42:19', user: 'Sarah Williams', userId: 'ADM-002', action: 'Updated User Role', resource: 'User STU-023 Role Change', ip: '192.168.1.112', severity: 'warning' },
    { id: 9, timestamp: '2026-04-28 10:33:55', user: 'Alice Brown', userId: 'STU-004', action: 'Viewed Document', resource: 'Request #1238 Status', ip: '192.168.1.167', severity: 'info' },
    { id: 10, timestamp: '2026-04-28 09:15:42', user: 'Admin User', userId: 'ADM-001', action: 'System Login', resource: 'Admin Dashboard', ip: '192.168.1.105', severity: 'info' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
                         log.action.toLowerCase().includes(search.toLowerCase()) ||
                         log.resource.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = actionFilter === 'all' || log.severity === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'bg-red-500/20 text-red-300 border-red-500/30',
      warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return variants[severity as keyof typeof variants] || variants.info;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Activity & Audit Logs</h1>
          </div>
          <p className="text-slate-400">Complete system activity tracking and audit trail</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total Events</CardDescription>
              <CardTitle className="text-3xl text-white">{logs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Critical Alerts</CardDescription>
              <CardTitle className="text-3xl text-red-400">
                {logs.filter(l => l.severity === 'critical').length}
              </CardTitle>
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

        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
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
              <Button variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">System Audit Trail</CardTitle>
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
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${
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
                        <Badge className={getSeverityBadge(log.severity)}>
                          {log.severity}
                        </Badge>
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
