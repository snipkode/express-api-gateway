import React, { useState } from 'react';
import { useEffect } from 'react';
import { Share2, ExternalLink, Copy, FileText, Code } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';

interface ProxyRoute {
  id: string;
  path: string;
  service: string;
  target: string;
  method: string[];
  description: string;
  version: string;
}


export function ProxyPage() {
  const api = useApi();
  const [routes, setRoutes] = useState<ProxyRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<ProxyRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gateway/services');
      
      // Transform services into proxy routes
      const transformedRoutes = response.services?.map((service: any) => ({
        id: service.id,
        path: `/api/${service.version}/${service.name}/*`,
        service: service.name,
        target: service.target,
        method: ['GET', 'POST', 'PUT', 'DELETE'], // Default methods
        description: `${service.name} service proxy`,
        version: service.version
      })) || [];
      
      setRoutes(transformedRoutes);
      setError(null);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load proxy routes');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testProxyRoute = async (route: ProxyRoute) => {
    try {
      setTestResult('Testing...');
      const testPath = `/api/${route.version}/${route.service}/test`;
      const response = await api.get(testPath);
      setTestResult(`Success: ${JSON.stringify(response, null, 2)}`);
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">API Proxy Configuration</h1>
        <p className="text-gray-600">Manage dynamic routing and proxy settings for your services</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={fetchRoutes}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* Proxy Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routes List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Active Routes</h2>
            <button 
              onClick={fetchRoutes}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh Routes
            </button>
          </div>

          <div className="space-y-4">
            {routes.map((route, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedRoute === route 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Share2 className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-sm text-gray-800">{route.path}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {route.method.map((method) => (
                      <span
                        key={method}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getMethodColor(method)}`}
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">{route.description}</div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Service: {route.service}</span>
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-32">{route.target}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Route Details</h2>
          
          {selectedRoute ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service Name</label>
                <p className="text-sm text-gray-800 mt-1">{selectedRoute.service}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proxy Path</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1">
                    {selectedRoute.path}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedRoute.path)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target URL</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                    {selectedRoute.target}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedRoute.target)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Allowed Methods</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedRoute.method.map((method) => (
                    <span
                      key={method}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getMethodColor(method)}`}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                <p className="text-sm text-gray-700 mt-1">{selectedRoute.description}</p>
              </div>

              {testResult && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Test Result</label>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                    {testResult}
                  </pre>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.open(`${api.settings.swaggerUrl}`, '_blank')}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Docs</span>
                  </button>
                  <button 
                    onClick={() => testProxyRoute(selectedRoute)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    <span>Test API</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a route to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* API Documentation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">API Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">{route.service}</h3>
                <button 
                  onClick={() => window.open(`/api/docs/${route.version}/${route.service}/swagger.json`, '_blank')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{route.description}</p>
              <a
                href={`/api/docs/${route.version}/${route.service}/swagger.json`}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View Swagger</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}