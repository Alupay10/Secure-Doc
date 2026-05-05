import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Shield,
  Users,
  Activity,
  LogOut,
  Lock,
  FileStack,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useEffect } from 'react';

export default function RootLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const studentNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/new-request', icon: PlusCircle, label: 'New Request' },
    { path: '/requests', icon: FileText, label: 'My Requests' },
  ];

  const adminNavItems = [
    { path: '/admin-dashboard', icon: Shield, label: 'Security Dashboard' },
    { path: '/admin/requests', icon: FileStack, label: 'Request Management' },
    { path: '/admin/access-control', icon: Users, label: 'Access Control' },
    { path: '/admin/activity-logs', icon: Activity, label: 'Activity Logs' },
    { path: '/admin/security', icon: ShieldCheck, label: 'Security Overview' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="text-lg font-semibold text-white">SecureDoc</h1>
              <p className="text-xs text-slate-400">Request System</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs ${
                user?.role === 'admin'
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
