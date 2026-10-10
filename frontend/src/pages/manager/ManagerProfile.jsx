import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Save, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  FileCheck2,
  RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api.service';

const ALL_AMENITIES = [
  'Dolby Atmos Sound',
  '4K Laser Projection',
  'IMAX 3D Immersive',
  'Plush Recliner Seating',
  'Wheelchair Accessible',
  'Gourmet Food & Beverages',
  'Valet Parking',
  'Children Play Zone',
  'High-Speed Wi-Fi',
  'Online Concession Pickup'
];

export const ManagerProfile = () => {
  const { theatre, refreshTheatre } = useOutletContext();
  const [formData, setFormData] = useState({
    name: '',
    legalEntityName: '',
    gstNumber: '',
    contactPhone: '',
    contactEmail: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    amenities: []
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (theatre) {
      setFormData({
        name: theatre.name || '',
        legalEntityName: theatre.legalEntityName || '',
        gstNumber: theatre.gstNumber || '',
        contactPhone: theatre.contactPhone || '',
        contactEmail: theatre.contactEmail || '',
        addressLine: theatre.addressLine || '',
        city: theatre.city || '',
        state: theatre.state || '',
        postalCode: theatre.postalCode || '',
        amenities: Array.isArray(theatre.amenities) ? theatre.amenities : []
      });
    }
  }, [theatre]);

  const handleToggleAmenity = (amenity) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      const updated = exists ? prev.amenities.filter(a => a !== amenity) : [...prev.amenities, amenity];
      return { ...prev, amenities: updated };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    setSaving(true);

    try {
      await api.updateMyTheatre(formData);
      setSaveSuccess(true);
      await refreshTheatre();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update theatre details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Building2 className="text-yellow-400" /> Cinema Profile & KYC Details
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Manage your theatre's public venue profile, amenities, contact information, and verification status.
        </p>
      </div>

      {/* KYC / Onboarding Status Card */}
      <div className="p-6 rounded-2xl bg-[#101216] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Verification & KYC Status
            </span>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              {theatre?.status === 'ACTIVE' || theatre?.status === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  <span>Fully Verified & Active Cinema Partner</span>
                </>
              ) : theatre?.status === 'REJECTED' ? (
                <>
                  <XCircle className="text-red-400" size={20} />
                  <span>Onboarding Application Rejected</span>
                </>
              ) : (
                <>
                  <Clock className="text-amber-400 animate-pulse" size={20} />
                  <span>Pending Admin Review & Document Verification</span>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-neutral-400">
            Partner ID: <span className="font-mono text-white font-bold">{theatre?.id?.slice(0, 8)}...</span>
          </div>
        </div>

        {theatre?.rejectionReason && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            <strong>Rejection Reason:</strong> {theatre.rejectionReason}
          </div>
        )}

        {/* Documents Checklist */}
        <div>
          <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
            Onboarding Verification Checklist
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <FileCheck2 size={18} className="text-yellow-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Trade License</div>
                <div className="text-neutral-500 text-[11px]">Submitted for review</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <FileCheck2 size={18} className="text-yellow-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Fire Safety NOC</div>
                <div className="text-neutral-500 text-[11px]">Compliance checked</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <FileCheck2 size={18} className="text-yellow-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">GSTIN Certificate</div>
                <div className="text-neutral-500 text-[11px]">Verified identity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-[#101216] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Theatre profile updated successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{saveError}</span>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-white/5 pb-2">
            Venue & Entity Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Theatre / Cinema Name <span className="text-yellow-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={formData.legalEntityName}
                onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                GSTIN / Tax Registration Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Location & Address */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h2 className="text-base font-bold text-white border-b border-white/5 pb-2">
            Location & Physical Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Address Line <span className="text-yellow-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                City <span className="text-yellow-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                State <span className="text-yellow-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Cinema Amenities */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div>
            <h2 className="text-base font-bold text-white">Cinema Amenities & Features</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select the premium features available at your cinema to display on public movie listings.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {ALL_AMENITIES.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleToggleAmenity(amenity)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                      : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="truncate">{amenity}</span>
                  {isSelected && <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition shadow-lg shadow-yellow-500/20 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving Changes...' : 'Save Venue Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
