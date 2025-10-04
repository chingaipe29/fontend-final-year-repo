import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAlerts, deleteAlert, resolveAlert } from "../api";

// --- Icons ---
const AlertIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
);

const LocationIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// --- Alerts Component ---
export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, message: "", payload: null });

  const fetchAlertsData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const alertsResponse = await fetchAlerts();
      const data = alertsResponse?.data || [];
      console.log("Fetched alerts:", data);

      // Keep only latest alert per device
      const latestMap = new Map();
      data.forEach(alert => {
        const deviceId = alert.device_id || "unknown";
        const existing = latestMap.get(deviceId);
        if (!existing || new Date(alert.created_at || Date.now()) > new Date(existing.created_at || Date.now())) {
          latestMap.set(deviceId, alert);
        }
      });

      setAlerts(Array.from(latestMap.values()));
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError("Failed to load alerts. Please check your connection.");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertsData();
  }, [fetchAlertsData]);

  // --- Modal ---
  const ConfirmModal = ({ open, message, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm Action</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  const handleModalConfirm = async () => {
    const { action, payload } = confirmModal;
    setConfirmModal({ open: false, action: null, message: "", payload: null });

    try {
      if (action === "resolve") {
        await resolveAlert(payload);
        setAlerts(prev => prev.filter(alert => alert.id !== payload));
        setSuccess("Alert resolved successfully");
      } else if (action === "delete") {
        await deleteAlert(payload);
        setAlerts(prev => prev.filter(alert => alert.id !== payload));
        setSuccess("Alert deleted successfully");
      } else if (action === "clearAll") {
        await Promise.all(alerts.map(alert => deleteAlert(alert.id)));
        setAlerts([]);
        setSuccess("All alerts cleared successfully");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Action failed:", err);
      setError("Action failed");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleResolveAlert = (alertId) => setConfirmModal({
    open: true,
    action: "resolve",
    message: "Are you sure you want to resolve this alert?",
    payload: alertId,
  });

  const handleDeleteAlert = (alertId) => setConfirmModal({
    open: true,
    action: "delete",
    message: "Are you sure you want to delete this alert?",
    payload: alertId,
  });

  const handleClearAllAlerts = () => setConfirmModal({
    open: true,
    action: "clearAll",
    message: "Are you sure you want to clear all alerts? This action cannot be undone.",
    payload: null,
  });

  const AlertCard = ({ alert, onResolve, onDelete }) => (
    <div className="flex items-start justify-between p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
      <div className="flex items-start space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertIcon className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase">{alert.alert_type}</span>
            <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-900 font-medium mb-1">{alert.message}</p>
          <p className="text-xs text-gray-500">Device: {alert.device_id || "Unknown"}</p>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center space-x-2">
        <button title="View location" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
          <LocationIcon className="w-4 h-4" />
        </button>
        <button onClick={() => onResolve(alert.id)} title="Resolve alert" className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button onClick={() => onDelete(alert.id)} title="Delete alert" className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors">
          <TrashIcon />
        </button>
      </div>
    </div>
  );

  if (loading && alerts.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3 max-w-sm">
          <AlertIcon className="w-5 h-5 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">×</button>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3 max-w-sm">
          ✓
          <div className="flex-1">{success}</div>
          <button onClick={() => setSuccess("")} className="text-green-700 hover:text-green-900">×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <button onClick={fetchAlertsData} disabled={loading} className={`p-2 rounded-lg transition-colors ${loading ? 'animate-spin' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`} title="Refresh alerts">
            🔄
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
                <p className="text-gray-500 mt-1">Recent notifications requiring attention</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</span>
                {alerts.length > 0 && (
                  <button onClick={handleClearAllAlerts} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                    Clear All
                  </button>
                )}
              </div>
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} onDelete={handleDeleteAlert} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <AlertIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium">No active alerts</p>
                <p className="text-sm">You're all caught up for now!</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onConfirm={handleModalConfirm}
        onCancel={() => setConfirmModal({ open: false, action: null, message: "", payload: null })}
      />
    </div>
  );
}
