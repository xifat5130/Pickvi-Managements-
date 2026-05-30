/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, OrderItem } from '../types';
import { X, Search, Plus, ShoppingCart, Trash2, User, Phone, MapPin, Calculator, ClipboardCheck, ArrowRight } from 'lucide-react';

interface Props {
  token: string | null;
  currentUserRole: string;
  onClose: () => void;
  onOrderCreated: (id: number) => void;
  initialBillingDraft?: any;
  initialItemsDraft?: any[];
  initialNoteDraft?: string;
  isMobile?: boolean;
}

export default function CreateOrderModal({
  token,
  currentUserRole,
  onClose,
  onOrderCreated,
  initialBillingDraft,
  initialItemsDraft,
  initialNoteDraft,
  isMobile = false,
}: Props) {
  // Catalog states
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Computed filtered list
  const filteredProducts = products.filter((item) => {
    const q = catalogSearch.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(q);
    const skuMatch = item.sku ? item.sku.toLowerCase().includes(q) : false;
    const idMatch = String(item.id).includes(q);
    
    // Also support variation search
    const varMatch = item.variations 
      ? item.variations.some(v => v.name.toLowerCase().includes(q))
      : false;

    return nameMatch || skuMatch || idMatch || varMatch;
  });

  const mobileFilteredProducts = catalogSearch.trim() === '' ? [] : filteredProducts.slice(0, 5);

  // Cart building state
  const [cart, setCart] = useState<{
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    variation_id?: number;
    variation_name?: string;
  }[]>([]);

  // Customer Contact Fields
  const [billingForm, setBillingForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address_1: '',
    city: 'Dhaka', // Default to capital city
  });

  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load catalog of products
  const fetchProducts = async () => {
    setIsLoadingCatalog(true);
    try {
      const response = await fetch('/api/products', {
        headers: { Authorization: token || '' },
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hook initial drafts pushed from AI Parser
  useEffect(() => {
    if (initialBillingDraft) {
      setBillingForm({
        first_name: initialBillingDraft.first_name || '',
        last_name: initialBillingDraft.last_name || '',
        phone: initialBillingDraft.phone || '',
        address_1: initialBillingDraft.address_1 || '',
        city: initialBillingDraft.city || 'Dhaka',
      });
    }
    if (initialItemsDraft && initialItemsDraft.length > 0) {
      const mapped = initialItemsDraft.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variation_id: item.variation_id,
        variation_name: item.variation_name,
      }));
      setCart(mapped);
    }
    if (initialNoteDraft) {
      setCustomerNote(initialNoteDraft);
    }
  }, [initialBillingDraft, initialItemsDraft, initialNoteDraft]);

  // Cart operations
  const addToCart = (product: Product, variation?: any) => {
    const finalPrice = variation ? variation.price : product.price;
    const finalVarId = variation ? variation.id : undefined;
    const finalVarName = variation ? variation.name : undefined;

    // Check if duplicate line exists to increment qty
    const existIdx = cart.findIndex(
      (item) => item.product_id === product.id && item.variation_id === finalVarId
    );

    if (existIdx > -1) {
      const updated = [...cart];
      updated[existIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price: finalPrice,
          quantity: 1,
          variation_id: finalVarId,
          variation_name: finalVarName,
        },
      ]);
    }
  };

  const updateCartQty = (idx: number, qty: number) => {
    if (qty <= 0) return;
    const updated = [...cart];
    updated[idx].quantity = qty;
    setCart(updated);
  };

  const removeFromCart = (idx: number) => {
    const updated = cart.filter((_, i) => i !== idx);
    setCart(updated);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg('Your order cart is empty. Pick items from the catalog.');
      return;
    }
    if (!billingForm.first_name || !billingForm.phone || !billingForm.address_1) {
      setErrorMsg('Customer name, active phone number, and delivery block are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({
          billing: billingForm,
          line_items: cart,
          customer_note: customerNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate order record.');
      }

      onOrderCreated(data.order_id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Workflow creation sequence rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] z-50 overflow-y-auto flex flex-col pb-16 font-sans">
        {/* Sticky Mobile Header */}
        <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-20 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Pickvi Mobile Workbench</span>
              <h1 className="font-extrabold text-sm text-slate-900 leading-none">New Dispatch Creation</h1>
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
        <div className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
          
          {/* Store Catalog & Search Section (Merged Search, Active Cart & Results) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase block tracking-wider">
                📦 Store Catalog
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full font-mono">
                Real-Time Search
              </span>
            </div>

            {/* Catalog search bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-medium text-slate-800 outline-none transition-all"
              />
            </div>

            {/* ACTIVE SELECTED ITEMS (CART) - Shown right under the search bar */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-150 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  🛒 Selected Items ({cart.length})
                </span>
                <span className="text-xs font-black font-mono text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  ৳{cartTotal.toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center font-medium">No items selected yet. Search and buy below 👇</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <strong className="text-slate-800 block truncate font-semibold leading-tight">{item.name}</strong>
                        {item.variation_name && (
                          <span className="inline-block text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1 py-0.2 rounded mt-0.5">
                            {item.variation_name}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">৳{item.price}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                         <input
                           type="number"
                           min="1"
                           value={item.quantity}
                           onChange={(e) => updateCartQty(idx, parseInt(e.target.value) || 1)}
                           className="w-10 text-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                         />
                         <button
                           type="button"
                           onClick={() => removeFromCart(idx)}
                           className="p-1.5 text-slate-400 hover:text-red-655 bg-white border border-slate-200 rounded-lg cursor-pointer transition-colors"
                         >
                           <Trash2 className="w-3.5 h-3.5 text-red-550" />
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Products map list */}
            {isLoadingCatalog ? (
              <div className="py-6 flex justify-center items-center">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <div className="space-y-3">
                {mobileFilteredProducts.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-3">
                    {catalogSearch.trim() === '' 
                      ? 'Type a product name to search and add to cart 🔍' 
                      : 'No products found ❌'}
                  </div>
                ) : (
                  mobileFilteredProducts.map((item) => (
                    <div key={item.id} className="p-3 border border-slate-100 bg-slate-50/40 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-start gap-2.5">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-xl shrink-0 border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <strong className="text-xs font-bold text-slate-800 block truncate">{item.name}</strong>
                          <span className="text-[10px] text-slate-455 block mt-0.5 font-bold">৳{item.price} • Stock: {item.stock_quantity ?? 'On Demand'}</span>
                        </div>
                        {!item.variations && (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 active:scale-95"
                          >
                            Buy
                          </button>
                        )}
                      </div>

                      {item.variations && (
                        <div className="bg-white border border-slate-100 rounded-xl p-2 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Variations</span>
                          <div className="divide-y divide-slate-50">
                            {item.variations.map((v) => (
                              <div key={v.id} className="flex justify-between items-center text-[10px] py-1.5 px-1 first:pt-0 last:pb-0">
                                <span className="text-slate-700 font-semibold">{v.name} (৳{v.price})</span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(item, v)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100 active:scale-95 transition-all text-[9px]"
                                >
                                  +Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Delivery form with Slate labels */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <span className="text-xs font-extrabold text-slate-800 block uppercase tracking-wider">
               Customer Delivery Details *
            </span>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Receiver Name"
                    value={billingForm.first_name}
                    onChange={(e) => setBillingForm({ ...billingForm, first_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Surname"
                    value={billingForm.last_name}
                    onChange={(e) => setBillingForm({ ...billingForm, last_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">
                  Active Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 017xxxxxxxx"
                    value={billingForm.phone}
                    onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">
                    Full Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House, Road, Area block..."
                    value={billingForm.address_1}
                    onChange={(e) => setBillingForm({ ...billingForm, address_1: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">
                    City Hub
                  </label>
                  <select
                    value={billingForm.city}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2 py-2.5 text-[10px] font-bold text-slate-800 cursor-pointer outline-none transition-all"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Narayanganj">Narayanganj</option>
                    <option value="Gazipur">Gazipur</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">
                  Private Delivery Instructions (Note)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Deliver before evening"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submitting blocks */}
          <div className="space-y-3">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-655 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 text-xs font-bold rounded-2.5xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 transition-all select-none active:scale-98"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>
                {currentUserRole === 'moderator'
                  ? 'Submit for Approval'
                  : 'Complete Order Dispatch'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200/60 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden my-2 sm:my-6 max-h-[95vh]" id="create-order-workbench-modal">
        {/* Left Side: Product Selector Catalog (Col 5) */}
        <div className="p-4 sm:p-6 lg:col-span-5 border-b border-slate-150 lg:border-b-0 lg:border-r flex flex-col justify-start overflow-y-auto max-h-[45vh] lg:max-h-[95vh]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-slate-800 flex items-center gap-1.5">
                📦 Pickvi Store Catalog
              </h3>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full font-mono">
                Real-Time Stocks
              </span>
            </div>

            {/* Product Search Input Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Product name, SKU or ID..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium placeholder:text-slate-400 outline-none focus:border-slate-500 text-slate-800"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isLoadingCatalog ? (
              <div className="py-12 flex justify-center items-center">
                <svg className="animate-spin h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No products found.
                  </div>
                ) : (
                  filteredProducts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-xl space-y-2.5 transition-colors duration-100"
                    >
                      <div className="flex items-start gap-2.5">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-11 h-11 object-cover rounded-lg shrink-0 border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex-1">
                          <strong className="text-xs font-semibold text-slate-800 block leading-tight">{item.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Price: ৳{item.price} | Stock: {item.stock_quantity}</span>
                        </div>
                        {!item.variations && (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="p-1 px-3 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center shrink-0 cursor-pointer transition-transform duration-100 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Buy
                          </button>
                        )}
                      </div>

                      {item.variations && (
                        <div className="bg-white border border-slate-100 rounded-lg p-1.5 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">Variations</span>
                          <div className="grid grid-cols-1 gap-1">
                            {item.variations.map((v) => (
                              <div key={v.id} className="flex justify-between items-center text-[10px] p-1.5 rounded-md hover:bg-slate-50/70 border border-transparent hover:border-slate-100">
                                <span className="text-slate-700 font-semibold">{v.name} (৳{v.price})</span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(item, v)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold rounded-md cursor-pointer text-[10px]"
                                >
                                  +Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Shipping address and Cart items Builder (Col 7) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:col-span-7 flex flex-col justify-start overflow-y-auto max-h-[50vh] lg:max-h-[95vh]">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-extrabold text-slate-900">New Dispatch</h3>
                  <p className="text-[10px] text-slate-500">Cart & Delivery Details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart building worksheet */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Items ({cart.length})</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1.5 space-y-1.5 max-h-[15vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    Cart stands empty.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-100 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <strong className="text-slate-800 block truncate leading-tight font-medium">{item.name}</strong>
                        {item.variation_name && (
                          <span className="inline-block text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 font-mono px-1 rounded mt-0.5">
                            {item.variation_name}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">৳{item.price}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartQty(idx, parseInt(e.target.value) || 1)}
                          className="w-10 text-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs font-mono font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic total calculations */}
            <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><Calculator className="w-4 h-4" /> Invoice Total:</span>
              <span className="text-lg font-display font-extrabold">৳{cartTotal.toLocaleString()}</span>
            </div>

            {/* Shipping Contact block */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Customer Delivery Details</span>
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Receiver name"
                      value={billingForm.first_name}
                      onChange={(e) => setBillingForm({ ...billingForm, first_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-slate-500 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">Last Name</label>
                    <input
                      type="text"
                      placeholder="Surname"
                      value={billingForm.last_name}
                      onChange={(e) => setBillingForm({ ...billingForm, last_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-slate-500 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">Mobile *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 01712345678"
                      value={billingForm.phone}
                      onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-slate-500 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">City *</label>
                    <select
                      value={billingForm.city}
                      onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                      className="w-full bg-white border border-slate-300 focus:border-slate-500 cursor-pointer rounded-lg px-1 py-1.5 text-[10px] font-semibold text-slate-800"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Narayanganj">Narayanganj</option>
                      <option value="Gazipur">Gazipur</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="House No, Road ID, Sector, Area..."
                    value={billingForm.address_1}
                    onChange={(e) => setBillingForm({ ...billingForm, address_1: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-slate-500 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Delivery instructions..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-slate-500 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {errorMsg && (
              <div className="p-2 mb-2 bg-rose-50 border border-rose-100 text-[10px] text-rose-600 rounded-lg">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>
                {currentUserRole === 'moderator'
                  ? 'Submit for approval'
                  : 'Complete order checkout'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
