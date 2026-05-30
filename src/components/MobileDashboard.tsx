import React from 'react';
import { Bell, Menu, Search, SlidersHorizontal, ChevronDown, TrendingUp, TrendingDown, ClipboardCheck, ShoppingBag, Radio, RefreshCw } from 'lucide-react';
import { DashboardStats, Order } from '../types';

interface Props {
  stats: DashboardStats | null;
  orders: Order[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentDateFilter: string;
  setCurrentDateFilter: (df: string) => void;
  onViewOrder: (id: number) => void;
  onCreateOrderClick: () => void;
  isSyncing: boolean;
  onForceSync: () => void;
  totalOrdersCount: number;
  onSimulateOrder: () => void;
  isSimulatingOrder: boolean;
  username: string;
  setActiveTab: (tab: 'home' | 'schedule' | 'inbox' | 'profile') => void;
  currentUserRole?: string;
}

export const MobileDashboard = ({
  stats,
  orders,
  searchQuery,
  setSearchQuery,
  currentDateFilter,
  setCurrentDateFilter,
  onViewOrder,
  onCreateOrderClick,
  isSyncing,
  onForceSync,
  totalOrdersCount,
  onSimulateOrder,
  isSimulatingOrder,
  username,
  setActiveTab,
  currentUserRole
}: Props) => {
  
  // Create relative statistics values
  const totalSalesStr = stats ? `৳${stats.total_sales.toLocaleString()}` : '৳0';
  const totalOrdersStr = stats ? stats.order_count.toString() : '0';
  const pendingOrdersCount = stats ? stats.pending_approval : 0;
  const processingCount = stats ? stats.processing_count : 0;
  const completedCount = stats ? stats.completed_count : 0;
  const cancelledCount = stats ? stats.cancelled_count : 0;

  // Let's create an elegant wave path that simulates dynamic movement depending on earnings stats
  const wavePoints = "M 0 60 Q 30 20 60 50 T 120 30 T 180 70 T 240 40 T 300 10 T 340 40 L 340 100 L 0 100 Z";
  const waveLine = "M 0 60 Q 30 20 60 50 T 120 30 T 180 70 T 240 40 T 300 10 T 340 40";

  // Quick date selector toggle cycler
  const toggleDateFilter = () => {
    const presets = ['all', 'today', 'week', 'month'];
    const idx = presets.indexOf(currentDateFilter);
    const nextPreset = presets[(idx + 1) % presets.length];
    setCurrentDateFilter(nextPreset);
  };

  const getPresetLabel = () => {
    if (currentDateFilter === 'all') return 'All Time';
    if (currentDateFilter === 'today') return 'Today';
    if (currentDateFilter === 'week') return 'This Week';
    if (currentDateFilter === 'month') return 'This Month';
    return currentDateFilter;
  };

  // Status proportion donut calculator
  const totalBreakdown = pendingOrdersCount + processingCount + completedCount + cancelledCount || 1;
  const completedPct = Math.round((completedCount / totalBreakdown) * 100);
  const processingPct = Math.round((processingCount / totalBreakdown) * 100);
  const pendingPct = Math.round((pendingOrdersCount / totalBreakdown) * 100);
  const cancelledPct = Math.round((cancelledCount / totalBreakdown) * 100);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-32">
      
      {/* Upper Status Glow Area */}
      <div className="bg-white px-5 pt-5 pb-5 rounded-b-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border-b border-slate-100">
        
        {/* Header Block */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/10">
              <ShoppingBag className="w-5 h-5 text-white stroke-[2.5px]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="font-bold text-base text-slate-900 leading-tight">Pickvi Store</h1>
                <span className="text-[8px] bg-blue-500/10 text-blue-600 font-extrabold px-1.5 py-0.2 rounded font-mono">LIVE</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Welcome, {username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync trigger */}
            <button
              onClick={onForceSync}
              className={`p-2.5 rounded-xl border border-slate-150 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none ${isSyncing ? 'opacity-80' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setActiveTab('inbox')} 
                className="p-2.5 rounded-xl border border-slate-150 bg-slate-50 text-slate-500 focus:outline-none"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2 border-2 border-white animate-pulse" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Block */}
        <div className="relative">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 font-medium outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
            placeholder="Product, customer name or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setActiveTab('schedule'); // Jump to the schedule/timeline list tab
              }
            }}
          />
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          {searchQuery && (
            <span className="absolute right-3.5 top-2 bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 text-[8px] font-bold font-mono">
              Press Enter to Filter
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Preset Date Filter Rail */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-150 rounded-lg text-slate-500 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrolls-none w-full">
            {[
              { value: 'all', label: 'All-Time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' }
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => setCurrentDateFilter(preset.value)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold select-none cursor-pointer transition-all ${
                  currentDateFilter === preset.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-500 border border-slate-150 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Header Section with Time Selector */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-extrabold text-sm uppercase text-slate-400 tracking-wider">Overview Summary</h2>
            <button 
              onClick={toggleDateFilter} 
              className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-white border border-slate-150 px-2.5 py-1 rounded-xl shadow-sm select-none"
            >
              <span>{getPresetLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Statistical Cards matching Screen 1 mockup */}
          {currentUserRole === 'moderator' ? (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Total Orders</span>
                  <span className="bg-blue-50 text-blue-600 font-semibold text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                    <ShoppingBag className="w-2.5 h-2.5" />
                    Active
                  </span>
                </div>
                <h3 className="font-extrabold text-[15px] sm:text-base text-slate-800 tracking-tight">{totalOrdersStr} Items</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">Your entries count</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Returned / Cancelled</span>
                  <span className="bg-rose-50 text-rose-600 font-semibold text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    Status
                  </span>
                </div>
                <h3 className="font-extrabold text-[15px] sm:text-base text-slate-800 tracking-tight">{cancelledCount} Orders</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">Returned & Cancelled</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earnings / Sales</span>
                  <span className="bg-emerald-50 text-emerald-600 font-semibold text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    +1.2%
                  </span>
                </div>
                <h3 className="font-extrabold text-[15px] sm:text-base text-slate-800 tracking-tight">{totalSalesStr}</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">Gross volume BDT</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Dispatches</span>
                  <span className="bg-orange-55 text-orange-600 font-semibold text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    -0.3%
                  </span>
                </div>
                <h3 className="font-extrabold text-[15px] sm:text-base text-slate-800 tracking-tight">{totalOrdersStr} Items</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">Processed orders</p>
              </div>
            </div>
          )}

          {/* Smooth wave area line chart - only for non-moderators */}
          {currentUserRole !== 'moderator' && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400">SALES INTENSITY GRAPH</span>
                <span className="text-[9px] text-slate-500 font-semibold font-mono">Y-Axis: 10K to 500K</span>
              </div>
              <div className="relative pt-1 h-24">
                {/* SVG Area Chart drawing for instant load speeds */}
                <svg viewBox="0 0 340 100" className="w-full h-full" preserveAspectRatio="none overflow-hidden">
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>
                  <path d={wavePoints} fill="url(#blueGrad)" />
                  <path d={waveLine} stroke="#2563eb" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  
                  {/* Visual grid dots on the wave */}
                  <circle cx="60" cy="50" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="180" cy="70" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="240" cy="40" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="300" cy="10" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="animate-ping" />
                </svg>
              </div>
              
              {/* X-Axis labels matching screen reference and custom design layout */}
              <div className="flex justify-between px-2 text-[10px] font-bold text-slate-400 font-mono pt-1">
                <span>01</span>
                <span>02</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-100">03 (Today)</span>
                <span>04</span>
              </div>
            </div>
          )}
        </div>

        {/* Orders Status Distribution Donut Chart */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-extrabold text-sm uppercase text-slate-400 tracking-wider">Status Distribution</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full">
              ↗ +2.6% efficiency
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              {/* Premium custom high-contrast SVG Donut segment */}
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {/* Completed (dark blue) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e40af" strokeWidth="4" 
                  strokeDasharray={`${completedPct} ${100 - completedPct}`} 
                  strokeDashoffset="0" 
                />
                {/* Processing (light blue) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="4" 
                  strokeDasharray={`${processingPct} ${100 - processingPct}`} 
                  strokeDashoffset={`-${completedPct}`} 
                />
                {/* Pending (amber) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4" 
                  strokeDasharray={`${pendingPct} ${100 - pendingPct}`} 
                  strokeDashoffset={`-${completedPct + processingPct}`} 
                />
                {/* Cancelled (rose) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4" 
                  strokeDasharray={`${cancelledPct} ${100 - cancelledPct}`} 
                  strokeDashoffset={`-${completedPct + processingPct + pendingPct}`} 
                />
              </svg>
              {/* Center counter detail */}
              <div className="absolute text-center">
                <span className="text-[14px] font-extrabold text-slate-800 font-mono leading-none">{totalOrdersStr}</span>
                <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Total</p>
              </div>
            </div>

            {/* Custom high-contrast human readable labels */}
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e40af] shrink-0" />
                  <span>Completed</span>
                </div>
                <strong className="text-slate-800 font-mono">{completedPct}% ({completedCount})</strong>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                  <span>Processing</span>
                </div>
                <strong className="text-slate-800 font-mono">{processingPct}% ({processingCount})</strong>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                  <span>Pending Approval</span>
                </div>
                <strong className="text-slate-800 font-mono">{pendingPct}% ({pendingOrdersCount})</strong>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
                  <span>Cancelled</span>
                </div>
                <strong className="text-slate-800 font-mono">{cancelledPct}% ({cancelledCount})</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Small quick dispatch list hint */}
        <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold leading-none">Orders Timeline List</h3>
            <p className="text-[10px] text-blue-100">Ready to dispatch, click & modify</p>
          </div>
          <button 
            onClick={() => setActiveTab('schedule')} 
            className="bg-white text-blue-600 font-bold px-3.5 py-1.5 text-xs rounded-xl select-none"
          >
            Check Timeline &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};
