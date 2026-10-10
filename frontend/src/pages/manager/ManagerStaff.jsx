import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  QrCode, 
  Trash2, 
  Lock, 
  Unlock, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ScanLine, 
  Mail, 
  Phone, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api.service';

export const ManagerStaff = () => {
  const { theatre } = useOutletContext();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: ''
  });

  // Ticket Scanner Test Tool
  const [testBookingId, setTestBookingId] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff();
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching theatre staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      await api.createStaff(newStaff);
      setIsAddStaffOpen(false);
      setNewStaff({ fullName: '', email: '', mobileNumber: '', password: '' });
      fetchStaff();
    } catch (err) {
      setCreateError(err.message || 'Failed to create staff member');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.toggleStaffStatus(id);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to toggle staff status');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member ${name}?`)) return;
    try {
      await api.deleteStaff(id);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to remove staff');
    }
  };

  // Ticket scan verification test
  const handleValidateTicket = async (e) => {
    e.preventDefault();
    if (!testBookingId.trim()) return;

    setScanning(true);
    setScanResult(null);

    try {
      const res = await api.validateTicket(testBookingId.trim());
      setScanResult({
        success: true,
        message: res.message || 'ENTRY_ALLOWED',
        data: res.data
      });
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Validation failed'
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Users className="text-yellow-400" /> Gate Staff & Access Control
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage theatre staff accounts, grant gate ticket scanning permissions, and test barcode validation.
          </p>
        </div>

        <button
          onClick={() => setIsAddStaffOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition shadow-lg shadow-yellow-500/20"
        >
          <UserPlus size={16} /> Add Gate Staff Member
        </button>
      </div>

      {/* Grid: Staff Roster + Live Gate Scanner Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Staff Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-yellow-400" />
              Theatre Gate Staff Roster
            </h2>
            <span className="text-xs text-neutral-400">
              {staff.length} staff members registered
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-neutral-500 bg-[#101216] rounded-2xl border border-white/5">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-yellow-400" />
              <p className="text-sm">Loading staff accounts...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="bg-[#101216] border border-white/5 rounded-2xl p-10 text-center">
              <Users size={44} className="mx-auto text-neutral-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No Staff Accounts Yet</h3>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-1 mb-5">
                Add staff members to let your gate attendants scan and validate customer tickets at auditorium entrances.
              </p>
              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition"
              >
                <Plus size={15} /> Add First Staff Member
              </button>
            </div>
          ) : (
            <div className="bg-[#101216] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#14171d] text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Permissions</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staff.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center font-bold text-yellow-400 text-xs">
                              {member.fullName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{member.fullName}</div>
                              <div className="text-[11px] text-neutral-500">
                                Added {new Date(member.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-neutral-300">{member.email}</div>
                          {member.mobileNumber && (
                            <div className="text-[11px] text-neutral-500">{member.mobileNumber}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <QrCode size={11} /> SCAN_TICKETS
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {member.isBlocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(member.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 transition"
                              title={member.isBlocked ? 'Activate Staff' : 'Suspend Staff'}
                            >
                              {member.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member.id, member.fullName)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition"
                              title="Remove Staff"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Gate Ticket Scanner Testing Tool */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ScanLine size={18} className="text-yellow-400" />
            Gate Ticket Scanner Test
          </h2>

          <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 space-y-4">
            <p className="text-xs text-neutral-400">
              Verify barcode and QR tickets directly from the console to test admission gate validation.
            </p>

            <form onSubmit={handleValidateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Booking UUID / Ticket ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste booking UUID..."
                  value={testBookingId}
                  onChange={(e) => setTestBookingId(e.target.value)}
                  className="w-full bg-[#181b22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                <QrCode size={15} />
                {scanning ? 'Verifying Ticket...' : 'Simulate Gate Scan'}
              </button>
            </form>

            {/* Scan Result Feedback Banner */}
            {scanResult && (
              <div
                className={`mt-4 p-4 rounded-xl border text-xs animate-in fade-in space-y-1.5 ${
                  scanResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {scanResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{scanResult.success ? 'ENTRY ALLOWED' : 'ENTRY REJECTED'}</span>
                </div>
                <div>{scanResult.message}</div>
                {scanResult.data && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-neutral-300 space-y-0.5">
                    <div>Film: <strong>{scanResult.data.show?.movie?.title}</strong></div>
                    <div>Auditorium: <strong>{scanResult.data.show?.screen?.name}</strong></div>
                    <div>Seats: <strong>{scanResult.data.seats?.map(s => `${s.seat?.rowLabel}${s.seat?.seatNumber}`).join(', ')}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121419] border border-white/10 rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="text-yellow-400" size={20} />
                Add Gate Staff Member
              </h3>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Full Name <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff1@cineverse.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={newStaff.mobileNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, mobileNumber: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Temporary Access Password <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-neutral-400">
                This account will be created with role <strong>THEATRE_STAFF</strong> and granted permissions to scan and validate tickets for this cinema branch.
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition disabled:opacity-50"
                >
                  {creating ? 'Creating Account...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
