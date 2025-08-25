import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode"; // <-- named import
import { login as apiLogin, refreshToken, setAuth } from "../api";


export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,
      access: null,
      refresh: null,

      // -----------------------
      // Login
      // -----------------------
      async login(username, password) {
        try {
          const response = await apiLogin(username, password);
          const { access, refresh } = response.data;

          // Decode user info from JWT
          const decodedUser = jwtDecode(access);

          // Store tokens and user info
          set({ user: decodedUser, access, refresh });

          // Set global axios header
          setAuth(access);

          return { success: true };
        } catch (error) {
          console.error("Login failed:", error);
          throw error;
        }
      },

      // -----------------------
      // Logout
      // -----------------------
      logout() {
        set({ user: null, access: null, refresh: null });
        setAuth(null);
        localStorage.removeItem("auth-storage"); // clear persisted state
      },

      // -----------------------
      // Check if authenticated
      // -----------------------
      isAuthenticated: () => {
        const { access } = get();
        if (!access) return false;

        try {
          const decoded = jwtDecode(access);
          const currentTime = Date.now() / 1000;
          return decoded.exp > currentTime;
        } catch {
          return false;
        }
      },

      getCurrentUser: () => get().user,

      // -----------------------
      // Refresh access token
      // -----------------------
      async refreshAccess() {
        const { refresh } = get();
        if (!refresh) return false;

        try {
          const response = await refreshToken(refresh);
          const { access } = response.data;

          set({ access });
          setAuth(access);

          // Update persisted state manually
          const authStorage = localStorage.getItem("auth-storage");
          if (authStorage) {
            const { state } = JSON.parse(authStorage);
            const newAuthData = { ...JSON.parse(authStorage), state: { ...state, access } };
            localStorage.setItem("auth-storage", JSON.stringify(newAuthData));
          }

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },
    }),
    { name: "auth-storage" } // Zustand persist key
  )
);
