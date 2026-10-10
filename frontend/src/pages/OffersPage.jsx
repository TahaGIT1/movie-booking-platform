import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Copy, Check } from 'lucide-react';

export const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getOffers().then((data) => {
      if (isMounted) {
        setOffers(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setOffers([]);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (code) => {
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
          Cinema Deals & Promo Coupons
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
          Apply verified coupon codes during ticket checkout to enjoy discounted movie and concession pricing.
        </p>
      </div>

      {offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id || offer.code}
              className="flex flex-col justify-between rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/50 transition-all shadow-xl p-6"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5a623] text-black">
                    {offer.discountPercentage ? `${offer.discountPercentage}% OFF` : 'COUPON'}
                  </span>
                  {offer.validUntil && (
                    <span className="text-[10px] text-neutral-400">
                      Valid till {new Date(offer.validUntil).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="text-2xl font-heading font-black text-[#f5a623] mb-1">
                  {offer.discountPercentage ? `${offer.discountPercentage}% DISCOUNT` : offer.code}
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2 leading-snug">
                  Coupon {offer.code}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                  {offer.description || `Redeem this coupon code at ticket checkout to apply savings.`}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                    Promo Code
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {offer.code}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(offer.code)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#f5a623] hover:text-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
          ))}
        </div>
      ) : !loading ? (
        <div className="p-12 text-center rounded-2xl bg-[#11131c] border border-white/10">
          <div className="text-3xl mb-3">🏷️</div>
          <h3 className="text-lg font-bold text-white mb-1">No Active Coupons in Database</h3>
          <p className="text-xs text-neutral-400">There are currently no active promotional coupons available.</p>
        </div>
      ) : null}
    </main>
  );
};
