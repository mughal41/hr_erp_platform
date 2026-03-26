import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  Briefcase,
  CreditCard, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Employees', path: '/employees' },
  { icon: CalendarCheck, label: 'Attendance', path: '/attendance' },
  { icon: FileSpreadsheet, label: 'Leave', path: '/leave' },
  { icon: Briefcase, label: 'Recruitment', path: '/recruitment' },
  { icon: CreditCard, label: 'Payroll', path: '/payroll' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  return (
    <div className={`h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-slate-50">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          H
        </div>
        {!isCollapsed && <span className="ml-3 font-bold text-xl tracking-tight text-slate-900">Portal</span>}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            <item.icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-16 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-50 space-y-1">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5 mx-auto" /> : (
            <>
              <ChevronLeft className="h-5 w-5 mr-3" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <LogOut className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
