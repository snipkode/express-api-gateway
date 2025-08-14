import React, { useState } from 'react';
import { useEffect } from 'react';
import { Plus, Search, Shield, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  tenant: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}


export function UsersPage() {
  const api = useApi();
  const { register } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    tenant: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchUsers(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/admin/tenants');
      setTenants(response.tenants || []);
      if (response.tenants?.length > 0) {
        setSelectedTenant(response.tenants[0].id);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants');
    }
  };

  const fetchUsers = async (tenantId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${tenantId}`);
      
      // Transform API response to match our interface
      const transformedUsers = response.users?.map((user: any) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        tenant: tenantId,
        status: 'active', // Default status
        lastLogin: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        createdAt: new Date().toISOString().split('T')[0]
      })) || [];
      
      setUsers(transformedUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const success = await register(newUser.username, newUser.password, newUser.role, newUser.tenant);
      if (success) {
        setShowAddUser(false);
        setNewUser({ username: '', password: '', role: 'user', tenant: '' });
        if (selectedTenant) {
          fetchUsers(selectedTenant);
        }
      } else {
        alert('Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.post(`/admin/users/${selectedTenant}/role`, {
        userId: parseInt(userId),
        role: newRole
      });
      
      // Refresh users list
      if (selectedTenant) {
        fetchUsers(selectedTenant);
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage users across all tenants</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <select 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={() => setShowAddUser(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Add New User</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={newUser.tenant}
                  onChange={(e) => setNewUser({ ...newUser, tenant: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.name}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Tenant</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Last Login</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Created</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{user.username}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border-0 ${getRoleColor(user.role)}`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        {user.role === 'superadmin' && <option value="superadmin">superadmin</option>}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{user.tenant}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{user.lastLogin}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{user.createdAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}