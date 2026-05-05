import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import {
  Shield,
  Lock,
  Eye,
  Database,
  CheckCircle,
  AlertTriangle,
  Key,
  FileLock,
  Users,
  Activity,
  Server,
  GitBranch,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface SecurityItem {
  label: string;
  description: string;
  status: 'implemented' | 'partial' | 'planned';
  detail: string;
}

interface SecurityPillar {
  id: string;
  title: string;
  subtitle: string;
  concept: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  items: SecurityItem[];
}

const pillars: SecurityPillar[] = [
  {
    id: 'confidentiality',
    title: 'Confidentiality',
    subtitle: 'Data is accessible only to authorized users',
    concept: 'Ensures that sensitive information is not disclosed to unauthorized individuals, processes, or devices.',
    icon: <Lock className="w-6 h-6" />,
    accentColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-300',
    items: [
      {
        label: 'End-to-End File Encryption',
        description: 'All uploaded documents are encrypted using TweetNaCl (XSalsa20-Poly1305) before being stored.',
        status: 'implemented',
        detail: 'utils/encryption.ts — encryptFile(), decryptBlob()',
      },
      {
        label: 'Role-Based Access Control',
        description: 'Students can only access their own data. Admins have elevated access enforced at the database level.',
        status: 'implemented',
        detail: 'rls-policies.sql — per-table RLS policies',
      },
      {
        label: 'Row-Level Security (RLS)',
        description: 'Supabase RLS policies prevent any user from querying data they do not own, even with a valid session.',
        status: 'implemented',
        detail: 'Enabled on all 6 tables in schema.sql',
      },
      {
        label: 'Route Guards',
        description: 'Frontend routes are protected — unauthenticated users are redirected to login, and students cannot access admin pages.',
        status: 'implemented',
        detail: 'ProtectedRoute.tsx wraps all sensitive routes',
      },
      {
        label: 'Signed Download URLs',
        description: 'Document download links expire after 1 hour and are generated per-request, not stored publicly.',
        status: 'implemented',
        detail: 'documentService.ts — getDocumentDownloadUrl()',
      },
      {
        label: 'Server-Side Encryption Key Management',
        description: 'Encryption keys should be stored in Supabase Vault rather than alongside encrypted data.',
        status: 'planned',
        detail: 'Currently keys are stored in the documents table — Vault migration pending',
      },
    ],
  },
  {
    id: 'integrity',
    title: 'Integrity',
    subtitle: 'Data is accurate, consistent, and unmodified',
    concept: 'Ensures that information is not altered in unauthorized ways, and that any modifications are detectable.',
    icon: <ShieldCheck className="w-6 h-6" />,
    accentColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-300',
    items: [
      {
        label: 'Soft Deletes for Audit Compliance',
        description: 'No records are ever hard-deleted. A deleted_at timestamp is set instead, preserving the full data history.',
        status: 'implemented',
        detail: 'All tables include deleted_at column — requestService.ts, documentService.ts',
      },
      {
        label: 'Append-Only Activity Logs',
        description: 'Audit logs cannot be updated or deleted by any user, including admins. RLS enforces UPDATE and DELETE as FALSE.',
        status: 'implemented',
        detail: 'rls-policies.sql — "Activity logs cannot be modified/deleted" policies',
      },
      {
        label: 'Automatic Timestamp Triggers',
        description: 'Database triggers automatically update updated_at on every row change, preventing manual timestamp tampering.',
        status: 'implemented',
        detail: 'schema.sql — update_updated_at_column() trigger function',
      },
      {
        label: 'Request Approval History',
        description: 'Every status change on a request is recorded in request_approvals with who made the change and when.',
        status: 'implemented',
        detail: 'schema.sql — request_approvals table',
      },
      {
        label: 'File Type Validation',
        description: 'Only PDF, JPEG, PNG, and DOCX files are accepted. Type is validated both client-side and in the service layer.',
        status: 'implemented',
        detail: 'errorHandler.ts — validateFile(), documentService.ts — allowedTypes',
      },
      {
        label: 'Cryptographic File Integrity',
        description: 'TweetNaCl\'s Poly1305 MAC authenticates each file. Tampered ciphertext will fail decryption.',
        status: 'implemented',
        detail: 'encryption.ts — nacl.secretbox uses authenticated encryption',
      },
    ],
  },
  {
    id: 'availability',
    title: 'Availability',
    subtitle: 'Data and services are accessible when needed',
    concept: 'Ensures that information and systems are available to authorized users whenever they are needed.',
    icon: <Server className="w-6 h-6" />,
    accentColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-300',
    items: [
      {
        label: 'Managed Cloud Infrastructure',
        description: 'Supabase provides 99.9% uptime SLA for database, auth, and storage — no self-hosted infrastructure to manage.',
        status: 'implemented',
        detail: 'Supabase hosted PostgreSQL + Storage',
      },
      {
        label: 'Graceful Error Handling',
        description: 'All service calls are wrapped with error handlers that show user-friendly messages and prevent app crashes.',
        status: 'implemented',
        detail: 'errorHandler.ts — handleError(), getErrorMessage()',
      },
      {
        label: 'Database Indexes',
        description: 'Key columns (user_id, status, created_at) are indexed to ensure queries remain fast as data grows.',
        status: 'implemented',
        detail: 'schema.sql — indexes on all foreign keys and filter columns',
      },
      {
        label: 'Pagination Support',
        description: 'All list endpoints support limit/offset pagination to prevent large queries from degrading performance.',
        status: 'implemented',
        detail: 'requestService.ts, documentService.ts, auditService.ts — filters.limit/offset',
      },
      {
        label: 'Session Timeout',
        description: 'Inactive sessions should be automatically expired after a configurable idle period to reduce attack surface.',
        status: 'planned',
        detail: 'Idle timer + auto-logout not yet implemented',
      },
      {
        label: 'Offline Feedback',
        description: 'Network errors are detected and communicated to users with actionable error messages.',
        status: 'partial',
        detail: 'errorHandler.ts detects network errors — no offline queue yet',
      },
    ],
  },
];

const additionalControls = [
  {
    icon: <Key className="w-5 h-5 text-indigo-400" />,
    label: 'Authentication',
    detail: 'Supabase Auth with email/password. JWT tokens managed server-side.',
    status: 'implemented' as const,
  },
  {
    icon: <Users className="w-5 h-5 text-emerald-400" />,
    label: 'Least Privilege',
    detail: 'Each role (student/admin) is granted only the minimum permissions needed.',
    status: 'implemented' as const,
  },
  {
    icon: <Activity className="w-5 h-5 text-amber-400" />,
    label: 'Non-Repudiation',
    detail: 'Every action is logged with user ID, timestamp, resource, and IP address.',
    status: 'implemented' as const,
  },
  {
    icon: <Eye className="w-5 h-5 text-blue-400" />,
    label: 'Access Monitoring',
    detail: 'Admin dashboard shows real-time security alerts and activity audit trail.',
    status: 'implemented' as const,
  },
  {
    icon: <FileLock className="w-5 h-5 text-purple-400" />,
    label: 'Data Classification',
    detail: 'Documents are treated as sensitive by default — all encrypted, RLS enforced.',
    status: 'implemented' as const,
  },
  {
    icon: <GitBranch className="w-5 h-5 text-rose-400" />,
    label: 'Role Elevation Prevention',
    detail: 'signUp() always assigns student role. Admin accounts require existing admin action.',
    status: 'implemented' as const,
  },
  {
    icon: <Database className="w-5 h-5 text-cyan-400" />,
    label: 'Input Validation',
    detail: 'All form inputs are validated client-side with descriptive error messages.',
    status: 'implemented' as const,
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-orange-400" />,
    label: '2FA / MFA',
    detail: 'Supabase supports TOTP-based 2FA. Not yet enabled for admin accounts.',
    status: 'planned' as const,
  },
];

const statusConfig = {
  implemented: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Implemented',
    className: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  },
  partial: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Partial',
    className: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  },
  planned: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Planned',
    className: 'text-slate-400 bg-slate-500/10 border border-slate-500/20',
  },
};

export default function SecurityOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const totalItems = pillars.flatMap((p) => p.items).length + additionalControls.length;
  const implementedItems =
    pillars.flatMap((p) => p.items).filter((i) => i.status === 'implemented').length +
    additionalControls.filter((c) => c.status === 'implemented').length;
  const plannedItems =
    pillars.flatMap((p) => p.items).filter((i) => i.status === 'planned').length +
    additionalControls.filter((c) => c.status === 'planned').length;
  const partialItems =
    pillars.flatMap((p) => p.items).filter((i) => i.status === 'partial').length;

  const completionPct = Math.round((implementedItems / totalItems) * 100);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Security Overview</h1>
          </div>
          <p className="text-slate-400">
            CIA Triad compliance status and security controls for the SecureDoc system
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs">Security Score</CardDescription>
              <CardTitle className="text-3xl text-white">{completionPct}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs">Implemented</CardDescription>
              <CardTitle className="text-3xl text-emerald-400">{implementedItems}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">of {totalItems} controls</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs">Partial</CardDescription>
              <CardTitle className="text-3xl text-amber-400">{partialItems}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">in progress</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs">Planned</CardDescription>
              <CardTitle className="text-3xl text-slate-400">{plannedItems}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">not yet implemented</p>
            </CardContent>
          </Card>
        </div>

        {/* CIA Triad pillars */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {pillars.map((pillar) => {
            const pillarImplemented = pillar.items.filter((i) => i.status === 'implemented').length;
            const pillarTotal = pillar.items.length;

            return (
              <Card key={pillar.id} className={`bg-slate-900 border-slate-800`}>
                <CardHeader className="pb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${pillar.bgColor} border ${pillar.borderColor} mb-3`}>
                    <span className={pillar.accentColor}>{pillar.icon}</span>
                  </div>
                  <CardTitle className="text-white text-xl">{pillar.title}</CardTitle>
                  <CardDescription className={`${pillar.textColor} text-sm font-medium`}>
                    {pillar.subtitle}
                  </CardDescription>
                  <p className="text-slate-500 text-xs mt-1">{pillar.concept}</p>

                  {/* Pillar progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{pillarImplemented}/{pillarTotal} controls implemented</span>
                      <span>{Math.round((pillarImplemented / pillarTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${
                          pillar.id === 'confidentiality'
                            ? 'bg-indigo-500'
                            : pillar.id === 'integrity'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${(pillarImplemented / pillarTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {pillar.items.map((item, idx) => {
                    const status = statusConfig[item.status];
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm text-white font-medium leading-snug">{item.label}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                        <p className="text-xs font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded">
                          {item.detail}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Security Controls */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Additional Security Controls
            </CardTitle>
            <CardDescription className="text-slate-400">
              Supporting security measures beyond the CIA Triad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {additionalControls.map((control, idx) => {
                const status = statusConfig[control.status];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-slate-900">{control.icon}</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium mb-1">{control.label}</p>
                    <p className="text-xs text-slate-400">{control.detail}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-xs text-slate-600 text-center mt-6">
          SecureDoc — Information Security Course Project · CIA Triad compliance report · All controls verified against source code
        </p>
      </div>
    </div>
  );
}
