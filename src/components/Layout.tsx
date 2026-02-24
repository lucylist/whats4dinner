import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Share2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { roomId } = useApp();
  const [copied, setCopied] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const basePath = import.meta.env.BASE_URL || '/';

  const navLinkClass = (path: string) => {
    const base = "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all";
    return isActive(path)
      ? `${base} bg-gold/20 text-gold-light`
      : `${base} text-cream-400 hover:text-cream-100 hover:bg-forest-600`;
  };

  const navIconClass = (path: string) => {
    return isActive(path)
      ? "h-10 w-auto mb-0.5 object-contain"
      : "h-10 w-auto mb-0.5 object-contain brightness-75";
  };

  const handleShare = async () => {
    const base = import.meta.env.BASE_URL || '/';
    const url = `${window.location.origin}${base}?family=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-forest-800">
      {/* Header */}
      <header className="sticky top-0 w-screen bg-forest-800/95 backdrop-blur-sm border-b border-forest-500/50 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/calendar" className="group">
            <img
              src={`${import.meta.env.BASE_URL || '/'}images/logo-botanical.png`}
              alt="What's for dinner?"
              className="h-10 sm:h-12 w-auto"
            />
          </Link>
          <div className="flex items-center gap-1">
            {roomId && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-400 hover:text-cobalt hover:bg-forest-600 rounded-lg transition-colors"
                title="Share with family"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-forest-200" />
                    <span className="text-forest-200">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 pb-28">
        {children}
      </main>

      {/* Shadow gradient above nav */}
      <div className="fixed bottom-20 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent z-40 pointer-events-none" />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-forest-800 border-t border-forest-500/50 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center h-20">
            <Link to="/calendar" className={navLinkClass('/calendar')}>
              <img src={`${basePath}images/nav-icon-calendar.png`} alt="" className={navIconClass('/calendar')} />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">Calendar</span>
            </Link>
            <Link to="/meals" className={navLinkClass('/meals')}>
              <img src={`${basePath}images/nav-icon-meals.png`} alt="" className={navIconClass('/meals')} />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">Meals</span>
            </Link>
            <Link to="/plan-week" className={navLinkClass('/plan-week')}>
              <img src={`${basePath}images/nav-icon-preferences.png`} alt="" className={navIconClass('/plan-week')} />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">Preferences</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
