import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  fetchOverview, 
  fetchAlerts, 
  patchGeofenceRadius, 
  resolveAlert, 
  ackAlert 
} from "../api";

const actionButtons = [
  {
    title: 'Add Employee',
    description: 'Register new farm employees',
    icon: '👨‍🌾',
    path: '/add-employee',
    color: '#4CAF50'
  },
  {
    title: 'Add Equipment',
    description: 'Register tractors and vehicles',
    icon: '🚜',
    path: '/add-equipment',
    color: '#2196F3'
  },
  {
    title: 'Add Livestock',
    description: 'Register animals with trackers',
    icon: '🐄',
    path: '/add-livestock',
    color: '#FF9800'
  }
];

// SVG Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const LivestockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2zm7-10h-5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"></path>
    <line x1="10.5" y1="5" x2="17.5" y2="5"></line>
    <line x1="10.5" y1="9" x2="17.5" y2="9"></line>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16,17 21,12 16,7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 极速3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1极速="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/s极速vg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9,22 9,12 15,12 15,22"></polyline>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 极速0 0 1 0 2.83 2 2 0 0 1-2.83 极速0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1极速.51-1H3a2 2 0 0 极速1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill极速="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="极速6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 极速0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke极速Linecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4极速v2"></path>
    <circle cx="8.5极速" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>
);

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [geofence, setGeofence] = useState({ id: 1, name: "Main Geofence", radius_meters: 500 });
  const [radius, setRadius] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      
      const overviewResponse = await fetchOverview();
      setItems(overviewResponse.data || []);

      const alertsResponse = await fetchAlerts();
      setAlerts(alertsResponse.data || []);

      if (geofence) setRadius(geofence.radius_meters);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

const inside = useMemo(() => items.filter(i => i.inside_geofence === true), [items]);
const outside = useMemo(() => items.filter(i => i.inside_geofence === false), [items]);

  
  const employees = useMemo(() => items.filter(i => i.kind === "employee"), [items]);
  const equipment = useMemo(() => items.filter(i => i.kind === "equipment"), [items]);
  const livestock = useMemo(() => items.filter(i => i.kind === "livestock"), [items]);
  
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "employees") return employees;
    if (activeTab === "equipment") return equipment;
    if (activeTab === "livestock") return livestock;
    if (activeTab === "inside") return inside;
    if (activeTab === "outside") return outside;
    return items;
  }, [activeTab, items, employees, equipment, livestock, inside, outside]);

  async function updateRadius() {
    if (!geofence?.id && !geofence?.name) { 
      console.error("No geofence found"); 
      return; 
    }
    try {
      const { data } = await patchGeofenceRadius(geofence.id, Number(radius));
      setGeofence(data);
      console.log("Geofence radius updated");
    } catch (err) {
      console.error("Failed to update radius:", err);
      setError("Failed to update geofence radius");
    }
  }

  async function acknowledgeAlert(alert) {
    try {
      await ackAlert(alert.id);
      window.location.href = `/track/${alert.gps_data?.device_id ?? ""}`;
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      setError("Failed to acknowledge alert");
    }
  }

  async function resolveAlertHandler(alertId) {
    try {
      await resolveAlert(alertId);
      await load();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      setError("Failed to resolve alert");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError("")}
            className="absolute top-0 right-0 mt-1 mr-2"
          >
            ×
          </button>
        </div>
      )}

      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-indigo-600 text-white"
        onClick={() => setSidebarOpen(true)}
      >
        <MenuIcon />
      </button>
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-200 ease-in-out md:relative md:translate-x-0`}>
        <button 
          className="md:hidden absolute top-4 right-4 p-2 rounded-md text-gray极速-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <CloseIcon />
        </button>
        
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
            <h1 className="text-xl font-bold text-white">GeoGuard</h1>
          </div>
          
          <div className="flex-1 px-4 py-6 space-y-2">
            <SidebarLink to="/" icon={<HomeIcon />} text="Dashboard" />
            <SidebarLink to="/add-employee" icon={<UserIcon />} text="Employees" />
            <SidebarLink to="/add-equipment" icon={<TruckIcon />} text="Equipment" />
            <SidebarLink to="/add-livestock" icon={<LivestockIcon />} text="Livestock" />
            <SidebarLink to="/map" icon={<MapIcon />} text="Map View" />
            <SidebarLink to="/alerts" icon={<AlertIcon />} text="Alerts" />
            <SidebarLink to="/settings" icon={<SettingsIcon />} text="Settings" />
          </div>
          
          <div className="px-4 py-4 border-t border-gray-800">
            <div className="flex items-center px-4 py-2 text-gray-400 hover:text-white cursor-pointer">
              <UserIcon />
              <span className="ml-3">User Account</span>
            </div>
            <div className="flex items-center px-4 py-2 text-gray-400 hover:text-white cursor-pointer">
              <LogoutIcon />
              <span className="ml-3">Log Out</span>
            </div>
          </div>
        </div>
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 p-6 space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-gray-600">Monitor your assets in real-time</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {actionButtons.map((button, index) => (
              <Link
                key={index}
                to={button.path}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors"
                style={{ backgroundColor: button.color }}
              >
                <span>{button.icon}</span>
                <span>{button.title}</span>
              </Link>
            ))}
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold text-lg">Geofence Status</h2>
            
            {geofence && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Radius (m):</span>
                  <input 
                    className="border rounded-lg p-2 w-24 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    value={radius}
                    onChange={(e)=>setRadius(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={updateRadius} 
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-极速700 transition-colors"
                >
                  Update Radius
                </button>
              </div>
            )}
          </div>
          
          {geofence ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-green-800">Inside Geofence</h3>
                  <CheckCircleIcon />
                </div>
                <p className="text-2xl font-bold mt-2 text-green-900">{inside.length} items</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-red-800">Outside Geofence</h3>
                  <XCircleIcon />
                </div>
                <p className="text-2xl font-bold mt-2 text-red-900">{outside.length} items</p>
              </div>
              
              <div className="bg-blue-50 p极速-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-blue-800">Total Items</h3>
                  <span className="text-blue-500 font-medium">All</span>
                </div>
                <p className="text-2xl font-bold mt-2 text-blue-900">{items.length} items</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No geofence configured. Please set up a geofence to start monitoring.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto -mb-px">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "all" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                All Items
              </button>
              <button
                onClick={() => setActiveTab("employees")}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "employees极速" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Employees ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab("equipment")}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "equipment" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Equipment ({equipment.length})
              </button>
              <button
                onClick={() => setActiveTab("livestock")}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "livestock" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Livestock ({livestock.length})
              </button>
              <button
                onClick={() => setActiveTab("inside")}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "inside" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Inside ({inside.length})
              </button>
              <button
                onClick={() => setActiveTab("outside")}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === "outside" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Outside ({outside.length})
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">
              {activeTab === "all" && "All Items"}
              {activeTab === "employees" && "Employees"}
              {activeTab === "equipment" && "Equipment"}
              {activeTab === "livestock" && "Livestock"}
              {activeTab === "inside" && "Items Inside Geofence"}
              {activeTab === "outside" && "Items Outside Geofence"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(i => (
                <ItemCard key={i.device_id} item={i} />
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items found in this category.
              </div>
            )}
          </div>
        </div>

        <section>
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Active Alerts</h2>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {alerts.length} alerts
              </span>
            </div>
            
            <div className="space-y-3">
              {alerts.map(a => (
                <div key={a.id} className="flex items-center justify-between border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-red-800">{a.alert_type?.toUpperCase()}</div>
                    <div className="text-sm text-red-600">{a.message}</div>
                    <div className="text-xs text-red-500 mt-1">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => acknowledgeAlert(a)} 
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      Track
                    </button>
                    <button 
                      onClick={() => resolveAlertHandler(a.id)} 
                      className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
              
              {!alerts.length && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, text }) {
  return (
    <Link 
      to={to} 
      className="flex items-center px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
    >
      {icon}
      <span className="ml-3">{text}</span>
    </Link>
  );
}

function ItemCard({ item }) {
  const getIcon = () => {
    if (item.kind === "employee") return <UserIcon />;
    if (item.kind === "equipment") return <TruckIcon />;
    if (item.kind === "livestock") return <LivestockIcon />;
    return <MapIcon />;
  };
  
  const getStatusColor = () => {
    return item.inside_geofence ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };
  
  const getKindLabel = () => {
    if (item.kind === "employee") return "Employee";
    if (item.kind === "equipment") return "Equipment";
    if (item.kind === "livestock") return "Livestock";
    return "Unknown";
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-gray-600">{getKindLabel()}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
          {item.inside_geofence ? "Inside" : "Outside"}
        </span>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Device: {item.device_id}</p>
        {item.latest && (
          <>
            <p className="mt-1">
              Location: {item.latest.latitude?.toFixed?.(5)}, {item.latest.longitude?.toFixed?.(5)}
            </p>
            <p className="mt-1">Speed: {item.latest.speed} km/h</p>
          </>
        )}
      </div>
      
      <div className="mt-4">
        <Link 
          to={`/track/${item.device_id}`} 
          className="text-indigo-600 text-sm hover:text-indigo-800 flex items-center gap-1"
        >
          <MapIcon />
          <span>View on Map</span>
        </Link>
      </div>
    </div>
  );
}