import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuditLog, Permission, Service, Tenant, User, UserRateLimit } from '../types';

interface ApiSettings {
  baseUrl: string;
  timeout: number;
}

interface ApiContextType {
  settings: ApiSettings;
  updateSettings: (settings: Partial<ApiSettings>) => void;
  makeRequest: (endpoint: string, options?: AxiosRequestConfig) => Promise<AxiosResponse>;
  get: (endpoint: string) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
  auth: {
    login: (username: string, password: string, tenant: string) => Promise<any>;
    register: (data: any) => Promise<any>;
    registerTenant: (data: any) => Promise<any>;
  };
  admin: {
    getTenants: () => Promise<any>;
    createTenant: (data: any) => Promise<any>;
    getUsers: () => Promise<any>;
    getUsersByTenant: (tenantId: string) => Promise<any>;
    changeUserRole: (tenantId: string, data: any) => Promise<any>;
    deleteTenant: (tenantId: string) => Promise<any>;
    updateTenant: (tenantId: string, data: any) => Promise<any>;
    deleteUser: (tenantId: string, userId: string) => Promise<any>;
    updateUser: (tenantId: string, userId: string, data: any) => Promise<any>;
  };
  gateway: {
    getServices: () => Promise<any>;
    createService: (data: any) => Promise<any>;
    updateServiceRateLimit: (serviceId: string, data: any) => Promise<any>;
    getUserRateLimit: (serviceId: string, userId: string) => Promise<any>;
    updateUserRateLimit: (serviceId: string, data: any) => Promise<any>;
    grantPermissions: (serviceId: string, data: any) => Promise<any>;
    removePermissions: (serviceId: string, userId: string) => Promise<any>;
    deleteService: (serviceId: string) => Promise<any>;
    updateService: (serviceId: string, data: any) => Promise<any>;
    deletePermission: (serviceId: string, userId: string) => Promise<any>;
  };
  tenants: {
    getAll: () => Promise<Tenant[]>;
    create: (data: Partial<Tenant>) => Promise<Tenant>;
    update: (id: number, data: Partial<Tenant>) => Promise<Tenant>;
    delete: (id: number) => Promise<void>;
    getUsers: (tenantId: number) => Promise<User[]>;
  };
  users: {
    getAll: () => Promise<User[]>;
    create: (data: Partial<User>) => Promise<User>;
    update: (id: number, data: Partial<User>) => Promise<User>;
    delete: (id: number) => Promise<void>;
    changeRole: (userId: number, role: string) => Promise<void>;
  };
  services: {
    getAll: () => Promise<Service[]>;
    create: (data: Partial<Service>) => Promise<Service>;
    update: (id: number, data: Partial<Service>) => Promise<Service>;
    delete: (id: number) => Promise<void>;
    updateRateLimit: (id: number, limit: number) => Promise<void>;
  };
  permissions: {
    grant: (data: Partial<Permission>) => Promise<Permission>;
    revoke: (serviceId: number, userId: number) => Promise<void>;
    getForService: (serviceId: number) => Promise<Permission[]>;
  };
  rateLimits: {
    get: (serviceId: number, userId: number) => Promise<UserRateLimit>;
    update: (serviceId: number, userId: number, limit: number) => Promise<void>;
  };
  audit: {
    getLogs: (filters?: { 
      tenant_id?: number;
      user_id?: number;
      action?: string;
    }) => Promise<AuditLog[]>;
  };
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ApiSettings>({
    baseUrl: import.meta.env.VITE_API_URL || 'https://api-gateway.example.com',
    timeout: 30000,
  });

  const updateSettings = (newSettings: Partial<ApiSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    localStorage.setItem('api_settings', JSON.stringify({ ...settings, ...newSettings }));
  };

  const handleRequest = async (endpoint: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
    const url = `${settings.baseUrl}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    const tenant = localStorage.getItem('tenant');

    const config: AxiosRequestConfig = {
      ...options,
      baseURL: settings.baseUrl,
      url: endpoint,
      timeout: settings.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tenant && { 'X-Tenant': tenant }),
        ...options.headers
      }
    };

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
      throw error;
    }
  };

  const get = async (endpoint: string): Promise<any> => {
    const response = await handleRequest(endpoint, { method: 'GET' });
    return response.data;
  };

  const post = async (endpoint: string, data?: any): Promise<any> => {
    const response = await handleRequest(endpoint, {
      method: 'POST',
      data
    });
    return response.data;
  };

  const put = async (endpoint: string, data?: any): Promise<any> => {
    const response = await handleRequest(endpoint, {
      method: 'PUT',
      data
    });
    return response.data;
  };

  const del = async (endpoint: string): Promise<any> => {
    const response = await handleRequest(endpoint, { method: 'DELETE' });
    return response.data;
  };

  const apiMethods = {
    auth: {
      login: (username: string, password: string, tenant: string) => 
        post('/auth/login', { username, password, tenant }),
      register: (data: any) => post('/auth/register', data),
      registerTenant: (data: any) => post('/auth/register/tenant', data)
    },
    admin: {
      getTenants: () => get('/admin/tenants'),
      createTenant: (data: any) => post('/admin/tenants', data),
      getUsers: () => get('/admin/users'),
      getUsersByTenant: (tenantId: string) => get(`/admin/users/${tenantId}`),
      changeUserRole: (tenantId: string, data: any) => 
        post(`/admin/users/${tenantId}/role`, data),
      deleteTenant: (tenantId: string) =>
        del(`/admin/tenants/${tenantId}`),
      updateTenant: (tenantId: string, data: any) =>
        put(`/admin/tenants/${tenantId}`, data),
      deleteUser: (tenantId: string, userId: string) =>
        del(`/admin/users/${tenantId}/${userId}`),
      updateUser: (tenantId: string, userId: string, data: any) =>
        put(`/admin/users/${tenantId}/${userId}`, data),
    },
    gateway: {
      getServices: () => get('/gateway/services'),
      createService: (data: any) => post('/gateway/services', data),
      updateServiceRateLimit: (serviceId: string, data: any) =>
        put(`/gateway/services/${serviceId}/rate-limit`, data),
      getUserRateLimit: (serviceId: string, userId: string) =>
        get(`/gateway/services/${serviceId}/user-rate-limits/${userId}`),
      updateUserRateLimit: (serviceId: string, data: any) =>
        put(`/gateway/services/${serviceId}/user-rate-limit`, data),
      grantPermissions: (serviceId: string, data: any) =>
        post(`/gateway/services/${serviceId}/permissions`, data),
      removePermissions: (serviceId: string, userId: string) =>
        del(`/gateway/services/${serviceId}/permissions/${userId}`),
      deleteService: (serviceId: string) => 
        del(`/gateway/services/${serviceId}`),
      updateService: (serviceId: string, data: any) =>
        put(`/gateway/services/${serviceId}`, data),
      deletePermission: (serviceId: string, userId: string) =>
        del(`/gateway/services/${serviceId}/permissions/${userId}`),
    },
    tenants: {
      getAll: () => get('/admin/tenants'),
      create: (data: Partial<Tenant>) => post('/admin/tenants', data),
      update: (id: number, data: Partial<Tenant>) => put(`/admin/tenants/${id}`, data),
      delete: (id: number) => del(`/admin/tenants/${id}`),
      getUsers: (tenantId: number) => get(`/admin/users/${tenantId}`),
    },
    users: {
      getAll: () => get('/admin/users'),
      create: (data: Partial<User>) => post('/auth/register/tenant', data),
      update: (id: number, data: Partial<User>) => put(`/admin/users/${id}`, data),
      delete: (id: number) => del(`/admin/users/${id}`),
      changeRole: (userId: number, role: string) => 
        post(`/admin/users/${userId}/role`, { role }),
    },
    services: {
      getAll: () => get('/gateway/services'),
      create: (data: Partial<Service>) => post('/gateway/services', data),
      update: (id: number, data: Partial<Service>) => put(`/gateway/services/${id}`, data),
      delete: (id: number) => del(`/gateway/services/${id}`),
      updateRateLimit: (id: number, limit: number) => 
        put(`/gateway/services/${id}/rate-limit`, { rate_limit: limit }),
    },
    permissions: {
      grant: (data: Partial<Permission>) => 
        post(`/gateway/services/${data.service_id}/permissions`, {
          user_id: data.user_id,
          access_level: data.access_level
        }),
      revoke: (serviceId: number, userId: number) => 
        del(`/gateway/services/${serviceId}/permissions/${userId}`),
      getForService: (serviceId: number) => 
        get(`/gateway/services/${serviceId}/permissions`),
    },
    rateLimits: {
      get: (serviceId: number, userId: number) => 
        get(`/gateway/services/${serviceId}/user-rate-limits/${userId}`),
      update: (serviceId: number, userId: number, limit: number) => 
        put(`/gateway/services/${serviceId}/user-rate-limit`, { rate_limit: limit }),
    },
    audit: {
      getLogs: (filters = {}) => handleRequest('/admin/audit-logs', { method: 'GET', params: filters }).then(response => response.data),
    }
  };

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('api_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <ApiContext.Provider value={{
      settings,
      updateSettings,
      makeRequest: handleRequest,
      get,
      post,
      put,
      delete: del,
      ...apiMethods
    }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
