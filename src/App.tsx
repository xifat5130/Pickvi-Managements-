/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, DashboardStats as StatsType } from './types';
import DashboardStats from './components/DashboardStats';
import OrderParser from './components/OrderParser';
import OrderList from './components/OrderList';
import OrderDetailsModal from './components/OrderDetailsModal';
import CreateOrderModal from './components/CreateOrderModal';
import UsersManagementModal from './components/UsersManagementModal';
import CourierSettingsModal from './components/CourierSettingsModal';
import { MobileUIContainer } from './components/MobileUIContainer';
import ProfitTracker from './components/ProfitTracker';
import AdExpenseTracker from './components/AdExpenseTracker';
import { LogOut, Users, Settings as SettingsIcon, ClipboardCheck, Sparkles, AlertCircle, ShoppingBag, Bell, Activity, Moon, RefreshCw, Radio, Plus, Smartphone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // App Master layout states
  const [isParserOpen, setIsParserOpen] = useState(true); // AI parser open by default to showcase AI features
  const [activeTab, setActiveTab ] = useState<'orders' | 'profit' | 'ads'>('orders');

  // Main list filters and pagination states
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentFilter, setCurrentFilter] = useState('all'); // 'all', 'pending', 'processing', 'completed', 'cancelled'
  const [currentDateFilter, setCurrentDateFilter] = useState('month'); // 'today', 'week', 'month', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [periodDays, setPeriodDays] = useState(36500);

  // Main UI statistics states
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Modal control triggers
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isCourierOpen, setIsCourierOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive device detector
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AI draft states passed down to creator modal on populate
  const [aiBillingDraft, setAiBillingDraft] = useState<any>(null);
  const [aiItemsDraft, setAiItemsDraft] = useState<any[]>([]);
  const [aiNoteDraft, setAiNoteDraft] = useState('');

  // Notifications Queue
  const [notifications, setNotifications] = useState<{
    id: number;
    title: string;
    message: string;
    orderId: number;
    total: number;
  }[]>([]);

  // Simulation indicators
  const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref tracking for delta sync timeline checks
  const lastSyncTimestampRef = useRef<string>(new Date().toISOString());

  // Restore session from cache on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('pickvi_user');
    const cachedToken = localStorage.getItem('pickvi_token');
    if (cachedUser && cachedToken) {
      setCurrentUser(JSON.parse(cachedUser));
      setSessionToken(cachedToken);
    }
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    if (sessionToken) {
      fetchOrders();
    }
  }, [sessionToken, currentFilter, currentDateFilter, searchQuery, currentPage]);

  // Fetch stats when periodDays change
  useEffect(() => {
    if (sessionToken) {
      fetchStats();
    }
  }, [sessionToken, periodDays]);

  // Real-time Delta Sync tracking thread (runs every 15 seconds)
  useEffect(() => {
    if (!sessionToken) return;

    const deltaInterval = setInterval(async () => {
      try {
        const timestamp = lastSyncTimestampRef.current;
        const response = await fetch(`/api/delta?modified_after=${encodeURIComponent(timestamp)}`, {
          headers: { 'Authorization': sessionToken },
        });

        if (response.ok) {
          const data = await response.json();
          lastSyncTimestampRef.current = data.timestamp || new Date().toISOString();

          // If changed orders are identified
          if (data.deltaOrders && data.deltaOrders.length > 0) {
            // Trigger UI reload with smooth transitions
            fetchOrders();
            fetchStats();

            // Emit beautiful toast notifications for new completed entries
            data.deltaOrders.forEach((newOrder: Order) => {
              // Only alert if created recently to avoid spamming historical modifications
              const isRecent = (new Date().getTime() - new Date(newOrder.date_created).getTime()) < 60000;
              if (isRecent) {
                const toastId = Date.now() + Math.floor(Math.random() * 100);
                const desc = `BDT ${newOrder.total.toLocaleString()} item order placed by ${newOrder.billing.first_name}.`;

                setNotifications((prev) => [
                  {
                    id: toastId,
                    title: `🛒 Real-time Order #${newOrder.id} Received!`,
                    message: desc,
                    orderId: newOrder.id,
                    total: newOrder.total,
                  },
                  ...prev,
                ]);

                // Auto dim notifications after 6 seconds
                setTimeout(() => {
                  setNotifications((prev) => prev.filter((n) => n.id !== toastId));
                }, 7500);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error running delta polling sync check:', err);
      }
    }, 15000);

    return () => clearInterval(deltaInterval);
  }, [sessionToken]);

  // Periodically synchronize all active in-transit courier tracking states (runs every 45 seconds)
  useEffect(() => {
    if (!sessionToken) return;

    const courierInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/steadfast/sync_all_active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': sessionToken,
            'x-sf1-key': localStorage.getItem('pickvi_sf1_key') || '',
            'x-sf1-secret': localStorage.getItem('pickvi_sf1_secret') || '',
            'x-sf2-key': localStorage.getItem('pickvi_sf2_key') || '',
            'x-sf2-secret': localStorage.getItem('pickvi_sf2_secret') || ''
          }
        });
        if (response.ok) {
          const resMap = await response.json();
          if (resMap.success && resMap.updated_count > 0) {
            fetchOrders();
            fetchStats();
          }
        }
      } catch (err) {
        console.warn('Error in background active tracking status sync:', err);
      }
    }, 45000);

    return () => clearInterval(courierInterval);
  }, [sessionToken]);

  // Fetch Stats data helper
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await fetch(`/api/stats?period=${periodDays}`, {
        headers: { 'Authorization': sessionToken || '' },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch Orders data helper Map
  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: currentFilter,
        date: currentDateFilter,
        search: searchQuery,
        page: String(currentPage),
      });

      const response = await fetch(`/api/orders?${queryParams.toString()}`, {
        headers: { 'Authorization': sessionToken || '' },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalOrders(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Log in form submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication rejected.');
      }

      // Preserve details in cache
      localStorage.setItem('pickvi_user', JSON.stringify(data.user));
      localStorage.setItem('pickvi_token', data.token);

      setCurrentUser(data.user);
      setSessionToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Server authentication connection refused.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout action helper
  const handleLogoutAction = async () => {
    if (sessionToken) {
      await fetch('/api/logout');
    }
    localStorage.removeItem('pickvi_user');
    localStorage.removeItem('pickvi_token');
    setCurrentUser(null);
    setSessionToken(null);
  };

  // Handle Moderator approvals inside table triggers (for admins)
  const handleApproveOrder = async (id: number) => {
    try {
      const response = await fetch('/api/update_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionToken || '',
        },
        body: JSON.stringify({ orderId: id, status: 'processing' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Reload
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Approval workflow rejected.');
    }
  };

  // Simulating an incoming customer order (Header action)
  const handleSimulateInvoiceIncoming = async () => {
    setIsSimulatingOrder(true);
    try {
      const response = await fetch('/api/simulate_new_order', {
        method: 'POST',
        headers: { 'Authorization': sessionToken || '' },
      });
      if (response.ok) {
        // Prompt immediate synchronization
        fetchOrders();
        fetchStats();

        // Push instantly to local notifications array for beautiful interactive demo feel
        const resData = await response.json();
        const o = resData.order;

        const mockId = Date.now() + Math.floor(Math.random() * 100);
        setNotifications((prev) => [
          {
            id: mockId,
            title: '🎉 Simulated Gateway Order Added!',
            message: `Order #${o.id} created for ${o.billing.first_name} ${o.billing.last_name || ''} (BDT ${o.total.toLocaleString()}).`,
            orderId: o.id,
            total: o.total,
          },
          ...prev,
        ]);

        // Auto remove
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== mockId));
        }, 7000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingOrder(false);
    }
  };

  // Dynamic router to parse AI draft into new order builder
  const handleDraftPushedToCheckout = (billing: any, items: any[], customer_note: string) => {
    setAiBillingDraft(billing);
    setAiItemsDraft(items);
    setAiNoteDraft(customer_note);

    // Open creator modal workflow instantly
    setIsCreatingOrder(true);
  };

  const handleForceManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': sessionToken || '',
        },
      });

      // Simultaneously trigger real-time updates for active dispatches
      await fetch('/api/steadfast/sync_all_active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionToken || '',
          'x-sf1-key': localStorage.getItem('pickvi_sf1_key') || '',
          'x-sf1-secret': localStorage.getItem('pickvi_sf1_secret') || '',
          'x-sf2-key': localStorage.getItem('pickvi_sf2_key') || '',
          'x-sf2-secret': localStorage.getItem('pickvi_sf2_secret') || ''
        }
      });
    } catch (err) {
      console.error('Trigger sync error:', err);
    }
    fetchOrders();
    fetchStats();
    setTimeout(() => setIsSyncing(false), 800);
  };

  // Trigger from kpi "Pending Approvals" to list only pending moderator drafts
  const handleFilterToApprovalQueue = () => {
    setActiveTab('orders');
    setCurrentFilter('pending');
    setCurrentPage(1);
    const orderListDiv = document.getElementById('order-list-viewport-panel');
    if (orderListDiv) {
      orderListDiv.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auth panel
  if (!sessionToken || !currentUser) {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between py-10 px-4 font-sans selection-box antialiased text-slate-800">
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full select-none shadow-xs">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-600 font-mono">Mobile Node Active</span>
          </div>

          <div className="my-auto space-y-6 max-w-sm w-full mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex p-3.5 bg-blue-600 text-white rounded-2xl font-bold text-xl uppercase shadow-md shadow-blue-500/20">
                P
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pickvi Mobile Hub</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
                E-Commerce Dispatch & Order Tracking Registry (Bangladesh)
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-5">
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Security Username
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    placeholder="e.g., moderator_xifat"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all font-mono"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-650 rounded-xl font-medium">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 px-4 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center space-x-1"
                >
                  {isAuthLoading ? (
                    <span>Accessing Secure Bridge...</span>
                  ) : (
                    <span>Sign In Mobile Panel</span>
                  )}
                </button>
              </form>

              {/* Quick Preset Buttons on Mobile login screen */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Quick Access Profiles
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUsername('admin');
                      setLoginPassword('admin123');
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }, 150);
                    }}
                    className="py-2 px-2.5 border border-slate-150 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl text-left transition-all active:scale-95"
                  >
                    <span className="text-[9px] font-extrabold text-slate-800 block">👑 Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginUsername('moderator_xifat');
                      setLoginPassword('mod123');
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }, 150);
                    }}
                    className="py-2 px-2.5 border border-slate-150 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl text-left transition-all active:scale-95"
                  >
                    <span className="text-[9px] font-extrabold text-slate-800 block">💼 Moderator</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-400 font-mono">
            Direct WooCommerce SQL Sync Engine v2
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection-box antialiased text-gray-200">
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full select-none shadow-xs">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono text-gray-455">Pickvi Dev Environment Active</span>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex p-3 bg-white/10 border border-white/20 text-white rounded-3xl mb-4 font-display font-black text-lg tracking-widest uppercase">
            P
          </div>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight">Pickvi Admin Panel</h2>
          <p className="mt-1.5 text-xs text-gray-400 font-sans leading-relaxed">
            Authorized admin portal for custom-built direct HPOS order registry and operational tracking database.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#111111] py-8 px-6 sm:px-10 border border-white/5 rounded-3xl shadow-2xl space-y-6">
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Security Account (Username)
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:bg-white/10 focus:border-cyan-500/50"
                  placeholder="admin or moderator_xifat"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Access Keyword (Password)
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:bg-white/10 focus:border-cyan-500/50 font-mono"
                  placeholder="admin123 or mod123"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-xs text-rose-455 rounded-xl">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-2.5 px-4 cursor-pointer bg-cyan-600 border border-cyan-700/20 hover:bg-cyan-555 text-black hover:bg-[#22d3ee] disabled:opacity-50 text-xs font-bold rounded-xl shadow-sm select-none transition-all duration-150 transform active:scale-98 flex items-center justify-center space-x-1"
              >
                {isAuthLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Establishing Database Session...</span>
                  </>
                ) : (
                  <span>Access Admin Panel</span>
                )}
              </button>
            </form>

            {/* Presets and quick drive setups */}
            <div className="border-t border-white/10 pt-5 space-y-3.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block text-center">
                Click a Preset to Auto-Login Instantly
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('admin');
                    setLoginPassword('admin123');
                    // auto trigger submit helper
                    setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 150);
                  }}
                  className="py-2.5 px-3 border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer rounded-xl text-left transition-all"
                >
                  <span className="text-[10px] font-bold text-white block">👑 System Admin</span>
                  <span className="text-[9px] text-gray-400 mt-1 font-mono block">Role: Full Control</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('moderator_xifat');
                    setLoginPassword('mod123');
                    setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 150);
                  }}
                  className="py-2.5 px-3 border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer rounded-xl text-left transition-all"
                >
                  <span className="text-[10px] font-bold text-white block">💼 Moderator Team</span>
                  <span className="text-[9px] text-gray-400 mt-1 font-mono block">Role: Order Creator</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-[10px] text-gray-500 font-mono">
            Direct WooCommerce SQL Bridge v2.10 | PHP Session Proxy
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="bg-[#f8fafc] text-slate-800 min-h-screen relative font-sans selection-box antialiased">
        <MobileUIContainer
          orders={orders}
          stats={stats}
          isOrdersLoading={isOrdersLoading}
          isStatsLoading={isStatsLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentFilter={currentFilter}
          setCurrentFilter={setCurrentFilter}
          currentDateFilter={currentDateFilter}
          setCurrentDateFilter={setCurrentDateFilter}
          onCreateOrderClick={() => setIsCreatingOrder(true)}
          onOrderClick={(id) => setViewingOrderId(id)}
          currentUser={currentUser}
          onLogout={handleLogoutAction}
          isSyncing={isSyncing}
          onForceSync={() => {
            fetchOrders();
            fetchStats();
          }}
          notifications={notifications}
          setNotifications={setNotifications}
          onSimulateOrder={handleSimulateInvoiceIncoming}
          isSimulatingOrder={isSimulatingOrder}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalOrdersCount={totalOrders}
          onCloseMobileUI={handleLogoutAction}
        />

        {viewingOrderId && (
          <OrderDetailsModal
            orderId={viewingOrderId}
            token={sessionToken}
            currentUserRole={currentUser.role}
            onClose={() => setViewingOrderId(null)}
            onOrderUpdated={() => {
              fetchOrders();
              fetchStats();
            }}
            isMobile={true}
            initialOrder={orders.find(o => o.id === viewingOrderId)}
          />
        )}

        {isCreatingOrder && (
          <CreateOrderModal
            token={sessionToken}
            currentUserRole={currentUser.role}
            onClose={() => {
              setIsCreatingOrder(false);
              setAiBillingDraft(null);
              setAiItemsDraft([]);
              setAiNoteDraft('');
            }}
            onOrderCreated={(id) => {
              fetchOrders();
              fetchStats();
              setIsCreatingOrder(false);
              setViewingOrderId(id);
            }}
            initialBillingDraft={aiBillingDraft}
            initialItemsDraft={aiItemsDraft}
            initialNoteDraft={aiNoteDraft}
            isMobile={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col justify-between font-sans selection-box antialiased relative">
      {/* Floating notifications stream stack */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="bg-[#111111] border border-white/10 shadow-2xl shadow-black p-4 rounded-2xl text-white space-y-2 pointer-events-auto cursor-pointer"
              onClick={() => {
                setActiveTab('orders');
                setViewingOrderId(msg.orderId);
                // dismiss
                setNotifications((prev) => prev.filter((n) => n.id !== msg.id));
              }}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  {msg.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifications((prev) => prev.filter((n) => n.id !== msg.id));
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-gray-450 leading-normal">{msg.message}</p>
              <div className="text-[9px] font-mono text-cyan-400 font-semibold uppercase flex items-center justify-between">
                <span>Click to Open details modal ↗</span>
                <span className="bg-white/5 font-sans px-1.5 border border-white/10 py-0.2 rounded text-white">BDT {msg.total.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Persistent global header */}
      <header className="bg-[#0d0d0d] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          {/* Brand branding */}
          <div className="flex items-center space-x-3 select-none">
            <div className="p-2 bg-white/10 text-white font-display border border-white/10 font-black rounded-2xl flex items-center justify-center text-sm shadow-sm select-none">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-display font-bold text-white tracking-tight leading-none">Pickvi</h1>
                <span className="bg-white/5 text-gray-300 font-bold font-mono text-[8px] border border-white/10 rounded px-1.5">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-none font-sans">E-Commerce Management Proxy</p>
            </div>
          </div>

          {/* Action triggers header bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* AI Parser toggle */}
            <button
              onClick={() => setIsParserOpen(!isParserOpen)}
              className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                isParserOpen
                  ? 'bg-violet-900/40 text-violet-300 border-violet-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Parser Workbench</span>
            </button>

            {/* Credentials manager */}
            <button
              onClick={() => setIsUsersOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-300 text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>Accounts</span>
            </button>
 
             {/* Courier Credentials manager */}
            <button
              onClick={() => setIsCourierOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-950/20 border border-violet-500/20 hover:bg-violet-900/30 transition-all text-violet-300 text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>Courier Hub</span>
            </button>

            {/* Log out trigger */}
            <div className="border-l border-white/10 pl-2 ml-1 flex items-center gap-2">
              <div className="text-right hidden md:block">
                <span className="text-[10px] font-extrabold text-white block leading-tight">{currentUser.fullName}</span>
                <span className="text-[9px] text-gray-450 font-mono block tracking-wider uppercase leading-none">{currentUser.role}</span>
              </div>
              <button
                type="button"
                onClick={handleLogoutAction}
                className="p-1.5 hover:bg-rose-950/40 text-gray-400 hover:text-rose-455 rounded-lg cursor-pointer border border-transparent hover:border-rose-500/20"
                title="Destroy auth session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Polling Beacon line */}
      <div className="bg-black/80 border-b border-white/5 text-gray-400 px-4 py-1.5 text-center text-[10px] font-mono flex items-center justify-center gap-1.5 select-none shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
        </span>
        <span>Real-time Delta Polling check active. Database syncing every 15s. Last Sync: <span className="text-white">{new Date(lastSyncTimestampRef.current).toLocaleTimeString()}</span></span>
      </div>

      {/* Main page Container layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Admin Navigation Tabs */}
        {currentUser && currentUser.role === 'admin' && (
          <div className="flex border-b border-white/5 space-x-6 pb-1 mb-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-xs font-semibold relative tracking-wide uppercase transition cursor-pointer select-none ${
                activeTab === 'orders' ? 'text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">🛒 Orders Registry</span>
              {activeTab === 'orders' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`pb-3 text-xs font-semibold relative tracking-wide uppercase transition cursor-pointer select-none ${
                activeTab === 'profit' ? 'text-indigo-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">💰 Profit Analyzer</span>
              {activeTab === 'profit' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`pb-3 text-xs font-semibold relative tracking-wide uppercase transition cursor-pointer select-none ${
                activeTab === 'ads' ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">📢 Ad Cost Tracker</span>
              {activeTab === 'ads' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>
          </div>
        )}

        {activeTab === 'orders' ? (
          <>
            {/* Dynamic modular KPI Widget Row */}
            <DashboardStats
              stats={stats}
              periodDays={periodDays}
              setPeriodDays={setPeriodDays}
              isLoading={isStatsLoading}
              onFilterApprovalQueue={handleFilterToApprovalQueue}
              currentUserRole={currentUser?.role}
            />

            {/* AI Order Parsing Drawer Pane */}
            {isParserOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="transition-all"
              >
                <OrderParser onDraftGenerated={handleDraftPushedToCheckout} token={sessionToken} />
              </motion.div>
            )}

            {/* Grid Area: Browse Orders (Col 12) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#111111] border border-white/5 p-4 rounded-xl shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-white">WooCommerce Direct Database Registry</h3>
                  <p className="text-[10px] text-gray-400">Manage orders, update specific billing data, or track active inventory items.</p>
                </div>

                <button
                  onClick={() => {
                    // Clear any leftover drafts
                    setAiBillingDraft(null);
                    setAiItemsDraft([]);
                    setAiNoteDraft('');
                    setIsCreatingOrder(true);
                  }}
                  className="px-4 py-2 bg-cyan-600 border border-cyan-700/20 hover:bg-cyan-550 text-black hover:bg-[#22d3ee] font-bold rounded-xl text-xs flex items-center gap-1 select-none cursor-pointer transition-all active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> Direct Create Order
                </button>
              </div>

              {/* Master Paginated grid list */}
              <OrderList
                orders={orders}
                totalOrdersCount={totalOrders}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                currentFilter={currentFilter}
                setCurrentFilter={setCurrentFilter}
                currentDateFilter={currentDateFilter}
                setCurrentDateFilter={setCurrentDateFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onViewOrder={setViewingOrderId}
                onApproveOrder={handleApproveOrder}
                currentUserRole={currentUser.role}
                isSyncing={isOrdersLoading || isSyncing}
                onForceSync={handleForceManualSync}
              />
            </div>
          </>
        ) : activeTab === 'profit' ? (
          <ProfitTracker orders={orders} onViewOrder={(id) => setViewingOrderId(id)} />
        ) : (
          <AdExpenseTracker />
        )}
      </main>

      {/* Master details modal backdrop slider */}
      {viewingOrderId && (
        <OrderDetailsModal
          orderId={viewingOrderId}
          token={sessionToken}
          currentUserRole={currentUser.role}
          onClose={() => setViewingOrderId(null)}
          onOrderUpdated={() => {
            fetchOrders();
            fetchStats();
          }}
          initialOrder={orders.find(o => o.id === viewingOrderId)}
        />
      )}

      {/* Creator work card checkout backdrop slider */}
      {isCreatingOrder && (
        <CreateOrderModal
          token={sessionToken}
          currentUserRole={currentUser.role}
          onClose={() => {
            setIsCreatingOrder(false);
            setAiBillingDraft(null);
            setAiItemsDraft([]);
            setAiNoteDraft('');
          }}
          onOrderCreated={(id) => {
            fetchOrders();
            fetchStats();
            setIsCreatingOrder(false);
            // open details modal immediately to verify
            setViewingOrderId(id);
          }}
          initialBillingDraft={aiBillingDraft}
          initialItemsDraft={aiItemsDraft}
          initialNoteDraft={aiNoteDraft}
        />
      )}

      {/* Accounts provision manager slider */}
      {isUsersOpen && (
        <UsersManagementModal
          token={sessionToken}
          currentUser={currentUser}
          onClose={() => setIsUsersOpen(false)}
        />
      )}

      {/* Courier settings manager popup */}
      {isCourierOpen && (
        <CourierSettingsModal
          token={sessionToken}
          onClose={() => setIsCourierOpen(false)}
        />
      )}

      {/* Global mini footer */}
      <footer className="bg-[#050505] border-t border-white/5 py-4 font-mono text-[9px] text-gray-500 select-none shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-1">
          <span>Copyright © 2026 Pickvi E-Commerce. All rights reserved.</span>
          <span>Security Audit: Passed (bcrypt-equipped storage module)</span>
        </div>
      </footer>
    </div>
  );
}
