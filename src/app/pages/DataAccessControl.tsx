import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Shield, Users, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { UserProfile, getAllUsers, updateUserRole, updateUserStatus } from '../../services/userService';
import { signIn } from '../../services/authService';

export default function DataAccessControl() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    targetUserId?: string;
    newRole?: 'admin' | 'student';
    password?: string;
    error?: string;
  }>({ isOpen: false });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error('Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (targetUserId: string, newRole: 'admin' | 'student') => {
    if (newRole === 'admin') {
      setConfirmation({ isOpen: true, targetUserId, newRole });
    } else {
      updateRole(targetUserId, newRole);
    }
  };

  const handleConfirmation = async () => {
    if (!confirmation.targetUserId || !confirmation.newRole || !confirmation.password || !user?.email) {
      setConfirmation(prev => ({ ...prev, error: 'An unexpected error occurred.' }));
      return;
    }

    try {
      // Verify admin's password by trying to sign in
      await signIn(user.email, confirmation.password);
      
      // Password is correct, proceed with role update
      await updateRole(confirmation.targetUserId, confirmation.newRole);
      
      setConfirmation({ isOpen: false }); // Close dialog on success
    } catch (error) {
      setConfirmation(prev => ({ ...prev, error: 'Incorrect password. Action cancelled.' }));
    }
  };

  const updateRole = async (targetUserId: string, newRole: 'admin' | 'student') => {
    if (!user || !user.email) {
      toast.error('Admin user information is not available.');
      return;
    }
    try {
      await updateUserRole(targetUserId, newRole, { id: user.id, email: user.email });
      toast.success(`Role updated for user ${targetUserId}`);
      fetchUsers(); // Refresh user list
    } catch (error) {
      toast.error('Failed to update user role.');
    }
  };

  const handleStatusToggle = async (targetUserId: string, currentStatus: 'active' | 'suspended') => {
    if (!user || !user.email) {
      toast.error('Admin user information is not available.');
      return;
    }
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(targetUserId, newStatus, { id: user.id, email: user.email });
      toast.success(`Access status updated for user ${targetUserId}`);
      fetchUsers(); // Refresh user list
    } catch (error) {
      toast.error('Failed to update user status.');
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin'
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-slate-400">Loading user data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold text-white">Data Access Control</h1>
            </div>
            <p className="text-slate-400">Manage user roles, permissions, and access levels</p>
          </div>

          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardHeader>
              <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-900 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-300 font-medium">Security Warning</p>
                  <p className="text-slate-400 mt-1">
                    Changes to user permissions are immediately effective and will be logged. Ensure you have proper authorization before modifying access controls.
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Total Users</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-3">
                  {users.length}
                  <Users className="w-6 h-6 text-indigo-400" />
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Active Users</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-3">
                  {users.filter(u => u.status === 'active').length}
                  <Unlock className="w-6 h-6 text-emerald-400" />
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Suspended Users</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-3">
                  {users.filter(u => u.status === 'suspended').length}
                  <Lock className="w-6 h-6 text-red-400" />
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">User Access Management</CardTitle>
              <CardDescription className="text-slate-400">Configure roles and permissions for system users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-sm font-medium text-slate-400 pb-3">User ID</th>
                      <th className="text-left text-sm font-medium text-slate-400 pb-3">Email</th>
                      <th className="text-left text-sm font-medium text-slate-400 pb-3">Role</th>
                      <th className="text-left text-sm font-medium text-slate-400 pb-3">Status</th>
                      <th className="text-left text-sm font-medium text-slate-400 pb-3">Access Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userData) => (
                      <tr key={userData.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-4 text-sm text-white font-mono">{userData.id}</td>
                        <td className="py-4 text-sm text-slate-400">{userData.email}</td>
                        <td className="py-4">
                          <Select
                            value={userData.role}
                            onValueChange={(value) => handleRoleChange(userData.id, value as 'admin' | 'student')}
                            disabled={userData.id === user?.id} // Prevent admin from changing their own role
                          >
                            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-4">
                          <Badge className={getStatusBadge(userData.status)}>
                            {userData.status}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={userData.status === 'active'}
                              onCheckedChange={() => handleStatusToggle(userData.id, userData.status)}
                              disabled={userData.id === user?.id} // Prevent admin from suspending themselves
                            />
                            {userData.status === 'active' ? (
                              <Unlock className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Lock className="w-4 h-4 text-red-400" />
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
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmation.isOpen} onOpenChange={(isOpen) => setConfirmation({ isOpen })}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Admin Promotion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Promoting a user to an administrator is a high-risk action. To proceed, please enter your password to confirm your identity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter your password"
              className="bg-slate-800 border-slate-700 text-white"
              value={confirmation.password || ''}
              onChange={(e) => setConfirmation(prev => ({ ...prev, password: e.target.value, error: undefined }))}
            />
            {confirmation.error && (
              <p className="text-red-400 text-sm mt-2">{confirmation.error}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleConfirmation} className="bg-indigo-600 hover:bg-indigo-700 text-white">Confirm & Promote</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
