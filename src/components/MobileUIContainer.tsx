import React, { useState } from 'react';
import { MobileDashboard } from './MobileDashboard';
import { ScheduleView } from './ScheduleView';
import { BottomNav } from './BottomNav';
import { Bell, User, LogOut, CheckCircle2, ShieldCheck, Database, X, AlertTriangle, HelpCircle, ToggleLeft, ToggleRight, Radio } from 'lucide-react';
import { Order, DashboardStats } from '../types';

interface Props {
  orders: Order[];
  stats: DashboardStats | null;
  isOrdersLoading: boolean;
  isStatsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentFilter: string;
  setCurrentFilter: (f: string) => void;
  currentDateFilter: string;
  setCurrentDateFilter: (df: string) => void;
  onCreateOrderClick: () => void;
  onOrderClick: (id: number) => void;
  currentUser: any;
  onLogout: () => void;
  isSyncing: boolean;
  onForceSync: () => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  onSimulateOrder: () => void;
  isSimulatingOrder: boolean;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (p: number) => void;
  totalOrdersCount: number;
  onCloseMobileUI: () => void;
}

export const MobileUIContainer = ({
  orders,
  stats,
  isOrdersLoading,
  isStatsLoading,
  searchQuery,
  setSearchQuery,
  currentFilter,
  setCurrentFilter,
  currentDateFilter,
  setCurrentDateFilter,
  onCreateOrderClick,
  onOrderClick,
  currentUser,
  onLogout,
  isSyncing,
  onForceSync,
  notifications,
  setNotifications,
  onSimulateOrder,
  isSimulatingOrder,
  currentPage,
  totalPages,
  setCurrentPage,
  totalOrdersCount,
  onCloseMobileUI,
}: Props) => {
  const [activeTab, setActiveTab ] = useState<'home' | 'schedule' | 'inbox' | 'profile'>('home');

  // Human-readable format date helpers
  const formatHourOfDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12:00 PM';
    }
  };

  return (
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen relative flex flex-col justify-between select-none">
      
      {/* Primary Display viewport */}
      <div className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'home' && (
          <MobileDashboard
            stats={stats}
            orders={orders}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentDateFilter={currentDateFilter}
            setCurrentDateFilter={setCurrentDateFilter}
            onViewOrder={onOrderClick}
            onCreateOrderClick={onCreateOrderClick}
            isSyncing={isSyncing}
            onForceSync={onForceSync}
            totalOrdersCount={totalOrdersCount}
            onSimulateOrder={onSimulateOrder}
            isSimulatingOrder={isSimulatingOrder}
            username={currentUser?.fullName || 'Moderator'}
            setActiveTab={setActiveTab}
            currentUserRole={currentUser?.role}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            orders={orders}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onCreateOrderClick={onCreateOrderClick}
            onOrderClick={onOrderClick}
            currentFilter={currentFilter}
            setCurrentFilter={setCurrentFilter}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalOrdersCount={totalOrdersCount}
            isSyncing={isSyncing}
            onForceSync={onForceSync}
            currentDateFilter={currentDateFilter}
            setCurrentDateFilter={setCurrentDateFilter}
          />
        )}

        {activeTab === 'inbox' && (
          <div className="p-6 pb-36 space-y-6 bg-[#f8fafc] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 leading-tight">Notification Logs</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-Time Online Orders</p>
              </div>
            </div>

            {/* Notifications Feed */}
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="bg-white border rounded-2.5xl p-8 text-center text-slate-400 font-medium shadow-sm">
                  <span className="font-bold text-slate-800 block text-xs">No Warnings or Alerts</span>
                  <p className="text-[10px] text-slate-400 mt-1">Use the Checkout Simulator in the Home tab to witness live notification queue items!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      onOrderClick(notif.orderId);
                    }}
                    className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex items-start gap-3 active:scale-98 transition-transform cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-2 shrink-0 animate-ping" />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-950 font-sans">{notif.title}</span>
                        <span className="text-[9px] bg-red-50 text-red-600 font-mono font-bold px-1.5 py-0.2 rounded">
                          ৳{notif.total ? notif.total.toLocaleString() : '0'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{notif.message}</p>
                      <span className="text-[8.5px] text-blue-600 font-bold block pt-1 uppercase tracking-wider select-none">
                        Click details card to manage order &rarr;
                      </span>
                    </div>
                  </div>
                ))
              )}

              {notifications.length > 0 && (
                <button 
                  onClick={() => setNotifications([])}
                  className="w-full py-2.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-extrabold rounded-xl border border-red-150 active:scale-95 transition-all select-none cursor-pointer"
                >
                  Clear All Alerts
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-6 pb-36 space-y-6 bg-[#f8fafc] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-700">
                PRO
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 leading-tight">System Settings</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Authorization console</p>
              </div>
            </div>

            {/* Profile Detail card */}
            <div className="bg-white p-5 rounded-2.5xl border border-slate-100 shadow-sm text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 font-black rounded-full mx-auto flex items-center justify-center text-xl shadow-inner border-2 border-white uppercase">
                {currentUser?.fullName ? currentUser?.fullName.charAt(0) : 'U'}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-950">{currentUser?.fullName || 'Full Name'}</h3>
                <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-black px-2 py-0.5 rounded-full uppercase tracking-widest font-mono mt-1 inline-block">
                  {currentUser?.role || 'Moderator'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Authorised to create, approve WooCommerce dispatches and track ad spent stats.</p>
            </div>

            {/* System actions */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">Control Operations</span>
              
              <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
                
                {/* Database Bridge details */}
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">Bridge Sync state</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">WooCommerce Sync Node v2</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-full font-mono">
                    CONNECTED
                  </span>
                </div>

                {/* Identity state details */}
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">Security Level</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">bcrypt encrypted session</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold font-mono">
                    MAXIMUM
                  </span>
                </div>

              </div>

              {/* Log out option */}
              <button
                onClick={onLogout}
                className="w-full py-3 bg-red-50 text-red-650 font-bold rounded-2xl border border-red-150 hover:bg-red-100 active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Destroy Authentication Session</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Nav component */}
      <BottomNav
        active={activeTab}
        setActive={setActiveTab}
        onCreateOrderClick={onCreateOrderClick}
        notificationCount={notifications.length}
      />

    </div>
  );
};
