import { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Download, Eye, Lock, Shield, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Textarea } from '../components/ui/textarea';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import * as requestService from '../../services/requestService';
import * as documentService from '../../services/documentService';
import * as auditService from '../../services/auditService';
import { handleError } from '../../utils/errorHandler';
import { toast } from 'sonner';

export default function MyRequests() {
  const { getDocumentByRequestId, fetchDocumentsForRequest } = useDocuments();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [editRequest, setEditRequest] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    documentType: '',
    purpose: '',
    remarks: '',
  });
  const [deleteRequestItem, setDeleteRequestItem] = useState<any | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleViewDocument = async (requestId: string) => {
    const document = getDocumentByRequestId(requestId);
    if (!document?.id) {
      toast.error('Document is not available yet');
      return;
    }

    try {
      const blob = await documentService.downloadDocument(document.id);
      const typedBlob = new Blob([blob], {
        type: document.fileType || blob.type || 'application/octet-stream',
      });
      const objectUrl = URL.createObjectURL(typedBlob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      handleError(err, 'documents:view');
    }
  };

  const openRequestDetails = (request: any) => {
    setSelectedRequest(request);
  };

  const closeRequestDetails = () => {
    setSelectedRequest(null);
  };

  const openEditModal = (request: any) => {
    if (request.status !== 'pending') {
      toast.error('Only pending requests can be edited');
      return;
    }

    setEditRequest(request);
    setEditForm({
      documentType: request.type || '',
      purpose: request.purpose || '',
      remarks: request.remarks || '',
    });
  };

  const closeEditModal = () => {
    setEditRequest(null);
  };

  const handleUpdateRequest = async () => {
    if (!editRequest || !user) return;

    if (!editForm.documentType.trim() || !editForm.purpose.trim()) {
      toast.error('Document type and purpose are required');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const updated = await requestService.updateUserRequest(editRequest.id, {
        type: editForm.documentType.trim(),
        purpose: editForm.purpose.trim(),
        remarks: editForm.remarks,
      });

      setRequests((prev) => prev.map((req) => (req.id === updated.id ? updated : req)));
      setSelectedRequest(selectedRequest?.id === updated.id ? updated : selectedRequest);

      await auditService.logActivity({
        user_id: user.id,
        user_email: user.email || 'unknown',
        action: 'Updated Request',
        resource: `request:${updated.id}`,
        details: {
          type: updated.type,
          purpose: updated.purpose,
          remarks: updated.remarks || null,
        },
        user_agent: navigator.userAgent,
      });

      toast.success('Request updated successfully');
      closeEditModal();
    } catch (err) {
      handleError(err, 'request:update');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const openDeleteModal = (request: any) => {
    if (request.status !== 'pending') {
      toast.error('Only pending requests can be deleted');
      return;
    }

    setDeleteRequestItem(request);
  };

  const handleDeleteRequest = async () => {
    if (!deleteRequestItem || !user) return;

    setIsDeleting(true);
    try {
      await requestService.deleteRequest(deleteRequestItem.id);

      setRequests((prev) => prev.filter((req) => req.id !== deleteRequestItem.id));
      setSelectedRequest(selectedRequest?.id === deleteRequestItem.id ? null : selectedRequest);

      await auditService.logActivity({
        user_id: user.id,
        user_email: user.email || 'unknown',
        action: 'Deleted Request',
        resource: `request:${deleteRequestItem.id}`,
        details: {
          type: deleteRequestItem.type,
          purpose: deleteRequestItem.purpose,
          status: deleteRequestItem.status,
        },
        user_agent: navigator.userAgent,
      });

      toast.success('Request deleted successfully');
      setDeleteRequestItem(null);
    } catch (err) {
      handleError(err, 'request:delete');
    } finally {
      setIsDeleting(false);
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
          {filteredRequests.map((request) => {
            const document = getDocumentByRequestId(request.id);
            const isProcessing = request.status === 'approved' && !document;
            const isApproved = request.status === 'approved';

            return (
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
                        {document && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Lock className="w-3 h-3" />
                            <span>
                              Document uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {!isApproved && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                          onClick={() => openRequestDetails(request)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => openEditModal(request)}
                          disabled={request.status !== 'pending'}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-800 bg-red-950/40 hover:bg-red-900/50 text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => openDeleteModal(request)}
                          disabled={request.status !== 'pending'}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                    {isApproved ? (
                      <>
                        {document ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1 px-3">
                            <Shield className="w-3 h-3" />
                            Available
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            Processing
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleViewDocument(request.id)}
                          disabled={!document}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Document
                        </Button>
                        <Button
                          size="sm"
                          className="bg-slate-700 hover:bg-slate-600 text-white"
                          onClick={() => handleDownload(request.id)}
                          disabled={!document}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Document
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );})}
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

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && closeRequestDetails()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              Request Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the full details of your submitted request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Document Type</p>
                  <p className="mt-1 text-sm font-medium text-white">{selectedRequest.type}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <div className="mt-2">
                    <Badge className={getStatusBadge(selectedRequest.status)}>{selectedRequest.status}</Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Request ID</p>
                  <p className="mt-1 text-sm font-medium text-white break-all">{selectedRequest.id}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {selectedRequest.date ? new Date(selectedRequest.date).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Purpose</p>
                <p className="mt-2 text-sm text-slate-200 leading-6">{selectedRequest.purpose}</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Additional Notes</p>
                <p className="mt-2 text-sm text-slate-200 leading-6">
                  {selectedRequest.remarks || 'No additional remarks were provided for this request.'}
                </p>
              </div>

              {(() => {
                const document = getDocumentByRequestId(selectedRequest.id);
                return (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Document Status</p>
                    {document ? (
                      <div className="mt-3 flex flex-col gap-2 text-sm text-slate-200">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Shield className="w-4 h-4" />
                          <span>Document uploaded and ready</span>
                        </div>
                        <p>File name: {document.fileName || 'Unnamed document'}</p>
                        <p>
                          Uploaded: {document.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Unknown'}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-amber-300">
                        No document is attached yet. If the request is approved, it may still be processing.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
              onClick={closeRequestDetails}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editRequest)} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <Pencil className="w-5 h-5 text-indigo-400" />
              Edit Request
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your request details. Only pending requests can be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Document Type</p>
              <Select
                value={editForm.documentType}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="transcript">Official Transcript</SelectItem>
                  <SelectItem value="enrollment">Certificate of Enrollment</SelectItem>
                  <SelectItem value="degree">Degree Certificate</SelectItem>
                  <SelectItem value="grade">Grade Report</SelectItem>
                  <SelectItem value="recommendation">Recommendation Letter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Purpose</p>
              <Input
                value={editForm.purpose}
                onChange={(e) => setEditForm((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="State the purpose for your request"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Additional Notes</p>
              <Textarea
                value={editForm.remarks}
                onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional notes for administrators"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
              onClick={closeEditModal}
              disabled={isSubmittingEdit}
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleUpdateRequest}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteRequestItem)} onOpenChange={(open) => !open && setDeleteRequestItem(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Request</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will soft-delete your request and remove it from your list. This action cannot be undone from the UI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
            {deleteRequestItem ? (
              <>
                <p><span className="text-slate-500">Request ID:</span> {deleteRequestItem.id}</p>
                <p><span className="text-slate-500">Type:</span> {deleteRequestItem.type}</p>
              </>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteRequest();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
