
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { AdminLayout } from './components/admin/AdminLayout';
import { HomePage } from './pages/public/HomePage';
import { AuthModal } from './components/auth/AuthModal';

import { DashboardOverview } from './pages/admin/DashboardOverview';
import { ManageMovies } from './pages/admin/ManageMovies';
import { ManageTheatres } from './pages/admin/ManageTheatres';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans ">
      <AuthModal />
      {!isAdminRoute && <Navbar />}
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
          
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="movies" element={<ManageMovies />} />
            <Route path="theatres" element={<ManageTheatres />} />
            <Route path="shows" element={<div className="max-w-6xl"><h1 className="text-3xl font-bold text-white mb-8">Manage Shows</h1><p className="text-neutral-400">Shows management coming soon.</p></div>} />
          </Route>
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
