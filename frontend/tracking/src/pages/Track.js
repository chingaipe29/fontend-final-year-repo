import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { historyForDevice } from "../api";
import axios from "axios";

const API_BASE = "http://192.168.43.214:8000/api";
const MAPTILER_API_KEY = "hfAd07sIRGRdEIg2oM3B"; // Get from https://www.maptiler.com/cloud/

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom blue polyline style
const bluePolylineStyle = {
  color: '#007bff',
  weight: 6,
  opacity: 0.8,
  lineJoin: 'round'
};

export default function Track() {
  const { deviceId } = useParams();
  const [pos, setPos] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [points, setPoints] = useState([]);
  const [mapStyle, setMapStyle] = useState("streets"); // Default MapTiler style
  const mapRef = useRef();

  // MapTiler style options
  const mapStyles = {
    streets: "streets",
    satellite: "satellite",
    basic: "basic",
    outdoor: "outdoor",
    light: "light",
    dark: "dark"
  };

  // Get MapTiler tile URL based on selected style
  const getTileUrl = (style) => {
    return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
  };

  // poll the latest point every 3s
  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/devices/${deviceId}/history/`, { params: {} });
        if (data.length) {
          const newPoints = data.map(d => [d.latitude, d.longitude]);
          setPoints(newPoints);
          const last = data[data.length-1];
          const newPosition = [last.latitude, last.longitude];
          setPos(newPosition);
          setSpeed(last.speed);
          
          // Center map on new position
          if (mapRef.current && newPosition) {
            mapRef.current.setView(newPosition, 15);
          }
        }
      } catch (error) {
        console.error("Error polling device data:", error);
      }
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [deviceId]);

  // initial history (last 2 hours)
  useEffect(() => {
    const to = new Date().toISOString();
    const from = new Date(Date.now()-2*3600*1000).toISOString();
    historyForDevice(deviceId, from, to).then(({data}) => {
      if (data.length) {
        const newPoints = data.map(d => [d.latitude, d.longitude]);
        setPoints(newPoints);
        const last = data[data.length-1];
        const newPosition = [last.latitude, last.longitude];
        setPos(newPosition);
        setSpeed(last.speed);
        
        // Center map on initial position
        if (mapRef.current && newPosition) {
          mapRef.current.setView(newPosition, 15);
        }
      }
    }).catch(error => {
      console.error("Error loading device history:", error);
    });
  }, [deviceId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Live Tracking</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Device: <span className="font-medium">{deviceId}</span> | Speed: {speed ?? "--"} km/h
            </div>
            <select 
              value={mapStyle} 
              onChange={(e) => setMapStyle(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="streets">Streets</option>
              <option value="satellite">Satellite</option>
              <option value="basic">Basic</option>
              <option value="outdoor">Outdoor</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow">
        <div style={{height: "70vh"}}>
          <MapContainer
            ref={mapRef}
            center={pos || [0, 0]}
            zoom={pos ? 15 : 2}
            style={{height: "100%", width: "100%"}}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            {/* MapTiler Tile Layer */}
            <TileLayer
              attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
              url={getTileUrl(mapStyle)}
            />
            
            {/* Current position marker */}
            {pos && (
              <Marker position={pos}>
                <Popup>
                  <div className="p-2">
                    <strong>Current Position</strong>
                    <br />
                    Device: {deviceId}
                    <br />
                    Speed: {speed ?? "--"} km/h
                    <br />
                    Coordinates: {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Blue tracking polyline showing the complete route */}
            {points.length > 1 && (
              <Polyline 
                positions={points} 
                pathOptions={bluePolylineStyle}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Legend for the tracking line */}
      <div className="bg-white rounded-2xl p-4 shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-blue-600 rounded"></div>
            <span className="text-sm text-gray-600">Device Travel Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Current Position</span>
          </div>
        </div>
      </div>
    </div>
  );
}