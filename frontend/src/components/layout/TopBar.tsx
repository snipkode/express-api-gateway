import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  user: any;
  onSidebarToggle: () => void;
}

export function TopBar({ user, onSidebarToggle }: TopBarProps) {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gray-800">Gateway Manager</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-800">{user?.username}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role} • {user?.tenant}</div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}