import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6 sm:p-8 lg:p-10 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Background Decor (Minimalist) */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary-100/20 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary-100/10 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </div>
  );
};

export default MainLayout;
