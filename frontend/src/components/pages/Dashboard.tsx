import React from 'react';
import { 
  Building2, 
  Users, 
  Cog, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const stats = [
  {
    label: 'Active Tenants',
    value: '12',
    change: '+2 this month',
    icon: Building2,
    color: 'blue'
  },
  {
    label: 'Total Users',
    value: '248',
    change: '+15 this week',
    icon: Users,
    color: 'emerald'
  },
  {
    label: 'Active Services',
    value: '34',
    change: '+5 new services',
    icon: Cog,
    color: 'purple'
  },
  {
    label: 'API Requests',
    value: '1.2M',
    change: '+18% from last month',
    icon: Activity,
    color: 'orange'
  }
];

const recentActivity = [
  { type: 'success', message: 'New tenant "acme-corp" created', time: '5 minutes ago' },
  { type: 'warning', message: 'Rate limit exceeded for service "payment-api"', time: '12 minutes ago' },
  { type: 'info', message: 'User role updated in tenant "tech-startup"', time: '1 hour ago' },
  { type: 'success', message: 'Service "notification-api" deployed successfully', time: '2 hours ago' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your multi-tenant infrastructure at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            emerald: 'bg-emerald-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500'
          };

          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-xs text-green-600 font-medium">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const getIcon = () => {
                switch (activity.type) {
                  case 'success':
                    return <CheckCircle className="w-5 h-5 text-green-500" />;
                  case 'warning':
                    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
                  default:
                    return <Clock className="w-5 h-5 text-blue-500" />;
                }
              };

              return (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  {getIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">System Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">API Gateway</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Healthy</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Database</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Rate Limiter</span>
              </div>
              <span className="text-xs text-yellow-600 font-medium">High Load</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Proxy Services</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Operational</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Create New Tenant
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Add Service
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                View API Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}