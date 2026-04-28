import { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Download, Eye, Lock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import * as requestService from '../../services/requestService';
import * as documentService from '../../services/documentService';
import { handleError } from '../../utils/errorHandler';
import { toast } from 'sonner';

export default function MyRequests() {
  const { getDocumentByRequestId, fetchDocumentsForRequest } = useDocuments();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const data = await requestService.getUserRequests(user.id);
        setRequests(data);

        await Promise.all(
          data.map((request) => fetchDocumentsForRequest(request.id))
        );
      } catch (err) {
        handleError(err, 'requests:load');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user, fetchDocumentsForRequest]);

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.type.toLowerCase().includes(search.toLowerCase()) ||
                          req.id.includes(search);
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const handleDownload = async (requestId: string) => {
    const document = getDocumentByRequestId(requestId);
    if (!document?.id) {
      toast.error('Document is not available yet');
      return;
    }

    try {
      const blob = await documentService.downloadDocument(document.id);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = document.fileName || 'document';
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success('Document download started');
    } catch (err) {
      handleError(err, 'documents:download');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Requests</h1>
          <p className="text-slate-400">View and manage all your document requests</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by request ID or document type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardContent className="py-6 text-slate-400">Loading your requests...</CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium text-white">{request.type}</h3>
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Request #{request.id}</span>
                        <span>•</span>
                        <span>Submitted: {request.date}</span>
                        <span>•</span>
                        <span>Purpose: {request.purpose}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last accessed: {request.lastAccessed}</span>
                        </div>
                        {getDocumentByRequestId(request.id) && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Lock className="w-3 h-3" />
                            <span>
                              Document uploaded: {new Date(getDocumentByRequestId(request.id)!.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    {getDocumentByRequestId(request.id) ? (
                      <>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1 px-3">
                          <Shield className="w-3 h-3" />
                          Available
                        </Badge>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleDownload(request.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Document
                        </Button>
                      </>
                    ) : request.status === 'approved' ? (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        Processing
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No requests found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
