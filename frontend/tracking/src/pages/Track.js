import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, FeatureGroup, Polygon } from "react-leaflet";
import L from "leaflet";
import 'leaflet-draw';
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { EditControl } from "react-leaflet-draw";
import { historyForDevice, login, fetchOverview, geofenceApi } from "../api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import marker images
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconPng,
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icons matching Dashboard.js theme
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9,22 9,12 15,12 15,22"></polyline>
  </svg>
);

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

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12,19 5,12 12,5"></polyline>
  </svg>
);

const NavigationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3,11 22,2 13,21 11,13 3,11"></polygon>
  </svg>
);

// Custom map icons with improved styling
const createCustomIcon = (color, isSelected = false) =>
  new L.DivIcon({
    html: `<div style="background-color: ${color}; width: ${isSelected ? '20px' : '16px'}; height: ${isSelected ? '20px' : '16px'}; border-radius: 50%; border: ${isSelected ? '4px' : '3px'} solid white; box-shadow: 0 0 ${isSelected ? '8px' : '4px'} rgba(0,0,0,0.3); ${isSelected ? 'animation: pulse 2s infinite;' : ''}"></div><style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }</style>`,
    iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
    iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
    className: ""
  });

const deviceIcons = {
  default: (selected) => createCustomIcon("#ef4444", selected),
  employee: (selected) => createCustomIcon("#3b82f6", selected),
  equipment: (selected) => createCustomIcon("#10b981", selected),
  livestock: (selected) => createCustomIcon("#f59e0b", selected),
};

// DrawTools component
const DrawTools = React.memo(({ onCreated, onDeleted, onEdit }) => (
  <FeatureGroup>
    <EditControl
      position="topright"
      draw={{
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          shapeOptions: {
            color: '#4f46e5',
            fillColor: '#4f46e5',
            fillOpacity: 0.2,
            weight: 3
          }
        },
      }}
      edit={{
        remove: true,
        edit: true,
      }}
      onCreated={onCreated}
      onDeleted={onDeleted}
      onEdited={onEdit}
    />
  </FeatureGroup>
));

// Auto-focus component
const AutoFocusMap = ({ position, zoomLevel }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position && isValidPosition(position)) {
      map.setView(position, zoomLevel, { 
        animate: true,
        duration: 1.5
      });
    }
  }, [position, zoomLevel, map]);
  
  return null;
};

// Fit bounds component
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    const validPositions = positions.filter(pos => isValidPosition(pos));
    if (validPositions.length > 0) {
      const bounds = L.latLngBounds(validPositions);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [positions, map]);
  return null;
};

// Helper function to validate position
const isValidPosition = (position) => {
  return position && 
         typeof position[0] === 'number' && 
         typeof position[1] === 'number' &&
         !isNaN(position[0]) && 
         !isNaN(position[1]) &&
         position[0] >= -90 && position[0] <= 90 &&
         position[1] >= -180 && position[1] <= 180;
};

const Track = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(deviceId || "");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geofences, setGeofences] = useState([]);
  const [saving, setSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(deviceId ? 15 : 2);
  const [focusDevice, setFocusDevice] = useState(null);
  const mapRef = useRef();
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [geofenceToDelete, setGeofenceToDelete] = useState(null);

  // Save geofence to backend
  const saveGeofenceToBackend = useCallback(async (geofenceData) => {
    try {
      setSaving(true);
      const response = await geofenceApi.createGeofence(geofenceData);
      toast.success("Geofence created successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to save geofence";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error("Failed to save geofence:", err.response?.data || err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // Delete geofence from backend
  const deleteGeofenceFromBackend = useCallback(async (geofenceId) => {
    try {
      await geofenceApi.deleteGeofence(geofenceId);
      toast.success("Geofence deleted successfully ✅", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete geofence";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      throw err;
    }
  }, []);

  // Get device icon
  const getDeviceIcon = useCallback((device, isSelected = false) => {
    const iconFunction = deviceIcons[device.kind] || deviceIcons.default;
    return iconFunction(isSelected);
  }, []);

  // Focus on specific device
  const focusOnDevice = useCallback((device) => {
    if (device && device.latest && isValidPosition([device.latest.latitude, device.latest.longitude])) {
      setFocusDevice(device);
      setSelectedDevice(device.device_id);
      setMapCenter([device.latest.latitude, device.latest.longitude]);
      setMapZoom(16);
      setShowAllDevices(false);
    }
  }, []);

  // Handle geofence operations
  const handleGeofenceCreated = useCallback(async (e) => {
    const layer = e.layer;
    if (layer instanceof L.Polygon) {
      const latLngs = layer.getLatLngs();
      const coords = latLngs[0].map((latlng) => [latlng.lat, latlng.lng]);

      if (coords.length > 0 && coords[0] !== coords[coords.length - 1]) {
        coords.push(coords[0]);
      }

      try {
        const savedGeofence = await saveGeofenceToBackend({
          coordinates: coords,
          name: `Geofence ${new Date().toLocaleString()}`,
          description: "Created from map interface",
        });

        layer.options.geofenceId = savedGeofence.id;
        setGeofences((prev) => [...prev, savedGeofence]);
      } catch (error) {
        console.error("Geofence creation failed:", error);
      }
    }
  }, [saveGeofenceToBackend]);

  // Initialize component
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Login first
        await login("neslon", "1234");
        
        // Fetch overview data
        const devRes = await fetchOverview();
        console.log("Fetched devices:", devRes.data);
        
        // Filter and process devices
        const validDevices = (devRes.data || []).filter(device => 
          device.latest &&
          device.latest.latitude !== undefined && 
          device.latest.longitude !== undefined &&
          !isNaN(device.latest.latitude) && 
          !isNaN(device.latest.longitude) &&
          device.latest.latitude >= -90 && device.latest.latitude <= 90 &&
          device.latest.longitude >= -180 && device.latest.longitude <= 180
        );
        
        console.log("Valid devices:", validDevices);
        setDevices(validDevices);

        // Fetch geofences
        try {
          const geoRes = await geofenceApi.getGeofences();
          setGeofences(geoRes.data || []);
        } catch (geoError) {
          console.warn("Could not fetch geofences:", geoError.message);
          toast.warning("Could not load geofences", {
            position: "top-right",
            autoClose: 3000,
          });
        }
        
        // Set default center (fallback to a reasonable location)
        let defaultCenter = [-15.4167, 28.2833]; // Lusaka, Zambia coordinates
        let defaultZoom = 10;
        
        // Handle device focusing
        if (deviceId && validDevices.length > 0) {
          const deviceToFocus = validDevices.find(d => d.device_id === deviceId);
          if (deviceToFocus) {
            defaultCenter = [deviceToFocus.latest.latitude, deviceToFocus.latest.longitude];
            defaultZoom = 16;
            setTimeout(() => {
              focusOnDevice(deviceToFocus);
            }, 500);
          } else {
            toast.error(`Device ${deviceId} not found or has invalid coordinates`, {
              position: "top-right",
              autoClose: 5000,
            });
            setShowAllDevices(true);
          }
        } else if (validDevices.length > 0) {
          setShowAllDevices(true);
          defaultCenter = [validDevices[0].latest.latitude, validDevices[0].latest.longitude];
          defaultZoom = 10;
        }
        
        setMapCenter(defaultCenter);
        setMapZoom(defaultZoom);
        console.log("Map center set to:", defaultCenter, "zoom:", defaultZoom);
        
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Initialization error";
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        console.error("Init error:", err.message);
        // Set fallback position even on error
        setMapCenter([-15.4167, 28.2833]);
        setMapZoom(10);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [deviceId, focusOnDevice]);

  // Show all devices
  const showAllDevicesHandler = useCallback(() => {
    setShowAllDevices(true);
    setFocusDevice(null);
    setSelectedDevice("");
    setMapZoom(10);
  }, []);

  // Calculate positions for bounds
  const allPositions = devices
    .filter(device => device.latest && isValidPosition([device.latest.latitude, device.latest.longitude]))
    .map(device => [device.latest.latitude, device.latest.longitude]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon />
              <span>Back to Dashboard</span>
            </Link>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <MapIcon />
                Device Tracking Map
              </h1>
              <p className="text-sm text-gray-600">
                {focusDevice 
                  ? `Tracking: ${focusDevice.name} (${focusDevice.device_id})`
                  : `Showing ${devices.length} devices with valid coordinates`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-2 text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm">Saving geofence...</span>
              </div>
            )}
            
            {focusDevice && (
              <button
                onClick={showAllDevicesHandler}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <NavigationIcon />
                <span>Show All Devices</span>
              </button>
            )}
          </div>
        </div>

        {/* Device selection for mobile */}
        {devices.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={selectedDevice}
              onChange={(e) => {
                const device = devices.find(d => d.device_id === e.target.value);
                if (device) {
                  focusOnDevice(device);
                } else {
                  showAllDevicesHandler();
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="">All Devices</option>
              {devices.map(device => (
                <option key={device.device_id} value={device.device_id}>
                  {device.name} ({device.kind})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Map container */}
      <div className="flex-1 p-4 min-h-0">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-[calc(100vh-200px)]"
            whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-focus on selected device */}
            {focusDevice && focusDevice.latest && isValidPosition([focusDevice.latest.latitude, focusDevice.latest.longitude]) && (
              <AutoFocusMap 
                position={[focusDevice.latest.latitude, focusDevice.latest.longitude]} 
                zoomLevel={16} 
              />
            )}

            {/* Render devices */}
            {devices.map(device => (
              device.latest && isValidPosition([device.latest.latitude, device.latest.longitude]) && (
                <Marker
                  key={device.device_id}
                  position={[device.latest.latitude, device.latest.longitude]}
                  icon={getDeviceIcon(device, selectedDevice === device.device_id)}
                  eventHandlers={{
                    click: () => {
                      focusOnDevice(device);
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-48">
                      <div className="flex items-center gap-2 mb-2">
                        {device.kind === "employee" && <UserIcon />}
                        {device.kind === "equipment" && <TruckIcon />}
                        {device.kind === "livestock" && <LivestockIcon />}
                        <strong className="text-lg">{device.name}</strong>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Type:</strong> {device.kind}</p>
                        <p><strong>Device ID:</strong> {device.device_id}</p>
                        <p><strong>Speed:</strong> {device.latest.speed || 0} km/h</p>
                        <p><strong>Position:</strong> {device.latest.latitude.toFixed(6)}, {device.latest.longitude.toFixed(6)}</p>
                        <p><strong>Last update:</strong> {new Date(device.latest.timestamp).toLocaleString()}</p>
                        <p>
                          <strong>Status:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            device.inside_geofence ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {device.inside_geofence ? "Inside Geofence" : "Outside Geofence"}
                          </span>
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => focusOnDevice(device)}
                        className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <NavigationIcon />
                        Focus on Device
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Render geofences */}
            {geofences.map((geofence) => (
              <Polygon
                key={geofence.id}
                positions={geofence.coordinates}
                pathOptions={{ 
                  color: "#4f46e5", 
                  fillColor: "#4f46e5",
                  fillOpacity: 0.2,
                  weight: 3
                }}
                eventHandlers={{
                  add: (e) => {
                    e.target.options.geofenceId = geofence.id;
                  }
                }}
              >
                <Popup>
                  <div>
                    <strong className="text-lg">{geofence.name}</strong>
                    <p className="text-sm text-gray-600 mt-1">{geofence.description}</p>
                    <button 
                      onClick={() => {
                        setGeofenceToDelete(geofence);
                        setShowDeleteModal(true);
                      }}
                      className="mt-3 w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Geofence
                    </button>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Draw tools */}
            <DrawTools
              onCreated={handleGeofenceCreated}
              onDeleted={() => {}}
              onEdit={() => {}}
            />
            
            {/* Fit bounds when showing all devices */}
            {showAllDevices && allPositions.length > 0 && (
              <FitBounds positions={allPositions} />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
  <div className="bg-white rounded-xl shadow-lg p-6 w-96 relative z-[10000]">
    <h2 className="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
    <p className="mt-2 text-gray-600">
      Are you sure you want to delete <strong>{geofenceToDelete?.name}</strong>?
    </p>
    <div className="mt-4 flex justify-end gap-3">
      <button
        onClick={() => setShowDeleteModal(false)}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        Cancel
      </button>
      <button
        onClick={async () => {
          try {
            await deleteGeofenceFromBackend(geofenceToDelete.id);
            setGeofences(prev => prev.filter(g => g.id !== geofenceToDelete.id));
          } catch (error) {
            console.error("Failed to delete geofence:", error);
          } finally {
            setShowDeleteModal(false);
          }
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Delete
      </button>
    </div>
  </div>
</div>
      )}

      {/* Device list sidebar for larger screens */}
      {devices.length > 0 && (
        <div className="hidden lg:block fixed right-4 top-1/2 transform -translate-y-1/2 w-80 bg-white rounded-2xl shadow-lg p-4 max-h-96 overflow-y-auto z-10">
          <h3 className="font-semibold text-lg mb-3">Devices ({devices.length})</h3>
          <div className="space-y-2">
            {devices.map(device => (
              <div
                key={device.device_id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDevice === device.device_id 
                    ? "bg-indigo-50 border-indigo-200" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => focusOnDevice(device)}
              >
                <div className="flex items-center gap-2">
                  {device.kind === "employee" && <UserIcon />}
                  {device.kind === "equipment" && <TruckIcon />}
                  {device.kind === "livestock" && <LivestockIcon />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{device.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{device.kind}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    device.inside_geofence ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {device.inside_geofence ? "In" : "Out"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Track;