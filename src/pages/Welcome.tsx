import { ChefHat, Users, Link2, Plus } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What's for dinner?</h1>
          <p className="text-gray-500 text-lg">Plan meals together with your family</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onCreateRoom}
            className="w-full flex items-center gap-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl px-6 py-5 transition-all shadow-md hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">Create a new library</div>
              <div className="text-primary-100 text-sm">Start fresh and invite your family</div>
            </div>
          </button>

          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full flex items-center gap-4 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl px-6 py-5 transition-all shadow-sm hover:shadow-md border border-gray-200"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Join an existing library</div>
                <div className="text-gray-400 text-sm">Enter a family code to join</div>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Family code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. k8m3x9p2"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg tracking-wider font-mono"
                  autoFocus
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim()}
                  className="px-5 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Join
                </button>
              </div>
              <button
                onClick={() => { setShowJoin(false); setJoinCode(''); }}
                className="text-sm text-gray-400 hover:text-gray-600 mt-3"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Link2 className="w-4 h-4" />
            Share your link and everyone sees the same recipes
          </div>
        </div>
      </div>
    </div>
  );
}
