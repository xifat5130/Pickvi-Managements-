/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ArrowRight, User, Phone, MapPin, Copy, FileText, ShoppingCart, HelpCircle } from 'lucide-react';

interface ParsedBilling {
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  city: string;
}

interface ParsedItem {
  product_id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  variation_id?: number;
  variation_name?: string;
}

interface ParsedResult {
  billing: ParsedBilling;
  items: ParsedItem[];
  customer_note?: string;
}

interface Props {
  onDraftGenerated: (billing: ParsedBilling, items: ParsedItem[], note: string) => void;
  token: string | null;
}

const SAMPLE_TEXTS = [
  {
    label: "Polo Shirt Order",
    text: `কাস্টমার নাম: তানভীর হাসান
ফোন নং: 01711223344
ঠিকানা: হাউজ ১২, রোড ৪, সেক্টর ১০, উত্তরা, ঢাকা
আইটেম: Premium Cotton Polo Shirt ২ টা লাল রঙের, সাইজ L লাগবে ভাই, একটু তাড়াতাড়ি দিয়েন।`
  },
  {
    label: "Chinos & Belt Bundle",
    text: `Name: Rifat Chowdury
Mobile: 01987654321
Shipping Location: Concord Tower, Flat 4C, Narayanganj
I want 1 Slim-Fit Chinos pants size 34 in charcoal and 1 Premium leather belt. Delivery after 4 PM please.`
  }
];

export default function OrderParser({ onDraftGenerated, token }: Props) {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/gemini/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ rawText })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse order text.');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gemini core parsing connection error.');
    } finally {
      setIsParsing(false);
    }
  };

  const applyDraft = () => {
    if (!result) return;
    onDraftGenerated(result.billing, result.items, result.customer_note || '');
    // clear parser
    setResult(null);
    setRawText('');
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-xl overflow-hidden" id="order-parser-panel">
      <div className="bg-black/30 px-5 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-violet-955/40 rounded-lg text-violet-400 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-white">AI Quick Address & Order Parser</h3>
            <p className="text-[10px] text-gray-400">Convert unstructured inbox chats directly into structured customer details</p>
          </div>
        </div>
        <span className="text-[10px] bg-violet-955/20 text-violet-300 font-mono px-2 py-0.5 rounded border border-violet-500/20">
          Gemini 3.5 Active
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input block */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <label className="font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-gray-500" /> Paste Customer Text</label>
            <div className="flex space-x-1">
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setRawText(sample.text)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 hover:text-white text-[10px] text-gray-400 rounded border border-white/10 transition-all cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Type or paste invoice message, address block, contact name, size, phone number here..."
            className="w-full h-36 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white resize-none font-sans focus:bg-white/10 focus:border-cyan-500/50 duration-150"
          />

          <button
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="w-full cursor-pointer py-2 px-4 bg-cyan-600 border border-cyan-700/20 hover:bg-cyan-550 text-black hover:bg-[#22d3ee] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all duration-150"
          >
            {isParsing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing parsing matrices with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Parse Address & Build Draft</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-955/20 border border-rose-500/20 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Output Preview block */}
        <div className="border border-dashed border-white/10 rounded-xl bg-[#0d0d0d] p-4 flex flex-col justify-between">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <div className="p-3 bg-white/5 rounded-full text-gray-500 mb-2.5">
                <BrainCircuit className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-xs font-semibold text-gray-300">Structured Data Engine Pending</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[280px]">Paste a text block on the left and invoke the parsing action to map results via deep inference.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Extracted Cart Details
                  </span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/20 font-medium px-1.5 py-0.5 rounded border border-cyan-500/20">
                    Success
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-start gap-1.5 shadow-md">
                    <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-gray-405 block uppercase tracking-wider">Receiver Name</span>
                      <span className="font-medium text-white">{result.billing.first_name} {result.billing.last_name}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-start gap-1.5 shadow-md">
                    <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-gray-405 block uppercase tracking-wider">Mobile Number</span>
                      <span className="font-medium text-white font-mono">{result.billing.phone}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-2 col-span-2 flex items-start gap-1.5 shadow-md">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="w-full">
                      <span className="text-[9px] text-gray-405 block uppercase tracking-wider">Delivery Address</span>
                      <span className="font-medium text-white text-xs block leading-tight">{result.billing.address_1}</span>
                      <span className="inline-block mt-1 text-[9px] text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-1 py-0.2 rounded font-medium">City: {result.billing.city}</span>
                    </div>
                  </div>
                </div>

                {/* Items preview mapping */}
                <div className="space-y-1.5 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <div className="text-[9px] font-bold text-gray-455 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-gray-500" /> Extracted Cart Line Items:
                  </div>
                  {result.items.length === 0 ? (
                    <p className="text-[10px] text-gray-400">No matching product identified. You can manually selection.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {result.items.map((item, id) => (
                        <div key={id} className="py-1 text-[11px] flex justify-between items-center">
                          <div className="font-medium text-gray-300">
                            {item.name}
                            {item.variation_name ? (
                              <span className="text-[9px] text-gray-450 ml-1 bg-white/5 px-1 py-0.2 border border-white/10 rounded font-mono">
                                {item.variation_name}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {item.quantity} шт × ৳{item.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {result.customer_note && (
                  <div className="text-[10px] text-amber-300 bg-amber-955/20 border border-amber-500/20 rounded-lg p-2 flex items-start gap-1 leading-normal">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <strong>Note:</strong> {result.customer_note}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={applyDraft}
                className="w-full mt-2 py-2 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] cursor-pointer text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 transform hover:-translate-y-0.5"
              >
                <span>Populate checkout draft cart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple placeholder icon wrapper for BrainCircuit as it may not exist in some lucide configs
function BrainCircuit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M19 12h3" />
      <path d="M2 12h3" />
      <path d="M17.657 17.657l-2.121-2.121" />
      <path d="M8.464 8.464L6.343 6.343" />
      <path d="M17.657 6.343l-2.121 2.121" />
      <path d="M8.464 15.657l-2.121 2.121" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
