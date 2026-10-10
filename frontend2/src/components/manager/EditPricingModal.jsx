import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Sparkles, 
  Film, 
  Tv2, 
  Clock, 
  Calendar, 
  ArrowUpDown, 
  Percent, 
  Layers, 
  Check,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '../../services/api.service';

export const EditPricingModal = ({ 
  isOpen, 
  onClose, 
  show, 
  movie,
  scheduledShowsCount = 1,
  onSuccess 
}) => {
  if (!isOpen) return null;

  const targetMovie = show?.movie || movie || {};
  const currentPricing = (show && typeof show.baseTierPricing === 'object' && show.baseTierPricing !== null)
    ? show.baseTierPricing
    : { NORMAL: 250, PREMIUM: 380, RECLINER: 550 };

  const [pricing, setPricing] = useState({
    NORMAL: currentPricing.NORMAL || 250,
    PREMIUM: currentPricing.PREMIUM || 380,
    RECLINER: currentPricing.RECLINER || 550
  });

  const [initialPricing] = useState({
    NORMAL: currentPricing.NORMAL || 250,
    PREMIUM: currentPricing.PREMIUM || 380,
    RECLINER: currentPricing.RECLINER || 550
  });

  const [updateScope, setUpdateScope] = useState(show ? 'single' : 'all'); // 'single' | 'all'
  const [visualFormat, setVisualFormat] = useState(show?.visualFormat || 'TWO_D');
  const [languageVersion, setLanguageVersion] = useState(show?.languageVersion || 'English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick Multipliers (+10%, -10%, etc.)
  const applyMultiplier = (factor) => {
    setPricing(prev => ({
      NORMAL: Math.max(0, Math.round(Number(prev.NORMAL) * factor)),
      PREMIUM: Math.max(0, Math.round(Number(prev.PREMIUM) * factor)),
      RECLINER: Math.max(0, Math.round(Number(prev.RECLINER) * factor))
    }));
  };

  // Fixed delta (+50, -50)
  const applyDelta = (delta) => {
    setPricing(prev => ({
      NORMAL: Math.max(0, Number(prev.NORMAL) + delta),
      PREMIUM: Math.max(0, Number(prev.PREMIUM) + delta),
      RECLINER: Math.max(0, Number(prev.RECLINER) + delta)
    }));
  };

  const resetPricing = () => {
    setPricing({ ...initialPricing });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const formattedPricing = {
        NORMAL: Math.max(0, Number(pricing.NORMAL) || 0),
        PREMIUM: Math.max(0, Number(pricing.PREMIUM) || 0),
        RECLINER: Math.max(0, Number(pricing.RECLINER) || 0)
      };

      if (show) {
        // If single show exists, we can call updateShow
        await api.updateShow(show.id, {
          baseTierPricing: formattedPricing,
          languageVersion,
          visualFormat,
          updateAllMovieShows: updateScope === 'all'
        });
      } else if (targetMovie?.id) {
        // Batch update by movie ID
        await api.updateMovieShowsPricing(targetMovie.id, formattedPricing);
      }

      setSuccessMsg('Ticket rates updated successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to update ticket rates');
    } finally {
      setLoading(false);
    }
  };

  const startDate = show?.startTime ? new Date(show.startTime) : null;
  const timeString = startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const dateString = startDate ? startDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' }) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#101216] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-yellow-500/10 relative overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Coins size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Modify Ticket Pricing
              </h3>
              <p className="text-xs text-neutral-400">
                Adjust seat rates for scheduled screenings anytime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Movie & Session Info Card */}
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
          {targetMovie?.posterUrl ? (
            <img
              src={targetMovie.posterUrl}
              alt={targetMovie.title}
              className="w-14 h-20 object-cover rounded-xl shadow-md border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-14 h-20 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
              <Film size={22} />
            </div>
          )}

          <div className="space-y-1 flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
              {show ? (show.screen?.name || `Screen ${show.screen?.screenNumber}`) : 'All Scheduled Screens'}
            </span>
            <h4 className="text-base font-bold text-white truncate">
              {targetMovie?.title || 'Film Session'}
            </h4>
            
            {show ? (
              <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2">
                <span>{dateString}</span>
                <span>•</span>
                <span className="font-mono text-white font-semibold">{timeString}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-neutral-300">
                  {show.visualFormat}
                </span>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                Affects all upcoming scheduled sessions for this title
              </div>
            )}

            {show?._count?.bookings > 0 && (
              <div className="text-[11px] text-amber-400 font-medium pt-0.5">
                Note: {show._count.bookings} existing booking(s) already placed. New pricing will apply to remaining available seats.
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Update Scope Selection (Single vs Movie-wide) */}
          {show && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers size={14} className="text-yellow-400" /> Apply Pricing Changes To:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateScope('single')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    updateScope === 'single'
                      ? 'bg-yellow-500/10 border-yellow-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">This Show Only</span>
                    {updateScope === 'single' && <Check size={14} className="text-yellow-400" />}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Target only the {timeString} slot
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUpdateScope('all')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    updateScope === 'all'
                      ? 'bg-yellow-500/10 border-yellow-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">All Movie Shows</span>
                    {updateScope === 'all' && <Check size={14} className="text-yellow-400" />}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Apply to all shows of this film
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Pricing Tiers Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Tag size={13} className="text-yellow-400" /> Tier Base Pricing (INR ₹)
              </label>

              {/* Quick Multipliers */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyMultiplier(1.1)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/5 transition flex items-center gap-0.5"
                  title="Increase by 10%"
                >
                  <TrendingUp size={10} /> +10%
                </button>
                <button
                  type="button"
                  onClick={() => applyMultiplier(0.9)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-rose-400 border border-white/5 transition flex items-center gap-0.5"
                  title="Discount by 10%"
                >
                  <TrendingDown size={10} /> -10%
                </button>
                <button
                  type="button"
                  onClick={() => applyDelta(50)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 transition"
                  title="Add ₹50 across tiers"
                >
                  +₹50
                </button>
                <button
                  type="button"
                  onClick={resetPricing}
                  className="px-2 py-0.5 rounded text-[10px] font-medium text-neutral-500 hover:text-neutral-300 transition"
                  title="Reset to initial values"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Tier Inputs */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Normal Tier */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">Normal</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Standard</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={pricing.NORMAL}
                    onChange={(e) => setPricing({ ...pricing, NORMAL: e.target.value })}
                    className="w-full bg-[#161920] border border-cyan-500/20 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Premium Tier */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Premium</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Middle</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={pricing.PREMIUM}
                    onChange={(e) => setPricing({ ...pricing, PREMIUM: e.target.value })}
                    className="w-full bg-[#161920] border border-amber-500/20 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Recliner Tier */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Recliner</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Luxury</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={pricing.RECLINER}
                    onChange={(e) => setPricing({ ...pricing, RECLINER: e.target.value })}
                    className="w-full bg-[#161920] border border-purple-500/20 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-400 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <span className="text-[10px] font-semibold text-neutral-400 block">
              Quick Pricing Strategies:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPricing({ NORMAL: 200, PREMIUM: 300, RECLINER: 450 })}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 border border-white/5 transition"
              >
                Weekday Value (₹200/₹300/₹450)
              </button>
              <button
                type="button"
                onClick={() => setPricing({ NORMAL: 280, PREMIUM: 420, RECLINER: 650 })}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 border border-white/5 transition"
              >
                Prime Weekend (₹280/₹420/₹650)
              </button>
              <button
                type="button"
                onClick={() => setPricing({ NORMAL: 350, PREMIUM: 550, RECLINER: 850 })}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-yellow-400 border border-yellow-500/20 transition"
              >
                Blockbuster / IMAX (₹350/₹550/₹850)
              </button>
            </div>
          </div>

          {/* Format Settings (Only for single show) */}
          {show && updateScope === 'single' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Format
                </label>
                <select
                  value={visualFormat}
                  onChange={(e) => setVisualFormat(e.target.value)}
                  className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="TWO_D">2D Standard</option>
                  <option value="THREE_D">3D Stereoscopic</option>
                  <option value="IMAX">IMAX Experience</option>
                  <option value="FOUR_DX">4DX Motion & Effects</option>
                  <option value="SCREEN_X">ScreenX 270° Panoramic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Audio / Language
                </label>
                <input
                  type="text"
                  value={languageVersion}
                  onChange={(e) => setLanguageVersion(e.target.value)}
                  placeholder="e.g. English Atmos, Hindi 7.1"
                  className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-neutral-300 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Saving Rates...</span>
                </>
              ) : (
                <>
                  <Coins size={15} />
                  <span>
                    {updateScope === 'all' ? 'Save Rates for All Shows' : 'Save Show Rates'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
