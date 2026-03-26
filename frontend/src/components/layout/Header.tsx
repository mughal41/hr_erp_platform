import React from 'react';
import { useSelector } from 'react-redux';
import { Bell, Search, User } from 'lucide-react';
import Avatar from '../common/Avatar';

const Header: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search employees, tasks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-5">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-100 mx-2"></div>

        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Administrator'}</p>
          </div>
          <Avatar 
            name={user?.name || 'Admin User'} 
            className="ring-2 ring-transparent group-hover:ring-primary-100 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
