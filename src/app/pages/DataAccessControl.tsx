import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Shield, Users, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function DataAccessControl() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const users = [
    { id: 'STU-001', name: 'John Doe', email: 'john@university.edu', role: 'student', status: 'active', permissions: ['read', 'request'] },
    { id: 'STU-002', name: 'Jane Smith', email: 'jane@university.edu', role: 'student', status: 'active', permissions: ['read', 'request'] },
    { id: 'STU-003', name: 'Bob Johnson', email: 'bob@university.edu', role: 'student', status: 'suspended', permissions: [] },
    { id: 'ADM-001', name: 'Admin User', email: 'admin@university.edu', role: 'admin', status: 'active', permissions: ['read', 'write', 'approve', 'delete'] },
    { id: 'ADM-002', name: 'Sarah Williams', email: 'sarah@university.edu', role: 'admin', status: 'active', permissions: ['read', 'approve'] },
  ];

  const handleRoleChange = (userId: string, newRole: string) => {
    toast.success(`Role updated for user ${userId}`);
  };

  const handleStatusToggle = (userId: string) => {
    toast.success(`Access status toggled for user ${userId}`);
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

  return (
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
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Name</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Email</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Role</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Status</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Permissions</th>
                    <th className="text-left text-sm font-medium text-slate-400 pb-3">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-4 text-sm text-white">{userData.id}</td>
                      <td className="py-4 text-sm text-white">{userData.name}</td>
                      <td className="py-4 text-sm text-slate-400">{userData.email}</td>
                      <td className="py-4">
                        <Select
                          defaultValue={userData.role}
                          onValueChange={(value) => handleRoleChange(userData.id, value)}
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
                        <div className="flex flex-wrap gap-1">
                          {userData.permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-300">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            defaultChecked={userData.status === 'active'}
                            onCheckedChange={() => handleStatusToggle(userData.id)}
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
  );
}
