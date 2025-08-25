import axios from "axios";

// Base API URL - dynamically handle optional /api prefix
const BACKEND_BASE = "http://192.168.43.214:8000";

// Use a single prefix for API routes
const API_PREFIX = "/api";

// Full API base
const API_BASE = `${BACKEND_BASE}${API_PREFIX}`;

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      return state?.access;
    }
    return localStorage.getItem("accessToken");
  } catch (error) {
    console.error("Error reading auth storage:", error);
    return localStorage.getItem("accessToken");
  }
};

// Helper function to get refresh token
const getRefreshToken = () => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      return state?.refresh;
    }
    return localStorage.getItem("refreshToken");
  } catch (error) {
    console.error("Error reading refresh token:", error);
    return localStorage.getItem("refreshToken");
  }
};

// Update auth tokens
const updateAuthTokens = (access, refresh = null) => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const newAuthData = {
        ...parsed,
        state: { 
          ...parsed.state, 
          access,
          ...(refresh && { refresh })
        }
      };
      localStorage.setItem("auth-storage", JSON.stringify(newAuthData));
    } else {
      localStorage.setItem("accessToken", access);
      if (refresh) localStorage.setItem("refreshToken", refresh);
    }
  } catch (error) {
    console.error("Error updating auth storage:", error);
    localStorage.setItem("accessToken", access);
    if (refresh) localStorage.setItem("refreshToken", refresh);
  }
};

// Axios instance
export const api = axios.create({
  baseURL: API_BASE,
});

// -------------------------------
// Request interceptor - attach JWT
// -------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------
// Response interceptor - handle refresh
// -------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE}/token/refresh/`, { refresh: refreshToken });
          const { access } = response.data;
          updateAuthTokens(access);

          // Retry original request with new token
          original.headers.Authorization = `Bearer ${access}`;
          return api(original);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// -------------------------------
// Legacy setter
// -------------------------------
export function setAuth(token) {
  if (token) {
    updateAuthTokens(token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
  }
}

// -------------------------------
// Auth endpoints
// -------------------------------
export const login = (username, password) => api.post("/token/", { username, password }).then(res => {
  if (res.data.access) updateAuthTokens(res.data.access, res.data.refresh);
  return res;
});

export const refreshToken = (refresh) => api.post("/token/refresh/", { refresh });
export const registerUser = (data) => api.post("/register/", data);
export const fetchUserProfile = () => api.get("/profile/");

// -------------------------------
// Overview / Dashboard
// -------------------------------
export const fetchOverview = () => api.get("/status/overview/");

// -------------------------------
// Alerts
// -------------------------------
export const fetchAlerts = () => api.get("/alerts/");
export const ackAlert = (id) => api.post(`/alerts/${id}/ack/`);
export const resolveAlert = (id) => api.post(`/alerts/${id}/resolve/`);

// -------------------------------
// Geofences
// -------------------------------
export const fetchGeofences = () => api.get("/geofences/");
export const patchGeofenceRadius = (geofenceId, radius_meters) =>
  api.patch(`/geofences/${geofenceId}/radius/`, { radius_meters });

// -------------------------------
// Device history
// -------------------------------
export const historyForDevice = (deviceId, fromISO, toISO) =>
  api.get(`/devices/${deviceId}/history/`, { params: { from: fromISO, to: toISO } });

// -------------------------------
// Equipment
// -------------------------------
export const fetchEquipment = () => api.get("/equipment/");
export const createEquipment = (data) => api.post("/equipment/", data);

// -------------------------------
// Employees
// -------------------------------
export const fetchEmployees = () => api.get("/employees/");
export const createEmployee = (data) => api.post("/employees/", data);
