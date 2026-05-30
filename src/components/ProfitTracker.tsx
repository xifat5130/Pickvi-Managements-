/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { TrendingUp, Coins, ShoppingBag, Truck, Edit3, Check, DollarSign, ArrowUpRight } from 'lucide-react';

interface Props {
  orders: Order[];
  onViewOrder: (id: number) => void;
}

export default function ProfitTracker({ orders, onViewOrder }: Props) {
  // Config states matching template localStorage keys
  const [costs, setCosts] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem('pv6_costs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [delFee, setDelFee] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pv6_del');
      return saved ? JSON.parse(saved) : 70;
    } catch {
      return 70;
    }
  });

  const [ads, setAds] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('pv6_ads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Period filter days state (7, 14, 30)
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [tempDelFee, setTempDelFee] = useState<string>(String(delFee));
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [tempCostValue, setTempCostValue] = useState<string>('');

  // Sync state modifications to match localstorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedCosts = localStorage.getItem('pv6_costs');
        if (savedCosts) setCosts(JSON.parse(savedCosts));
        const savedDel = localStorage.getItem('pv6_del');
        if (savedDel) {
          const val = JSON.parse(savedDel);
          setDelFee(val);
          setTempDelFee(String(val));
        }
        const savedAds = localStorage.getItem('pv6_ads');
        if (savedAds) setAds(JSON.parse(savedAds));
      } catch (err) {
        console.warn('Error reading storage changes:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter orders for the chosen period which are NOT cancelled, failed, or refunded
  const getFilteredOrders = () => {
    const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    return orders.filter((o) => {
      if (!o.date_created) return false;
      const orderDate = new Date(o.date_created);
      const isWithinPeriod = orderDate >= cutoffDate;
      const isActive = !['cancelled', 'failed', 'refunded'].includes(o.status);
      return isWithinPeriod && isActive;
    });
  };

  // Get ad costs registered from chosen days
  const getAdSpendForPeriod = (days: number) => {
    const cutoffStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return ads
      .filter((a) => a.date >= cutoffStr)
      .reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
  };

  // Individual order profit calculator
  const calculateOrderProfit = (order: Order) => {
    const revenue = parseFloat(String(order.total || 0));
    let cog = 0;

    (order.line_items || []).forEach((item) => {
      const pid = item.variation_id && item.variation_id !== 0 ? String(item.variation_id) : String(item.product_id);
      const costPrice = costs[pid] || costs[String(item.product_id)] || 0;
      cog += parseFloat(String(costPrice)) * (parseInt(String(item.quantity)) || 1);
    });

    const profit = revenue - cog - delFee;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return { revenue, cog, profit, margin };
  };

  const activeOrders = getFilteredOrders();
  const totalRevenue = activeOrders.reduce((sum, o) => sum + parseFloat(String(o.total || 0)), 0);
  
  let totalCogs = 0;
  activeOrders.forEach((o) => {
    (o.line_items || []).forEach((item) => {
      const pid = item.variation_id && item.variation_id !== 0 ? String(item.variation_id) : String(item.product_id);
      const costPrice = costs[pid] || costs[String(item.product_id)] || 0;
      totalCogs += parseFloat(String(costPrice)) * (parseInt(String(item.quantity)) || 1);
    });
  });

  const adSpend = getAdSpendForPeriod(periodDays);
  const totalDeliveryCost = activeOrders.length * delFee;
  const netProfit = totalRevenue - totalCogs - totalDeliveryCost - adSpend;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Extract list of all products sold in these orders to show cost input
  const getUniqueSoldProducts = () => {
    const prodMap: { [key: string]: { id: string; name: string } } = {};
    activeOrders.forEach((o) => {
      (o.line_items || []).forEach((item) => {
        const hasVar = item.variation_id && item.variation_id !== 0;
        const pid = hasVar ? String(item.variation_id) : String(item.product_id);
        if (!prodMap[pid]) {
          prodMap[pid] = {
            id: pid,
            name: item.name + (hasVar ? ' (ভেরিয়েশন)' : ''),
          };
        }
      });
    });
    return Object.values(prodMap);
  };

  const uniqueProducts = getUniqueSoldProducts();

  // Save changes wrapper
  const handleSaveDelFee = () => {
    const val = parseFloat(tempDelFee) || 0;
    setDelFee(val);
    try {
      localStorage.setItem('pv6_del', JSON.stringify(val));
      // Dispatch storage event manually for same-tab updates
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProductCost = (pid: string) => {
    const val = parseFloat(tempCostValue) || 0;
    const updated = { ...costs, [pid]: val };
    setCosts(updated);
    try {
      localStorage.setItem('pv6_costs', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
    setEditingCostId(null);
  };

  const formatBDT = (val: number) => {
    return '৳' + Math.round(val).toLocaleString('en-US');
  };

  return (
    <div className="space-y-6">
      {/* Tab filter and headers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-400" /> Profit & Margin Analyzer
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Calculate Net Income margins, Cost of Goods Sold (COGS), and active campaign overheads.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
          {[
            { label: '7 Days', days: 7 },
            { label: '14 Days', days: 14 },
            { label: '30 Days', days: 30 },
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setPeriodDays(item.days)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                periodDays === item.days
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI stats blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block leading-none">
              Total Sales (আয়)
            </span>
            <span className="p-1 px-2.5 text-[9px] font-bold rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              {activeOrders.length} Orders
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-display font-bold text-white tracking-tight">
              {formatBDT(totalRevenue)}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Excludes cancelled & returned</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${netProfit >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`} />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block leading-none">
              Net Profit
            </span>
            <span className={`p-1 px-2 text-[9px] font-bold rounded-lg border ${
              netProfit >= 0 
                ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20' 
                : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
            }`}>
              Margin: {profitMargin}%
            </span>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-display font-bold tracking-tight ${netProfit >= 0 ? 'text-indigo-400' : 'text-rose-455'}`}>
              {formatBDT(netProfit)}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">After Ads, COGS & Delivery Fee</p>
          </div>
        </div>

        {/* Goods Cost price COGS */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block leading-none">
              Cost of Goods (COGS)
            </span>
            <span className="text-[10px] font-mono text-gray-450">Products cost</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-display font-bold text-white tracking-tight">
              {formatBDT(totalCogs)}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Based on saved configuration</p>
          </div>
        </div>

        {/* Ad + Delivery overheads */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block leading-none">
              Overheads & Shipping
            </span>
            <span className="text-[10px] font-mono text-violet-400">Boosts + Delivery</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-display font-bold text-white tracking-tight">
              {formatBDT(adSpend + totalDeliveryCost)}
            </div>
            <p className="text-[10px] text-violet-400/80 mt-1">
              Ads: {formatBDT(adSpend)} | Ship: {formatBDT(totalDeliveryCost)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Controls and Cost settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Delivery Configuration set */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Default Delivery fee (৳)</h3>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              This average BDT is charged per active order to estimate shipping overheads.
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={tempDelFee}
                onChange={(e) => setTempDelFee(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:bg-white/10 focus:border-indigo-500/50 font-mono"
              />
              <button
                onClick={handleSaveDelFee}
                className="bg-indigo-650 hover:bg-indigo-600 border border-indigo-700/20 text-white p-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product costs settings panel list */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Sold Cost Prices</h3>
              <p className="text-[11px] text-gray-450 mt-1 leading-normal">
                Assign cost prices below to correctly estimate Net margin. Only products sold in selected period are listed here:
              </p>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {uniqueProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  No active sales tracked in this period.
                </div>
              ) : (
                uniqueProducts.map((p) => {
                  const currentCost = costs[p.id] || 0;
                  const isEditing = editingCostId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="bg-white/3 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate" title={p.name}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {p.id}</p>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            value={tempCostValue}
                            onChange={(e) => setTempCostValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveProductCost(p.id)}
                            className="w-18 bg-white/10 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-center text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveProductCost(p.id)}
                            className="p-1 bg-emerald-555 hover:bg-emerald-500 rounded text-black flex items-center justify-center cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-indigo-400 font-mono">
                            {formatBDT(currentCost)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCostId(p.id);
                              setTempCostValue(String(currentCost || ''));
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: Orders list report */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Detailed Order-by-Order Breakdowns
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeOrders.length === 0 ? (
                <div className="text-center py-20 text-xs text-gray-500">
                  No active orders recorded in this range.
                </div>
              ) : (
                [...activeOrders]
                  .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                  .map((order) => {
                    const stats = calculateOrderProfit(order);
                    const name = [order.billing?.first_name, order.billing?.last_name]
                      .filter(Boolean)
                      .join(' ') || 'অজানা';
                    const dateStr = order.date_created ? order.date_created.split('T')[0] : '—';

                    return (
                      <div
                        key={order.id}
                        onClick={() => onViewOrder(order.id)}
                        className="bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl p-3.5 flex justify-between items-center gap-4 cursor-pointer transition duration-150"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-gray-550">
                              #{order.id}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <span className="text-[10px] text-gray-450 font-mono">{dateStr}</span>
                          </div>
                          <p className="text-xs font-semibold text-white/90 truncate mt-1">{name}</p>
                          <p className="text-[9px] text-gray-500 truncate mt-0.5">
                            Items: {order.line_items?.map((li) => `${li.name} (x${li.quantity})`).join(', ') || 'No line items'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[11px] text-gray-450 font-mono font-medium">
                            Rev: {formatBDT(stats.revenue)}
                          </p>
                          <p className={`text-sm font-bold font-mono mt-0.5 ${
                            stats.profit >= 0 ? 'text-emerald-400' : 'text-rose-455'
                          }`}>
                            {stats.profit >= 0 ? '+' : ''}
                            {formatBDT(stats.profit)}
                          </p>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 ${
                            stats.profit >= 0 
                              ? 'bg-emerald-950/50 text-emerald-400' 
                              : 'bg-rose-950/50 text-rose-400'
                          }`}>
                            Margin: {stats.margin}%
                          </span>
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
