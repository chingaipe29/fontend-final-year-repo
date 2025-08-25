import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./store/auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Track from "./pages/Track";
import { useEffect } from "react";
import { setAuth } from "./api";
import AddEmployeeForm from './pages/Employee';
import AddEquipmentForm from './pages/Equipment';
import AddLivestockForm from './pages/Livestock';
// In your main App component or index.js


function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated() ? children : <Navigate to="/" />;
}

export default function App() {
  const { access } = useAuth();

  useEffect(() => {
    if (access) setAuth(access);
  }, [access]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route
  path="/map"
  element={
    <PrivateRoute>  {/* ← Change to PrivateRoute */}
      <Track />   {/* ← Create a new MapView component */}
    </PrivateRoute>
  }
/>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected routes - FLAT structure */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-employee"
          element={
            <PrivateRoute>
              <AddEmployeeForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-equipment"
          element={
            <PrivateRoute>
              <AddEquipmentForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-livestock"
          element={
            <PrivateRoute>
              <AddLivestockForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/track/:deviceId"
          element={
            <PrivateRoute>
              <Track />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            useAuth().isAuthenticated() ? <Navigate to="/" /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}