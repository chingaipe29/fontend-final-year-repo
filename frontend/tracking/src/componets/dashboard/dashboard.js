import React, { useState, useEffect } from 'react';
import { 
  Home, Truck, UserCheck, Beef, Map, 
  Wifi, WifiOff, Moon, Sun, AlertTriangle,
  CheckCircle, XCircle, Clock, Navigation,
  PlusCircle, Save, X, Menu, User, Settings, LogOut,
  Play, StopCircle, MapPin, Activity, RotateCcw
} from 'lucide-react';

// Tracking Page Component
const TrackingPage = ({ asset, onClose, onStopTracking }) => {
  const [currentPosition, setCurrentPosition] = useState(asset.lastLocation);
  const [speed, setSpeed] = useState(0);
  const [isTracking, setIsTracking] = useState(true);
  const [history, setHistory] = useState([]);

  // Simulate live tracking data
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      // Simulate movement by adding small random changes to position
      const newLat = currentPosition.lat + (Math.random() - 0.5) * 0.001;
      const newLng = currentPosition.lng + (Math.random() - 0.5) * 0.001;
      const newSpeed = Math.random() * 10 + 5; // Random speed between 5-15 km/h
      
      const newPosition = { lat: newLat, lng: newLng };
      
      setCurrentPosition(newPosition);
      setSpeed(newSpeed);
      
      // Add to history
      setHistory(prev => [...prev, {
        position: newPosition,
        speed: newSpeed,
        timestamp: new Date()
      }]);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isTracking, currentPosition]);

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
          >
            {isTracking ? <StopCircle size={20} /> : <Play size={20} />}
            {isTracking ? 'Pause' : 'Resume'}
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
        </div>

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

      <div className="tracking-map">
        <h3>Live Location Map</h3>
        <div className="map-placeholder">
          <Map size={48} />
          <p>Live map visualization would appear here</p>
          <span>Showing route from original position to current location</span>
        </div>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-color start-point"></div>
            <span>Start Position</span>
          </div>
          <div className="legend-item">
            <div className="legend-color current-point"></div>
            <span>Current Position</span>
          </div>
          <div className="legend-item">
            <div className="legend-color path-line"></div>
            <span>Travel Path</span>
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

// Main App Component
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

  // Load initial mock data
  useEffect(() => {
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
  const handleRegisterAsset = (type, assetData) => {
    const newAsset = {
      ...assetData,
      assetType: type,
      status: 'inside',
      lastLocation: { lat: -15.392072, lng: 28.330145 },
      lastUpdate: new Date()
    };
    
    setAssets(prev => [...prev, newAsset]);
    setLastUpdate(new Date());
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

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <style jsx>{`
        /* Base styles */
        .app-container {
          min-height: 100vh;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .light-mode {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
          color: #111827;
        }
        
        .dark-mode {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          color: #ffffff;
        }
        
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        
        .light-mode .app-header {
          border-color: #e2e8f0;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .dark-mode .app-header {
          border-color: #334155;
          background: rgba(15, 23, 42, 0.95);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .menu-toggle {
          padding: 8px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .light-mode .menu-toggle {
          background: #f1f5f9;
          color: #475569;
        }
        
        .light-mode .menu-toggle:hover {
          background: #e2e8f0;
        }
        
        .dark-mode .menu-toggle {
          background: #334155;
          color: #fbbf24;
        }
        
        .dark-mode .menu-toggle:hover {
          background: #475569;
        }
        
        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          padding: 8px;
          background: #3b82f6;
          border-radius: 8px;
        }
        
        .app-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        
        .light-mode .app-title {
          color: #1e293b;
        }
        
        .dark-mode .app-title {
          color: #ffffff;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
        }
        
        .light-mode .connection-status {
          background: #f1f5f9;
        }
        
        .dark-mode .connection-status {
          background: #334155;
        }
        
        .connection-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .connected {
          background: #10b981;
          animation: pulse 2s infinite;
        }
        
        .disconnected {
          background: #ef4444;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .connection-text {
          font-size: 14px;
          font-weight: 500;
        }
        
        .light-mode .connection-text {
          color: #475569;
        }
        
        .dark-mode .connection-text {
          color: #cbd5e1;
        }
        
        .theme-toggle {
          padding: 8px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .light-mode .theme-toggle {
          background: #e2e8f0;
          color: #475569;
        }
        
        .light-mode .theme-toggle:hover {
          background: #cbd5e1;
        }
        
        .dark-mode .theme-toggle {
          background: #334155;
          color: #fbbf24;
        }
        
        .dark-mode .theme-toggle:hover {
          background: #475569;
        }
        
        /* Alert Notification */
        .alert-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 100;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease;
        }
        
        .dark-mode .alert-notification {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .alert-content {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 12px;
        }
        
        .alert-icon {
          color: #ef4444;
          flex-shrink: 0;
        }
        
        .alert-message {
          flex: 1;
        }
        
        .alert-message h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .alert-message p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }
        
        .dark-mode .alert-message p {
          color: #94a3b8;
        }
        
        .alert-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        
        /* Tracking Page */
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
        
        .tracking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid;
        }
        
        .light-mode .tracking-header {
          border-color: #e2e8f0;
          background: #ffffff;
        }
        
        .dark-mode .tracking-header {
          border-color: #334155;
          background: #1e293b;
        }
        
        .tracking-title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .tracking-title h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        
        .asset-name {
          font-size: 14px;
          color: #64748b;
        }
        
        .dark-mode .asset-name {
          color: #94a3b8;
        }
        
        .tracking-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .tracking-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tracking-btn {
          background: #3b82f6;
          color: #ffffff;
        }
        
        .tracking-btn:hover {
          background: #2563eb;
        }
        
        .tracking-btn.active {
          background: #ef4444;
        }
        
        .tracking-btn.active:hover {
          background: #dc2626;
        }
        
        .tracking-content {
          position:relative;
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .tracking-info {
            position:absolute;
          width: 300px;
          padding: 24px;
          border-right: 1px solid;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .light-mode .tracking-info {
          border-color: #e2e8f0;
          background: #f8fafc;
        }
        
        .dark-mode .tracking-info {
          border-color: #334155;
          background: #1e293b;
        }
        
        .info-card {
          padding: 16px;
          border-radius: 8px;
        }
        
        .light-mode .info-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }
        
        .dark-mode .info-card {
          background: #0f172a;
          border: 1px solid #334155;
        }
        
        .info-card h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .info-item:last-child {
          margin-bottom: 0;
        }
        
        .status-inside {
          color: #10b981;
          font-weight: 500;
        }
        
        .status-outside {
          color: #ef4444;
          font-weight: 500;
        }
        
        .tracking-history {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .tracking-history h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .history-item {
          padding: 12px;
          border-radius: 6px;
        }
        
        .light-mode .history-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        
        .dark-mode .history-item {
          background: #1e293b;
          border: 1px solid #334155;
        }
        
        .history-coordinates {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          margin-bottom: 4px;
        }
        
        .history-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #64748b;
        }
        
        .dark-mode .history-details {
          color: #94a3b8;
        }
        
        .history-speed {
          font-weight: 500;
        }
        
        .empty-history {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }
        
        .dark-mode .empty-history {
          color: #94a3b8;
        }
        
        .tracking-map {
        margin-left:300px;
        margin-top:60px;
        height:1000px;
          width: 1000px;
          padding: 24px;
          border-left: 1px solid;
          display: flex;
          flex-direction: column;
        }
        
        .light-mode .tracking-map {
          border-color: #e2e8f0;
          background: #f8fafc;
        }
        
        .dark-mode .tracking-map {
          border-color: #334155;
          background: #1e293b;
        }
        
        .tracking-map h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .map-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 2px dashed;
          padding: 20px;
          text-align: center;
        }
        
        .light-mode .map-placeholder {
          border-color: #cbd5e1;
          background: #ffffff;
          color: #64748b;
        }
        
        .dark-mode .map-placeholder {
          border-color: #475569;
          background: #0f172a;
          color: #94a3b8;
        }
        
        .map-placeholder p {
          margin: 12px 0 8px 0;
          font-weight: 500;
        }
        
        .map-placeholder span {
          font-size: 12px;
        }
        
        .map-legend {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }
        
        .start-point {
          background: #10b981;
        }
        
        .current-point {
          background: #3b82f6;
        }
        
        .path-line {
          background: #ef4444;
          border-radius: 2px;
          height: 4px;
        }
        
        /* Sidebar Styles */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 45;
        }
        
        .sidebar {
          position: fixed;
          top: 0;
          left: -320px;
          width: 320px;
          height: 100vh;
          background: #ffffff;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          transition: left 0.3s ease;
          z-index: 50;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        
        .dark-mode .sidebar {
          background: #1e293b;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
        }
        
        .sidebar.open {
          left: 0;
        }
        
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid;
        }
        
        .light-mode .sidebar-header {
          border-color: #e2e8f0;
        }
        
        .dark-mode .sidebar-header {
          border-color: #334155;
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }
        
        .close-btn {
          padding: 4px;
          border: none;
          background: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .light-mode .close-btn {
          color: #64748b;
        }
        
        .light-mode .close-btn:hover {
          background: #f1f5f9;
        }
        
        .dark-mode .close-btn {
          color: #94a3b8;
        }
        
        .dark-mode .close-btn:hover {
          background: #334155;
        }
        
        .sidebar-nav {
          padding: 16px 0;
          border-bottom: 1px solid;
        }
        
        .light-mode .sidebar-nav {
          border-color: #e2e8f0;
        }
        
        .dark-mode .sidebar-nav {
          border-color: #334155;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }
        
        .light-mode .nav-item {
          color: #475569;
        }
        
        .light-mode .nav-item:hover {
          background: #f8fafc;
        }
        
        .light-mode .nav-item.active {
          background: #e0f2fe;
          color: #0369a1;
        }
        
        .dark-mode .nav-item {
          color: #cbd5e1;
        }
        
        .dark-mode .nav-item:hover {
          background: #334155;
        }
        
        .dark-mode .nav-item.active {
          background: #1e40af;
          color: #ffffff;
        }
        
        .registration-section {
          padding: 20px;
          border-bottom: 1px solid;
        }
        
        .light-mode .registration-section {
          border-color: #e2e8f0;
        }
        
        .dark-mode .registration-section {
          border-color: #334155;
        }
        
        .registration-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .registration-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .btn-register {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 1px solid;
          border-radius: 8px;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }
        
        .light-mode .btn-register {
          border-color: #cbd5e1;
          color: #475569;
        }
        
        .light-mode .btn-register:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        
        .dark-mode .btn-register {
          border-color: #475569;
          color: #cbd5e1;
        }
        
        .dark-mode .btn-register:hover {
          background: #334155;
          border-color: #64748b;
        }
        
        /* Registration Form Styles */
        .registration-form {
          padding: 20px;
          border-bottom: 1px solid;
        }
        
        .light-mode .registration-form {
          border-color: #e2e8f0;
        }
        
        .dark-mode .registration-form {
          border-color: #334155;
        }
        
        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .form-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        
        .light-mode .form-group input,
        .light-mode .form-group select {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        
        .light-mode .form-group input:focus,
        .light-mode .form-group select:focus {
          border-color: #3b82f6;
          outline: none;
        }
        
        .dark-mode .form-group input,
        .dark-mode .form-group select {
          background: #0f172a;
          border-color: #475569;
          color: #ffffff;
        }
        
        .dark-mode .form-group input:focus,
        .dark-mode .form-group select:focus {
          border-color: #3b82f6;
          outline: none;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .btn-primary, .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: #ffffff;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          background: #64748b;
          color: #ffffff;
        }
        
        .btn-secondary:hover {
          background: #475569;
        }
        
        .sidebar-footer {
          margin-top: auto;
          padding: 16px 0;
        }
        
        /* Main Content Styles */
        .main-content {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          transition: margin-left 0.3s ease;
        }
        
        .main-content.with-sidebar {
          margin-left: 320px;
        }
        
        /* Dashboard Styles */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .dashboard h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }
        
        .light-mode .dashboard h2 {
          color: #1e293b;
        }
        
        .dark-mode .dashboard h2 {
          color: #ffffff;
        }
        
        .last-update {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
        }
        
        .dark-mode .last-update {
          color: #94a3b8;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          padding: 24px;
          border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .light-mode .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .dark-mode .stat-card {
          background: #1e293b;
          border: 1px solid #334155;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card.inside {
          border-left: 4px solid #10b981;
        }
        
        .stat-card.outside {
          border-left: 4px solid #ef4444;
        }
        
        .stat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .stat-label {
          font-size: 16px;
          font-weight: 500;
        }
        
        .light-mode .stat-label {
          color: #475569;
        }
        
        .dark-mode .stat-label {
          color: #cbd5e1;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 700;
        }
        
        .light-mode .stat-value {
          color: #1e293b;
        }
        
        .dark-mode .stat-value {
          color: #ffffff;
        }
        
        /* Assets Sections */
        .assets-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }
        
        .asset-section {
          padding: 20px;
          border-radius: 12px;
        }
        
        .light-mode .asset-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .dark-mode .asset-section {
          background: #1e293b;
          border: 1px solid #334155;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }
        
        .asset-section h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          padding-bottom: 16px;
          border-bottom: 1px solid;
        }
        
        .light-mode .asset-section h3 {
          border-color: #e2e8f0;
          color: #1e293b;
        }
        
        .dark-mode .asset-section h3 {
          border-color: #334155;
          color: #ffffff;
        }
        
        .assets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .asset-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .light-mode .asset-item {
          background: #f8fafc;
        }
        
        .dark-mode .asset-item {
          background: #0f172a;
        }
        
        .asset-item.inside {
          border-left: 3px solid #10b981;
        }
        
        .asset-item.outside {
          border-left: 3px solid #ef4444;
        }
        
        .asset-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .asset-name {
          font-weight: 600;
          font-size: 16px;
        }
        
        .asset-category {
          font-size: 14px;
          opacity: 0.7;
          text-transform: capitalize;
        }
        
        .asset-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .status-indicator.inside {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-indicator.outside {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .asset-update {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          opacity: 0.7;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          border-radius: 8px;
        }
        
        .light-mode .empty-state {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #64748b;
        }
        
        .dark-mode .empty-state {
          background: #0f172a;
          border: 1px dashed #475569;
          color: #94a3b8;
        }
        
        .empty-state p {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
        }
        
        /* Icon Colors */
        .icon-blue {
          color: #3b82f6;
        }
        
        .icon-green {
          color: #10b981;
        }
        
        .icon-red {
          color: #ef4444;
        }
        
        .icon-purple {
          color: #8b5cf6;
        }
        
        .icon-orange {
          color: #f97316;
        }
        
        .icon-white {
          color: #ffffff;
        }
        
        /* Alert Banner */
        .connection-banner {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          background: #f59e0b;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .assets-sections {
            grid-template-columns: 1fr;
          }
          
          .main-content.with-sidebar {
            margin-left: 0;
          }
          
          .tracking-content {
            flex-direction: column;
          }
          
          .tracking-info {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid;
          }
          
          .tracking-map {
            width: 100%;
            border-left: none;
            border-top: 1px solid;
          }
        }
        
        @media (max-width: 768px) {
          .app-header {
            padding: 12px 16px;
          }
          
          .app-title {
            font-size: 20px;
          }
          
          .main-content {
            padding: 16px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .tracking-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .tracking-controls {
            width: 100%;
            justify-content: space-between;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .header-right {
            gap: 12px;
          }
          
          .connection-status {
            padding: 6px 10px;
          }
          
          .connection-text {
            font-size: 12px;
          }
          
          .asset-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .asset-status {
            align-items: flex-start;
          }
          
          .alert-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .alert-actions {
            width: 100%;
            justify-content: space-between;
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