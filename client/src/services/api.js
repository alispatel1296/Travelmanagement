// Base API request wrapper
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('tf_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me'),
    getDrivers: () => request('/auth/drivers')
  },

  // Fleet Vehicles
  vehicles: {
    getAll: (params = '') => request(`/vehicles${params ? `?${params}` : ''}`),
    getById: (id) => request(`/vehicles/${id}`),
    create: (vehicleData) => request('/vehicles', { method: 'POST', body: JSON.stringify(vehicleData) }),
    update: (id, updates) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' })
  },

  // Transit Routes & Stops
  routes: {
    getAll: () => request('/routes'),
    getById: (id) => request(`/routes/${id}`),
    create: (routeData) => request('/routes', { method: 'POST', body: JSON.stringify(routeData) }),
    delete: (id) => request(`/routes/${id}`, { method: 'DELETE' })
  },

  // Scheduled Trips & Dispatch
  trips: {
    getAll: (params = '') => request(`/trips${params ? `?${params}` : ''}`),
    getById: (id) => request(`/trips/${id}`),
    create: (tripData) => request('/trips', { method: 'POST', body: JSON.stringify(tripData) }),
    advanceStop: (id) => request(`/trips/${id}/advance-stop`, { method: 'PATCH' }),
    updateStatus: (id, status) => request(`/trips/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getDriverTrips: () => request('/trips/my-assigned')
  },

  // Passenger Bookings
  bookings: {
    getAll: () => request('/bookings'),
    create: (bookingData) => request('/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
    getMy: () => request('/bookings/my'),
    cancel: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
    verifyToken: (token) => request('/bookings/verify-token', { method: 'POST', body: JSON.stringify({ token }) })
  },

  // Analytics & Dashboard
  analytics: {
    getDashboard: () => request('/analytics/dashboard')
  },

  // Live Database Inspector
  database: {
    getTables: () => request('/database/tables'),
    getTableData: (tableName) => request(`/database/table/${tableName}`)
  }
};
