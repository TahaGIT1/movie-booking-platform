import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { StreamsPage } from './pages/StreamsPage';
import { PlaysPage } from './pages/PlaysPage';
import { SportsPage } from './pages/SportsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { TheatresPage } from './pages/TheatresPage';
import { OffersPage } from './pages/OffersPage';
import { LoginPage } from './pages/LoginPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { BookingPage } from './pages/BookingPage';
import { ProfilePage } from './pages/ProfilePage';
import { BookingsHistoryPage } from './pages/BookingsHistoryPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex flex-col font-sans selection:bg-[#f5a623] selection:text-black">
      {/* Global Navbar */}
      <Navbar onOpenSearch={() => setSearchOpen(true)} />

      {/* Routes Content */}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/streams" element={<StreamsPage />} />
          <Route path="/plays" element={<PlaysPage />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/theatres" element={<TheatresPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/movie/:id" element={<MovieDetailsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/plays/:id" element={<EventDetailsPage />} />
          <Route path="/sports/:id" element={<EventDetailsPage />} />
          <Route path="/activities/:id" element={<EventDetailsPage />} />
          <Route path="/book/:movieId" element={<BookingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookings" element={<BookingsHistoryPage />} />
          {/* Catch-all to Home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>

      {/* Comprehensive Website Footer (shown on all discovery pages) */}
      {!isLoginPage && <Footer />}

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;

