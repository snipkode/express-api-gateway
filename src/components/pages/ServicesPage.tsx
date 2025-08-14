import React, { useState } from 'react';
import { useEffect } from 'react';
import { Plus, Search, Globe, Activity, BarChart3, AlertCircle, MoreVertical } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';

interface Service {
  id: string;
  name: string;
  version: string;
  target: string;
  tenant: string;
  status: 'healthy' | 'degraded' | 'down';
  rate_limit: number;
  requestCount: number;
  uptime: string;
}

interface ServicePermission {
  userId: string;
  serviceId: string;
  rateLimit: number;
  accessLevel: 'read' | 'write' | 'admin';
}

interface UserPermission {
  id: string;
  name: string;
  email: string;
  accessLevel: 'read' | 'write' | 'admin';
  rateLimit: number;
}

export function ServicesPage() {
  const api = useApi();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    version: 'v1',
    target: ''
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [permissions, setPermissions] = useState<ServicePermission[]>([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceUsers, setServiceUsers] = useState<UserPermission[]>([]);
  const [newPermission, setNewPermission] = useState({
    userId: '',
    accessLevel: 'read' as const,
    rateLimit: 100
  });
  const [generatedToken, setGeneratedToken] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gateway/services');
      
      // Transform API response to match our interface
      const transformedServices = response.services?.map((service: any) => ({
        id: service.id,
        name: service.name,
        version: service.version,
        target: service.target,
        tenant: 'default', // Default tenant since API doesn't provide it
        status: 'healthy', // Default status
        rate_limit: service.rate_limit || 0,
        requestCount: Math.floor(Math.random() * 50000), // Mock data
        uptime: '99.9%' // Mock data
      })) || [];
      
      setServices(transformedServices);
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    try {
      await api.post('/gateway/services', newService);
      setShowAddService(false);
      setNewService({ name: '', version: 'v1', target: '' });
      fetchServices(); // Refresh the list
    } catch (err) {
      console.error('Error adding service:', err);
      alert('Failed to add service');
    }
  };

  const handleUpdateRateLimit = async (serviceId: string, rateLimit: number) => {
    try {
      await api.gateway.updateServiceRateLimit(serviceId, { rate_limit: rateLimit });
      await fetchServices();
    } catch (err) {
      console.error('Error updating rate limit:', err);
      alert('Failed to update rate limit');
    }
  };

  const handleGrantPermission = async (serviceId: string, userId: string) => {
    try {
      await api.gateway.grantPermissions(serviceId, { user_id: userId });
      setShowPermissionsModal(false);
      await fetchServices();
    } catch (err) {
      console.error('Error granting permissions:', err);
      alert('Failed to grant permissions');
    }
  };

  const handleGenerateToken = async (serviceId: string) => {
    try {
      const response = await api.post(`/gateway/services/${serviceId}/token`);
      setGeneratedToken(response.token);
      setShowTokenModal(true);
    } catch (err) {
      console.error('Error generating token:', err);
      alert('Failed to generate token');
    }
  };

  const handleAddPermission = async (serviceId: string) => {
    try {
      await api.gateway.grantPermissions(serviceId, {
        user_id: newPermission.userId,
        access_level: newPermission.accessLevel,
        rate_limit: newPermission.rateLimit
      });
      fetchServiceUsers(serviceId);
      setNewPermission({ userId: '', accessLevel: 'read', rateLimit: 100 });
    } catch (err) {
      console.error('Error adding permission:', err);
      alert('Failed to add permission');
    }
  };

  const fetchServiceUsers = async (serviceId: string) => {
    try {
      const response = await api.get(`/gateway/services/${serviceId}/permissions`);
      setServiceUsers(response.users || []);
    } catch (err) {
      console.error('Error fetching service users:', err);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTenant = !selectedTenant || service.tenant === selectedTenant;
    return matchesSearch && matchesTenant;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Management</h1>
          <p className="text-gray-600">Configure and monitor gateway services</p>
        </div>
        <button 
          onClick={() => setShowAddService(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services..."
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
            <option value="">All Tenants</option>
            <option value="acme-corp">ACME Corp</option>
            <option value="techstartup">Tech Startup</option>
            <option value="betatest">Beta Testing</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
          </select>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={() => setShowAddService(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Service</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Service Name (e.g., todo)"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Version (e.g., v1)"
                  value={newService.version}
                  onChange={(e) => setNewService({ ...newService, version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="url"
                  placeholder="Target URL (e.g., https://api.example.com)"
                  value={newService.target}
                  onChange={(e) => setNewService({ ...newService, target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddService(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={fetchServices}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Service Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.version}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(service.status)}
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target URL</label>
                <p className="text-sm text-gray-700 truncate">{service.target}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tenant</label>
                <p className="text-sm text-gray-700">{service.tenant}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rate Limit</label>
                  <input
                    type="number"
                    value={service.rate_limit}
                    onChange={(e) => handleUpdateRateLimit(service.id, parseInt(e.target.value))}
                    className="text-sm text-gray-700 border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uptime</label>
                  <p className="text-sm text-gray-700">{service.uptime}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{service.requestCount.toLocaleString()} requests</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Service Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentService(service);
                  setShowPermissionsModal(true);
                  fetchServiceUsers(service.id);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Manage Permissions
              </button>
              <button
                onClick={() => handleGenerateToken(service.id)}
                className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                Generate Token
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No services found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first service to the gateway.</p>
          <button 
            onClick={() => setShowAddService(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      )}

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowTokenModal(false)} />
            <div className="relative bg-white rounded-xl p-6 max-w-lg w-full">
              <h3 className="text-xl font-bold mb-4">API Token</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 break-all">
                <p className="text-sm font-mono">{generatedToken}</p>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => navigator.clipboard.writeText(generatedToken)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && currentService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPermissionsModal(false)} />
            <div className="relative bg-white rounded-xl p-6 max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-6">Manage Service Permissions</h3>
              
              {/* Add New Permission */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="User ID"
                  value={newPermission.userId}
                  onChange={(e) => setNewPermission({...newPermission, userId: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={newPermission.accessLevel}
                  onChange={(e) => setNewPermission({...newPermission, accessLevel: e.target.value as 'read' | 'write' | 'admin'})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handleAddPermission(currentService.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add Permission
                </button>
              </div>

              {/* Users List */}
              <div className="space-y-4">
                {serviceUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {user.accessLevel} • {user.rateLimit} req/min
                      </span>
                      <button
                        onClick={() => api.gateway.removePermissions(currentService.id, user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}