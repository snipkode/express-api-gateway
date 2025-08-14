import React, { useState, useEffect } from 'react';
import { Shield, Users } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';

interface PermissionFormProps {
  serviceId: string;
  tenantId: string;
  onSubmit: (userId: string) => Promise<void>;
  onCancel: () => void;
}

export function PermissionForm({ serviceId, tenantId, onSubmit, onCancel }: PermissionFormProps) {
  const api = useApi();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    try {
      const response = await api.admin.getUsersByTenant(tenantId);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select User
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedUser}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Shield className="w-4 h-4" />
          <span>{isSubmitting ? 'Granting...' : 'Grant Access'}</span>
        </button>
      </div>
    </form>
  );
}
