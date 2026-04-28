import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Send, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import * as requestService from '../../services/requestService';
import * as auditService from '../../services/auditService';
import { handleError, validateRequestForm } from '../../utils/errorHandler';

export default function NewRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    documentType: '',
    purpose: '',
    additionalInfo: '',
    urgency: 'normal',
  });

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestValidation = validateRequestForm(formData.documentType, formData.purpose);
    if (!requestValidation.valid) {
      toast.error(requestValidation.error || 'Please fill in all required fields');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to submit a request');
      return;
    }

    setLoading(true);
    try {
      const req = await requestService.createRequest(
        user.id,
        formData.documentType,
        formData.purpose,
        user.email || undefined
      );

      await auditService.logActivity(user.id, 'Create Request', `request:${req.id}`, 'info', {
        type: formData.documentType,
        purpose: formData.purpose,
      }, user.email || undefined);

      toast.success('Request submitted successfully!');
      navigate('/requests');
    } catch (err) {
      handleError(err, 'request:create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">New Document Request</h1>
          <p className="text-slate-400">Submit a request for official documents</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <div className="flex items-start gap-3 p-3 bg-blue-950/30 border border-blue-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium">Security Notice</p>
                <p className="text-slate-400 mt-1">
                  All requests are logged and monitored. Please ensure your request is legitimate and necessary.
                  Processing typically takes 3-5 business days.
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Request Details</CardTitle>
              <CardDescription className="text-slate-400">Fill in the information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="documentType" className="text-slate-300">
                  Document Type *
                </Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger id="documentType" className="mt-2 bg-slate-800 border-slate-700 text-white">
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
                <Label htmlFor="purpose" className="text-slate-300">
                  Purpose of Request *
                </Label>
                <Input
                  id="purpose"
                  placeholder="e.g., Job application, Graduate school, Transfer"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="urgency" className="text-slate-300">
                  Urgency Level
                </Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                >
                  <SelectTrigger id="urgency" className="mt-2 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low">Low - No rush</SelectItem>
                    <SelectItem value="normal">Normal - Standard processing</SelectItem>
                    <SelectItem value="high">High - Needed soon</SelectItem>
                    <SelectItem value="urgent">Urgent - Needed ASAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="additionalInfo" className="text-slate-300">
                  Additional Information
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any additional details or special instructions..."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
