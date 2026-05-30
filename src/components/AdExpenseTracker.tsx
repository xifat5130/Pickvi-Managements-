/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Megaphone, Calendar, CreditCard, Layers } from 'lucide-react';

export default function AdExpenseTracker() {
  const [ads, setAds] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('pv6_ads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Form states
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState<string>('');
  const [platform, setPlatform] = useState<string>('Facebook');
  const [note, setNote] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Sync state modifications from storage event
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedAds = localStorage.getItem('pv6_ads');
        if (savedAds) setAds(JSON.parse(savedAds));
      } catch (err) {
        console.warn('Error reading storage changes:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getAdSpendForPeriod = (days: number) => {
    const cutoffStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return ads
      .filter((a) => a.date >= cutoffStr)
      .reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
  };

  const adSpend7Days = getAdSpendForPeriod(7);
  const adSpend30Days = getAdSpendForPeriod(30);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const amt = parseFloat(amount);
    if (!date) {
      setErrorMsg('দয়া করে তারিখ সিলেক্ট করুন।');
      return;
    }
    if (!amount || isNaN(amt) || amt <= 0) {
      setErrorMsg('দয়া করে সঠিক এমাউন্ট দিন।');
      return;
    }

    const newAd = {
      date,
      amount: amt,
      platform,
      note: note.trim(),
    };

    const updated = [...ads, newAd];
    setAds(updated);

    try {
      localStorage.setItem('pv6_ads', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      setSuccessMsg('খরচ সফলভাবে যোগ করা হয়েছে!');
      setAmount('');
      setNote('');
      // Auto fade success message
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('তথ্য সেভ করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteExpense = (index: number) => {
    const updated = [...ads];
    updated.splice(index, 1);
    setAds(updated);

    try {
      localStorage.setItem('pv6_ads', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      setSuccessMsg('খরচ সফলভাবে মুছে ফেলা হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setErrorMsg('তথ্য আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const formatBDT = (val: number) => {
    return '৳' + Math.round(val).toLocaleString('en-US');
  };

  return (
    <div className="space-y-6">
      {/* Header and Brand */}
      <div>
        <h2 className="text-xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-violet-400" /> Ad Cost Overhead Tracker
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Log ad campaign expenditures to calculate precise net income across tracking periods.
        </p>
      </div>

      {/* Stats summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 7 Days Ad spends */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block leading-none">
            7-Day Aggregate Expense (বিজ্ঞাপন খরচ)
          </span>
          <div className="mt-4">
            <div className="text-2xl font-display font-bold text-white tracking-tight">
              {formatBDT(adSpend7Days)}
            </div>
            <p className="text-[10px] text-gray-450 mt-1">Sum of active campaign overheads in last 7 days</p>
          </div>
        </div>

        {/* 30 Days Ad spends */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block leading-none">
            30-Day Aggregate Expense (বিজ্ঞাপন খরচ)
          </span>
          <div className="mt-4">
            <div className="text-2xl font-display font-bold text-white tracking-tight">
              {formatBDT(adSpend30Days)}
            </div>
            <p className="text-[10px] text-gray-450 mt-1">Sum of active campaign overheads in last 30 days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Add new overhead form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleAddExpense}
            className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                + Log New Ad Cost
              </h3>
              <p className="text-[10px] text-gray-450 mt-1">Record marketing investment spent on different ad channels.</p>
            </div>

            {/* Campaign Date */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">
                Campaign Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:bg-white/10 focus:border-violet-500/50"
                />
              </div>
            </div>

            {/* Price investment details */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">
                Amount (৳)
              </label>
              <input
                type="number"
                required
                placeholder="Ex. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:bg-white/10 focus:border-violet-500/50 font-mono"
              />
            </div>

            {/* Platform Select list option */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">
                Platform Channel
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-violet-500/50"
              >
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Google">Google</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Campaign brief descriptive label */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">
                Campaign / Note
              </label>
              <input
                type="text"
                placeholder="Ex. Summer T-Shirt Boosting or Post Boosting"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:bg-white/10 focus:border-violet-500/50"
              />
            </div>

            {/* Error messaging state */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-[11px] text-rose-400 rounded-xl leading-snug">
                {errorMsg}
              </div>
            )}

            {/* Success messaging state */}
            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-400 rounded-xl leading-snug">
                {successMsg}
              </div>
            )}

            {/* Action add trigger */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 cursor-pointer bg-violet-600 hover:bg-violet-555 border border-violet-700/20 hover:bg-[#8b5cf6] text-white text-xs font-bold rounded-xl shadow-xs transition duration-150 transform active:scale-98 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add expense
            </button>
          </form>
        </div>

        {/* Right col: Expenditures log history lists */}
        <div className="lg:col-span-2">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Historical Advertising spends log
            </h3>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {ads.length === 0 ? (
                <div className="text-center py-20 text-xs text-gray-500">
                  No ad spending recorded on file. Add your first cost above!
                </div>
              ) : (
                [...ads]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((ad, idx) => {
                    // find matching index in the original unsorted index array to safely delete
                    const originalIdx = ads.findIndex((originalAd) => originalAd === ad);

                    return (
                      <div
                        key={idx}
                        className="bg-white/3 border border-white/5 rounded-xl p-3.5 flex justify-between items-center gap-4 transition duration-150 hover:bg-white/5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-450 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {ad.date}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <span className="bg-violet-950/40 text-violet-400 border border-violet-500/20 text-[9px] font-bold px-2 py-0.2 rounded-md">
                              {ad.platform}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-white/95 mt-1.5">
                            {ad.note || 'No descriptive comments logged'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-base font-bold font-mono text-rose-455">
                            {formatBDT(ad.amount)}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(originalIdx)}
                            className="p-2 hover:bg-rose-950/40 text-gray-400 hover:text-rose-455 border border-transparent hover:border-rose-500/10 rounded-xl cursor-pointer transition"
                            title="Remove cost record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
