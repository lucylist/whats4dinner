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

export function isShopifyProxyKey(key: string): boolean {
  return key.startsWith('shopify-');
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
      if (isShopifyProxyKey(key)) {
        // Test Shopify proxy with a tiny chat completion
        const res = await fetch('/api/ai/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          }),
        });
        setTestResult(res.ok ? 'success' : 'error');
      } else {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        setTestResult(res.ok ? 'success' : 'error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const keyType = apiKey.trim().startsWith('shopify-') ? 'shopify' : apiKey.trim().startsWith('sk-') ? 'openai' : null;

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
            <h3 className="font-semibold text-gray-900">AI Image Generation Key</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Used to generate food images for your meals. Accepts an OpenAI API key or a Shopify LLM proxy token. Stored only in this browser.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setSaved(false); setTestResult(null); }}
              placeholder="sk-... or shopify-..."
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

          {keyType && (
            <p className="text-xs text-gray-400">
              Detected: {keyType === 'shopify' ? 'Shopify LLM proxy token' : 'OpenAI API key'}
            </p>
          )}

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
              Key is invalid or expired.
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-700">Supported key types:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><span className="font-mono text-xs">shopify-...</span> — Shopify LLM proxy token (only works on <span className="font-medium">quick.shopify.io</span>)</li>
            <li><span className="font-mono text-xs">sk-...</span> — OpenAI API key — works everywhere (<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">get one here</a>)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
