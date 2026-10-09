import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { MovieDetailsPage } from './pages/MovieDetailsPage'
import { SeatSelectionPage } from './pages/SeatSelectionPage'
import { TheatreSelectionPage } from './pages/TheatreSelectionPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { PaymentPlaceholderPage } from './pages/PaymentPlaceholderPage'
import { BookingConfirmationPage } from './pages/BookingConfirmationPage'
import { MyBookingsPage } from './pages/MyBookingsPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ProfilePage } from './pages/ProfilePage'
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage'
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage'
import { TicketVerificationPage } from './pages/staff/TicketVerificationPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { ManageUsersPage } from './pages/admin/ManageUsersPage'
import { ManageTheatresPage } from './pages/admin/ManageTheatresPage'
import { ProtectedRoute } from './components/ProtectedRoute'

const areas = ['customer', 'manager', 'staff', 'admin'] as const

function AreaPlaceholder({ area }: { area: string }) { return <main className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-3xl font-bold capitalize">{area} area</h1><p className="mt-3 text-slate-300">This route is reserved for the {area} experience.</p><Link className="mt-6 inline-block text-indigo-400 underline" to="/">Back to home</Link></div></main> }
function NotFound() { return <AreaPlaceholder area="page not found" /> }

export default function App() { return <Routes><Route path="/" element={<HomePage />} /><Route path="/movies/:id" element={<MovieDetailsPage />} /><Route path="/movies/:id/showtimes" element={<ProtectedRoute><TheatreSelectionPage /></ProtectedRoute>} /><Route path="/seats" element={<SeatSelectionPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/payment" element={<PaymentPlaceholderPage />} /><Route path="/booking-confirmation" element={<BookingConfirmationPage />} /><Route path="/my-bookings" element={<ProtectedRoute roles={['customer']}><MyBookingsPage /></ProtectedRoute>} /><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignupPage />} /><Route path="/profile" element={<ProtectedRoute roles={['customer']}><ProfilePage /></ProtectedRoute>} /><Route path="/manager" element={<ProtectedRoute roles={['manager']}><ManagerDashboardPage /></ProtectedRoute>} /><Route path="/staff" element={<ProtectedRoute roles={['staff']}><StaffDashboardPage /></ProtectedRoute>} /><Route path="/staff/tickets" element={<ProtectedRoute roles={['staff']}><TicketVerificationPage /></ProtectedRoute>} /><Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} /><Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsersPage /></ProtectedRoute>} /><Route path="/admin/theatres" element={<ProtectedRoute roles={['admin']}><ManageTheatresPage /></ProtectedRoute>} />{areas.map((area) => <Route key={area} path={`/${area}/*`} element={<ProtectedRoute roles={[area]}><AreaPlaceholder area={area} /></ProtectedRoute>} />)}<Route path="*" element={<NotFound />} /></Routes> }
