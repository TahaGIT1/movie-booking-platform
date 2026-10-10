import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { AdminLayout } from './components/admin/AdminLayout';
import { ManagerLayout } from './components/manager/ManagerLayout';
import { HomePage } from './pages/public/HomePage';
import { AuthModal } from './components/auth/AuthModal';

import { DashboardOverview } from './pages/admin/DashboardOverview';
import { ManageMovies } from './pages/admin/ManageMovies';
import { ManageTheatres } from './pages/admin/ManageTheatres';
import { TheatreRequests } from './pages/admin/TheatreRequests';

import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerScreens } from './pages/manager/ManagerScreens';
import { ManagerShows } from './pages/manager/ManagerShows';
import { ManagerBookings } from './pages/manager/ManagerBookings';
import { ManagerStaff } from './pages/manager/ManagerStaff';
import { ManagerProfile } from './pages/manager/ManagerProfile';

import { TheaterManagerSignup } from './pages/auth/TheaterManagerSignup';
import { CustomerSignup } from './pages/auth/CustomerSignup';
import { MovieBookingPage } from './pages/public/MovieBookingPage';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isManagerRoute = location.pathname.startsWith('/manager') && location.pathname !== '/manager/signup';

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans">
      <AuthModal />
      {!isAdminRoute && !isManagerRoute && <Navbar />}
      {children}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/:movieId" element={<MovieBookingPage />} />
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
            <Route path="shows" element={<div className="max-w-6xl"><h1 className="text-3xl font-bold text-white mb-8">Manage Shows</h1><p className="text-neutral-400">Shows management coming soon.</p></div>} />
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

          {/* Fallback wildcard redirect: Any invalid or not found route redirects to root/homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
