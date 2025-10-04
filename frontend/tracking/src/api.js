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
// Equipment CRUD Operations
// -------------------------------
export const fetchEquipments = () => api.get("/equipment/");
export const fetchEquipment = () => api.get("/equipment/"); // Alias for consistency

export const saveEquipment = (data, id = null) => {
  if (id) {
    return api.put(`/equipment/${id}/`, data);
  } else {
    return api.post("/equipment/", data);
  }
};

export const createEquipment = (data) => api.post("/equipment/", data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}/`, data);

export const deleteEquipment = async (equipmentId) => {
  try {
    const response = await api.delete(`/equipment/${equipmentId}/`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete equipment:", error);
    throw error;
  }
};


// -------------------------------
// Generic delete function
// -------------------------------
export const deleteLivestock = async (id) => {
  const response = await api.delete(`/livestock/delete/${id}/`);
  return response.data;
};

export const deleteAlert = async (alertId) => {
  try {
    const response = await api.delete(`/alerts/${alertId}/`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete alert:", error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId) => {
  try {
    const response = await api.delete(`/employees/delete/${employeeId}/`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete employee:", error);
    throw error;
  }
};

export const deleteItem = async (itemType, itemId) => {
  try {
    let endpoint;
    switch (itemType) {
      case "equipment":
        endpoint = `/equipment/delete/${itemId}/`;
        break;
      case "employee":
        endpoint = `/employees/delete/${itemId}/`;
        break;
      case "alert":
        endpoint = `/alerts/${itemId}/`;
        break;
      case "livestock":
        endpoint = `/livestock/delete/${itemId}/`;
        break;
      default:
        throw new Error(`Unsupported item type: ${itemType}`);
    }
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error("Failed to delete item:", error);
    throw error;
  }
};

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
// User Profile Management
// -------------------------------
export const userProfileApi = {
  getProfile: () => api.get("/profile/"),
  updateProfile: (profileData) => api.put("/profile/", profileData),
  patchProfile: (updates) => api.patch("/profile/", updates),
  changePassword: (currentPassword, newPassword) => 
    api.post("/change-password/", { current_password: currentPassword, new_password: newPassword }),
  updateProfilePhoto: (photoFile) => {
    const formData = new FormData();
    formData.append("profile_photo", photoFile);
    return api.patch("/profile/photo/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateNotificationPreferences: (preferences) => 
    api.patch("/profile/notifications/", { notification_preferences: preferences }),
  getActivityLogs: (limit = 50) => 
    api.get("/profile/activity/", { params: { limit } }),
};

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
// Geofences - CORRECTED ENDPOINTS
// -------------------------------
export const fetchGeofences = () => api.get("/geofences-api/");
export const createGeofence = (geofenceData) => api.post("/geofences-api/", geofenceData);
export const updateGeofence = (id, geofenceData) => api.put(`/geofences-api/${id}/`, geofenceData);
export const deleteGeofence = (id) => api.delete(`/geofences-api/${id}/`);
export const checkLocationInGeofence = (latitude, longitude) => 
  api.post("/geofences-api/check_location/", { latitude, longitude });

// Legacy geofence endpoints (if you still need them)
export const patchGeofenceRadius = (geofenceId, radius_meters) =>
  api.patch(`/geofences/${geofenceId}/radius/`, { radius_meters });

// -------------------------------
// Geofence API functions - CORRECTED
// -------------------------------
export const geofenceApi = {
  getGeofences: () => api.get('/geofences-api/'),
  createGeofence: (geofenceData) => api.post('/geofences-api/', geofenceData),
  updateGeofence: (id, geofenceData) => api.put(`/geofences-api/${id}/`, geofenceData),
  deleteGeofence: (id) => api.delete(`/geofences-api/${id}/`),
  checkLocation: (latitude, longitude) => 
    api.post('/geofences-api/check_location/', { latitude, longitude }),
  checkDeviceInGeofence: (deviceData) => 
    api.post('/geofences-api/check_location/', {
      latitude: deviceData.latitude,
      longitude: deviceData.longitude
    })
};

// Clear all alerts
export const clearAllAlerts = async () => {
  try {
    const response = await api.post("/alerts/clear-all/", {});
    return response.data;
  } catch (err) {
    console.error("Error clearing alerts:", err.response || err.message);
    throw err;
  }
};

// -------------------------------
// Device history
// -------------------------------
export const historyForDevice = (deviceId, fromISO, toISO) =>
  api.get(`/devices/${deviceId}/history/`, { params: { from: fromISO, to: toISO } });

// -------------------------------
// Employees
// -------------------------------
export const fetchEmployees = () => api.get("/employees/");
export const createEmployee = (data) => api.post("/employees/", data);

// -------------------------------
// Helper function for error handling
// -------------------------------
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    console.error("API Error:", error.response.data);
    return {
      error: true,
      message: error.response.data.detail || error.response.data.message || "An error occurred",
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response received
    console.error("Network Error:", error.request);
    return {
      error: true,
      message: "Network error. Please check your connection.",
      status: null
    };
  } else {
    // Something else happened
    console.error("Error:", error.message);
    return {
      error: true,
      message: error.message || "An unexpected error occurred",
      status: null
    };
  }
};

export { API_BASE };