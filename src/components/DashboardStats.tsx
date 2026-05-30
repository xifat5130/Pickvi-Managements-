/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DashboardStats as StatsType } from '../types';
import { TrendingUp, ShoppingBag, ShieldAlert, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  stats: StatsType | null;
  periodDays: number;
  setPeriodDays: (days: number) => void;
  isLoading: boolean;
  onFilterApprovalQueue: () => void;
  currentUserRole?: string;
}

export default function DashboardStats({ stats, periodDays, setPeriodDays, isLoading, onFilterApprovalQueue, currentUserRole }: Props) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-[#111111] border border-white/5 rounded-xl"></div>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return `৳${val.toLocaleString('en-US')}`;
  };

  const isModerator = currentUserRole === 'moderator';

  const kpis = isModerator ? [
    {
      title: 'Your Total Orders',
      value: stats.order_count,
      desc: 'your entries in selected period',
      icon: ShoppingBag,
      color: 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20',
    },
    {
      title: 'Returned / Cancelled',
      value: stats.cancelled_count,
      desc: 'your returned or cancelled items',
      icon: AlertCircle,
      color: 'text-rose-455 bg-rose-955/20 border-rose-500/20',
    },
    {
      title: 'Pending Approvals',
      value: stats.pending_approval,
      desc: 'your drafts awaiting approval',
      icon: ShieldAlert,
      color: 'text-amber-400 bg-amber-950/20 border-amber-500/20',
      action: stats.pending_approval > 0 ? onFilterApprovalQueue : undefined,
    },
    {
      title: 'Processing',
      value: stats.processing_count,
      desc: 'your processing orders',
      icon: ClipboardList,
      color: 'text-indigo-400 bg-indigo-950/20 border-indigo-500/20',
    },
    {
      title: 'Completed',
      value: stats.completed_count,
      desc: 'your successfully delivered items',
      icon: CheckCircle2,
      color: 'text-teal-400 bg-teal-950/20 border-teal-500/20',
    },
  ] : [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.total_sales),
      desc: 'from active processing/completed orders',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20',
    },
    {
      title: 'Total Orders',
      value: stats.order_count,
      desc: 'placed within selected period',
      icon: ShoppingBag,
      color: 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20',
    },
    {
      title: 'Pending Approvals',
      value: stats.pending_approval,
      desc: 'from moderator queue',
      icon: ShieldAlert,
      color: 'text-amber-400 bg-amber-950/20 border-amber-500/20',
      action: stats.pending_approval > 0 ? onFilterApprovalQueue : undefined,
    },
    {
      title: 'Processing',
      value: stats.processing_count,
      desc: 'awaiting dispatch & verification',
      icon: ClipboardList,
      color: 'text-indigo-400 bg-indigo-950/20 border-indigo-500/20',
    },
    {
      title: 'Completed',
      value: stats.completed_count,
      desc: 'successfully delivered at destination',
      icon: CheckCircle2,
      color: 'text-teal-400 bg-teal-950/20 border-teal-500/20',
    },
  ];

  return (
    <div className="space-y-4" id="pickvi-stats-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-display font-semibold text-white tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-gray-400">Real-time indicators processed from direct WooCommerce core database query.</p>
        </div>

        <div className="flex items-center space-x-1.5 bg-white/5 border border-white/10 rounded-lg p-1 shadow-xs">
          {[
            { label: 'Today', days: 1 },
            { label: '7 Days', days: 7 },
            { label: '14 Days', days: 14 },
            { label: '30 Days', days: 30 },
            { label: 'All', days: 36500 },
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setPeriodDays(item.days)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                periodDays === item.days
                  ? 'bg-cyan-600 text-black shadow-xs font-bold'
                  : 'text-gray-450 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const hasAction = !!kpi.action;

          return (
            <div
              key={idx}
              id={`kpi-card-${idx}`}
              className={`bg-[#111111] border border-white/5 rounded-2xl p-5 shadow-2xl transition-all flex flex-col justify-between relative overflow-hidden ${
                hasAction ? 'hover:shadow-md cursor-pointer border-amber-500/20 hover:border-amber-500/40' : ''
              } ${isLoading ? 'opacity-70' : ''}`}
              onClick={kpi.action}
            >
              {kpi.title === 'Pending Approvals' && stats.pending_approval > 0 && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-bl-lg animate-pulse" />
              )}
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest leading-none">
                  {kpi.title}
                </span>
                <span className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-3">
                <span className="text-2xl font-display font-semibold text-white leading-none">
                  {kpi.value}
                </span>
                <p className="text-[10px] text-gray-450 mt-1 flex items-center gap-1.5 leading-tight">
                  {kpi.title === 'Pending Approvals' && stats.pending_approval > 0 ? (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> Click to view queue
                    </span>
                  ) : (
                    kpi.desc
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
