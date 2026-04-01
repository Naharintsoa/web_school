import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function Layout({ 
  children, 
  userName, 
  userRole, 
  activePath, 
  onNavigate, 
  onLogout 
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`
        fixed inset-0 z-40 lg:hidden
        ${sidebarOpen ? 'block' : 'hidden'}
      `}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-indigo-800">
          <Sidebar
            role={userRole as 'admin' | 'teacher' | 'parent'}
            onNavigate={(path) => {
              onNavigate(path);
              setSidebarOpen(false);
            }}
            activePath={activePath}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64">
          <Sidebar
            role={userRole as 'admin' | 'teacher' | 'parent'}
            onNavigate={onNavigate}
            activePath={activePath}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={userName}
          role={userRole}
          activePath={activePath}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}