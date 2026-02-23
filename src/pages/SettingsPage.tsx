import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'openai_api_key';

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const hasKey = !!getStoredApiKey();

  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setTestResult(null);
    setSaved(false);
  };

  const handleTest = async () => {
    const key = apiKey.trim();
    if (!key) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      setTestResult(res.ok ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const masked = apiKey ? apiKey.slice(0, 7) + '...' + apiKey.slice(-4) : '';

  return (
    <div className="max-w-2xl mx-auto pt-6 space-y-8 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Configure your app preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-purple-100 rounded-lg">
            <Key className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">OpenAI API Key</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Used to generate food images for your meals. Your key is stored only in this browser and never sent to any server except OpenAI.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setSaved(false); setTestResult(null); }}
              placeholder="sk-..."
              className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saved ? 'Saved!' : 'Save key'}
            </button>
            <button
              onClick={handleTest}
              disabled={!apiKey.trim() || testing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Testing...' : 'Test key'}
            </button>
            {hasKey && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          {testResult === 'success' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Key is valid — image generation will work.
            </div>
          )}
          {testResult === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Key is invalid or expired. Check your OpenAI dashboard.
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-700">How to get an API key:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">platform.openai.com/api-keys</a></li>
            <li>Click "Create new secret key"</li>
            <li>Copy and paste it above</li>
          </ol>
          <p className="text-xs text-gray-400 mt-2">Image generation costs ~$0.02 per image with gpt-image-1.</p>
        </div>
      </div>
    </div>
  );
}
