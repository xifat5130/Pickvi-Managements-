/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, OrderStatus } from '../types';
import { Search, MapPin, Phone, Clock, Calendar, Check, X, RefreshCw, Layers, ShieldCheck, ChevronRight } from 'lucide-react';

interface Props {
  orders: Order[];
  totalOrdersCount: number;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (p: number) => void;
  currentFilter: string;
  setCurrentFilter: (f: string) => void;
  currentDateFilter: string;
  setCurrentDateFilter: (df: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onViewOrder: (id: number) => void;
  onApproveOrder?: (id: number) => void;
  currentUserRole: string;
  isSyncing: boolean;
  onForceSync: () => void;
}

const STATUS_CONFIGS: { [key in OrderStatus]: { bg: string; text: string; label: string } } = {
  pending: { bg: 'bg-amber-955/30 border-amber-500/25', text: 'text-amber-400', label: 'Pending Approval' },
  'on-hold': { bg: 'bg-indigo-955/30 border-indigo-500/25', text: 'text-indigo-400', label: 'On Hold' },
  processing: { bg: 'bg-blue-955/30 border-blue-500/25', text: 'text-blue-400', label: 'Processing' },
  completed: { bg: 'bg-emerald-955/30 border-emerald-500/25', text: 'text-emerald-400', label: 'Completed' },
  cancelled: { bg: 'bg-white/5 border-white/10', text: 'text-gray-400', label: 'Cancelled' },
};

export default function OrderList({
  orders,
  totalOrdersCount,
  currentPage,
  totalPages,
  setCurrentPage,
  currentFilter,
  setCurrentFilter,
  currentDateFilter,
  setCurrentDateFilter,
  searchQuery,
  setSearchQuery,
  onViewOrder,
  onApproveOrder,
  currentUserRole,
  isSyncing,
  onForceSync,
}: Props) {

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-xl overflow-hidden" id="order-list-viewport-panel">
      {/* Search & Filtering Panel */}
      <div className="p-5 border-b border-white/5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-cyan-500/50 transition-all text-slate-200"
              placeholder="Search ID, customer name, mobile numbers, city, or product lines..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on query change
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync trigger */}
            <button
              onClick={onForceSync}
              disabled={isSyncing}
              className={`p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-gray-300 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isSyncing ? 'opacity-80' : ''
              }`}
              title="Manual Sync Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* Date preset dropdown */}
            <select
              value={currentDateFilter}
              onChange={(e) => {
                setCurrentDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 border border-white/10 bg-[#111111] hover:bg-[#161616] cursor-pointer rounded-xl text-xs font-medium py-2 text-gray-300 outline-none"
            >
              <option value="all">🕒 All Timeframes</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Status filters horizontal rail */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrolls-none border-b border-white/5">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'pending', label: 'Pending Approvals' },
            { value: 'processing', label: 'Processing' },
            { value: 'on-hold', label: 'On Hold' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setCurrentFilter(tab.value);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold cursor-pointer rounded-lg border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentFilter === tab.value
                  ? 'bg-cyan-600 border-cyan-600 text-black shadow-xs font-bold'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/30 border-b border-white/5 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
              <th className="py-3 px-5 text-center">ID</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Order Items</th>
              <th className="py-3 px-4">Courier & Tracking</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center justify-center">
                    <Layers className="w-8 h-8 text-gray-600 mb-2" />
                    <span className="font-semibold text-gray-300 block">No Orders Found</span>
                    <p className="text-[10px] text-gray-500 mt-1">Verify filters or query search keywords.</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusCfg = STATUS_CONFIGS[order.status] || { bg: 'bg-white/5 border-white/10', text: 'text-gray-400', label: order.status };
                const isModeratorCreated = order._is_moderator_order === 'yes';

                return (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors align-middle duration-100">
                    {/* ID & Flags */}
                    <td className="py-4 px-5 text-center selection-box">
                      <span className="font-display font-bold text-white">#{order.id}</span>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 whitespace-nowrap">
                        {formatDate(order.date_created)}
                      </div>
                      {isModeratorCreated && (
                        <div className="mt-1 flex flex-col items-center justify-center gap-0.5" title="Requires Administrator Approval">
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[8px] bg-amber-955/40 text-amber-400 border border-amber-500/20 font-semibold px-1 rounded uppercase tracking-wider font-mono">Mod</span>
                          </div>
                          <span className="text-[8.5px] text-yellow-400/80 font-mono tracking-tight font-medium max-w-[80px] truncate">
                            {order._moderator_name || order._moderator_username || 'Staff'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4 w-48 max-w-sm">
                      <div className="font-semibold text-white text-[12px] truncate">
                        {order.billing?.first_name} {order.billing?.last_name || ''}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-550" /> {order.billing?.phone || 'No phone'}
                      </div>
                    </td>

                    {/* Line Items */}
                    <td className="py-4 px-4 max-w-sm">
                      <div className="space-y-0.5">
                        {order.line_items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-gray-300 leading-tight">
                            <span className="font-semibold">{it.quantity}x</span> {it.name}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Courier & Tracking */}
                    <td className="py-4 px-4 min-w-[180px]">
                      {order.steadfast && order.steadfast.is_sent && order.steadfast.consignment_id ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-blue-500/10 text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/20 font-mono select-all">
                              {order.steadfast.consignment_id}
                            </span>
                            <span className="text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-semibold uppercase tracking-wider">
                              Sent
                            </span>
                          </div>
                          {order.steadfast.delivery_status && (
                            <div className="text-[11px] text-gray-300">
                              🚚 Status: <span className="text-cyan-400 font-bold">{order.steadfast.delivery_status}</span>
                            </div>
                          )}
                          {order.steadfast.cod_amount !== undefined && (
                            <div className="text-[10px] text-gray-500 font-mono">
                              COD BDT: ৳{order.steadfast.cod_amount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 font-medium inline-block">
                          📦 Not Dispatched
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block border text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap tracking-wide select-none ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.label}
                      </span>
                      <div className="font-display font-semibold text-white text-[11px] mt-1 font-mono">
                        ৳{order.total.toLocaleString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onViewOrder(order.id)}
                          className="p-2 bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 rounded-lg border border-white/10 flex items-center justify-center cursor-pointer transition-all duration-100"
                          title="View / Modify detail"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-gray-440 font-medium">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (Filtered list total of {totalOrdersCount} records)
          </span>

          <div className="flex space-x-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 cursor-pointer transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 cursor-pointer transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
