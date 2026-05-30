/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Key, HelpCircle } from 'lucide-react';

interface Props {
  token: string | null;
  onClose: () => void;
}

export default function CourierSettingsModal({ token, onClose }: Props) {
  const [sf1Key, setSf1Key] = useState('');
  const [sf1Secret, setSf1Secret] = useState('');
  const [sf2Key, setSf2Key] = useState('');
  const [sf2Secret, setSf2Secret] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    sf1_balance: number;
    sf2_balance: number;
    currency: string;
    success?: boolean;
    error?: string;
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setSf1Key(localStorage.getItem('pickvi_sf1_key') || '');
    setSf1Secret(localStorage.getItem('pickvi_sf1_secret') || '');
    setSf2Key(localStorage.getItem('pickvi_sf2_key') || '');
    setSf2Secret(localStorage.getItem('pickvi_sf2_secret') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('pickvi_sf1_key', sf1Key.trim());
    localStorage.setItem('pickvi_sf1_secret', sf1Secret.trim());
    localStorage.setItem('pickvi_sf2_key', sf2Key.trim());
    localStorage.setItem('pickvi_sf2_secret', sf2Secret.trim());
    alert('Steadfast courier settings successfully saved in browser registry!');
    onClose();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/steadfast/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
          'x-sf1-key': sf1Key.trim(),
          'x-sf1-secret': sf1Secret.trim(),
          'x-sf2-key': sf2Key.trim(),
          'x-sf2-secret': sf2Secret.trim()
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult({
          success: true,
          sf1_balance: data.sf1_balance,
          sf2_balance: data.sf2_balance,
          currency: data.currency || 'BDT'
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Connection verification failed.',
          sf1_balance: 0,
          sf2_balance: 0,
          currency: 'BDT'
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        error: e.message || 'Network communication error.',
        sf1_balance: 0,
        sf2_balance: 0,
        currency: 'BDT'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
              📦 Steadfast Courier Credentials
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">Configure API connections for automated HPOS dispatches.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Info Card */}
          <div className="bg-amber-955/20 border border-amber-500/20 p-3 rounded-xl flex gap-3 text-amber-400 text-xs leading-normal">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong>Secure Client Credential Hub</strong>
              <p className="text-[10.5px] mt-0.5 text-amber-400/80">
                Credentials are saved locally. When placing dispatch requests, your keys are processed server-side as temporary proxy headers.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Account 1 */}
            <div className="bg-[#111111] border border-white/5 p-4 rounded-xl space-y-3">
              <span className="text-[10px] text-violet-400 font-bold block uppercase tracking-wide">
                🅐 Account 1 (Primary Admin Account)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block uppercase mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="API key of Account 1"
                    value={sf1Key}
                    onChange={(e) => setSf1Key(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block uppercase mb-1">Secret Key</label>
                  <input
                    type="password"
                    placeholder="Secret key of Account 1"
                    value={sf1Secret}
                    onChange={(e) => setSf1Secret(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Account 2 */}
            <div className="bg-[#111111] border border-white/5 p-4 rounded-xl space-y-3">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wide">
                🅑 Account 2 (Mod Drafts Secondary)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block uppercase mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="API key of Account 2"
                    value={sf2Key}
                    onChange={(e) => setSf2Key(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#22c55e]/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block uppercase mb-1">Secret Key</label>
                  <input
                    type="password"
                    placeholder="Secret key of Account 2"
                    value={sf2Secret}
                    onChange={(e) => setSf2Secret(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#22c55e]/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Status Panel */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              testResult.success
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-955/20 border-rose-500/25 text-rose-450'
            }`}>
              <div className="font-bold flex items-center gap-1">
                {testResult.success ? '✓ Connections Success' : '✕ Connection Lost'}
              </div>
              {testResult.success ? (
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <div>Account 1: <strong>{testResult.sf1_balance} {testResult.currency}</strong></div>
                  <div>Account 2: <strong>{testResult.sf2_balance} {testResult.currency}</strong></div>
                </div>
              ) : (
                <p className="text-[11px]">{testResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#111111]/80 border-t border-white/5 p-4 flex gap-2 justify-end">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-2 hover:bg-white/5 text-gray-300 hover:text-white rounded-xl border border-white/10 text-xs font-semibold select-none cursor-pointer"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-violet-650 hover:bg-violet-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 select-none cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
