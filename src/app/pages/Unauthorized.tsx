import { Link } from 'react-router';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-950/30 border-2 border-red-900 rounded-2xl mb-6">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-lg text-slate-400 mb-8">
          You do not have permission to access this resource. This incident has been logged.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Security Information</h2>
          <div className="space-y-2 text-sm text-slate-400 text-left">
            <div className="flex justify-between">
              <span>Access Level Required:</span>
              <span className="text-white">Administrator</span>
            </div>
            <div className="flex justify-between">
              <span>Your Access Level:</span>
              <span className="text-amber-400">Student</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span className="text-white font-mono text-xs">2026-04-28 14:32:15</span>
            </div>
          </div>
        </div>

        <Link to="/dashboard">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>

        <p className="text-xs text-slate-500 mt-6">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
