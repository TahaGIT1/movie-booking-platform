import { API_BASE_URL } from '../config/constants';

const getHeaders = (hasBody = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return await res.json();
  },

  register: async (userData) => {
    const res = await fetch(API_BASE_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || data.message || 'Registration failed');
    }
    return data;
  },

  registerTheatreManager: async (managerData) => {
    const res = await fetch(API_BASE_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...managerData, role: 'THEATRE_MANAGER' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || data.message || 'Theatre Manager registration failed');
    }
    return data;
  },

  logout: async () => {
    try {
      const res = await fetch(API_BASE_URL + '/auth/logout', {
        method: 'POST',
        headers: getHeaders(true)
      });
      return await res.json().catch(() => ({}));
    } catch (e) {
      console.warn('Backend logout failed:', e);
      return { success: false };
    }
  },

  // Movies
  getMovies: async () => {
    const res = await fetch(API_BASE_URL + '/movies');
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data;
  },

  searchMovies: async (q) => {
    const res = await fetch(`${API_BASE_URL}/movies/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) return [];
    return data.data || [];
  },

  getAdminMovies: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/movies`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch movies');
    return data.data || [];
  },

  createMovie: async (movieData) => {
    const res = await fetch(`${API_BASE_URL}/admin/movies`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(movieData),
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error?.message || data.message || 'Failed to create movie';
      throw new Error(errMsg);
    }
    return data.data || data;
  },

  updateMovie: async (movieId, movieData) => {
    const res = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(movieData),
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error?.message || data.message || 'Failed to update movie';
      throw new Error(errMsg);
    }
    return data.data || data;
  },

  deleteMovie: async (movieId) => {
    const res = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete movie');
    return data;
  },

  // Super Admin
  getAdminTheatres: async (status) => {
    const url = status 
      ? `${API_BASE_URL}/admin/theatres?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/admin/theatres`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Authentication required (401). Please sign in as Super Admin.');
      }
      throw new Error(data.message || data.error?.message || 'Failed to fetch theatres');
    }
    return data.data || [];
  },

  approveTheatre: async (theatreId, status = 'APPROVED') => {
    const res = await fetch(`${API_BASE_URL}/admin/theatres/${theatreId}/approve`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) throw new Error('Authentication required (401). Please sign in as Super Admin.');
      throw new Error(data.message || data.error?.message || 'Failed to approve theatre');
    }
    return data;
  },

  rejectTheatre: async (theatreId, reason) => {
    const res = await fetch(`${API_BASE_URL}/admin/theatres/${theatreId}/reject`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) throw new Error('Authentication required (401). Please sign in as Super Admin.');
      throw new Error(data.message || data.error?.message || 'Failed to reject theatre');
    }
    return data;
  },

  deleteAdminTheatre: async (theatreId) => {
    const res = await fetch(`${API_BASE_URL}/admin/theatres/${theatreId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Authentication required (401): Super Admin session missing or expired. Please sign in as Super Admin.');
      }
      if (res.status === 403) {
        throw new Error('Permission denied (403): Only Super Admins can delete theatres.');
      }
      throw new Error(data.message || data.error?.message || 'Failed to delete theatre');
    }
    return data;
  },

  // Theatre Manager: Profile & Analytics
  getMyTheatre: async () => {
    const res = await fetch(`${API_BASE_URL}/theatres/my`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch your cinema profile');
    return data.data;
  },

  updateMyTheatre: async (updateData) => {
    const res = await fetch(`${API_BASE_URL}/theatres/my`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update theatre profile');
    return data.data;
  },

  getManagerAnalytics: async () => {
    const res = await fetch(`${API_BASE_URL}/theatres/my/analytics`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
    return data.data;
  },

  // Screens
  getScreens: async () => {
    const res = await fetch(`${API_BASE_URL}/manager/screens`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch screens');
    return data.data || [];
  },

  getScreen: async (screenId) => {
    const res = await fetch(`${API_BASE_URL}/manager/screens/${screenId}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch screen details');
    return data.data;
  },

  createScreen: async (screenData) => {
    const res = await fetch(`${API_BASE_URL}/manager/screens`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(screenData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create screen');
    return data.data;
  },

  updateScreen: async (screenId, updateData) => {
    const res = await fetch(`${API_BASE_URL}/manager/screens/${screenId}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update screen');
    return data.data;
  },

  deleteScreen: async (screenId) => {
    const res = await fetch(`${API_BASE_URL}/manager/screens/${screenId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete screen');
    return data;
  },

  configureSeats: async (screenId, seatConfig) => {
    const res = await fetch(`${API_BASE_URL}/manager/screens/${screenId}/seats`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(seatConfig)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to configure seat layout');
    return data;
  },

  bulkUpdateSeats: async (bulkData) => {
    const res = await fetch(`${API_BASE_URL}/manager/seats/bulk-update`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(bulkData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update seats');
    return data;
  },

  // Shows
  getManagerShows: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.screenId) query.append('screenId', params.screenId);
    if (params.movieId) query.append('movieId', params.movieId);
    
    const url = `${API_BASE_URL}/manager/shows?${query.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shows');
    return data.data || [];
  },

  createShow: async (showData) => {
    const res = await fetch(`${API_BASE_URL}/manager/shows`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(showData)
    });
    const data = await res.json();
    if (!res.ok) {
      const errMessage = data.error?.message || data.message || 'Failed to schedule show';
      throw new Error(errMessage);
    }
    return data.data;
  },

  updateShow: async (showId, updateData) => {
    const res = await fetch(`${API_BASE_URL}/manager/shows/${showId}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update show');
    return data.data;
  },

  updateMovieShowsPricing: async (movieId, baseTierPricing) => {
    const res = await fetch(`${API_BASE_URL}/manager/shows/movie/${movieId}/pricing`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ baseTierPricing })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update movie pricing');
    return data;
  },

  cancelShow: async (showId) => {
    const res = await fetch(`${API_BASE_URL}/manager/shows/${showId}/cancel`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to cancel show');
    return data;
  },

  deleteShow: async (showId) => {
    const res = await fetch(`${API_BASE_URL}/manager/shows/${showId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete show');
    return data;
  },

  // Bookings Administration
  getTheatreBookings: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.showId) query.append('showId', params.showId);
    if (params.search) query.append('search', params.search);

    const url = `${API_BASE_URL}/bookings/theatre?${query.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch theatre bookings');
    return data.data || [];
  },

  // Staff Management
  getStaff: async () => {
    const res = await fetch(`${API_BASE_URL}/manager/staff`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch staff');
    return data.data || [];
  },

  createStaff: async (staffData) => {
    const res = await fetch(`${API_BASE_URL}/manager/staff`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(staffData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.message || 'Failed to create staff member');
    return data.data;
  },

  toggleStaffStatus: async (staffId) => {
    const res = await fetch(`${API_BASE_URL}/manager/staff/${staffId}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to toggle staff status');
    return data;
  },

  deleteStaff: async (staffId) => {
    const res = await fetch(`${API_BASE_URL}/manager/staff/${staffId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to remove staff');
    return data;
  },

  validateTicket: async (bookingId) => {
    const res = await fetch(`${API_BASE_URL}/staff/validate-ticket`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ticket validation failed');
    return data;
  },

  // Customer Facing Services
  getMovieById: async (movieId) => {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch movie');
    return data.data || data;
  },

  getPublicShows: async ({ movieId, city, date } = {}) => {
    const query = new URLSearchParams();
    if (movieId) query.append('movieId', movieId);
    if (city) query.append('city', city);
    if (date) query.append('date', date);

    const res = await fetch(`${API_BASE_URL}/shows/public?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shows');
    return data.data || [];
  },

  getShowById: async (showId) => {
    const res = await fetch(`${API_BASE_URL}/shows/${showId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch show details');
    return data.data;
  },

  getShowSeats: async (showId) => {
    const res = await fetch(`${API_BASE_URL}/shows/${showId}/seats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load seats');
    return data.data || [];
  },

  lockSeats: async (showId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/shows/${showId}/seats/lock`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ seatIds })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error?.message || data.message || 'Failed to lock seats');
      err.code = data.error?.code;
      err.details = data.error?.details;
      throw err;
    }
    return data;
  },

  releaseSeats: async (showId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/shows/${showId}/seats/release`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ seatIds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to release seats');
    return data;
  },

  releaseAllHolds: async () => {
    const res = await fetch(`${API_BASE_URL}/shows/release-all-holds`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.message || 'Failed to release all holds');
    return data;
  },

  getMyActiveHold: async () => {
    const res = await fetch(`${API_BASE_URL}/shows/my-active-hold`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.message || 'Failed to check active hold');
    return data.data;
  },

  initiateBooking: async (showId, seatIds) => {
    const res = await fetch(`${API_BASE_URL}/bookings/initiate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ showId, seatIds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error?.message || 'Failed to initiate booking');
    return data.data;
  },

  mockPayment: async (bookingId, status = 'SUCCESS') => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/mock-payment`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Payment simulation failed');
    return data;
  },

  getBookingById: async (bookingId) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch booking');
    return data.data;
  },

  getMyBookings: async () => {
    const res = await fetch(`${API_BASE_URL}/bookings/my`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch your bookings');
    return data.data || [];
  },

  cancelBooking: async (bookingId) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to cancel booking');
    return data;
  },

  getUserProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch user profile');
    return data.data;
  },

  updateUserProfile: async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update user profile');
    return data.data;
  },

  getPublicTheatres: async (city) => {
    const url = city && city !== 'All Cities' && city !== 'All'
      ? `${API_BASE_URL}/theatres?city=${encodeURIComponent(city)}`
      : `${API_BASE_URL}/theatres`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch theatres');
    return data.data || [];
  },

  getNotifications: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) return { data: [], unreadCount: 0 };
    return data;
  },

  markNotificationRead: async (notificationId) => {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return await res.json();
  },

  markAllNotificationsRead: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await res.json();
  },

  // Movie Reviews (Feature 12)
  getMovieReviews: async (movieId) => {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews`);
    const data = await res.json();
    return data;
  },

  submitMovieReview: async (movieId, reviewData) => {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(reviewData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit review');
    return data;
  },

  deleteMovieReview: async (movieId) => {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  // Watchlist (Feature 13)
  getWatchlistStatus: async (movieId) => {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}/watchlist`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data;
  },

  toggleWatchlist: async (movieId) => {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}/watchlist`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update watchlist');
    return data;
  },

  getMyWatchlist: async () => {
    const res = await fetch(`${API_BASE_URL}/movies/watchlist/my`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data;
  }
};

