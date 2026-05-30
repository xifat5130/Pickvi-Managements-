import React, { useMemo, useState } from 'react';
import { Bell, Menu, Plus, Search, ChevronDown, CheckCircle, Circle, MapPin, Phone, User, Landmark, HelpCircle, Eye, RefreshCw } from 'lucide-react';
import { Order } from '../types';

interface Props {
  orders: Order[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onCreateOrderClick: () => void;
  onOrderClick: (id: number) => void;
  currentFilter: string;
  setCurrentFilter: (f: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (p: number) => void;
  totalOrdersCount: number;
  isSyncing: boolean;
  onForceSync: () => void;
  currentDateFilter: string;
  setCurrentDateFilter: (df: string) => void;
}

export const ScheduleView = ({
  orders,
  searchQuery,
  setSearchQuery,
  onCreateOrderClick,
  onOrderClick,
  currentFilter,
  setCurrentFilter,
  currentPage,
  totalPages,
  setCurrentPage,
  totalOrdersCount,
  isSyncing,
  onForceSync,
  currentDateFilter,
  setCurrentDateFilter,
}: Props) => {

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const displayedOrders = useMemo(() => {
    let result = orders;
    if (selectedDay) {
      result = result.filter(order => order.date_created && order.date_created.startsWith(selectedDay));
    }
    return result;
  }, [orders, selectedDay]);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '12:00 PM';
    }
  };

  // Status mapping for timeline visual metrics (dots and progress meter widths)
  const getStatusMetrics = (status: string) => {
    switch (status) {
      case 'completed':
        return { percent: 100, activeDot: true, bgClass: 'bg-emerald-500' };
      case 'processing':
        return { percent: 85, activeDot: true, bgClass: 'bg-blue-600' };
      case 'pending':
        return { percent: 32, activeDot: true, bgClass: 'bg-amber-500' };
      case 'on-hold':
        return { percent: 50, activeDot: false, bgClass: 'bg-yellow-600' };
      default:
        return { percent: 0, activeDot: false, bgClass: 'bg-slate-300' };
    }
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const now = new Date(); // representing May 30, 2026
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        d: dayNames[d.getDay()],
        n: String(d.getDate()).padStart(2, '0'),
        dateString: d.toISOString().split('T')[0], // 'YYYY-MM-DD'
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-36">
      
      {/* Header matching Screen 2 structure */}
      <div className="bg-white px-5 pt-5 pb-4 rounded-b-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border-b border-slate-100">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-2 gap-1 bg-blue-50 p-2 rounded-xl border border-blue-100">
              <span className="w-2 h-2 bg-blue-600 rounded-xs" />
              <span className="w-2 h-2 bg-blue-600 rounded-xs" />
              <span className="w-2 h-2 bg-blue-600 rounded-xs" />
              <span className="w-2 h-2 bg-blue-600 rounded-xs" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 leading-tight">Order List</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pickvi Live Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={onForceSync}
               className="p-2.5 rounded-xl border border-slate-150 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
               title="Reload Timeline Live"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <div className="relative">
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">3</span>
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">
                MD
              </div>
            </div>
          </div>
        </div>

        {/* Search Input with custom "+" add order shortcut to open creation modal */}
        <div className="flex gap-2">
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm border border-slate-200 flex-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by ID, phone or name..." 
              className="flex-1 bg-transparent text-xs placeholder:text-slate-400 text-slate-800 outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={onCreateOrderClick}
            className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-500/10 cursor-pointer focus:outline-none flex items-center justify-center shrink-0"
            title="Create Custom Order"
          >
            <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Timeline Horizontal Date selector strip with dynamic days */}
        <div className="bg-white p-3.5 rounded-2.5xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Dispatch Calendars</span>
            <button 
              onClick={() => {
                const presets = ['all', 'today', 'week', 'month'];
                const idx = presets.indexOf(currentDateFilter);
                const nextPreset = presets[(idx + 1) % presets.length];
                setCurrentDateFilter(nextPreset);
                setSelectedDay(null); // Reset local day
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 select-none cursor-pointer bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 focus:outline-none"
            >
              <span>{
                currentDateFilter === 'all' ? 'All Time' :
                currentDateFilter === 'today' ? 'Today' :
                currentDateFilter === 'week' ? 'Last 7 Days' :
                currentDateFilter === 'month' ? 'Last 30 Days' : currentDateFilter
              }</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((day, idx) => {
              const isSelected = selectedDay === day.dateString;
              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (isSelected) {
                      setSelectedDay(null);
                    } else {
                      setSelectedDay(day.dateString);
                    }
                  }}
                  className={`py-2 px-1.5 rounded-2xl transition-all select-none cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20 scale-105' 
                      : day.isToday 
                      ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">{day.d}</div>
                  <div className="text-xs font-black mt-0.5">{day.n}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick status mini rail filters for active timeline items */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrolls-none">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'pending', label: 'Pending' },
            { id: 'processing', label: 'Processing' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap select-none cursor-pointer transition-all ${
                currentFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-150 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline List Layout using dashed connector lines */}
        <div className="relative pl-6 space-y-6">
          {/* Vertical Dashed Line Indicator rail */}
          <div className="absolute left-3.5 top-3.5 bottom-12 w-0.5 border-l-2 border-dashed border-slate-200" />

          {displayedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-150 shadow-sm">
              <span className="font-extrabold text-sm text-slate-850 block">No Orders Found</span>
              <p className="text-[11px] text-slate-400 mt-1">Please try modifying your search, filter parameters or click other calendar days.</p>
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="mt-3 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100"
                >
                  Clear calendar day filter
                </button>
              )}
            </div>
          ) : (
            displayedOrders.map((order, i) => {
              const metrics = getStatusMetrics(order.status);
              const timeStr = formatTime(order.date_created);

              // Standard mockup asks for the active/current item (Let's make processing status orders receive that special blue layout!)
              // Active status card layout is vibrant blue frame with white text
              const isBlueCardTheme = order.status === 'processing';

              return (
                <div key={order.id} className="relative group">
                  
                  {/* Circle dot node on the left timeline guide */}
                  <div className="absolute -left-5 top-5 z-20">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-xs border-2 border-slate-200">
                      <div className={`w-2.5 h-2.5 rounded-full ${metrics.activeDot ? 'bg-blue-600' : 'bg-slate-350'}`} />
                    </div>
                  </div>

                  {/* Individual Timeline Card */}
                  <div 
                    onClick={() => onOrderClick(order.id)}
                    className={`p-4 rounded-2.5xl shadow-sm border cursor-pointer active:scale-98 transition-all duration-150 ${
                      isBlueCardTheme 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10' 
                        : 'bg-white text-slate-800 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Time Label & Order Num Header block */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold opacity-80 uppercase tracking-widest ${isBlueCardTheme ? 'text-blue-100' : 'text-slate-400'}`}>
                        {timeStr}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {order._is_moderator_order === 'yes' && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                            isBlueCardTheme 
                              ? 'bg-blue-700/50 text-blue-100 border border-blue-500/35' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            Mod: {order._moderator_name || order._moderator_username || 'Staff'}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                          isBlueCardTheme 
                            ? 'bg-blue-500 text-blue-50' 
                            : order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : order.status === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          #{order.id}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info (Avoids any truncation/horizontal scrolling completely) */}
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-[13px] leading-snug">
                        {order.billing?.first_name} {order.billing?.last_name || ''}
                      </h3>

                      <div className="flex flex-col gap-1 text-[11px] opacity-90">
                        {order.billing?.phone && (
                          <div className="flex items-center gap-1 font-mono font-semibold">
                            <Phone className={`w-3 h-3 ${isBlueCardTheme ? 'text-blue-200' : 'text-slate-400'}`} />
                            <span>{order.billing.phone}</span>
                          </div>
                        )}
                        {order.billing?.city && (
                          <div className="flex items-center gap-1 font-medium">
                            <MapPin className={`w-3 h-3 ${isBlueCardTheme ? 'text-blue-200' : 'text-slate-400'}`} />
                            <span>{order.billing.city}, {order.billing.address_1}</span>
                          </div>
                        )}
                      </div>

                      {/* Display Products Line Items */}
                      <div className={`p-2 rounded-xl text-[10px] leading-relaxed select-text mt-3.5 ${
                        isBlueCardTheme ? 'bg-blue-700/45 text-blue-55' : 'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        <span className="font-extrabold block mb-1 opacity-70 uppercase tracking-wider text-[8px]">Ordered lines</span>
                        {order.line_items?.map((item, idx) => (
                          <div key={idx} className="font-medium truncate">
                            &bull; <strong className="font-bold">{item.quantity}x</strong> {item.name}
                          </div>
                        ))}
                      </div>

                      {/* Custom Status Progress Indicator Bar (Removed avatar photos cleanly) */}
                      <div className="pt-3 flex items-center justify-between gap-4 mt-2 border-t border-dashed border-white/10">
                        <div className="flex-1 flex items-center gap-2">
                          <span className={`text-[9px] font-bold tracking-tight uppercase shrink-0 ${isBlueCardTheme ? 'text-blue-100' : 'text-slate-400'}`}>
                            Progress:
                          </span>
                          <div className={`h-1.5 rounded-full flex-1 relative ${isBlueCardTheme ? 'bg-blue-700' : 'bg-slate-100'}`}>
                            <div 
                              className={`h-1.5 rounded-full ${isBlueCardTheme ? 'bg-blue-300' : 'bg-blue-600'}`} 
                              style={{ width: `${metrics.percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black font-mono leading-none shrink-0 min-w-[28px] text-right">
                            {metrics.percent}%
                          </span>
                        </div>
                      </div>

                      {/* Steadfast Tracker Badge (or Not Sent tracker) */}
                      {order.steadfast && order.steadfast.is_sent && order.steadfast.consignment_id ? (
                        <div className={`p-2 rounded-xl text-[10px] border font-mono font-medium flex items-center justify-between mt-2.5 ${
                          isBlueCardTheme 
                            ? 'bg-blue-800/60 text-blue-100 border-blue-500/20' 
                            : 'bg-[#fafafa] text-slate-700 border-slate-150 shadow-xs'
                        }`}>
                          <span className="flex items-center gap-1 select-text">
                            🚚 <strong className="font-bold">Steadfast:</strong> {order.steadfast.consignment_id}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-black text-[8.5px] uppercase tracking-wider ${
                            isBlueCardTheme ? 'bg-blue-300 text-blue-900' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {order.steadfast.delivery_status || 'In Transit'}
                          </span>
                        </div>
                      ) : (
                        <div className={`p-2 rounded-xl text-[10px] border font-medium flex items-center justify-between leading-none mt-2 ${
                          isBlueCardTheme 
                            ? 'bg-blue-700/30 text-blue-200 border-blue-600/30' 
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          <span>⚡ Courier: Not Dispatched</span>
                          <span className="text-[8.5px] font-bold opacity-70">PENDING</span>
                        </div>
                      )}

                      {/* Price indicator tag */}
                      <div className="pt-2 flex justify-between items-center text-[10px] opacity-90 font-bold select-none">
                        <span className={isBlueCardTheme ? 'text-blue-100' : 'text-slate-400'}>INVOICE total:</span>
                        <span className={`text-xs font-black font-mono ${isBlueCardTheme ? 'text-white' : 'text-blue-600'}`}>
                          ৳{order.total.toLocaleString()}
                        </span>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}

          {/* Simple pagination slider bar values */}
          {totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between pr-2 text-xs text-slate-500 font-semibold select-none">
              <span>{currentPage} / {totalPages} pages</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="px-3 py-1 bg-white border rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className="px-3 py-1 bg-white border rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
