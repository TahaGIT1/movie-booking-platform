import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
// Customer Discovery & Booking Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';

/**
 * Route-level code splitting.
 *
 * Everything used to be bundled into a single ~770 kB file, so a customer
 * landing on the homepage downloaded the entire Super Admin and Theatre
 * Manager console as well. Only the discovery shell is eagerly loaded now;
 * each page is fetched the first time it is visited.
 */
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const StreamsPage = lazy(() => import('./pages/StreamsPage').then((m) => ({ default: m.StreamsPage })));
const PlaysPage = lazy(() => import('./pages/PlaysPage').then((m) => ({ default: m.PlaysPage })));
const SportsPage = lazy(() => import('./pages/SportsPage').then((m) => ({ default: m.SportsPage })));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })));
const TheatresPage = lazy(() => import('./pages/TheatresPage').then((m) => ({ default: m.TheatresPage })));
const OffersPage = lazy(() => import('./pages/OffersPage').then((m) => ({ default: m.OffersPage })));
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage').then((m) => ({ default: m.MovieDetailsPage })));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage').then((m) => ({ default: m.EventDetailsPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then((m) => ({ default: m.PaymentPage })));
const BookingsHistoryPage = lazy(() => import('./pages/BookingsHistoryPage').then((m) => ({ default: m.BookingsHistoryPage })));
// Auth Signups
const CustomerSignup = lazy(() => import('./pages/auth/CustomerSignup').then((m) => ({ default: m.CustomerSignup })));
const TheaterManagerSignup = lazy(() => import('./pages/auth/TheaterManagerSignup').then((m) => ({ default: m.TheaterManagerSignup })));
// Admin Pages & Layout
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview').then((m) => ({ default: m.DashboardOverview })));
const ManageMovies = lazy(() => import('./pages/admin/ManageMovies').then((m) => ({ default: m.ManageMovies })));
const ManageTheatres = lazy(() => import('./pages/admin/ManageTheatres').then((m) => ({ default: m.ManageTheatres })));
const TheatreRequests = lazy(() => import('./pages/admin/TheatreRequests').then((m) => ({ default: m.TheatreRequests })));
// Manager Pages & Layout
const ManagerLayout = lazy(() => import('./components/manager/ManagerLayout').then((m) => ({ default: m.ManagerLayout })));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard').then((m) => ({ default: m.ManagerDashboard })));
const ManagerScreens = lazy(() => import('./pages/manager/ManagerScreens').then((m) => ({ default: m.ManagerScreens })));
const ManagerShows = lazy(() => import('./pages/manager/ManagerShows').then((m) => ({ default: m.ManagerShows })));
const ManagerBookings = lazy(() => import('./pages/manager/ManagerBookings').then((m) => ({ default: m.ManagerBookings })));
const ManagerStaff = lazy(() => import('./pages/manager/ManagerStaff').then((m) => ({ default: m.ManagerStaff })));
const ManagerProfile = lazy(() => import('./pages/manager/ManagerProfile').then((m) => ({ default: m.ManagerProfile })));

/** Full-bleed placeholder shown while a lazy route chunk downloads. */
const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
  </div>
);
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
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </div>

      {/* Global Footer for discovery routes */}
      {showGlobalChrome && <Footer />}
    </div>);
}
export function App() {
    return (<Router>
      <AuthProvider>
        <ErrorBoundary>
          <AppLayout />
        </ErrorBoundary>
      </AuthProvider>
    </Router>);
}
export default App;
