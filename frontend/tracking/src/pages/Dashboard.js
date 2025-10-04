import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  fetchOverview, 
  fetchAlerts,
  deleteEquipment,
  deleteEmployee,
  deleteItem
} from "../api";

/* ---------------- ICONS ---------------- */
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const TruckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const LivestockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <circle cx="9" cy="9" r="1"/>
    <circle cx="15" cy="9" r="1"/>
    <path d="M8 16s1.5 2 4 2 4-2 4-2"/>
  </svg>
);

const MapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 16 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const AlertIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const HomeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H15a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const MenuIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SearchIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const BellIcon = ({ className = "w-5 h-5" }) => (
  <Link to="/alerts" className="p-2 hover:bg-gray-100 rounded-full">
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 1 1-3.46 0"/>
    </svg>
  </Link>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const LocationIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow-lg transition-opacity duration-300 ${
      type === 'success' 
        ? 'bg-green-100 text-green-700 border border-green-200' 
        : 'bg-red-100 text-red-700 border border-red-200'
    }`}>
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
        type === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {type === 'success' ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 hover:bg-gray-100 transition-colors"
        onClick={onClose}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, item }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-semibold">{item.name}</span> ({item.kind})? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(item.id, item.kind)}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Modern Dashboard Component
export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState("500");
  const navigate = useNavigate();
  
  // New state for toast notifications and delete modal
  const [toasts, setToasts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    id: null, 
    kind: '', 
    name: '' 
  });

  // Function to show toast notifications
  const showToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Function to remove toast notifications
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch overview and alerts data
      const [overviewResponse, alertsResponse] = await Promise.all([
        fetchOverview(),
        fetchAlerts()
      ]);
      
      setItems(overviewResponse.data || []);
      setAlerts(alertsResponse.data || []);
      
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showToast("Failed to load dashboard data. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Calculate derived data
  const { inside, outside, employees, equipment, livestock } = useMemo(() => {
    const insideItems = items.filter(i => i.inside_geofence === true);
    const outsideItems = items.filter(i => i.inside_geofence === false);
    const employeeItems = items.filter(i => i.kind === "employee");
    const equipmentItems = items.filter(i => i.kind === "equipment");
    const livestockItems = items.filter(i => i.kind === "livestock");
    
    return {
      inside: insideItems,
      outside: outsideItems,
      employees: employeeItems,
      equipment: equipmentItems,
      livestock: livestockItems,
    };
  }, [items]);

  // Calculate stats from actual data
  const stats = useMemo(() => ({
    employees: employees.length,
    equipment: equipment.length,
    livestock: livestock.length,
    total: items.length
  }), [employees.length, equipment.length, livestock.length, items.length]);

  // Filter items based on active tab and search
  const filteredItems = useMemo(() => {
    let result;
    switch (activeTab) {
      case "all": result = items; break;
      case "employees": result = employees; break;
      case "equipment": result = equipment; break;
      case "livestock": result = livestock; break;
      case "inside": result = inside; break;
      case "outside": result = outside; break;
      default: result = items;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name?.toLowerCase().includes(term) || 
        item.device_id?.toLowerCase().includes(term) ||
        item.kind?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [activeTab, items, employees, equipment, livestock, inside, outside, searchTerm]);

  // Handle item deletion
 const handleDeleteItem = async (id, kind) => {
  try {
    // Close the modal immediately
    setDeleteModal({ isOpen: false, id: null, kind: '', name: '' });
    
    // Find the item name for better feedback
    const item = items.find(i => i.id === id);
    const itemName = item?.name || kind;
    
    // Use deleteItem instead of deleteLivestock
    await deleteItem(kind, id);
    
    setItems(prev => prev.filter(item => item.id !== id));
    showToast(`${itemName} deleted successfully`, 'success');
    
  } catch (err) {
    console.error('Failed to delete item:', err);
    showToast(err.response?.data?.error || 'Failed to delete item', 'error');
  }
};
  // Modern Sidebar Component
  const Sidebar = ({ open, onClose }) => (
    <>
      {/* Mobile overlay - only render when sidebar is open */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - only render when open */}
      {open && (
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <LocationIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-white">GeoGuard</h1>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem icon={<HomeIcon />} text="Dashboard" href="/" active />
            <NavItem icon={<UserIcon />} text="Employees" href="/employeesM" />
            <NavItem icon={<TruckIcon />} text="Equipment" href="/equipmentM" />
            <NavItem icon={<LivestockIcon />} text="Livestock" href="/livestockM" />
            <NavItem icon={<MapIcon />} text="Map View" href="/map" />
             <NavItem icon={<UserIcon  />} text="User" href="/user" />
            <NavItem 
              icon={<AlertIcon />} 
              text="Alerts" 
              href="/alerts" 
              badge={alerts.length}
            />
            <NavItem icon={<SettingsIcon />} text="Settings" href="/settings" />
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@geoguard.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Navigation Item Component with badge support
  const NavItem = ({ icon, text, href, active, badge }) => (
    <Link
      to={href}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-blue-50 text-blue-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      onClick={() => setSidebarOpen(false)}
    >
      <div className="flex items-center space-x-3">
        <div className={`${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
          {icon}
        </div>
        <span className="font-medium">{text}</span>
      </div>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );

  // Modern Stats Cards
  const StatsCard = ({ icon, title, value, change, color, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span>{change}</span>
              <span className="ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Modern Item Card
  const ItemCard = ({ item, onDelete }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 relative group">
      <button
        onClick={() => setDeleteModal({ 
          isOpen: true, 
          id: item.id, 
          kind: item.kind, 
          name: item.name 
        })}
        className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-50"
        title="Delete item"
      >
        <TrashIcon />
      </button>
      
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${
          item.kind === 'employee' ? 'bg-blue-100' :
          item.kind === 'equipment' ? 'bg-green-100' : 'bg-orange-100'
        }`}>
          {item.kind === 'employee' && <UserIcon className={`w-6 h-6 text-blue-600`} />}
          {item.kind === 'equipment' && <TruckIcon className={`w-6 h-6 text-green-600`} />}
          {item.kind === 'livestock' && <LivestockIcon className={`w-6 h-6 text-orange-600`} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.inside_geofence 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {item.inside_geofence ? 'Inside' : 'Outside'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 capitalize">{item.kind}</p>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium">ID:</span>
              <span className="ml-2">{item.device_id}</span>
            </div>
            {item.latest && (
              <>
                <div className="flex items-center text-sm text-gray-500">
                  <LocationIcon className="w-4 h-4 mr-1" />
                  <span>{item.latest.latitude?.toFixed?.(4)}, {item.latest.longitude?.toFixed?.(4)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Speed: {item.latest.speed || 0} km/h</span>
                  <span>{new Date(item.latest.timestamp).toLocaleTimeString()}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate(`/track/${item.device_id}`)}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <MapIcon className="w-4 h-4 mr-1" />
              View on Map
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, kind: '', name: '' })}
        onConfirm={handleDeleteItem}
        item={deleteModal}
      />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title={sidebarOpen ? "Close menu" : "Open menu"}
              >
                <MenuIcon />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, manage your farm assets</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchData}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${loading ? 'animate-spin' : ''} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}
                title="Refresh data"
              >
                <RefreshIcon />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => navigate("/alerts")}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative transition-colors"
                  title={`View alerts${alerts.length > 0 ? ` (${alerts.length})` : ''}`}
                >
                  <BellIcon />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {alerts.length > 99 ? '99+' : alerts.length}
                    </span>
                  )}
                </button>
              </div>
              
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AD</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Search Results Count */}
          {searchTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">
                    {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found for "{searchTerm}"
                  </span>
                </div>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={<UserIcon className="w-6 h-6 text-blue-600" />}
              title="Employees"
              value={stats.employees}
              color="bg-blue-50"
            />
            <StatsCard
              icon={<TruckIcon className="w-6 h-6 text-green-600" />}
              title="Equipment"
              value={stats.equipment}
              color="bg-green-50"
            />
            <StatsCard
              icon={<LivestockIcon className="w-6 h-6 text-orange-600" />}
              title="Livestock"
              value={stats.livestock}
              color="bg-orange-50"
            />
            <StatsCard
              icon={<LocationIcon className="w-6 h-6 text-purple-600" />}
              title="Total Assets"
              value={stats.total}
              color="bg-purple-50"
            />
          </div>

          {/* Geofence Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Geofence Status</h2>
                <p className="text-gray-500 mt-1">Monitor assets within your designated area</p>
              </div>
              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <input
                  type="number"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                  placeholder="Radius"
                />
                <span className="text-sm text-gray-500">meters</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Update
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-800">Inside Geofence</h3>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-900">{inside.length}</p>
                <p className="text-sm text-green-600 mt-1">assets secure</p>
              </div>
              
              <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-red-800">Outside Geofence</h3>
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-900">{outside.length}</p>
                <p className="text-sm text-red-600 mt-1">need attention</p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-800">Coverage</h3>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">%</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {items.length > 0 ? Math.round((inside.length / items.length) * 100) : 0}%
                </p>
                <p className="text-sm text-blue-600 mt-1">assets monitored</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/employeesM")}
                className="group p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200">
                  <PlusIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manage Employees</h3>
                <p className="text-sm text-gray-500">View, add, edit, and manage farm workers</p>
              </button>
              
              <button
                onClick={() => navigate("/equipmentM")}
                className="group p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200">
                  <PlusIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manage Equipment</h3>
                <p className="text-sm text-gray-500">View, add, edit tractors, vehicles, and machinery</p>
              </button>
              
              <button
                onClick={() => navigate("/livestockM")}
                className="group p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200">
                  <PlusIcon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manage Livestock</h3>
                <p className="text-sm text-gray-500">View, add, edit animals with tracking devices</p>
              </button>
            </div>
          </div>

          {/* Assets Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Asset Overview</h2>
                  <p className="text-gray-500 mt-1">Track and manage all your farm assets</p>
                </div>
                
                <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, device ID, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80 text-sm transition-all duration-200 hover:border-gray-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        title="Clear search"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'all', name: 'All Assets', count: items.length },
                  { id: 'employees', name: 'Employees', count: employees.length },
                  { id: 'equipment', name: 'Equipment', count: equipment.length },
                  { id: 'livestock', name: 'Livestock', count: livestock.length },
                  { id: 'inside', name: 'Inside', count: inside.length },
                  { id: 'outside', name: 'Outside', count: outside.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? `No results for "${searchTerm}"` : 'No assets found'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Try searching for a different name, device ID, or asset type'
                      : 'Try adjusting your search terms or filters'
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear search and show all
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Dashboard data refreshed</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.kind === 'employee' ? 'bg-blue-100' :
                    item.kind === 'equipment' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {item.kind === 'employee' && <UserIcon className="w-5 h-5 text-blue-600" />}
                    {item.kind === 'equipment' && <TruckIcon className="w-5 h-5 text-green-600" />}
                    {item.kind === 'livestock' && <LivestockIcon className="w-5 h-5 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.name} is {item.inside_geofence ? 'inside' : 'outside'} the geofence
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.latest ? new Date(item.latest.timestamp).toLocaleTimeString() : 'Unknown time'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}