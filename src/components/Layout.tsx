import React, { useState, useRef, useCallback } from 'react';
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

  // Pull-to-refresh — whole page slides down
  const mainRef = useRef<HTMLElement>(null);
  const touchStartY = useRef<number>(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePullStart = useCallback((e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const handlePullMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current || isRefreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && mainRef.current && mainRef.current.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(delta * 0.4);
    }
  }, [isRefreshing]);

  const handlePullEnd = useCallback(() => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);
      setTimeout(() => window.location.reload(), 300);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing]);

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
    <div
      className="h-screen flex flex-col bg-forest-800 overflow-hidden"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      {/* Pull-to-refresh indicator + page offset */}
      {pullDistance > 0 && (
        <div
          className="shrink-0 flex items-end justify-center bg-forest-800"
          style={{ height: `${Math.min(pullDistance, 80)}px` }}
        >
          <div
            className={`w-6 h-6 mb-2 border-2 border-gold border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              opacity: Math.min(pullDistance / 60, 1),
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}

      {/* Header — fixed top, opaque, full width */}
      <header
        className="shrink-0 border-b border-forest-500/50 z-40 overflow-hidden"
        style={{
          backgroundColor: '#1e3a1e',
          backgroundImage: `
            linear-gradient(0deg, rgba(62,100,62,0.35) 50%, transparent 50%),
            linear-gradient(90deg, rgba(62,100,62,0.35) 50%, transparent 50%)
          `,
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-7xl mx-auto px-1 sm:px-4 pt-0 pb-2 sm:pb-3 flex items-center justify-center relative">
          <Link to="/calendar" className="group -mt-3 sm:-mt-5">
            <img
              src={`${import.meta.env.BASE_URL || '/'}images/horizontal-logo.png`}
              alt="What's for dinner?"
              className="w-full max-w-[100vw] sm:w-auto sm:h-[7.5rem] h-auto"
            />
          </Link>
          {roomId && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
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
            </div>
          )}
        </div>
      </header>

      {/* Scrollable content area */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="max-w-7xl w-full mx-auto px-4 pb-6">
          {children}
        </div>
      </main>

      {/* Shadow gradient above nav */}
      <div className="shrink-0 h-3 bg-gradient-to-t from-black/40 to-transparent -mt-3 relative z-10 pointer-events-none" />

      {/* Bottom Navigation — fixed bottom, full width */}
      <nav className="shrink-0 bg-forest-800 border-t border-forest-500/50 z-50">
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
