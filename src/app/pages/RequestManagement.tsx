import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../context/DocumentContext';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, Eye, Filter, Upload, Download, CloudUpload, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import * as requestService from '../../services/requestService';
import * as documentService from '../../services/documentService';
import * as auditService from '../../services/auditService';
import { handleError } from '../../utils/errorHandler';

export default function RequestManagement() {
  const { user } = useAuth();
  const { uploadDocument } = useDocuments();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRemarks, setUploadRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const [requests, setRequests] = useState<any[]>([]);
  const [docsMap, setDocsMap] = useState<Record<string, any[]>>({});
  const [loadingRequests, setLoadingRequests] = useState(false);

  const filteredRequests = requests.filter((req) => statusFilter === 'all' || req.status === statusFilter);

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await requestService.getAllRequests();
      setRequests(data || []);

      // Preload documents for each request (small optimization)
      const map: Record<string, any[]> = {};
      await Promise.all((data || []).map(async (r: any) => {
        try {
          const docs = await documentService.getDocumentsByRequestId(r.id);
          map[r.id] = docs || [];
        } catch (e) {
          map[r.id] = [];
        }
      }));
      setDocsMap(map);
    } catch (err) {
      handleError(err, 'requests:load');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
      await requestService.updateRequestStatus(id, 'approved', 'Approved by admin');
      await auditService.logActivity(user.id, 'Approve Request', `request:${id}`, 'info', null, user.email || undefined);
      toast.success(`Request #${id} has been approved`);
    } catch (err) {
      handleError(err, 'request:approve');
      // reload to ensure consistency
      await loadRequests();
    }
  };

  const openRejectModal = (requestId: string) => {
    setSelectedRequest(requestId);
    setRejectModalOpen(true);
    setRejectionReason('');
    setRejectionCategory('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || !rejectionCategory) {
      toast.error('Please select a category and provide a reason for rejection');
      return;
    }

    if (!selectedRequest || !user) return;

    try {
      // optimistic update
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest ? { ...r, status: 'rejected' } : r)));
      await requestService.updateRequestStatus(selectedRequest, 'rejected', `${rejectionCategory}: ${rejectionReason}`);
      await auditService.logActivity(user.id, 'Reject Request', `request:${selectedRequest}`, 'info', { category: rejectionCategory, reason: rejectionReason }, user.email || undefined);

      toast.success(`Request #${selectedRequest} has been rejected`);
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setRejectionCategory('');
    } catch (err) {
      handleError(err, 'request:reject');
      await loadRequests();
    }
  };

  const openUploadModal = (requestId: string) => {
    setSelectedRequest(requestId);
    setUploadModalOpen(true);
    setUploadFile(null);
    setUploadRemarks('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, DOCX, and PNG are allowed.');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, DOCX, and PNG are allowed.');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = () => {
    if (!uploadFile || !selectedRequest) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    (async () => {
      try {
        const doc = await uploadDocument(selectedRequest, uploadFile, uploadRemarks);
        // update docsMap
        setDocsMap((prev) => ({ ...prev, [selectedRequest]: [doc as any, ...(prev[selectedRequest] || [])] }));
        await auditService.logActivity(user.id, 'Upload Document', `request:${selectedRequest}`, 'info', { file: uploadFile.name }, user.email || undefined);
        toast.success(`Document uploaded successfully for request #${selectedRequest}`);
        setUploadModalOpen(false);
        setSelectedRequest(null);
        setUploadFile(null);
        setUploadRemarks('');
      } catch (err) {
        handleError(err, 'documents:upload');
      }
    })();
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Request Management</h1>
          <p className="text-slate-400">Review and process student document requests</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Requests</CardTitle>
            <CardDescription className="text-slate-400">
              {filteredRequests.length} request(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Request ID</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Student</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Document Type</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Purpose</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Status</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Date</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-4 text-sm text-white">#{request.id}</td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm text-white">{request.user}</p>
                          <p className="text-xs text-slate-400">{request.email}</p>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-white">{request.type}</td>
                      <td className="py-4 text-sm text-slate-400">{request.purpose}</td>
                      <td className="py-4">
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-slate-400">{request.date}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-900 border-slate-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Approve Request</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                      Are you sure you want to approve request #{request.id}? This action will be logged.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleApprove(request.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                      Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectModal(request.id)}
                                className="border-red-700 bg-red-950/30 hover:bg-red-950/50 text-red-300"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {request.status === 'approved' && !(docsMap[request.id] && docsMap[request.id].length > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUploadModal(request.id)}
                              className="border-indigo-700 bg-indigo-950/30 hover:bg-indigo-950/50 text-indigo-300"
                              title="Upload processed document"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Upload
                            </Button>
                          )}

                          {docsMap[request.id] && docsMap[request.id].length > 0 && (
                            <>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  Uploaded
                                </Badge>
                                <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          )}

                          {!(docsMap[request.id] && docsMap[request.id].length > 0) && request.status !== 'approved' && (
                            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CloudUpload className="w-6 h-6 text-indigo-400" />
              Upload Official Document
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload the processed document for request #{selectedRequest}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-slate-700 bg-slate-800/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-center">
                <CloudUpload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-300 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Accepted formats: PDF, DOCX, PNG (Max 10MB)
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.docx,.png"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </label>
                {uploadFile && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      {uploadFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="remarks" className="text-slate-300">
                Remarks / Notes (Optional)
              </Label>
              <Textarea
                id="remarks"
                placeholder="Add any additional notes or comments..."
                value={uploadRemarks}
                onChange={(e) => setUploadRemarks(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-950/30 border border-blue-900 rounded-lg">
              <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium">Security & Encryption</p>
                <p className="text-slate-400 mt-1">
                  Files are automatically encrypted using AES-256 encryption and access-controlled. Only authorized users can access this document.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-950/30 border border-amber-900 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-300 font-medium">Action Logging</p>
                <p className="text-slate-400 mt-1">
                  This upload will be logged in the system activity log with your user ID, timestamp, and IP address.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-400" />
              Reject Request
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Provide a reason for rejecting request #{selectedRequest}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="rejection-category" className="text-slate-300">
                Rejection Category *
              </Label>
              <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
                <SelectTrigger id="rejection-category" className="mt-2 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select a rejection category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="incomplete">Incomplete Information</SelectItem>
                  <SelectItem value="ineligible">Student Ineligible</SelectItem>
                  <SelectItem value="invalid">Invalid Request</SelectItem>
                  <SelectItem value="duplicate">Duplicate Request</SelectItem>
                  <SelectItem value="outstanding">Outstanding Fees/Issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rejection-reason" className="text-slate-300">
                Detailed Reason *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide a detailed explanation for the rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
              />
              <p className="text-xs text-slate-500 mt-2">
                This reason will be visible to the student and logged in the system.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-950/30 border border-amber-900 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-300 font-medium">Important Notice</p>
                <p className="text-slate-400 mt-1">
                  Rejection decisions are final and will be logged. The student will be notified via email with the reason provided. Ensure your explanation is clear and professional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-900 rounded-lg">
              <Lock className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-red-300 font-medium">Action Logging</p>
                <p className="text-slate-400 mt-1">
                  This rejection will be logged with your user ID, timestamp, IP address, and the reason provided.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || !rejectionCategory}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
