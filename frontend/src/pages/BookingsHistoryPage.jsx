import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, QrCode, RefreshCw, X, CheckCircle, Ticket } from 'lucide-react';
import { api } from '../services/api';
export const BookingsHistoryPage = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeQrModal, setActiveQrModal] = useState(null);
    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const data = await api.getBookings();
            setBookings(data);
        }
        catch (err) {
            console.warn('Failed to load bookings from API:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchBookings();
    }, []);
    return (<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 max-w-[1000px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4"/>
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={fetchBookings} disabled={isLoading} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#f5a623] transition-colors cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}/>
            <span>Sync</span>
          </button>
          <span className="text-xs text-[#f5a623] font-semibold">MY BOOKING HISTORY</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
            My Tickets & Reservations
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Present your e-ticket or QR code at cinema turnstiles or event admission gates.
          </p>
        </div>

        {bookings.length === 0 && !isLoading ? (<div className="p-12 text-center rounded-2xl bg-[#11131c] border border-white/10 space-y-4">
            <Ticket className="w-12 h-12 text-neutral-600 mx-auto"/>
            <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              You haven't reserved any movie or event tickets yet. Explore now showing films!
            </p>
            <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-[#f5a623] text-black font-semibold text-xs hover:bg-[#e09612]">
              Discover Movies
            </Link>
          </div>) : (<div className="space-y-4">
            {bookings.map((b) => (<div key={b.orderId} className="p-5 sm:p-6 rounded-2xl bg-[#11131c] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-22 rounded-xl overflow-hidden bg-neutral-800 border border-white/10 shrink-0">
                    <img src={b.posterImage || '/images/movies/the-batman.jpg'} alt={b.title || 'Movie'} className="w-full h-full object-cover"/>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'CONFIRMED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 text-neutral-400 border border-white/10'}`}>
                        {b.status}
                      </span>
                      <span className="text-xs font-mono text-neutral-500">{b.orderId}</span>
                    </div>

                    <h3 className="text-lg font-heading font-bold text-white">
                      {b.title || 'Cinema Ticket'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#f5a623]"/>
                        {b.theatreName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400"/>
                        {b.date} @ {b.time}
                      </span>
                    </div>

                    <div className="mt-2 text-xs">
                      <span className="text-neutral-500">Seats: </span>
                      <span className="text-[#f5a623] font-mono font-bold">
                        {b.seats.join(', ')}
                      </span>
                      <span className="text-neutral-500 ml-3">Paid: </span>
                      <span className="text-white font-medium">RM {b.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                  <button onClick={() => setActiveQrModal(b)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
                    <QrCode className="w-4 h-4 text-[#f5a623]"/>
                    <span>Show E-Ticket QR</span>
                  </button>
                </div>
              </div>))}
          </div>)}
      </div>

      {/* QR Code Inspection Modal */}
      {activeQrModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141722] border border-white/15 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 relative shadow-2xl">
            <button onClick={() => setActiveQrModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-4 h-4"/>
            </button>

            <div className="w-12 h-12 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 text-[#f5a623] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6"/>
            </div>

            <div>
              <h3 className="text-lg font-heading font-bold text-white">
                {activeQrModal.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {activeQrModal.theatreName}
              </p>
              <div className="text-xs font-mono font-bold text-[#f5a623] mt-1">
                Order ID: {activeQrModal.orderId}
              </div>
            </div>

            {/* Simulated High-Res QR Visual */}
            <div className="bg-white p-4 rounded-xl mx-auto inline-block shadow-inner">
              <div className="w-44 h-44 border-4 border-black p-2 flex flex-col justify-between bg-white text-black font-mono text-[9px]">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-black bg-black/20 flex items-center justify-center font-bold">QR</div>
                  <div className="w-10 h-10 border-4 border-black bg-black/20"/>
                </div>
                <div className="text-center font-bold tracking-widest text-[10px]">
                  CINEPASS VERIFIED
                  <div className="text-[8px] text-neutral-600 font-normal mt-0.5">
                    {activeQrModal.seats.join(', ')} • RM {activeQrModal.totalAmount}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-10 h-10 border-4 border-black bg-black/20"/>
                  <div className="text-[8px] text-neutral-500 font-mono">
                    {activeQrModal.orderId}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              Scan this code at cinema turnstile scanners for automated gate opening.
            </p>

            <button onClick={() => setActiveQrModal(null)} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10">
              Close
            </button>
          </div>
        </div>)}
    </div>);
};
