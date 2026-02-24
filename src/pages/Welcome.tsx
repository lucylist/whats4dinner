import { Users, Link2, Plus } from 'lucide-react';
import { useState } from 'react';

interface WelcomeProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function Welcome({ onCreateRoom, onJoinRoom }: WelcomeProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = () => {
    const code = joinCode.trim().toLowerCase();
    if (code) onJoinRoom(code);
  };

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full flex flex-col items-center py-6 sm:py-0">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-10 w-full max-w-[min(100%,42rem)]">
          <img
            src={`${import.meta.env.BASE_URL || '/'}images/logo-botanical.png`}
            alt="What's for dinner?"
            className="w-full max-h-[45vh] sm:max-h-[55vh] object-contain"
          />
        </div>

        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={onCreateRoom}
            className="w-full flex items-center gap-3 bg-gold hover:bg-gold-light text-forest-900 rounded-xl px-4 py-3 transition-all shadow-md hover:shadow-lg"
          >
            <div className="w-9 h-9 bg-forest-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Create a new library</div>
              <div className="text-forest-900/80 text-xs">Start fresh and invite your family</div>
            </div>
          </button>

          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full flex items-center gap-3 bg-forest-700 hover:bg-forest-600 text-cream-100 rounded-xl px-4 py-3 transition-all border border-forest-500/60 hover:border-gold/30"
            >
              <div className="w-9 h-9 bg-forest-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-cobalt" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Join an existing library</div>
                <div className="text-cream-400 text-xs">Enter a family code to join</div>
              </div>
            </button>
          ) : (
            <div className="bg-forest-700 rounded-xl px-4 py-3 border border-forest-500/60">
              <label className="block text-sm font-medium text-cream-400 mb-2">Family code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. k8m3x9p2"
                  className="flex-1 px-4 py-3 bg-forest-800 border border-forest-500 rounded-xl text-cream-100 focus:ring-2 focus:ring-gold focus:border-gold text-lg tracking-wider font-mono placeholder:text-cream-500"
                  autoFocus
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim()}
                  className="px-4 sm:px-5 py-3 bg-gold text-forest-900 rounded-xl font-medium hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Join
                </button>
              </div>
              <button
                onClick={() => { setShowJoin(false); setJoinCode(''); }}
                className="text-sm text-cream-500 hover:text-cream-300 mt-3"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-10 text-center">
          <div className="flex items-center justify-center gap-2 text-cream-500 text-xs">
            <Link2 className="w-3 h-3" />
            Share your link and everyone sees the same recipes
          </div>
        </div>
      </div>
    </div>
  );
}
