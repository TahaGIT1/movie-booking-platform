import { API_BASE_URL } from '../config/constants';

const getHeaders = (hasBody = false) => {
  const token = localStorage.getItem('token') || localStorage.getItem('cinepass_token');
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

  // Movies
  getMovies: async () => {
    const res = await fetch(API_BASE_URL + '/movies');
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data;
  },

  // Super Admin
  getAdminTheatres: async (status) => {
    const url = status 
      ? `${API_BASE_URL}/admin/theatres?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/admin/theatres`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch theatres');
    return data.data || [];
  },

  approveTheatre: async (theatreId, status = 'APPROVED') => {
    const res = await fetch(`${API_BASE_URL}/admin/theatres/${theatreId}/approve`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to approve theatre');
    return data;
  },

  rejectTheatre: async (theatreId, reason) => {
    const res = await fetch(`${API_BASE_URL}/admin/theatres/${theatreId}/reject`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to reject theatre');
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
  }
};
