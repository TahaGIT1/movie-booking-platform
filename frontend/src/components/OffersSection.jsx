import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OffersSection = () => {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getOffers().then((data) => {
      if (isMounted) {
        setOffers(Array.isArray(data) ? data : []);
      }
    }).catch(() => {
      if (isMounted) setOffers([]);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Promo code ${code} copied to clipboard! Apply during ticket checkout.`);
  };

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
            EXCLUSIVE SAVINGS
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            Cinema Offers & Promotions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Active coupons and discounts currently redeemable.
          </p>
        </div>

        <Link
          to="/offers"
          className="text-xs sm:text-sm font-semibold text-[#f5a623] hover:underline self-start sm:self-auto"
        >
          View All Offers →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {offers.map((offer) => (
          <div
            key={offer.id || offer.code}
            className="p-5 rounded-2xl bg-[#11131c] border border-white/10 hover:border-[#f5a623]/40 transition-all flex flex-col justify-between group shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30">
                  {offer.discountPercentage ? `${offer.discountPercentage}% OFF` : 'PROMO'}
                </span>
                {offer.validUntil && (
                  <span className="text-[10px] text-neutral-400">
                    Valid till {new Date(offer.validUntil).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="text-xl font-heading font-black text-white mb-1.5 group-hover:text-[#f5a623] transition-colors">
                {offer.discountPercentage ? `${offer.discountPercentage}% DISCOUNT` : offer.code}
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                {offer.description || `Use coupon code ${offer.code} at checkout to receive discount.`}
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-300">
                {offer.code}
              </span>
              <button
                onClick={() => copyCode(offer.code)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#f5a623] hover:text-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
