import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefHat, Calendar, Settings, Refrigerator, Share2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { roomId } = useApp();
  const [copied, setCopied] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) => {
    const base = "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors";
    return isActive(path)
      ? `${base} bg-primary-500 text-white`
      : `${base} text-gray-600 hover:bg-gray-100`;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?family=${roomId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "What's for dinner?", text: 'Join my family meal planner!', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
            <ChefHat className="w-8 h-8" />
            What's for dinner?
          </h1>
          {roomId && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Share with family"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
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
