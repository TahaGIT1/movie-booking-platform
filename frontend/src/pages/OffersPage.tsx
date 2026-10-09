import React, { useState, useEffect } from 'react';
import { offersData } from '../data/offers';
import { api } from '../services/api';
import type { Offer } from '../types';
import { Copy, Check } from 'lucide-react';

export const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>(offersData);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getOffers().then((data) => {
      if (isMounted && data?.length > 0) {
        setOffers(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };


  return (
    <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
          DISCOUNTS & REWARDS
        </span>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
          Exclusive Cinema Deals & Promo Codes
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
          Apply these coupon codes during ticket checkout to enjoy 1-for-1 tickets, student discounts, and concession snack rebates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="flex flex-col justify-between rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/50 transition-all shadow-xl"
          >
            <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
              <img
                src={offer.bannerImage}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#11131c] via-[#11131c]/50 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5a623] text-black">
                  {offer.category}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-2xl font-heading font-black text-[#f5a623] mb-1">
                  {offer.discount}
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2 leading-snug">
                  {offer.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                  {offer.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 block">
                    Promo Code
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {offer.code}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(offer.code)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedCode === offer.code
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/10 hover:bg-[#f5a623] hover:text-black text-white'
                  }`}
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
