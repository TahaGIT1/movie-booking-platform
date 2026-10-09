
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        const result = await api.login({ email, password });
        login(result.data.accessToken, result.data.user);
      } else {
        // Assume signup endpoint exists and logs in user directly or requires manual login
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          login(data.data.accessToken, data.data.user);
        } else {
          throw new Error(data.error?.message || data.message || 'Signup failed');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0a0b0e]/80 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={closeAuthModal} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition">
          <X size={24} />
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">CineVerse<span className="text-yellow-500">.</span></h2>
          <p className="text-neutral-400 mt-2">
            {authModalMode === 'login' ? 'Welcome back! Please login to continue.' : 'Create an account to book tickets.'}
          </p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm text-center font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {authModalMode === 'signup' && (
             <div>
               <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1 block">Full Name</label>
               <input 
                 type="text" 
                 className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-yellow-500 transition shadow-inner" 
                 value={fullName}
                 onChange={e => setFullName(e.target.value)}
                 required
                 placeholder="John Doe"
               />
             </div>
          )}
          <div>
            <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1 block">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-yellow-500 transition shadow-inner" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1 block">Password</label>
            <input 
              type="password" 
              className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-yellow-500 transition shadow-inner"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2"
          >
            {loading ? 'Processing...' : (authModalMode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-400">
          {authModalMode === 'login' ? (
            <p>Don't have an account? <button onClick={() => setAuthModalMode('signup')} className="text-yellow-500 font-bold hover:underline">Sign up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => setAuthModalMode('login')} className="text-yellow-500 font-bold hover:underline">Log in</button></p>
          )}
        </div>
      </div>
    </div>
  );
};
