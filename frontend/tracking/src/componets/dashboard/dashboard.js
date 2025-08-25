import React, { useState, useEffect } from 'react';
import { 
  Home, Truck, UserCheck, Beef, Map, 
  Wifi, WifiOff, Moon, Sun, AlertTriangle,
  CheckCircle, XCircle, Clock, Navigation,
  PlusCircle, Save, X, Menu, User, Settings, LogOut,
  Play, StopCircle, MapPin, Activity, RotateCcw, RefreshCw
} from 'lucide-react';

// API Service Functions
const apiService = {
  // Fetch all assets from Django server
  fetchAssets: async () => {
    try {
      const response = await fetch('http://localhost:8000/api/assets/');
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  },

  // Fetch specific asset details
  fetchAssetDetails: async (assetId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assets/${assetId}/`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching asset details:', error);
      throw error;
    }
  },

  // Fetch tracking history for an asset
  fetchTrackingHistory: async (assetId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assets/${assetId}/tracking/`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      throw error;
    }
  },

  // Register a new asset
  registerAsset: async (assetData) => {
    try {
      const response = await fetch('http://localhost:8000/api/assets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error registering asset:', error);
      throw error;
    }
  }
};

// Tracking Page Component
const TrackingPage = ({ asset, onClose, onStopTracking }) => {
  const [currentPosition, setCurrentPosition] = useState(asset.lastLocation);
  const [speed, setSpeed] = useState(0);
  const [isTracking, setIsTracking] = useState(true);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real tracking data from Django server
  const fetchTrackingData = async () => {
    if (!isTracking) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.fetchAssetDetails(asset.id);
      setCurrentPosition(data.lastLocation);
      setSpeed(data.speed || 0);
      
      // Add to history
      setHistory(prev => [...prev, {
        position: data.lastLocation,
        speed: data.speed || 0,
        timestamp: new Date(data.lastUpdate)
      }]);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial tracking history
  useEffect(() => {
    const loadTrackingHistory = async () => {
      try {
        const historyData = await apiService.fetchTrackingHistory(asset.id);
        setHistory(historyData.map(item => ({
          position: item.location,
          speed: item.speed,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading tracking history:', error);
      }
    };
    
    loadTrackingHistory();
  }, [asset.id]);

  // Set up interval for live tracking
  useEffect(() => {
    if (!isTracking) return;

    fetchTrackingData(); // Initial fetch
    
    const interval = setInterval(fetchTrackingData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatSpeed = (speed) => {
    return `${speed.toFixed(1)} km/h`;
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString();
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    onStopTracking();
  };

  const handleRefresh = () => {
    fetchTrackingData();
  };

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <div className="tracking-title">
          <h2>Live Tracking</h2>
          <span className="asset-name">Tracking: {asset.name}</span>
        </div>
        <div className="tracking-controls">
          <button 
            className={`tracking-btn ${isTracking ? 'active' : ''}`}
            onClick={() => setIsTracking(!isTracking)}
            disabled={isLoading}
          >
            {isTracking ? <StopCircle size={20} /> : <Play size={20} />}
            {isTracking ? 'Pause' : 'Resume'}
          </button>
          <button className="btn-secondary" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={20} />
            Refresh
          </button>
          <button className="btn-secondary" onClick={handleStopTracking}>
            <RotateCcw size={20} />
            Stop Tracking
          </button>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>
        
      <div className="tracking-content">
        {/* Map Section - Now taking central role */}
        <div className="tracking-map">
          <div className="map-header">
            <h3>Live Location Map</h3>
            <div className="map-status">
              {isTracking && !isLoading && (
                <div className="live-indicator">
                  <div className="pulse-dot"></div>
                  <span>Live</span>
                </div>
              )}
              {isLoading && <span>Updating...</span>}
            </div>
          </div>
          
          <div className="map-container">
            {/* In a real app, this would be a proper map component like Leaflet or Google Maps */}
            <div className="map-visualization">
              <div className="map-overlay">
                <div className="current-marker">
                  <MapPin size={32} className="marker-icon" />
                  <div className="marker-label">Current Position</div>
                </div>
                
                {/* Path visualization */}
                {history.length > 0 && (
                  <div className="travel-path">
                    {history.slice(-10).map((point, i) => (
                      <div 
                        key={i} 
                        className="path-point"
                        style={{
                          left: `${50 + (point.position.lng - currentPosition.lng) * 1000}%`,
                          bottom: `${50 + (point.position.lat - currentPosition.lat) * 1000}%`
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="map-coordinates">
                <span>{formatCoordinates(currentPosition.lat, currentPosition.lng)}</span>
              </div>
            </div>
          </div>
          
          <div className="map-controls">
            <button className="btn-secondary">
              <Save size={16} />
              Save Route
            </button>
            <button className="btn-secondary">
              <Map size={16} />
              Full Screen
            </button>
          </div>
        </div>

        {/* Info Panel - Now on the side */}
        <div className="tracking-info">
          <div className="info-card">
            <h3>Current Position</h3>
            <div className="info-item">
              <MapPin size={16} />
              <span>Coordinates: {formatCoordinates(currentPosition.lat, currentPosition.lng)}</span>
            </div>
            <div className="info-item">
              <Activity size={16} />
              <span>Speed: {formatSpeed(speed)}</span>
            </div>
            <div className="info-item">
              <Clock size={16} />
              <span>Last Update: {formatTime(new Date())}</span>
            </div>
          </div>

          <div className="info-card">
            <h3>Asset Information</h3>
            <div className="info-item">
              <span>Name: {asset.name}</span>
            </div>
            <div className="info-item">
              <span>Type: {asset.type}</span>
            </div>
            <div className="info-item">
              <span>Tracker ID: {asset.trackerId}</span>
            </div>
            <div className="info-item">
              <span>Status: <span className={`status-${asset.status}`}>{asset.status}</span></span>
            </div>
          </div>

          {/* Movement History - Now below the map */}
          <div className="tracking-history">
            <h3>Movement History</h3>
            <div className="history-list">
              {history.slice().reverse().map((entry, index) => (
                <div key={index} className="history-item">
                  <div className="history-coordinates">
                    {formatCoordinates(entry.position.lat, entry.position.lng)}
                  </div>
                  <div className="history-details">
                    <span className="history-speed">{formatSpeed(entry.speed)}</span>
                    <span className="history-time">{formatTime(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="empty-history">
                  <p>No tracking data yet. Movement history will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert Notification Component
const AlertNotification = ({ asset, onTrack, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  const handleTrack = () => {
    setVisible(false);
    onTrack();
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  if (!visible) return null;

  return (
    <div className="alert-notification">
      <div className="alert-content">
        <div className="alert-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="alert-message">
          <h4>Asset Outside Geofence!</h4>
          <p>{asset.name} has moved outside the designated area.</p>
        </div>
        <div className="alert-actions">
          <button className="btn-primary" onClick={handleTrack}>
            <Navigation size={16} />
            Track Asset
          </button>
          <button className="btn-secondary" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

// Registration Form Component
const RegistrationForm = ({ type, onRegister, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    trackerId: '',
    type: type === 'equipment' ? 'vehicle' : 'employee'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.trackerId) {
      onRegister({
        ...formData,
        id: Date.now().toString(),
        status: 'inside',
        lastLocation: { lat: -15.392072, lng: 28.330145 },
        lastUpdate: new Date()
      });
      setFormData({
        name: '',
        trackerId: '',
        type: type === 'equipment' ? 'vehicle' : 'employee'
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const equipmentTypes = [
    'vehicle', 'machinery', 'tool', 'device', 'other'
  ];

  const employeeTypes = [
    'driver', 'operator', 'supervisor', 'manager', 'worker'
  ];

  return (
    <div className="registration-form">
      <div className="form-header">
        <h3>Register New {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <button onClick={onClose} className="close-btn">
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={`Enter ${type} name`}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            {(type === 'equipment' ? equipmentTypes : employeeTypes).map(opt => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="trackerId">GPS Tracker ID *</label>
          <input
            type="text"
            id="trackerId"
            name="trackerId"
            value={formData.trackerId}
            onChange={handleChange}
            placeholder="Enter tracker ID"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            <PlusCircle size={18} />
            Register {type}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ isOpen, onClose, currentView, onViewChange, onRegisterAsset }) => {
  const [activeForm, setActiveForm] = useState(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'equipment', label: 'Equipment', icon: Truck },
    { id: 'employees', label: 'Employees', icon: UserCheck },
    { id: 'livestock', label: 'Livestock', icon: Beef },
    { id: 'geofence', label: 'Geofence', icon: Map },
  ];

  const handleRegister = (type, asset) => {
    onRegisterAsset(type, asset);
    setActiveForm(null);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="header-logo">
            <div className="logo-icon">
              <Navigation size={24} className="icon-white" />
            </div>
            <h2>GPS Tracker</h2>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="registration-section">
          <h3>Quick Registration</h3>
          <div className="registration-buttons">
            <button 
              onClick={() => setActiveForm('equipment')}
              className="btn-register"
            >
              <Truck size={18} />
              Register Equipment
            </button>
            <button 
              onClick={() => setActiveForm('employee')}
              className="btn-register"
            >
              <User size={18} />
              Register Employee
            </button>
          </div>
        </div>

        {/* Registration Forms */}
        {activeForm === 'equipment' && (
          <RegistrationForm
            type="equipment"
            onRegister={(asset) => handleRegister('equipment', asset)}
            onClose={() => setActiveForm(null)}
          />
        )}

        {activeForm === 'employee' && (
          <RegistrationForm
            type="employee"
            onRegister={(asset) => handleRegister('employee', asset)}
            onClose={() => setActiveForm(null)}
          />
        )}

        <div className="sidebar-footer">
          <button className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className="nav-item">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Dashboard Component
const Dashboard = ({ equipment, employees, livestock, geofenceRadius, lastUpdate }) => {
  // Count assets by type and status
  const equipmentCount = equipment.length;
  const employeesCount = employees.length;
  const livestockCount = livestock.length;
  
  const insideCount = [...equipment, ...employees, ...livestock].filter(asset => asset.status === 'inside').length;
  const outsideCount = [...equipment, ...employees, ...livestock].filter(asset => asset.status === 'outside').length;

  const stats = [
    {
      label: 'Total Equipment',
      value: equipmentCount,
      icon: Truck,
      color: 'blue'
    },
    {
      label: 'Total Employees',
      value: employeesCount,
      icon: UserCheck,
      color: 'green'
    },
    {
      label: 'Total Livestock',
      value: livestockCount,
      icon: Beef,
      color: 'purple'
    },
    {
      label: 'Geofence Radius',
      value: `${geofenceRadius}m`,
      icon: Map,
      color: 'orange'
    },
    {
      label: 'Inside Geofence',
      value: insideCount,
      icon: CheckCircle,
      color: 'green',
      status: 'inside'
    },
    {
      label: 'Outside Geofence',
      value: outsideCount,
      icon: XCircle,
      color: 'red',
      status: 'outside'
    }
  ];

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Asset Status Dashboard</h2>
        <div className="last-update">
          <Clock size={16} />
          <span>Last updated: {formatTimeAgo(lastUpdate)}</span>
        </div>
      </div>
      
      <div className="stats-grid">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`stat-card ${stat.status || ''}`}>
              <div className="stat-header">
                <Icon size={20} className={`icon-${stat.color}`} />
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="assets-sections">
        {/* Equipment Section */}
        <div className="asset-section">
          <h3>
            <Truck size={20} className="icon-blue" />
            Equipment Status ({equipment.length})
          </h3>
          {equipment.length === 0 ? (
            <div className="empty-state">
              <p>No equipment registered yet.</p>
            </div>
          ) : (
            <div className="assets-list">
              {equipment.map(asset => (
                <div key={asset.id} className={`asset-item ${asset.status}`}>
                  <div className="asset-info">
                    <span className="asset-name">{asset.name}</span>
                    <span className="asset-category">{asset.type}</span>
                  </div>
                  <div className="asset-status">
                    <div className={`status-indicator ${asset.status}`}>
                      {asset.status === 'inside' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      <span>{asset.status === 'inside' ? 'Inside' : 'Outside'}</span>
                    </div>
                    <div className="asset-update">
                      <Clock size={14} />
                      <span>{formatTimeAgo(asset.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employees Section */}
        <div className="asset-section">
          <h3>
            <UserCheck size={20} className="icon-green" />
            Employees Status ({employees.length})
          </h3>
          {employees.length === 0 ? (
            <div className="empty-state">
              <p>No employees registered yet.</p>
            </div>
          ) : (
            <div className="assets-list">
              {employees.map(asset => (
                <div key={asset.id} className={`asset-item ${asset.status}`}>
                  <div className="asset-info">
                    <span className="asset-name">{asset.name}</span>
                    <span className="asset-category">{asset.type}</span>
                  </div>
                  <div className="asset-status">
                    <div className={`status-indicator ${asset.status}`}>
                      {asset.status === 'inside' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      <span>{asset.status === 'inside' ? 'Inside' : 'Outside'}</span>
                    </div>
                    <div className="asset-update">
                      <Clock size={14} />
                      <span>{formatTimeAgo(asset.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Livestock Section */}
        <div className="asset-section">
          <h3>
            <Beef size={20} className="icon-purple" />
            Livestock Status ({livestock.length})
          </h3>
          {livestock.length === 0 ? (
            <div className="empty-state">
              <p>No livestock registered yet.</p>
            </div>
          ) : (
            <div className="assets-list">
              {livestock.map(asset => (
                <div key={asset.id} className={`asset-item ${asset.status}`}>
                  <div className="asset-info">
                    <span className="asset-name">{asset.name}</span>
                    <span className="asset-category">{asset.type}</span>
                  </div>
                  <div className="asset-status">
                    <div className={`status-indicator ${asset.status}`}>
                      {asset.status === 'inside' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      <span>{asset.status === 'inside' ? 'Inside' : 'Outside'}</span>
                    </div>
                    <div className="asset-update">
                      <Clock size={14} />
                      <span>{formatTimeAgo(asset.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [assets, setAssets] = useState([]);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
  const [alertAsset, setAlertAsset] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingAsset, setTrackingAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch assets from Django server
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const assetsData = await apiService.fetchAssets();
      setAssets(assetsData);
      setLastUpdate(new Date());
      
      // Check if any equipment is outside geofence to show alert
      const outsideEquipment = assetsData.find(
        asset => asset.assetType === 'equipment' && asset.status === 'outside'
      );
      
      if (outsideEquipment) {
        setAlertAsset(outsideEquipment);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      // Fallback to mock data if server is not available
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial mock data (fallback)
  const loadMockData = () => {
    const mockAssets = [
      // Equipment
      { 
        id: '1', 
        name: 'Tractor', 
        type: 'vehicle', 
        assetType: 'equipment',
        status: 'inside', 
        trackerId: 'TRAC001',
        lastLocation: { lat: -15.392072, lng: 28.330145 },
        lastUpdate: new Date(Date.now() - 15 * 60000)
      },
      { 
        id: '2', 
        name: 'Harvester', 
        type: 'machinery', 
        assetType: 'equipment',
        status: 'outside', 
        trackerId: 'HARV002',
        lastLocation: { lat: -15.395000, lng: 28.335000 },
        lastUpdate: new Date(Date.now() - 5 * 60000)
      },
      
      // Employees
      { 
        id: '3', 
        name: 'John Doe', 
        type: 'driver', 
        assetType: 'employee',
        status: 'inside', 
        trackerId: 'EMP001',
        lastLocation: { lat: -15.392100, lng: 28.330200 },
        lastUpdate: new Date(Date.now() - 10 * 60000)
      },
      
      // Livestock
      { 
        id: '4', 
        name: 'Daisy', 
        type: 'Beef', 
        assetType: 'livestock',
        status: 'inside', 
        trackerId: 'Beef001',
        lastLocation: { lat: -15.392500, lng: 28.329800 },
        lastUpdate: new Date(Date.now() - 20 * 60000)
      }
    ];
    
    setAssets(mockAssets);
    
    // Check if any equipment is outside geofence to show alert
    const outsideEquipment = mockAssets.find(
      asset => asset.assetType === 'equipment' && asset.status === 'outside'
    );
    
    if (outsideEquipment) {
      setAlertAsset(outsideEquipment);
      setShowAlert(true);
    }
  };

  // Load assets on component mount
  useEffect(() => {
    fetchAssets();
    
    // Set up interval to refresh data periodically
    const interval = setInterval(fetchAssets, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Connection status simulation
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(Math.random() > 0.1); // 90% connected
    };
    
    const interval = setInterval(checkConnection, 30000);
    checkConnection();
    return () => clearInterval(interval);
  }, []);

  // Filter assets by type
  const equipment = assets.filter(asset => asset.assetType === 'equipment');
  const employees = assets.filter(asset => asset.assetType === 'employee');
  const livestock = assets.filter(asset => asset.assetType === 'livestock');

  // Handle asset registration
  const handleRegisterAsset = async (type, assetData) => {
    try {
      const newAsset = await apiService.registerAsset({
        ...assetData,
        assetType: type,
        status: 'inside',
        lastLocation: { lat: -15.392072, lng: 28.330145 },
        lastUpdate: new Date()
      });
      
      setAssets(prev => [...prev, newAsset]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error registering asset:', error);
      // Fallback to local state update if server request fails
      const newAsset = {
        ...assetData,
        id: Date.now().toString(),
        assetType: type,
        status: 'inside',
        lastLocation: { lat: -15.392072, lng: 28.330145 },
        lastUpdate: new Date()
      };
      
      setAssets(prev => [...prev, newAsset]);
      setLastUpdate(new Date());
    }
  };

  // Handle alert notification
  const handleTrackAsset = () => {
    setShowTracking(true);
    setShowAlert(false);
    setTrackingAsset(alertAsset);
  };

  const handleDismissAlert = () => {
    setShowAlert(false);
    setAlertAsset(null);
  };

  const handleStopTracking = () => {
    setShowTracking(false);
    setTrackingAsset(null);
  };

  const handleRefreshData = () => {
    fetchAssets();
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <style jsx>{`
        /* Add these new styles for the updated layout */
        
        .tracking-content {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
        }
        
        .tracking-map {
          flex: 2;
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid;
        }
        
        .light-mode .tracking-map {
          border-color: #e2e8f0;
        }
        
        .dark-mode .tracking-map {
          border-color: #334155;
        }
        
        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
        }
        
        .map-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ef4444;
          font-weight: 500;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        .map-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .map-visualization {
          position: relative;
          width: 100%;
          height: 100%;
          background: #e2e8f0;
        }
        
        .dark-mode .map-visualization {
          background: #334155;
        }
        
        .map-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .current-marker {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .marker-icon {
          color: #ef4444;
        }
        
        .marker-label {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .dark-mode .marker-label {
          background: rgba(0, 0, 0, 0.8);
          color: white;
        }
        
        .travel-path {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .path-point {
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: #3b82f6;
          border-radius: 50%;
          transform: translate(-50%, 50%);
        }
        
        .map-coordinates {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.9);
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }
        
        .dark-mode .map-coordinates {
          background: rgba(0, 0, 0, 0.8);
          color: white;
        }
        
        .map-controls {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid;
        }
        
        .light-mode .map-controls {
          border-color: #e2e8f0;
        }
        
        .dark-mode .map-controls {
          border-color: #334155;
        }
        
        .tracking-info {
          display: flex;
          height: 40%;
          overflow: hidden;
        }
        
        .tracking-info .info-card {
          flex: 1;
          overflow-y: auto;
        }
        
        .tracking-info .tracking-history {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          border-left: 1px solid;
        }
        
        .light-mode .tracking-info .tracking-history {
          border-color: #e2e8f0;
        }
        
        .dark-mode .tracking-info .tracking-history {
          border-color: #334155;
        }
        
        /* Update existing styles for better layout */
        .tracking-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff;
          z-index: 100;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .dark-mode .tracking-page {
          background: #0f172a;
        }
        
        .app-header {
          z-index: 101; /* Ensure header is above everything */
        }
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .tracking-info {
            flex-direction: column;
            height: auto;
          }
          
          .tracking-info .tracking-history {
            border-left: none;
            border-top: 1px solid;
          }
        }
      `}</style>
      
      {/* Alert Banners */}
      {!isConnected && (
        <div className="connection-banner">
          <WifiOff size={20} />
          <span>Connection lost. Reconnecting...</span>
        </div>
      )}

      {/* Alert Notification */}
      {showAlert && alertAsset && (
        <AlertNotification
          asset={alertAsset}
          onTrack={handleTrackAsset}
          onDismiss={handleDismissAlert}
        />
      )}

      {/* Tracking Page */}
      {showTracking && trackingAsset && (
        <TrackingPage
          asset={trackingAsset}
          onClose={() => setShowTracking(false)}
          onStopTracking={handleStopTracking}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        onRegisterAsset={handleRegisterAsset}
      />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="header-logo">
            <div className="logo-icon">
              <Navigation size={24} className="icon-white" />
            </div>
            <h1 className="app-title">GPS Tracker Dashboard</h1>
          </div>
        </div>
        
        <div className="header-right">
          <div className="connection-status">
            <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span className="connection-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
        <Dashboard 
          equipment={equipment}
          employees={employees}
          livestock={livestock}
          geofenceRadius={geofenceRadius}
          lastUpdate={lastUpdate}
        />
      </div>
    </div>
  );
};

export default App;