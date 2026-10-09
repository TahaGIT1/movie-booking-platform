import { API_BASE_URL } from '../config/constants';

export const api = {
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
  getMovies: async () => {
    const res = await fetch(API_BASE_URL + '/movies');
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data;
  }
};
