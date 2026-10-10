import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthProvider } from './contexts/AuthContext';
// Customer Discovery & Booking Pages
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
import { PaymentPage } from './pages/PaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { BookingsHistoryPage } from './pages/BookingsHistoryPage';
// Auth Signups
import { CustomerSignup } from './pages/auth/CustomerSignup';
import { TheaterManagerSignup } from './pages/auth/TheaterManagerSignup';
// Admin Pages & Layout
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardOverview } from './pages/admin/DashboardOverview';
import { ManageMovies } from './pages/admin/ManageMovies';
import { ManageTheatres } from './pages/admin/ManageTheatres';
import { TheatreRequests } from './pages/admin/TheatreRequests';
// Manager Pages & Layout
import { ManagerLayout } from './components/manager/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerScreens } from './pages/manager/ManagerScreens';
import { ManagerShows } from './pages/manager/ManagerShows';
import { ManagerBookings } from './pages/manager/ManagerBookings';
import { ManagerStaff } from './pages/manager/ManagerStaff';
import { ManagerProfile } from './pages/manager/ManagerProfile';
function AppLayout() {
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isManagerRoute = location.pathname.startsWith('/manager') && location.pathname !== '/manager/signup';
    const isStandaloneAuth = location.pathname === '/login' || location.pathname === '/theatre/signup' || location.pathname === '/manager/signup';
    const showGlobalChrome = !isAdminRoute && !isManagerRoute && !isStandaloneAuth;
    return (<div className="min-h-screen bg-[#0a0b0e] text-white flex flex-col font-sans selection:bg-[#f5a623] selection:text-black">
      {/* Global Modals */}
      <AuthModal />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)}/>

      {/* Global Navbar for discovery routes */}
      {showGlobalChrome && <Navbar onOpenSearch={() => setSearchOpen(true)}/>}

      {/* Routes Content */}
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Customer Discovery Routes */}
          <Route path="/" element={<HomePage />}/>
          <Route path="/events" element={<EventsPage />}/>
          <Route path="/streams" element={<StreamsPage />}/>
          <Route path="/plays" element={<PlaysPage />}/>
          <Route path="/sports" element={<SportsPage />}/>
          <Route path="/activities" element={<ActivitiesPage />}/>
          <Route path="/theatres" element={<TheatresPage />}/>
          <Route path="/cinemas" element={<TheatresPage />}/>
          <Route path="/offers" element={<OffersPage />}/>
          <Route path="/login" element={<LoginPage />}/>
          <Route path="/movie/:id" element={<MovieDetailsPage />}/>
          <Route path="/events/:id" element={<EventDetailsPage />}/>
          <Route path="/plays/:id" element={<EventDetailsPage />}/>
          <Route path="/sports/:id" element={<EventDetailsPage />}/>
          <Route path="/activities/:id" element={<EventDetailsPage />}/>
          <Route path="/book/:movieId" element={<BookingPage />}/>
          <Route path="/payment" element={<PaymentPage />}/>
          <Route path="/profile" element={<ProfilePage />}/>
          <Route path="/bookings" element={<BookingsHistoryPage />}/>

          {/* Registration & Onboarding Routes */}
          <Route path="/signup" element={<CustomerSignup />}/>
          <Route path="/register" element={<CustomerSignup />}/>
          <Route path="/theatre/signup" element={<TheaterManagerSignup />}/>
          <Route path="/manager/signup" element={<TheaterManagerSignup />}/>

          {/* Super Admin Console */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />}/>
            <Route path="theatre-requests" element={<TheatreRequests />}/>
            <Route path="theatres" element={<ManageTheatres />}/>
            <Route path="movies" element={<ManageMovies />}/>
            <Route path="shows" element={<ManagerShows />}/>
            <Route path="*" element={<Navigate to="/admin" replace/>}/>
          </Route>

          {/* Dedicated Theatre Manager Console */}
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboard />}/>
            <Route path="screens" element={<ManagerScreens />}/>
            <Route path="shows" element={<ManagerShows />}/>
            <Route path="bookings" element={<ManagerBookings />}/>
            <Route path="staff" element={<ManagerStaff />}/>
            <Route path="profile" element={<ManagerProfile />}/>
            <Route path="*" element={<Navigate to="/manager" replace/>}/>
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </div>

      {/* Global Footer for discovery routes */}
      {showGlobalChrome && <Footer />}
    </div>);
}
export function App() {
    return (<Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>);
}
export default App;
