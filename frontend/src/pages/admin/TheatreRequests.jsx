import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  X
} from 'lucide-react';
import { api } from '../../services/api.service';

const REASON_PRESETS = [
  "Invalid or unverifiable GSTIN / Tax ID",
  "Incomplete commercial cinema licensing documentation",
  "Premises address or jurisdiction verification failed",
  "Duplicate registration for an existing theatre venue",
  "Applicant phone number and email are unresponsive"
];

export const TheatreRequests = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTheatre, setDetailTheatre] = useState(null);

  useEffect(() => {
    fetchTheatres();
  }, []);

  const fetchTheatres = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminTheatres();
      setTheatres(data || []);
    } catch (err) {
      console.error('Failed to fetch theatres:', err);
      // Fallback: fetch from public route if token issue
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/theatres');
        const data = await res.json();
        setTheatres(data.data || []);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (theatre, makeActive = false) => {
    setActionLoading(true);
    try {
      const statusToSet = makeActive ? 'ACTIVE' : 'APPROVED';
      await api.approveTheatre(theatre.id, statusToSet);
      
      setFeedbackMessage({
        type: 'success',
        text: `Application for "${theatre.name}" has been ${statusToSet === 'ACTIVE' ? 'activated' : 'approved'}!`
      });
      
      // Update local state immediately
      setTheatres(prev => prev.map(t => 
        t.id === theatre.id ? { ...t, status: statusToSet, rejectionReason: null } : t
      ));
      if (detailTheatre?.id === theatre.id) {
        setDetailTheatre(prev => ({ ...prev, status: statusToSet, rejectionReason: null }));
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to approve application.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const openRejectModal = (theatre) => {
    setSelectedTheatre(theatre);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedTheatre(null);
    setRejectionReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setActionLoading(true);
    try {
      await api.rejectTheatre(selectedTheatre.id, rejectionReason.trim());
      
      setFeedbackMessage({
        type: 'error',
        text: `Application for "${selectedTheatre.name}" was marked as REJECTED.`
      });

      // Update local state immediately
      setTheatres(prev => prev.map(t => 
        t.id === selectedTheatre.id 
          ? { ...t, status: 'REJECTED', rejectionReason: rejectionReason.trim() } 
          : t
      ));
      if (detailTheatre?.id === selectedTheatre.id) {
        setDetailTheatre(prev => ({ ...prev, status: 'REJECTED', rejectionReason: rejectionReason.trim() }));
      }

      closeRejectModal();
    } catch (err) {
      alert('Failed to reject: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Filter calculations
  const pendingCount = theatres.filter(t => t.status === 'PENDING').length;
  const approvedCount = theatres.filter(t => t.status === 'APPROVED' || t.status === 'ACTIVE').length;
  const rejectedCount = theatres.filter(t => t.status === 'REJECTED').length;

  const filteredTheatres = theatres.filter(t => {
    // Tab filter
    if (activeTab === 'PENDING' && t.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && t.status !== 'APPROVED' && t.status !== 'ACTIVE') return false;
    if (activeTab === 'REJECTED' && t.status !== 'REJECTED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchCity = t.city?.toLowerCase().includes(q);
      const matchGst = t.gstNumber?.toLowerCase().includes(q);
      const matchManager = t.users?.some(u => 
        u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
      return matchName || matchCity || matchGst || matchManager;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 size={13} />
            Partner Onboarding & Verification
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Theatre Requests & Approvals</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Review incoming cinema registration applications, verify tax/premises information, and approve or reject.
          </p>
        </div>

        <button
          onClick={fetchTheatres}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Requests
        </button>
      </div>

      {/* Floating Feedback Notification */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-500/15 border-red-500/40 text-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-semibold">{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-neutral-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Applications */}
        <div 
          onClick={() => setActiveTab('ALL')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'ALL' 
              ? 'bg-neutral-800/80 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
              : 'bg-neutral-900/40 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Registered</span>
            <FileText size={16} />
          </div>
          <p className="text-3xl font-black text-white mt-3">{theatres.length}</p>
          <span className="text-[11px] text-neutral-400 mt-1 block">All cinema records in database</span>
        </div>

        {/* Pending Review */}
        <div 
          onClick={() => setActiveTab('PENDING')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'PENDING' 
              ? 'bg-yellow-500/15 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.25)]' 
              : 'bg-neutral-900/40 border-white/10 hover:border-yellow-500/30'
          }`}
        >
          <div className="flex justify-between items-center text-yellow-400 text-xs font-bold uppercase tracking-wider">
            <span>Pending Review</span>
            <Clock size={16} />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-black text-yellow-400">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Awaiting admin review</span>
        </div>

        {/* Approved / Active */}
        <div 
          onClick={() => setActiveTab('APPROVED')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'APPROVED' 
              ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
              : 'bg-neutral-900/40 border-white/10 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex justify-between items-center text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>Approved / Active</span>
            <CheckCircle2 size={16} />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-3">{approvedCount}</p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Verified & live for bookings</span>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => setActiveTab('REJECTED')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'REJECTED' 
              ? 'bg-red-500/15 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
              : 'bg-neutral-900/40 border-white/10 hover:border-red-500/30'
          }`}
        >
          <div className="flex justify-between items-center text-red-400 text-xs font-bold uppercase tracking-wider">
            <span>Rejected</span>
            <XCircle size={16} />
          </div>
          <p className="text-3xl font-black text-red-400 mt-3">{rejectedCount}</p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Applications declined with reasons</span>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-neutral-900/50 p-3 rounded-2xl border border-white/10">
        
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Requests', count: theatres.length },
            { id: 'PENDING', label: 'Pending', count: pendingCount, highlight: true },
            { id: 'APPROVED', label: 'Approved', count: approvedCount },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id 
                  ? 'bg-black/30 text-black' 
                  : tab.highlight && tab.count > 0 
                    ? 'bg-yellow-500/20 text-yellow-400 font-bold' 
                    : 'bg-white/10 text-neutral-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px] md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search theatre, city, GST, manager..."
            className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
          />
        </div>

      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
        </div>
      ) : filteredTheatres.length === 0 ? (
        <div className="bg-neutral-900/30 border border-white/10 rounded-3xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No theatre requests found</h3>
          <p className="text-neutral-400 text-xs mt-1">
            {searchQuery ? 'Try clearing your search query.' : `No applications under ${activeTab.toLowerCase()} status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTheatres.map(theatre => {
            const manager = theatre.users?.[0];
            const amenitiesList = Array.isArray(theatre.amenities) ? theatre.amenities : [];
            const isPending = theatre.status === 'PENDING';
            const isApproved = theatre.status === 'APPROVED' || theatre.status === 'ACTIVE';
            const isRejected = theatre.status === 'REJECTED';

            return (
              <div 
                key={theatre.id}
                className="bg-neutral-900/60 border border-white/10 hover:border-white/20 rounded-3xl p-6 sm:p-7 backdrop-blur-xl transition shadow-xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Column: Theatre & Location info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-black text-white tracking-tight">{theatre.name}</h3>
                      
                      {/* Status Badge */}
                      {isPending && (
                        <span className="px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold inline-flex items-center gap-1.5">
                          <Clock size={12} /> PENDING REVIEW
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> {theatre.status}
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold inline-flex items-center gap-1.5">
                          <XCircle size={12} /> REJECTED
                        </span>
                      )}

                      {theatre.createdAt && (
                        <span className="text-[11px] text-neutral-500">
                          Applied: {new Date(theatre.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-neutral-300 pt-1">
                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">{theatre.city}, {theatre.state}</p>
                          <p className="text-neutral-400 text-[11px] line-clamp-1">{theatre.addressLine}</p>
                        </div>
                      </div>

                      {/* Legal / GST */}
                      <div className="flex items-start gap-2">
                        <FileText size={15} className="text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">{theatre.legalEntityName || 'Entity Not Provided'}</p>
                          <p className="text-neutral-400 text-[11px] font-mono uppercase">GST: {theatre.gstNumber || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Applicant Manager */}
                      <div className="flex items-start gap-2">
                        <User size={15} className="text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">{manager?.fullName || 'Manager Registered'}</p>
                          <p className="text-neutral-400 text-[11px]">{manager?.email || theatre.contactEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amenities chips */}
                    {amenitiesList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {amenitiesList.slice(0, 5).map((amenity, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-neutral-300">
                            {amenity.replace('_', ' ')}
                          </span>
                        ))}
                        {amenitiesList.length > 5 && (
                          <span className="text-[11px] text-neutral-500 font-semibold">
                            +{amenitiesList.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rejection Reason Display Banner if rejected */}
                    {isRejected && theatre.rejectionReason && (
                      <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 text-xs text-red-200 flex items-start gap-2.5">
                        <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-300">Reason for Rejection:</p>
                          <p className="text-neutral-300 mt-0.5">{theatre.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center justify-end gap-2.5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
                    
                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        setDetailTheatre(theatre);
                        setDetailModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      Inspect Details
                    </button>

                    {/* Approve Button (shown if not yet approved) */}
                    {!isApproved && (
                      <button
                        onClick={() => handleApprove(theatre)}
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} className="stroke-[3]" />
                        Approve Theatre
                      </button>
                    )}

                    {/* Reject Button: ONLY available if NOT approved */}
                    {!isApproved && (
                      <button
                        onClick={() => openRejectModal(theatre)}
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X size={14} className="stroke-[3]" />
                        Reject with Reason
                      </button>
                    )}

                    {/* Once Approved: Rejection is blocked */}
                    {isApproved && (
                      <div className="flex items-center gap-2">
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          Approved
                        </span>
                        <Link
                          to="/admin/theatres"
                          className="px-3.5 py-2 rounded-xl border border-white/10 hover:border-yellow-500/40 bg-white/5 text-neutral-300 hover:text-white text-xs font-semibold transition"
                        >
                          View in Manage Theatres →
                        </Link>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalOpen && selectedTheatre && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border border-red-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={closeRejectModal}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Reject Theatre Application</h3>
                <p className="text-xs text-neutral-400">Specify reason for rejecting this cinema partner</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 text-xs text-neutral-300 space-y-1">
              <p><strong className="text-white">Theatre:</strong> {selectedTheatre.name}</p>
              <p><strong className="text-white">Location:</strong> {selectedTheatre.city}, {selectedTheatre.state}</p>
              <p><strong className="text-white">GST Number:</strong> {selectedTheatre.gstNumber || 'N/A'}</p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-2">
                  Select Common Preset:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REASON_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 hover:border-yellow-500/40 text-[11px] text-neutral-300 hover:text-white transition text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Textarea */}
              <div>
                <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                  Detailed Reason for Rejection <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application cannot be approved (e.g., GST registration does not match company legal name, license expired)..."
                  className="w-full bg-black/60 border border-white/10 focus:border-red-500 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DETAILED INSPECTION MODAL */}
      {detailModalOpen && detailTheatre && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{detailTheatre.name}</h3>
                <p className="text-xs text-neutral-400">Application ID: {detailTheatre.id}</p>
              </div>
            </div>

            <div className="space-y-6 text-xs sm:text-sm">
              
              {/* Status Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-neutral-400">Current Application Status:</span>
                <span className={`font-bold px-3 py-1 rounded-full text-xs uppercase ${
                  detailTheatre.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                  detailTheatre.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {detailTheatre.status}
                </span>
              </div>

              {/* If Rejected Banner */}
              {detailTheatre.status === 'REJECTED' && detailTheatre.rejectionReason && (
                <div className="bg-red-500/15 border border-red-500/40 rounded-2xl p-4 text-xs text-red-200">
                  <p className="font-bold text-red-300 mb-1">Reason for Rejection:</p>
                  <p>{detailTheatre.rejectionReason}</p>
                </div>
              )}

              {/* Theatre Profile Details */}
              <div className="border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Cinema & Business Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-400 text-xs block">Legal Entity Name</span>
                    <span className="text-white font-medium">{detailTheatre.legalEntityName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">GSTIN / Tax ID</span>
                    <span className="text-white font-mono uppercase font-medium">{detailTheatre.gstNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Contact Phone</span>
                    <span className="text-white font-medium">{detailTheatre.contactPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Contact Email</span>
                    <span className="text-white font-medium">{detailTheatre.contactEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Location & Address</h4>
                <p className="text-white font-medium">{detailTheatre.addressLine}</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-400 block">City</span>
                    <span className="text-white font-medium">{detailTheatre.city}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">State</span>
                    <span className="text-white font-medium">{detailTheatre.state}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Postal Code</span>
                    <span className="text-white font-medium">{detailTheatre.postalCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Manager Details */}
              <div className="border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Applicant / Manager Account</h4>
                {detailTheatre.users && detailTheatre.users.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 text-xs block">Manager Name</span>
                      <span className="text-white font-medium">{detailTheatre.users[0].fullName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-xs block">Manager Email</span>
                      <span className="text-white font-medium">{detailTheatre.users[0].email}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-xs block">Phone</span>
                      <span className="text-white font-medium">{detailTheatre.users[0].mobileNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-xs block">Role</span>
                      <span className="text-yellow-400 font-mono text-xs">{detailTheatre.users[0].role}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-400">No linked user found.</p>
                )}
              </div>

              {/* Amenities */}
              <div className="border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Auditorium Formats & Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(detailTheatre.amenities) && detailTheatre.amenities.length > 0 ? (
                    detailTheatre.amenities.map((a, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
                        {a.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-400">Standard Screening</span>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
                >
                  Close
                </button>

                {detailTheatre.status !== 'APPROVED' && detailTheatre.status !== 'ACTIVE' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        openRejectModal(detailTheatre);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition"
                    >
                      Reject with Reason
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(detailTheatre)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      Approve Application
                    </button>
                  </>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Approved (Rejection Locked)
                  </span>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
