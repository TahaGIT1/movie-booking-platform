import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Tv, 
  Layers, 
  CheckCircle2, 
  Eye, 
  X, 
  RefreshCw, 
  CalendarDays,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api.service';

export const ManageTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  
  // Detailed Theatre Modal State
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Add Theatre Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTheatre, setNewTheatre] = useState({
    name: '',
    legalEntityName: '',
    gstNumber: '',
    city: '',
    state: '',
    postalCode: '',
    addressLine: '',
    contactEmail: '',
    contactPhone: '',
    amenities: ['DOLBY_ATMOS', 'RECLINER']
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    fetchTheatres();
  }, []);

  const fetchTheatres = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminTheatres();
      // Show approved or active theatres in Manage Theatres
      const activeList = Array.isArray(data) 
        ? data.filter(t => t.status === 'APPROVED' || t.status === 'ACTIVE') 
        : [];
      setTheatres(activeList);
    } catch (err) {
      console.error('Failed to fetch admin theatres, fallback to public:', err);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/admin/theatres', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...newTheatre, status: 'ACTIVE' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertMsg({ type: 'success', text: `Theatre "${newTheatre.name}" added successfully!` });
        setShowAddForm(false);
        setNewTheatre({
          name: '',
          legalEntityName: '',
          gstNumber: '',
          city: '',
          state: '',
          postalCode: '',
          addressLine: '',
          contactEmail: '',
          contactPhone: '',
          amenities: ['DOLBY_ATMOS', 'RECLINER']
        });
        fetchTheatres();
      } else {
        throw new Error(data.message || 'Failed to create theatre');
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Error saving theatre' });
    } finally {
      setCreateLoading(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  const openDetails = (theatre) => {
    setSelectedTheatre(theatre);
    setDetailModalOpen(true);
  };

  // Unique cities for filter
  const uniqueCities = Array.from(new Set(theatres.map(t => t.city).filter(Boolean)));

  // Filtered theatres
  const filteredTheatres = theatres.filter(t => {
    if (cityFilter !== 'ALL' && t.city !== cityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchCity = t.city?.toLowerCase().includes(q);
      const matchLegal = t.legalEntityName?.toLowerCase().includes(q);
      const matchGst = t.gstNumber?.toLowerCase().includes(q);
      const matchManager = t.users?.some(u => 
        u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
      return matchName || matchCity || matchLegal || matchGst || matchManager;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 size={13} />
            Cinema Operations
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manage Active Theatres</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Browse all approved cinema partners, review auditorium setups, inspect manager accounts, and add new properties.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchTheatres}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer"
          >
            <Plus size={16} /> 
            {showAddForm ? 'Close Form' : 'Add New Theatre'}
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in slide-in-from-top-3 ${
          alertMsg.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' : 'bg-red-500/15 border-red-500/40 text-red-200'
        }`}>
          <div className="flex items-center gap-3 text-sm font-semibold">
            {alertMsg.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-neutral-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-900/40 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>Approved & Active Theatres</span>
            <Building2 size={16} />
          </div>
          <p className="text-3xl font-black text-white mt-2">{theatres.length}</p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Live for customer ticket bookings</span>
        </div>

        <div className="bg-neutral-900/40 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-yellow-400 text-xs font-bold uppercase tracking-wider">
            <span>Cities Covered</span>
            <MapPin size={16} />
          </div>
          <p className="text-3xl font-black text-white mt-2">{uniqueCities.length}</p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Operational metropolitan regions</span>
        </div>

        <div className="bg-neutral-900/40 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <span>Screen Inventory</span>
            <Tv size={16} />
          </div>
          <p className="text-3xl font-black text-white mt-2">
            {theatres.reduce((acc, t) => acc + (t.screens?.length || 0), 0) || '--'}
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Configured movie auditoriums</span>
        </div>
      </div>

      {/* Add Theatre Drawer / Form */}
      {showAddForm && (
        <div className="bg-neutral-900/80 p-7 rounded-3xl border border-yellow-500/30 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Add Direct Cinema Venue</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Quickly provision a new active theatre directly into the platform.</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="text-neutral-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Theatre Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. CineVerse Platinum IMAX" 
                  value={newTheatre.name} 
                  onChange={e => setNewTheatre({...newTheatre, name: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                  required 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Legal Entity Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. CineVerse Cinemas Pvt Ltd" 
                  value={newTheatre.legalEntityName} 
                  onChange={e => setNewTheatre({...newTheatre, legalEntityName: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">GST Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 29ABCDE1234F1Z5" 
                  value={newTheatre.gstNumber} 
                  onChange={e => setNewTheatre({...newTheatre, gstNumber: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition uppercase" 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">City *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mumbai" 
                  value={newTheatre.city} 
                  onChange={e => setNewTheatre({...newTheatre, city: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                  required 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">State *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Maharashtra" 
                  value={newTheatre.state} 
                  onChange={e => setNewTheatre({...newTheatre, state: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                  required 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Postal Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. 400001" 
                  value={newTheatre.postalCode} 
                  onChange={e => setNewTheatre({...newTheatre, postalCode: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Contact Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. manager@cineverse.com" 
                  value={newTheatre.contactEmail} 
                  onChange={e => setNewTheatre({...newTheatre, contactEmail: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                />
              </div>

              <div>
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Contact Phone</label>
                <input 
                  type="text" 
                  placeholder="e.g. +91 98765 43210" 
                  value={newTheatre.contactPhone} 
                  onChange={e => setNewTheatre({...newTheatre, contactPhone: e.target.value})} 
                  className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition" 
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Full Address Line *</label>
              <textarea 
                placeholder="Level 4, Phoenix MarketCity, LBS Marg, Kurla West" 
                value={newTheatre.addressLine} 
                onChange={e => setNewTheatre({...newTheatre, addressLine: e.target.value})} 
                className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-500 min-h-[70px] text-xs sm:text-sm" 
                required 
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createLoading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
              >
                {createLoading ? 'Saving...' : 'Save & Activate Theatre'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-900/50 p-3 rounded-2xl border border-white/10">
        
        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-neutral-500 text-xs font-bold uppercase pl-2 shrink-0">City:</span>
          <button
            onClick={() => setCityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              cityFilter === 'ALL' 
                ? 'bg-yellow-500 text-black' 
                : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            All Cities
          </button>
          {uniqueCities.map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                cityFilter === city 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-neutral-400 hover:text-white bg-white/5'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px] sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search theatre, GST, manager..."
            className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
          />
        </div>

      </div>

      {/* Theatres Table / Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
        </div>
      ) : filteredTheatres.length === 0 ? (
        <div className="bg-neutral-900/30 border border-white/10 rounded-3xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No active theatres found</h3>
          <p className="text-neutral-400 text-xs mt-1">
            {searchQuery || cityFilter !== 'ALL' 
              ? 'Try clearing your search or city filters.' 
              : 'Approve pending applications from "Theatre Requests" to list them here.'}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900/50 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 bg-white/5 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Cinema Venue</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Assigned Manager</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                {filteredTheatres.map(theatre => {
                  const manager = theatre.users?.[0];
                  return (
                    <tr 
                      key={theatre.id} 
                      onClick={() => openDetails(theatre)}
                      className="hover:bg-white/5 transition cursor-pointer group"
                    >
                      {/* Cinema Name & Legal */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white group-hover:text-yellow-400 transition flex items-center gap-2">
                          <Building2 size={16} className="text-neutral-500 group-hover:text-yellow-400 transition" />
                          <span>{theatre.name}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                          {theatre.legalEntityName || 'Entity Not Provided'} {theatre.gstNumber ? `• GST: ${theatre.gstNumber}` : ''}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6">
                        <div className="font-medium text-neutral-200">{theatre.city}, {theatre.state}</div>
                        <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs">{theatre.addressLine}</div>
                      </td>

                      {/* Manager */}
                      <td className="py-4 px-6">
                        {manager ? (
                          <div>
                            <div className="font-medium text-neutral-200">{manager.fullName}</div>
                            <div className="text-[11px] text-neutral-400">{manager.email}</div>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-xs italic">Direct Platform Cinema</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5">
                          <CheckCircle2 size={12} />
                          {theatre.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(theatre);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-yellow-500/50 bg-white/5 hover:bg-yellow-500/10 text-neutral-300 hover:text-yellow-300 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIVIDUAL THEATRE DETAILS MODAL */}
      {detailModalOpen && selectedTheatre && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white transition"
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center shrink-0">
                <Building2 size={28} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black text-white">{selectedTheatre.name}</h3>
                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 uppercase">
                    <CheckCircle2 size={12} />
                    {selectedTheatre.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 font-mono">
                  ID: {selectedTheatre.id}
                  {selectedTheatre.createdAt && ` • Registered: ${new Date(selectedTheatre.createdAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-xs sm:text-sm">
              
              {/* Business & Legal Profile */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={15} />
                  Legal & Corporate Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-400 text-xs block">Legal Entity Name</span>
                    <span className="text-white font-medium">{selectedTheatre.legalEntityName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">GSTIN / Business Registration</span>
                    <span className="text-white font-mono uppercase font-medium">{selectedTheatre.gstNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Operational Contact Email</span>
                    <span className="text-white font-medium">{selectedTheatre.contactEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Box Office / Desk Phone</span>
                    <span className="text-white font-medium">{selectedTheatre.contactPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Location & Premise */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={15} />
                  Location & Venue Address
                </h4>
                <p className="text-white font-medium text-sm">{selectedTheatre.addressLine}</p>
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-neutral-400 block">City</span>
                    <span className="text-white font-medium">{selectedTheatre.city}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">State / Region</span>
                    <span className="text-white font-medium">{selectedTheatre.state}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Postal / PIN Code</span>
                    <span className="text-white font-medium">{selectedTheatre.postalCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Theatre Manager Information */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                  <User size={15} />
                  Onboarded Theatre Manager
                </h4>
                {selectedTheatre.users && selectedTheatre.users.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 text-xs block">Full Name</span>
                      <span className="text-white font-medium">{selectedTheatre.users[0].fullName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-xs block">Official Email</span>
                      <span className="text-white font-medium">{selectedTheatre.users[0].email}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-xs block">Mobile Number</span>
                      <span className="text-white font-medium">{selectedTheatre.users[0].mobileNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-xs block">Platform Role</span>
                      <span className="text-yellow-400 font-mono text-xs">{selectedTheatre.users[0].role}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-400 text-xs">Direct admin-managed theatre (no external manager registered).</p>
                )}
              </div>

              {/* Amenities & Screen Formats */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={15} />
                  Amenities & Supported Formats
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.isArray(selectedTheatre.amenities) && selectedTheatre.amenities.length > 0 ? (
                    selectedTheatre.amenities.map((a, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
                        {a.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-400 text-xs">Standard Multiplex Experience</span>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                <span className="text-xs text-neutral-500">
                  Theatre status is verified and active for bookings.
                </span>
                
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs transition cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
