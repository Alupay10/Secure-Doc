import { Link } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, PlusCircle, TrendingUp, Download, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import * as requestService from '../../services/requestService';
import { handleError } from '../../utils/errorHandler';

export default function StudentDashboard() {
  const { getDocumentByRequestId, fetchDocumentsForRequest } = useDocuments();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const data = await requestService.getUserRequests(user.id);
        setRequests(data);

        await Promise.all(
          data
            .filter((request) => request.status === 'approved')
            .map((request) => fetchDocumentsForRequest(request.id))
        );
      } catch (err) {
        handleError(err, 'dashboard:load');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, fetchDocumentsForRequest]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((request) => request.status === 'pending').length;
    const approved = requests.filter((request) => request.status === 'approved').length;
    const rejected = requests.filter((request) => request.status === 'rejected').length;

    return [
      { label: 'Total Requests', value: String(total), icon: FileText, color: 'text-indigo-400' },
      { label: 'Pending', value: String(pending), icon: Clock, color: 'text-amber-400' },
      { label: 'Approved', value: String(approved), icon: CheckCircle, color: 'text-emerald-400' },
      { label: 'Rejected', value: String(rejected), icon: XCircle, color: 'text-red-400' },
    ];
  }, [requests]);

  const recentActivity = [
    { id: 1, action: 'Request approved', description: 'Transcript request #1247 has been approved', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Request submitted', description: 'Certificate of enrollment submitted for review', time: '1 day ago', type: 'info' },
    { id: 3, action: 'Request pending', description: 'Grade report request is awaiting approval', time: '2 days ago', type: 'warning' },
    { id: 4, action: 'Document ready', description: 'Your transcript is ready for download', time: '3 days ago', type: 'success' },
  ];

  const myRequests = requests.slice(0, 4).map((request) => ({
    id: request.id,
    type: request.type,
    status: request.status,
    date: request.date ? request.date.slice(0, 10) : '',
    purpose: request.purpose,
  }));

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's an overview of your document requests.</p>
          </div>
          <Link to="/new-request">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardDescription className="text-slate-400">{stat.label}</CardDescription>
                  <CardTitle className="text-3xl text-white flex items-center gap-3">
                    {stat.value}
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {loading && (
          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardContent className="py-6 text-slate-400">Loading dashboard data...</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Requests</CardTitle>
                <CardDescription className="text-slate-400">Your latest document requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-slate-800 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-400" />
                          <div>
                            <h3 className="text-white font-medium">{request.type}</h3>
                            <p className="text-xs text-slate-400">Request #{request.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadge(request.status)}>
                            {request.status}
                          </Badge>
                          {getDocumentByRequestId(request.id) && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>Purpose: {request.purpose}</span>
                          <span>•</span>
                          <span>{request.date}</span>
                        </div>
                        {getDocumentByRequestId(request.id) && (
                          <Link to="/requests">
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/requests">
                  <Button variant="outline" className="w-full mt-4 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                    View All Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-slate-400">Timeline of your actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-emerald-400' :
                          activity.type === 'warning' ? 'bg-amber-400' :
                          'bg-indigo-400'
                        }`}></div>
                        {activity.id !== recentActivity.length && (
                          <div className="w-0.5 h-full bg-slate-800 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-white font-medium">{activity.action}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
