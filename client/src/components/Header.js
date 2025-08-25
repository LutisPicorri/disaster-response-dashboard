import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">
            Disaster Response Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-slate-300">
            Welcome, {user?.name || 'User'}
          </div>
          <button className="p-2 rounded-lg hover:bg-slate-700 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-600 transition-colors text-red-400 hover:text-white"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
