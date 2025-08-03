import React, { useState } from 'react';
import { Plus, Search, Globe, Activity, BarChart3, AlertCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  version: string;
  target: string;
  tenant: string;
  status: 'healthy' | 'degraded' | 'down';
  rateLimit: number;
  requestCount: number;
  uptime: string;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'payment-api',
    version: 'v1',
    target: 'https://payment.acme-corp.internal',
    tenant: 'acme-corp',
    status: 'healthy',
    rateLimit: 1000,
    requestCount: 15420,
    uptime: '99.9%'
  },
  {
    id: '2',
    name: 'user-service',
    version: 'v2',
    target: 'https://users.acme-corp.internal',
    tenant: 'acme-corp',
    status: 'healthy',
    rateLimit: 500,
    requestCount: 8250,
    uptime: '99.8%'
  },
  {
    id: '3',
    name: 'notification-api',
    version: 'v1',
    target: 'https://notify.techstartup.internal',
    tenant: 'techstartup',
    status: 'degraded',
    rateLimit: 200,
    requestCount: 3120,
    uptime: '97.2%'
  }
];

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Management</h1>
          <p className="text-gray-600">Configure and monitor gateway services</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
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
                  <p className="text-sm text-gray-700">{service.rateLimit}/min</p>
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
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No services found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first service to the gateway.</p>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto">
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      )}
    </div>
  );
}