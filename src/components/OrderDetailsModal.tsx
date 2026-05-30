/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderNote } from '../types';
import { X, MapPin, User, Phone, Edit3, Clipboard, HelpCircle, Save, Calendar, CheckSquare, Plus, Activity, BookOpen, ShieldCheck, AlertTriangle, Truck, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
  orderId: number;
  token: string | null;
  currentUserRole: string;
  onClose: () => void;
  onOrderUpdated: () => void;
  isMobile?: boolean;
  initialOrder?: Order;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending Approval' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderDetailsModal({ orderId, token, currentUserRole, onClose, onOrderUpdated, isMobile = false, initialOrder }: Props) {
  const isModerator = currentUserRole === 'moderator';
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [isLoading, setIsLoading] = useState(!initialOrder);

  // Editing billing state
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [billingForm, setBillingForm] = useState({
    first_name: initialOrder?.billing?.first_name || '',
    last_name: initialOrder?.billing?.last_name || '',
    phone: initialOrder?.billing?.phone || '',
    address_1: initialOrder?.billing?.address_1 || '',
    city: initialOrder?.billing?.city || '',
  });

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Status update loader
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fraud check states
  const [fraudHistory, setFraudHistory] = useState<{
    total_parcels: number;
    successful_deliveries: number;
    cancelled_deliveries: number;
    last_status: string;
    is_sandbox?: boolean;
    sandbox_reason?: string;
    used_account?: string;
  } | null>(null);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);

  // Steadfast client states
  const [isSyncingSteadfast, setIsSyncingSteadfast] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [codAmountInput, setCodAmountInput] = useState(initialOrder ? String(Math.round(initialOrder.total || 0)) : '');
  const [parcelQtyInput, setParcelQtyInput] = useState('1');
  const [copied, setCopied] = useState(false);

  const handleCopyConsignment = (cid: string) => {
    navigator.clipboard.writeText(cid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger Fraud check call to backend
  const triggerFraudCheck = async () => {
    setIsCheckingFraud(true);
    try {
      const response = await fetch('/api/steadfast/check_fraud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
          'x-sf1-key': localStorage.getItem('pickvi_sf1_key') || '',
          'x-sf1-secret': localStorage.getItem('pickvi_sf1_secret') || '',
          'x-sf2-key': localStorage.getItem('pickvi_sf2_key') || '',
          'x-sf2-secret': localStorage.getItem('pickvi_sf2_secret') || ''
        },
        body: JSON.stringify({ orderId }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.fraud_history) {
          setFraudHistory(data.fraud_history);
        }
      }
    } catch (err) {
      console.error("Failed to run fraud check", err);
    } finally {
      setIsCheckingFraud(false);
    }
  };

  // Dispatch Book Consignment call
  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const response = await fetch('/api/steadfast/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
          'x-sf1-key': localStorage.getItem('pickvi_sf1_key') || '',
          'x-sf1-secret': localStorage.getItem('pickvi_sf1_secret') || '',
          'x-sf2-key': localStorage.getItem('pickvi_sf2_key') || '',
          'x-sf2-secret': localStorage.getItem('pickvi_sf2_secret') || ''
        },
        body: JSON.stringify({
          orderId,
          codAmount: parseFloat(codAmountInput),
          parcelQty: parseInt(parcelQtyInput) || 1
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to book parcel.");
      }
      setIsDispatchOpen(false);
      onOrderUpdated();
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch to Steadfast.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Sync courier status
  const handleSyncCourierStatus = async () => {
    setIsSyncingSteadfast(true);
    try {
      const response = await fetch('/api/steadfast/sync_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
          'x-sf1-key': localStorage.getItem('pickvi_sf1_key') || '',
          'x-sf1-secret': localStorage.getItem('pickvi_sf1_secret') || '',
          'x-sf2-key': localStorage.getItem('pickvi_sf2_key') || '',
          'x-sf2-secret': localStorage.getItem('pickvi_sf2_secret') || ''
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update tracking.");
      }
      onOrderUpdated();
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to sync status.');
    } finally {
      setIsSyncingSteadfast(false);
    }
  };

  // Load single order details & notes
  const fetchDetails = async () => {
    if (!order) {
      setIsLoading(true);
    }
    try {
      const h = { 'Authorization': token || '' };
      // Read order
      const resOrder = await fetch(`/api/order/${orderId}`, { headers: h });
      if (!resOrder.ok) throw new Error('Failed to fetch order.');
      const orderData: Order = await resOrder.json();
      setOrder(orderData);
      setBillingForm({
        first_name: orderData.billing?.first_name || '',
        last_name: orderData.billing?.last_name || '',
        phone: orderData.billing?.phone || '',
        address_1: orderData.billing?.address_1 || '',
        city: orderData.billing?.city || '',
      });
      setCodAmountInput(String(Math.round(orderData.total || 0)));

      if (orderData.fraud_history) {
        setFraudHistory(orderData.fraud_history);
      } else {
        // Automatically scan only if it's never been scanned/saved before
        triggerFraudCheck();
      }

      // Fetch notes list from backend
      try {
        const resNotes = await fetch(`/api/notes?order_id=${orderId}`, { headers: h });
        if (resNotes.ok) {
          const notesData = await resNotes.json();
          setNotes(notesData.notes || []);
        }
      } catch (notesErr) {
        console.warn("Failed to retrieve order notes:", notesErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      if (initialOrder.fraud_history) {
        setFraudHistory(initialOrder.fraud_history);
      }
      setBillingForm({
        first_name: initialOrder.billing?.first_name || '',
        last_name: initialOrder.billing?.last_name || '',
        phone: initialOrder.billing?.phone || '',
        address_1: initialOrder.billing?.address_1 || '',
        city: initialOrder.billing?.city || '',
      });
      setCodAmountInput(String(Math.round(initialOrder.total || 0)));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    fetchDetails();
  }, [orderId, initialOrder]);

  // Handle status update
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetch('/api/update_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to modify status.');
      }
      onOrderUpdated();
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Status modification denied.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle billing details update
  const handleBillingSave = async () => {
    if (!order) return;
    try {
      const response = await fetch('/api/update_billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({ orderId: order.id, billing: billingForm }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      setIsEditingBilling(false);
      onOrderUpdated();
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer details.');
    }
  };

  // Handle new note submit
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !order) return;
    setIsSubmittingNote(true);
    try {
      const response = await fetch('/api/add_note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({ orderId: order.id, content: newNoteContent }),
      });
      if (response.ok) {
        setNewNoteContent('');
        fetchDetails(); // Reload notes
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-[#111111] rounded-3xl p-8 max-w-sm w-full border border-white/5 flex flex-col items-center justify-center space-y-4 shadow-2xl">
          <svg className="animate-spin h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 font-mono">Syncing database registers...</span>
        </div>
      </div>
    );
  }

  const formatHourOfDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12:00 PM';
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] z-50 overflow-y-auto flex flex-col pb-16 font-sans">
        {/* Sticky Mobile Header */}
        <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-20 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-105 text-blue-600 rounded-xl bg-blue-100">
              <Clipboard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Invoice Dispatch Desk</span>
              <h1 className="font-extrabold text-sm text-slate-900 leading-none">Order Details #{order.id}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-55 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic content scrollable area */}
        <div className="flex-1 w-full max-w-md mx-auto p-4 space-y-6 text-slate-800">
          
          {/* Operational Status selector on Mobile */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-400" /> Operational Status
              </span>
              <span className={`inline-block border text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                order.status === 'completed'
                  ? 'bg-emerald-50 border-emerald-250 text-emerald-750'
                  : order.status === 'processing'
                  ? 'bg-blue-50 border-blue-200 text-blue-750'
                  : order.status === 'pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-750'
                  : order.status === 'cancelled'
                  ? 'bg-rose-50 border-rose-200 text-rose-750'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-755'
              }`}>
                {order.status}
              </span>
            </div>

            {isModerator ? (
              <div className="p-3 bg-slate-50 text-[10px] text-slate-500 rounded-xl font-medium leading-normal">
                🔒 Your Moderator user role is restricted from adjusting operational order statuses.
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Modify status flow</label>
                <div className="relative mt-1">
                  <select
                    disabled={isUpdatingStatus}
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Receiver Contact form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-855 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Receiver Details
              </span>
              {!isModerator && (
                <button
                  type="button"
                  onClick={() => setIsEditingBilling(!isEditingBilling)}
                  className="text-xs text-blue-600 hover:text-blue-750 flex items-center gap-1 font-bold cursor-pointer select-none"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingBilling ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>

            {isEditingBilling ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">First Name</label>
                    <input
                      type="text"
                      value={billingForm.first_name}
                      onChange={(e) => setBillingForm({ ...billingForm, first_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={billingForm.last_name}
                      onChange={(e) => setBillingForm({ ...billingForm, last_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={billingForm.phone}
                    onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Address</label>
                    <input
                      type="text"
                      value={billingForm.address_1}
                      onChange={(e) => setBillingForm({ ...billingForm, address_1: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">CityHub</label>
                    <input
                      type="text"
                      value={billingForm.city}
                      onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBillingSave}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" /> Save Receiver Address
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs pt-1">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Recipient Name:</span>
                  <span className="font-bold text-slate-900">{order.billing?.first_name} {order.billing?.last_name || ''}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium font-sans">Active Mobile:</span>
                  <a href={`tel:${order.billing?.phone}`} className="font-extrabold text-blue-605 font-mono text-sm underline select-text">
                    {order.billing?.phone || 'N/A'}
                  </a>
                </div>
                <div className="flex justify-between items-start gap-3">
                  <span className="text-slate-400 font-medium">Delivery Address:</span>
                  <span className="font-bold text-slate-800 text-right max-w-xs block leading-relaxed">
                    {order.billing?.address_1}, {order.billing?.city}
                  </span>
                </div>
                {order.customer_note && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-[11px] text-amber-800 leading-normal font-medium">
                    ✏️ <strong>Buyer Checkout Note:</strong> {order.customer_note}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ordered Product Cart list formatted like a receipt */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
              Ordered Product Receipt
            </span>

            <div className="divide-y divide-slate-100">
              {order.line_items.map((it, i) => (
                <div key={i} className="py-3 flex justify-between items-center text-xs first:pt-0">
                  <div>
                    <span className="font-bold text-slate-800 block">{it.name}</span>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono font-bold">
                      <span>SKU-PV-{it.product_id}</span>
                      {it.variation_name && (
                        <>
                          <span className="text-slate-205">|</span>
                          <span className="text-blue-605 bg-blue-50 border border-blue-100 px-1.5 rounded">
                            {it.variation_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap pl-2">
                    <span className="font-bold text-slate-455 block">{it.quantity} × ৳{it.price}</span>
                    <span className="font-black text-slate-900 text-[11px] mt-0.5 block">৳{it.quantity * it.price}</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 flex justify-between items-center border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500">Invoice Total (BDT)</span>
                <span className="font-black text-slate-950 font-mono text-base font-sans">৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Receiver Fraud Screening Audit */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                🛡️ Fraud Screening Audit
              </span>
              <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold px-2 py-0.5 rounded-full font-mono">
                Steadfast Sync
              </span>
            </div>

            {isCheckingFraud ? (
              <div className="flex items-center justify-center py-6 space-x-2">
                <svg className="animate-spin h-5 w-5 text-emerald-650" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs text-slate-555 font-bold font-mono">Performing client check...</span>
              </div>
            ) : fraudHistory ? (
              <div className="space-y-4">
                {(() => {
                  const total = fraudHistory.total_parcels || 0;
                  const cancelled = fraudHistory.cancelled_deliveries || 0;
                  const success = fraudHistory.successful_deliveries || 0;
                  const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
                  let colorCls = "bg-emerald-50 border-emerald-250 text-emerald-750";
                  let noteLabel = "Trusted Customer (ভালো কাস্টমার)";
                  let adviceMsg = "100% clean parcel delivery rate on Steadfast Courier core records. Highly safe to dispatch.";
                  
                  if (total > 0) {
                    if (successRate < 60 || cancelled > 2) {
                      colorCls = "bg-red-50 border-red-150 text-red-750";
                      noteLabel = "High Return Risk (উচ্চ রিস্ক)";
                      adviceMsg = "Higher return frequency found. Strongly recommend asking for advance courier fee prior to shipping.";
                    } else if (successRate < 80 || cancelled > 0) {
                      colorCls = "bg-amber-50 border-amber-150 text-amber-750";
                      noteLabel = "Medium Return Risk (মধ্যম রিস্ক)";
                      adviceMsg = "Some returned dispatches detected. Contact recipient to verify details prior to booking.";
                    }
                  } else {
                    noteLabel = "New Customer";
                    adviceMsg = "Phone number has not placed previous Steadfast orders. Standard dispatch safe.";
                    colorCls = "bg-slate-50 border-slate-150 text-slate-500";
                  }
                  
                  return (
                    <>
                      {fraudHistory.is_sandbox && (
                        <div className="bg-amber-50/90 border border-amber-200 text-amber-900 p-3 rounded-2xl text-[11px] leading-relaxed space-y-1">
                          <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                            ⚠️ স্টেইডফাস্ট এপিআই সমস্যা (API Limit / Connection Alert)
                          </p>
                          <p className="font-semibold text-amber-700 bg-amber-100/50 p-1.5 rounded-lg text-[10px] font-mono break-words">
                            {fraudHistory.sandbox_reason || "Steadfast API searching limits reached or key mismatched."}
                          </p>
                          <p className="text-[10px] text-amber-600 font-sans">
                            * আপনার এপিআই কোটা লিমিট শেষ বা ভুল হবার কারনে রিয়েল ডাটা পাওয়া যায়নি, তাই নিচে সাময়িক ডেমো/স্যান্ডবক্স এনালাইসিস দেখানো হচ্ছে।
                          </p>
                        </div>
                      )}

                      {fraudHistory.used_account && (
                        <div className="text-[10px] text-slate-500 font-mono text-center select-none bg-slate-100 py-1.5 px-2.5 rounded-xl border border-slate-200">
                          🔍 চেক করা হয়েছে: <span className="font-bold text-slate-700">{fraudHistory.used_account}</span>
                        </div>
                      )}

                      <div className={`p-2.5 rounded-2xl text-center font-bold text-[11px] border uppercase tracking-wider ${colorCls}`}>
                        {noteLabel}
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase">Parcels</span>
                          <span className="text-base font-mono font-black text-slate-900 block mt-0.5">{total}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <span className="text-[9px] text-emerald-505 font-extrabold block uppercase">Delivered</span>
                          <span className="text-base font-mono font-black text-emerald-600 block mt-0.5">{success}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <span className="text-[9px] text-rose-505 font-extrabold block uppercase">Returned</span>
                          <span className="text-base font-mono font-black text-rose-600 block mt-0.5">{cancelled}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-2xl leading-relaxed">
                        ✏️ <strong>diagnostic:</strong> {adviceMsg}
                      </p>
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={triggerFraudCheck}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-150 rounded-xl text-slate-700 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Re-scan Core Database
                </button>
              </div>
            ) : (
              <div className="space-y-3 pb-1">
                <p className="text-xs text-slate-500 leading-normal">Ensure delivery safety by scanning the recipient's shipping profile rate.</p>
                <button
                  type="button"
                  onClick={triggerFraudCheck}
                  className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-600 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4" /> Scan Recipient Phone
                </button>
              </div>
            )}
          </div>

          {/* Steadfast Courier Booking Hub */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-505" /> Steadfast Courier Agent
            </span>

            {order.steadfast?.is_sent ? (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2.5xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-indigo-550 font-extrabold block uppercase tracking-wider">Consignment Number</span>
                    <span className="text-xs font-mono font-bold text-slate-900 block mt-1">{order.steadfast.consignment_id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyConsignment(order.steadfast.consignment_id)}
                    className="p-1 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-205 rounded-xl cursor-pointer text-[10px]"
                  >
                    {copied ? 'Copied!' : 'Copy ID'}
                  </button>
                </div>

                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Invoice Reference:</span>
                    <span className="font-mono text-slate-800 font-semibold">{order.steadfast.invoice || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium font-sans">Collect Price (COD):</span>
                    <span className="font-extrabold text-slate-900 font-mono">৳{order.steadfast.cod_amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Delivery Status:</span>
                    <span className="font-black text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-lg text-[10px] border border-indigo-100">
                      {order.steadfast.delivery_status || 'In Transit'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSyncCourierStatus}
                    disabled={isSyncingSteadfast}
                    className="flex-1 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncingSteadfast ? 'animate-spin' : ''}`} />
                    Sync Status
                  </button>
                  {order.steadfast.tracking_url && (
                    <a
                      href={order.steadfast.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Track Live
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-sans">
                <p className="text-xs text-slate-500 leading-normal">
                  Order hasn't been booked inside the agent database yet. Book instant dispatch consolidated parcel packages.
                </p>

                {currentUserRole === 'moderator' ? (
                  <div className="p-3 bg-amber-50 text-[10px] text-amber-800 border border-amber-100 rounded-xl leading-normal">
                    🔒 Moderators are locked from placing automated Steadfast Courier shipping orders.
                  </div>
                ) : (
                  <>
                    {!isDispatchOpen ? (
                      <button
                        type="button"
                        onClick={() => setIsDispatchOpen(true)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all"
                      >
                        <Truck className="w-4 h-4" /> Book Steadfast Shipment
                      </button>
                    ) : (
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-130 pb-2">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase">Book Dispatch Panel</span>
                          <button onClick={() => setIsDispatchOpen(false)} className="text-[10px] text-slate-505 underline font-bold">Cancel</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-455 block mb-1">COD Amount (BDT)</label>
                            <input
                              type="text"
                              value={codAmountInput}
                              onChange={(e) => setCodAmountInput(e.target.value)}
                              className="w-full bg-white border border-slate-205 text-slate-800 rounded-xl px-2 py-1.5 text-xs font-bold font-mono outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-455 block mb-1">Parcel Qty</label>
                            <input
                              type="text"
                              value={parcelQtyInput}
                              onChange={(e) => setParcelQtyInput(e.target.value)}
                              className="w-full bg-white border border-slate-205 text-slate-800 rounded-xl px-2 py-1.5 text-xs font-bold font-mono outline-none"
                            />
                          </div>
                        </div>

                        <button
                          disabled={isDispatching}
                          onClick={handleDispatch}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          Confirm Shipping Consignment
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* WooCommerce and Systems notes */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
              WooCommerce Audit Notes & Logs
            </span>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-[10px] text-slate-400 py-4 border border-dashed border-slate-150 text-center rounded-2xl">No system logs or annotation entries listed.</p>
              ) : (
                notes.map((note) => {
                  const isSystem = note.author === 'system';
                  return (
                    <div key={note.id} className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                      isSystem ? 'bg-slate-50 border-slate-100 text-slate-555' : 'bg-blue-50/50 border-blue-105 text-blue-800'
                    }`}>
                      <div className="flex justify-between items-center text-[9px] font-extrabold mb-1 uppercase text-slate-405 font-mono">
                        <span>{note.author}</span>
                        <span>{formatHourOfDate(note.date_created)}</span>
                      </div>
                      <p className="font-semibold text-slate-800 font-sans">{note.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Write private annotation note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !newNoteContent.trim()}
                className="px-4 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 select-none flex items-center justify-center transition-colors hover:bg-slate-800"
              >
                +
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0a0a0a] rounded-2xl w-full max-w-4xl shadow-2xl border border-white/10 grid grid-cols-1 lg:grid-cols-12 overflow-hidden my-8" id="order-details-modal-window">
        {/* Left Side: Order properties and Line items (Col 7) */}
        <div className="p-6 lg:p-7 lg:col-span-7 space-y-6 border-r border-white/5 max-h-[85vh] overflow-y-auto w-full">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-display font-semibold text-white">Order #{order.id}</h3>
                {order._is_moderator_order === 'yes' && (
                  <span className="text-[9px] bg-amber-955/20 text-amber-400 border border-amber-500/25 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider font-mono">
                    Moderator Draft
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Received via WooCommerce HPOS API matching system.</p>
            </div>
            {/* Quick close button in grid layout */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-full cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer shipping details panel */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" /> Receiver Contact Details
              </span>
              {!isModerator && (
                <button
                  type="button"
                  onClick={() => setIsEditingBilling(!isEditingBilling)}
                  className="text-xs text-cyan-450 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer select-none"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingBilling ? 'Cancel' : 'Edit Contact'}
                </button>
              )}
            </div>

            {isEditingBilling ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name</label>
                    <input
                      type="text"
                      value={billingForm.first_name}
                      onChange={(e) => setBillingForm({ ...billingForm, first_name: e.target.value })}
                      className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name</label>
                    <input
                      type="text"
                      value={billingForm.last_name}
                      onChange={(e) => setBillingForm({ ...billingForm, last_name: e.target.value })}
                      className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Customer Phone</label>
                  <input
                    type="text"
                    value={billingForm.phone}
                    onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                    className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Address Line 1</label>
                    <input
                      type="text"
                      value={billingForm.address_1}
                      onChange={(e) => setBillingForm({ ...billingForm, address_1: e.target.value })}
                      className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                    <input
                      type="text"
                      value={billingForm.city}
                      onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                      className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBillingSave}
                  className="w-full py-1.5 bg-cyan-600 hover:bg-[#22d3ee] text-black font-semibold rounded-lg text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Contact Address
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium font-sans">Full Name:</span>
                  <span className="font-semibold text-white">{order.billing?.first_name} {order.billing?.last_name || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Customer Phone:</span>
                  <span className="font-bold text-white font-mono">{order.billing?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-400 font-medium">Full Address:</span>
                  <span className="font-bold text-gray-300 text-right leading-relaxed max-w-[240px] block">
                    {order.billing?.address_1}, {order.billing?.city}
                  </span>
                </div>
                {order.customer_note && (
                  <div className="bg-[#1a1a1a]/40 border border-white/5 rounded-lg p-2.5 text-[10px] text-amber-300 leading-normal">
                    <strong>Buyer Note:</strong> {order.customer_note}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order line items inventory matches */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ordered Product Cart</h4>
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-2xl bg-[#111111] divide-y divide-white/5">
              {order.line_items.map((it, i) => (
                <div key={i} className="p-3.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-white block">{it.name} {i === 0 && order.steadfast?.delivery_status ? <span className="text-[10px] text-cyan-400 font-mono ml-2">[{order.steadfast.delivery_status}]</span> : ''}</span>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5 font-mono">
                      <span>SKU ID: PV-ID-{it.product_id}</span>
                      {it.variation_id && (
                        <>
                           <span className="text-white/10">|</span>
                          <span className="font-semibold text-cyan-400 bg-cyan-950/20 px-1 border border-cyan-500/20 rounded">
                            Variation: {it.variation_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-semibold text-gray-400 block">{it.quantity} × ৳{it.price.toLocaleString()}</span>
                    <span className="font-bold text-white text-[11px] mt-0.5 block">৳{(it.quantity * it.price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="p-3.5 bg-black/45 flex justify-between items-center text-xs border-t border-white/5">
                <span className="font-medium text-gray-400">Order Subtotal (BDT)</span>
                <span className="font-display font-semibold text-white text-sm font-mono">৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Order notes audit tracking card list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-500" /> WooCommerce Notes & Operations Logs</h4>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-[10px] text-gray-455 border border-dashed border-white/10 py-4 text-center rounded-xl bg-white/2">No administrative audit notes posted yet.</p>
              ) : (
                notes.map((note) => {
                  const isSystem = note.author === 'system';
                  return (
                    <div key={note.id} className={`p-2.5 rounded-xl border text-[10.5px] leading-relaxed ${
                      isSystem ? 'bg-white/2 border-white/5 text-gray-400' : 'bg-cyan-955/20 border-cyan-500/25 text-gray-300'
                    }`}>
                      <div className="flex justify-between items-center text-[9px] mb-1">
                        <span className="font-bold text-gray-500 uppercase">{note.author}</span>
                        <span className="text-gray-505">{new Date(note.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-medium">{note.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Write private order annotation..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 text-xs px-3 py-2 rounded-xl border border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !newNoteContent.trim()}
                className="px-3.5 py-2 bg-white/10 border border-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 select-none transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Note
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Status Adjustments */}
        <div className="p-6 lg:p-7 bg-[#0d0d0d] lg:col-span-5 flex flex-col justify-between max-h-[85vh] overflow-y-auto w-full">
          <div className="space-y-6">
            <div className="hidden lg:flex justify-end select-none">
              <button
                onClick={onClose}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg cursor-pointer border border-white/10"
                title="Exit single viewport"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Steadfast Courier Tracking & Booking */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-violet-400" /> Steadfast Courier Hub
              </h4>
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 space-y-3">
                {order.steadfast?.is_sent ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-violet-950/10 border border-violet-500/20 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block">Consignment ID</span>
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                          {order.steadfast.consignment_id}
                          <button
                            onClick={() => handleCopyConsignment(order.steadfast.consignment_id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-450 hover:text-white transition-all cursor-pointer"
                          >
                            {copied ? <span className="text-[9px] text-emerald-400">Copied</span> : <span className="text-[10px] text-gray-400 underline">Copy</span>}
                          </button>
                        </span>
                      </div>
                      <span className="text-[9.5px] bg-violet-500/10 text-violet-300 border border-violet-500/25 px-2 py-0.5 rounded-full font-bold select-none">
                        Booked
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px] border-b border-white/5 pb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Invoice:</span>
                        <span className="font-mono text-gray-200">{order.steadfast.invoice || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">COD Amount:</span>
                        <span className="font-semibold text-emerald-400">৳{order.steadfast.cod_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Delivery Status:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                          order.steadfast.delivery_status === 'Delivered'
                            ? 'bg-[#064e3b]/30 text-emerald-400 border border-emerald-500/25'
                            : order.steadfast.delivery_status?.toLowerCase().includes('cancel') || order.steadfast.delivery_status?.toLowerCase().includes('return')
                            ? 'bg-rose-955/35 text-rose-455 border border-rose-500/25'
                            : 'bg-blue-955/30 text-blue-400 border border-blue-400/25'
                        }`}>
                          {order.steadfast.delivery_status || 'In-Transit'}
                        </span>
                      </div>
                      {fraudHistory && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-gray-400">Status Breakdown:</span>
                          <div className="flex gap-2">
                            <span className="text-emerald-400 font-bold">{fraudHistory.successful_deliveries} Delivered</span>
                            <span className="text-rose-455 font-bold">{fraudHistory.cancelled_deliveries} Cancelled</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSyncCourierStatus}
                        disabled={isSyncingSteadfast}
                        className="flex-1 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold cursor-pointer select-none transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3 h-3 text-gray-400 ${isSyncingSteadfast ? 'animate-spin' : ''}`} />
                        {isSyncingSteadfast ? 'Syncing...' : 'Sync Status'}
                      </button>

                      {order.steadfast.tracking_url && (
                        <a
                          href={order.steadfast.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 bg-violet-900/40 hover:bg-violet-805/40 border border-[#818cf8]/35 text-[#818cf8] rounded-xl text-xs font-semibold select-none flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-405 leading-normal">
                      This order has not been dispatched to Steadfast Courier yet. You can book a consignment instantly.
                    </p>

                    {currentUserRole === 'moderator' ? (
                      <div className="p-3 bg-white/2 border border-white/10 rounded-xl text-[10.5px] text-gray-455 leading-normal">
                        🔒 Moderators do not have permission to execute dispatches to Steadfast Courier service.
                      </div>
                    ) : (
                      <>
                        {!isDispatchOpen ? (
                          <button
                            onClick={() => setIsDispatchOpen(true)}
                            className="w-full py-2 bg-violet-650 hover:bg-violet-600 border border-violet-700/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 select-none cursor-pointer transition-all"
                          >
                            <Truck className="w-4 h-4" /> Book Steadfast Dispatch
                          </button>
                        ) : (
                          <div className="space-y-3 bg-[#161616] p-3 rounded-xl border border-white/5 pt-2.5">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                              <span className="text-[11px] font-bold text-violet-300">New Consignment Form</span>
                              <button
                                onClick={() => setIsDispatchOpen(false)}
                                className="text-[10px] text-gray-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-gray-500 block mb-1">COD Amount (BDT)</label>
                                <input
                                  type="text"
                                  value={codAmountInput}
                                  onChange={(e) => setCodAmountInput(e.target.value)}
                                  className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-violet-500/50"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-gray-500 block mb-1">Parcels Qty</label>
                                <input
                                  type="text"
                                  value={parcelQtyInput}
                                  onChange={(e) => setParcelQtyInput(e.target.value)}
                                  className="w-full bg-[#111111] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-violet-500/50"
                                />
                              </div>
                            </div>

                            <button
                              disabled={isDispatching}
                              onClick={handleDispatch}
                              className="w-full py-2 bg-violet-600 hover:bg-[#818cf8] text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                              {isDispatching ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>Booking Parcel...</span>
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3.5 h-3.5" /> Book Consolidated Parcel
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Receiver Fraud Screening Audit */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Receiver Fraud Screening
              </h4>
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 space-y-3">
                {isCheckingFraud ? (
                  <div className="flex items-center justify-center py-4 space-x-2">
                    <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs text-gray-400 font-mono">Running Steadfast API Client Audit...</span>
                  </div>
                ) : fraudHistory ? (
                  <div className="space-y-3">
                    {(() => {
                      const total = fraudHistory.total_parcels || 0;
                      const cancelled = fraudHistory.cancelled_deliveries || 0;
                      const success = fraudHistory.successful_deliveries || 0;
                      const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
                      
                      let badgeCls = "bg-[#064e3b]/30 text-emerald-400 border border-emerald-500/25";
                      let badgeLabel = "Trusted Customer (ভালো কাস্টমার)";
                      let advice = "Perfect track record on Steadfast database registries. Very safe to dispatch.";
                      
                      if (total > 0) {
                        if (successRate < 60 || cancelled > 2) {
                          badgeCls = "bg-rose-950/30 text-rose-400 border border-rose-500/25";
                          badgeLabel = "High Risk of Return (উচ্চ রিস্ক)";
                          advice = "High cancellation/return frequency detected from this phone contact! Proceed with caution or pre-deposit request.";
                        } else if (successRate < 80 || cancelled > 0) {
                          badgeCls = "bg-amber-955/35 text-amber-400 border border-amber-500/25";
                          badgeLabel = "Medium Return Risk (মধ্যম রিস্ক)";
                          advice = "Some cancelled items found. Call buyer to verify address double check before booking.";
                        }
                      } else {
                        badgeLabel = "No Previous History";
                        advice = "No previous parcel history registered in Steadfast Database client index.";
                        badgeCls = "bg-[#18181b] text-gray-450 border border-white/5";
                      }
                      
                      return (
                        <>
                          {fraudHistory.is_sandbox && (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3 rounded-xl text-[10px] leading-relaxed space-y-1">
                              <p className="font-bold flex items-center gap-1.5 text-amber-400">
                                ⚠️ স্টেইডফাস্ট এপিআই সমস্যা (API Limit / Credentials Issue)
                              </p>
                              <p className="font-semibold text-amber-300 bg-black/30 p-1.5 rounded-lg text-[10px] font-mono break-words">
                                {fraudHistory.sandbox_reason || "Steadfast API searching limits reached or key mismatched."}
                              </p>
                              <p className="text-[9.5px] text-amber-400/80 font-sans">
                                * এপিআই লিমিট শেষ বা ভুল হবার কারনে রিয়েল ডাটা পাওয়া যায়নি, তাই নিচে সাময়িক ডেমো/স্যান্ডবক্স এনালাইসিস দেখানো হচ্ছে।
                              </p>
                            </div>
                          )}

                          {fraudHistory.used_account && (
                            <div className="text-[10px] text-gray-400 font-mono text-center select-none bg-[#1c1c1e] py-1.5 px-2.5 rounded-xl border border-white/5">
                              🔍 চেক করা হয়েছে: <span className="font-bold text-gray-300">{fraudHistory.used_account}</span>
                            </div>
                          )}

                          <div className={`p-2.5 rounded-xl text-center font-bold text-[11px] select-none uppercase tracking-wide ${badgeCls}`}>
                            {badgeLabel}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#161616] p-2 rounded-xl border border-white/5">
                              <span className="text-[9px] text-gray-500 font-semibold block uppercase">Total</span>
                              <span className="text-sm font-mono font-bold text-white mt-0.5 block">{total}</span>
                            </div>
                            <div className="bg-[#161616] p-2 rounded-xl border border-white/5">
                              <span className="text-[9px] text-emerald-500 font-semibold block uppercase">Delivered</span>
                              <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">{success}</span>
                            </div>
                            <div className="bg-[#161616] p-2 rounded-xl border border-white/5">
                              <span className="text-[9px] text-rose-550 font-semibold block uppercase">Cancelled</span>
                              <span className="text-sm font-mono font-bold text-rose-450 mt-0.5 block">{cancelled}</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-gray-400 leading-relaxed bg-white/2 p-2.5 rounded-xl border border-white/5">
                            <strong>Diagnostic evaluation:</strong> {advice}
                          </div>
                        </>
                      );
                    })()}

                    <button
                      onClick={triggerFraudCheck}
                      className="w-full py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold select-none flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3 h-3 text-gray-400" /> Re-scan Database Registry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Scan matching registers on Steadfast courier index to identify previous buyer returns & delivery rates.
                    </p>
                    <button
                      onClick={triggerFraudCheck}
                      className="w-full py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 select-none cursor-pointer transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" /> Scan Receiver Phone Activity
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status settings section */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-500" /> Operational Status Flow</h4>
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Current WooCommerce Status Indicator</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-block border text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      order.status === 'completed'
                        ? 'bg-emerald-955/20 border-emerald-500/25 text-emerald-400'
                        : order.status === 'processing'
                        ? 'bg-blue-955/20 border-blue-500/25 text-blue-400'
                        : order.status === 'pending'
                        ? 'bg-amber-955/20 border-amber-500/25 text-amber-400'
                        : order.status === 'cancelled'
                        ? 'bg-rose-955/20 border-rose-500/25 text-rose-450'
                        : 'bg-indigo-955/20 border-indigo-500/25 text-indigo-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 block">Modify Status Flow</label>
                  {isModerator ? (
                    <div className="mt-1.5 p-3 rounded-xl border border-white/10 bg-white/2 text-[10.5px] text-gray-455 leading-normal">
                      🔒 Status actions are locks. Your Moderator access does not authorize status adjustments.
                    </div>
                  ) : (
                    <div className="relative mt-1.5">
                      <select
                        disabled={isUpdatingStatus}
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                        className="w-full bg-[#161616] hover:bg-[#202020] cursor-pointer border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold select-none outline-none"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {isUpdatingStatus && (
                        <div className="absolute right-3 top-2.5">
                          <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-gray-550 text-center font-mono mt-6 border-t border-white/5 pt-3">
            Direct Access ID: PV - {orderId}
          </div>
        </div>
      </div>
    </div>
  );
}
