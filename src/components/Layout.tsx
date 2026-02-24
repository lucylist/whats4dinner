import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Share2, Check } from 'lucide-react';
import { CalendarLeafIcon, RecipesFlowerIcon, PlanHerbIcon } from './NavIcons';
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
      ? `${base} bg-gold/20 text-gold-light`
      : `${base} text-cream-400 hover:text-cream-100 hover:bg-forest-600`;
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
      <header className="sticky top-0 bg-forest-800/95 backdrop-blur-sm border-b border-forest-500/50 z-40">
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
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-400 hover:text-gold hover:bg-forest-600 rounded-lg transition-colors"
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

      <main className="max-w-7xl w-full mx-auto px-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-forest-800/95 backdrop-blur-sm border-t border-forest-500/50 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            <Link to="/calendar" className={navLinkClass('/calendar')}>
              <CalendarLeafIcon className="w-7 h-7 mb-0.5" />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">Calendar</span>
            </Link>
            <Link to="/meals" className={navLinkClass('/meals')}>
              <RecipesFlowerIcon className="w-7 h-7 mb-0.5" />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">Recipes</span>
            </Link>
            {/* My Fridge - hidden for MVP */}
            <Link to="/plan-week" className={navLinkClass('/plan-week')}>
              <PlanHerbIcon className="w-7 h-7 mb-0.5" />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">Plan</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
