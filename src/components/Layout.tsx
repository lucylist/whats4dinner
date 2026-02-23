import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefHat, Calendar, Settings, Refrigerator, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) => {
    const base = "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors";
    return isActive(path)
      ? `${base} bg-primary-500 text-white`
      : `${base} text-gray-600 hover:bg-gray-100`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
            <ChefHat className="w-8 h-8" />
            What's for dinner?
          </h1>
          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || ''}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-primary-200"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.displayName?.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            <Link to="/this-week" className={navLinkClass('/this-week')}>
              <Calendar className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Calendar</span>
            </Link>
            <Link to="/" className={navLinkClass('/')}>
              <ChefHat className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Meals</span>
            </Link>
            <Link to="/fridge" className={navLinkClass('/fridge')}>
              <Refrigerator className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">My fridge</span>
            </Link>
            <Link to="/plan-week" className={navLinkClass('/plan-week')}>
              <Settings className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Preferences</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
