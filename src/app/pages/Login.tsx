import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // SECURE FIX: We no longer pass the 'role' from the client.
  // The login function verifies the password and returns the correct role.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Call the updated login function (from AuthContext)
    const assignedRole = login(email, password);

    if (assignedRole) {
      toast.success(`Logged in successfully`);
      navigate(assignedRole === 'admin' ? '/admin-dashboard' : '/dashboard');
    } else {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SecureDoc System</h1>
          <p className="text-slate-400">Secure Document Request & Management</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Login to Your Account</h2>

          {/* SECURE FIX: Attach handleSubmit to the form directly */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="pt-4 space-y-3">
              {/* SECURE FIX: Only ONE single unified Login button */}
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                Login
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                All access is monitored and logged. Unauthorized access attempts will be reported to system administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}