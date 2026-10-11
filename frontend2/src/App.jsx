import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { AdminLayout } from './components/admin/AdminLayout';
import { ManagerLayout } from './components/manager/ManagerLayout';
import { HomePage } from './pages/public/HomePage';
import { AuthModal } from './components/auth/AuthModal';

// Customer Facing Pages
import { MovieDetailsPage } from './pages/public/MovieDetailsPage';
import { ShowtimesPage } from './pages/public/ShowtimesPage';
import { SeatSelectionPage } from './pages/public/SeatSelectionPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { BookingConfirmationPage } from './pages/public/BookingConfirmationPage';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { CinemasPage } from './pages/public/CinemasPage';

// Admin Pages
import { DashboardOverview } from './pages/admin/DashboardOverview';
import { ManageMovies } from './pages/admin/ManageMovies';
import { ManageTheatres } from './pages/admin/ManageTheatres';
import { TheatreRequests } from './pages/admin/TheatreRequests';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerScreens } from './pages/manager/ManagerScreens';
import { ManagerShows } from './pages/manager/ManagerShows';
import { ManagerBookings } from './pages/manager/ManagerBookings';
import { ManagerStaff } from './pages/manager/ManagerStaff';
import { ManagerProfile } from './pages/manager/ManagerProfile';

// Auth Pages
import { TheaterManagerSignup } from './pages/auth/TheaterManagerSignup';
import { CustomerSignup } from './pages/auth/CustomerSignup';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isManagerRoute = location.pathname.startsWith('/manager') && location.pathname !== '/manager/signup';

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans flex flex-col">
      <AuthModal />
      {!isAdminRoute && !isManagerRoute && <Navbar />}
      <div className="flex-1">
        {children}
      </div>
      {!isAdminRoute && !isManagerRoute && (
        <footer className="border-t border-white/10 bg-[#07080c] py-10 px-6 sm:px-12 text-xs text-neutral-500 mt-16">
          <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-black tracking-tight font-heading text-base">CineVerse</span>
              <span>© {new Date().getFullYear()} CineVerse Platform Ltd. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-neutral-400">
              <a href="/cinemas" className="hover:text-white transition">Cinemas</a>
              <a href="/profile" className="hover:text-white transition">Account</a>
              <a href="/theatre/signup" className="hover:text-[#f5a623] transition">List Cinema</a>
              <span className="text-neutral-600">PostgreSQL Powered</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          {/* Public / Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetailsPage />} />
          <Route path="/movie/:id/shows" element={<ShowtimesPage />} />
          <Route path="/shows/:showId/seats" element={<SeatSelectionPage />} />
          <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
          <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmationPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/bookings" element={<Navigate to="/my-bookings" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cinemas" element={<CinemasPage />} />
          <Route path="/theatres" element={<Navigate to="/cinemas" replace />} />

          {/* Customer Auth Shortcuts */}
          <Route path="/signup" element={<CustomerSignup />} />
          <Route path="/register" element={<CustomerSignup />} />
          <Route path="/theatre/signup" element={<TheaterManagerSignup />} />
          <Route path="/manager/signup" element={<TheaterManagerSignup />} />
          
          {/* Super Admin Console */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="theatre-requests" element={<TheatreRequests />} />
            <Route path="theatres" element={<ManageTheatres />} />
            <Route path="movies" element={<ManageMovies />} />
            <Route path="shows" element={<div className="max-w-6xl"><h1 className="text-3xl font-bold text-white mb-8">Manage Shows</h1><p className="text-neutral-400">Shows management active in database.</p></div>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Dedicated Theatre Manager Console */}
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="screens" element={<ManagerScreens />} />
            <Route path="shows" element={<ManagerShows />} />
            <Route path="bookings" element={<ManagerBookings />} />
            <Route path="staff" element={<ManagerStaff />} />
            <Route path="profile" element={<ManagerProfile />} />
            <Route path="*" element={<Navigate to="/manager" replace />} />
          </Route>

          {/* Fallback wildcard redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
