
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export const ManageTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTheatre, setNewTheatre] = useState({ name: '', city: '', addressLine: '', contactEmail: '', contactPhone: '', legalEntityName: '', gstNumber: '', postalCode: '', state: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchTheatres(); }, []);

  const fetchTheatres = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/theatres');
      const data = await res.json();
      setTheatres(data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/admin/theatres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({...newTheatre, status: 'ACTIVE'})
      });
      if (res.ok) {
        alert('Theatre added!');
        setShowForm(false);
        fetchTheatres();
      } else {
        const data = await res.json();
        alert('Failed: ' + data.message);
      }
    } catch (err) { alert('Error saving theatre'); }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Theatres</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400 transition">
          <Plus size={20} /> {showForm ? 'Cancel' : 'Add Theatre'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 animate-in slide-in-from-top-4 fade-in">
          <h2 className="text-xl font-bold mb-4">Add New Theatre</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Theatre Name" value={newTheatre.name} onChange={e=>setNewTheatre({...newTheatre, name: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="text" placeholder="Legal Entity Name" value={newTheatre.legalEntityName} onChange={e=>setNewTheatre({...newTheatre, legalEntityName: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="text" placeholder="City" value={newTheatre.city} onChange={e=>setNewTheatre({...newTheatre, city: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="text" placeholder="State" value={newTheatre.state} onChange={e=>setNewTheatre({...newTheatre, state: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="text" placeholder="Postal Code" value={newTheatre.postalCode} onChange={e=>setNewTheatre({...newTheatre, postalCode: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="text" placeholder="GST Number" value={newTheatre.gstNumber} onChange={e=>setNewTheatre({...newTheatre, gstNumber: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="email" placeholder="Contact Email" value={newTheatre.contactEmail} onChange={e=>setNewTheatre({...newTheatre, contactEmail: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
              <input type="text" placeholder="Contact Phone" value={newTheatre.contactPhone} onChange={e=>setNewTheatre({...newTheatre, contactPhone: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500" required />
            </div>
            <textarea placeholder="Full Address Line" value={newTheatre.addressLine} onChange={e=>setNewTheatre({...newTheatre, addressLine: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 min-h-[80px]" required />
            <button className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition">Save Theatre</button>
          </form>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 bg-white/5">
                <th className="py-4 px-6 font-medium">Name</th>
                <th className="py-4 px-6 font-medium">Location</th>
                <th className="py-4 px-6 font-medium">Contact</th>
                <th className="py-4 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {theatres.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-4 px-6 font-medium text-white">{t.name}</td>
                  <td className="py-4 px-6 text-neutral-300">{t.city}, {t.state}</td>
                  <td className="py-4 px-6 text-neutral-300">{t.contactEmail}</td>
                  <td className="py-4 px-6"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/20">{t.status}</span></td>
                </tr>
              ))}
              {theatres.length === 0 && !loading && (
                <tr><td colSpan="4" className="py-8 text-center text-neutral-500">No theatres found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
