import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ApiSettings {
  baseUrl: string;
  timeout: number;
}

interface ApiContextType {
  settings: ApiSettings;
  updateSettings: (settings: Partial<ApiSettings>) => void;
  makeRequest: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ApiSettings>({
    baseUrl: 'http://localhost:3000',
    timeout: 5000
  });

  const updateSettings = (newSettings: Partial<ApiSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    localStorage.setItem('api_settings', JSON.stringify({ ...settings, ...newSettings }));
  };

  const makeRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const url = `${settings.baseUrl}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), settings.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
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
      makeRequest
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