export interface Tenant {
  id: number;
  name: string;
  display_name: string;
  owner_email: string;
  status: 'active' | 'inactive';
  subscription_plan: 'free' | 'pro';
  subscription_expiry: string;
  max_users: number;
  custom_domain?: string;
  logo_url?: string;
  settings_json?: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  tenant_id: number;
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: number;
  name: string;
  target: string;
  version: string;
  tenant_id: number;
  description?: string;
  status: 'active' | 'inactive';
  rate_limit: number;
  swagger?: string;
  created_at: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  user_id: number;
  service_id: number;
  tenant_id: number;
  access_level: 'read' | 'write' | 'full';
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  tenant_id?: number;
  action: string;
  resource: string;
  description: string;
  timestamp: string;
}

export interface UserRateLimit {
  id: number;
  user_id: number;
  service_id: number;
  tenant_id: number;
  rate_limit: number;
  remaining: number;
  last_reset: string;
  created_at: string;
  updated_at?: string;
}
