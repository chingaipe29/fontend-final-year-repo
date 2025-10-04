# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a final year project implementing a **SmartFarm GPS tracking system** with:
- **Backend**: Django REST API with JWT authentication, SQLite database
- **Frontend**: React application with mapping capabilities using Leaflet
- **IoT Integration**: ESP32 device support for GPS data collection
- **Real-time Features**: Live tracking, geofencing, and alert system

## Architecture

### Backend Structure (`smartfarm/`)
- **Django Project**: `smartfarm/smartfarm/` - Main project configuration
- **Tracking App**: `smartfarm/tracking/` - Core business logic
  - **Models**: Equipment, Employee, Livestock, GPSData, Geofence2, Alert
  - **Views**: REST API endpoints with JWT authentication
  - **Real-time**: Server-sent events for live alerts
- **Database**: SQLite (`db.sqlite3`) for development

### Frontend Structure (`frontend/tracking/`)
- **React Application**: Create React App with React Router
- **State Management**: Zustand for authentication
- **UI Framework**: Tailwind CSS for styling
- **Maps**: Leaflet and React-Leaflet for GPS visualization
- **Pages**: Dashboard, Track, Equipment/Employee/Livestock management, Alerts

### Key Models Relationships
- **User** → owns → Equipment, Employee, Livestock, Geofence2
- **Equipment/Employee/Livestock** → generates → GPSData via device_id
- **GPSData** → triggers → Alert based on geofence breaches or speed limits
- **Geofence2** → contains polygon coordinates and ownership

## Common Commands

### Backend Development (Django)
```powershell
# Navigate to Django project
cd smartfarm

# Run development server (default: http://localhost:8000)
python manage.py runserver

# Run on specific port or IP
python manage.py runserver 0.0.0.0:8000

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Django shell for debugging
python manage.py shell

# Run tests
python manage.py test
python manage.py test tracking  # Test specific app

# Collect static files (if needed)
python manage.py collectstatic
```

### Frontend Development (React)
```powershell
# Navigate to React project
cd frontend/tracking

# Install dependencies
npm install

# Start development server (default: http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint/format (if configured)
npm run lint
```

### Full Stack Development
```powershell
# Start both backend and frontend simultaneously

# Terminal 1 - Django backend
cd smartfarm && python manage.py runserver

# Terminal 2 - React frontend  
cd frontend/tracking && npm start
```

## API Endpoints Structure

### Authentication
- `POST /api/register/` - User registration
- `POST /api/token/` - Login (JWT)
- `POST /api/token/refresh/` - Refresh token

### Core Resources
- `GET|POST /api/equipment/` - Equipment management
- `GET|PUT|DELETE /api/equipment/<id>/` - Equipment detail operations
- `DELETE /api/equipment/delete/<id>/` - Equipment deletion
- `GET|POST /api/employees/` - Employee management
- `GET|PUT|DELETE /api/employees/<id>/` - Employee detail operations  
- `DELETE /api/employees/delete/<id>/` - Employee deletion
- `GET|POST /api/livestock/` - Livestock management
- `GET|PUT|DELETE /api/livestock/<id>/` - Livestock detail operations
- `DELETE /api/livestock/delete/<id>/` - Livestock deletion
- `POST /api/gps-data/` - GPS telemetry from ESP32 devices

### Tracking & Monitoring
- `GET /api/status/overview/` - Dashboard summary with latest GPS positions
- `GET /api/devices/<device_id>/history/` - Historical GPS data
- `GET /api/devices/<device_id>/config/` - Device configuration for ESP32

### Geofencing
- `GET|POST /api/geofences-api/` - Geofence CRUD operations
- `POST /api/geofences-api/check_location/` - Check if point is inside geofences

### Alerts
- `GET /api/alerts/` - Active alerts for user's devices
- `POST /api/alerts/<id>/resolve/` - Mark alert as resolved
- `GET /api/stream/alerts/` - Server-sent events for real-time alerts

## Database Schema Key Points

### Multi-tenant Design
- All core models (Equipment, Employee, Livestock, Geofence2) are owned by `User`
- GPSData links to devices via `device_id` string field
- Alerts are generated automatically based on geofence breaches and speed limits

### Device Integration
- ESP32 devices identified by `device_id` (MAC address or custom ID)
- Equipment uses `device_id` field, Employees use `tracker_device_id` 
- Single GPSData table serves all device types

### Geofencing Implementation
- `Geofence2.coordinates` stores polygon as JSON array of [lat, lng] pairs
- `contains_point()` method implements ray casting algorithm
- Alerts generated when devices move outside all active geofences

## Development Notes

### CORS Configuration
The Django backend includes CORS middleware with specific allowed origins for React frontend. Update `CORS_ALLOWED_ORIGINS` in `settings.py` for different network configurations.

### JWT Token Configuration
- Access tokens expire after 60 minutes
- Refresh tokens expire after 7 days
- Tokens auto-rotate on refresh

### Real-time Features
- Server-sent events endpoint `/api/stream/alerts/` for live alert notifications
- Frontend polling for dashboard updates (consider WebSocket upgrade for production)

### ESP32 Integration
- Devices poll `/api/devices/<device_id>/config/` for geofence updates
- GPS data sent via POST to `/api/gps-data/`
- Automatic alert generation based on geofence violations and speed limits

### State Management
- Frontend uses Zustand for authentication state
- JWT tokens stored in localStorage
- API wrapper (`api.js`) handles authentication headers

### Map Integration
- Leaflet for map rendering with OpenStreetMap tiles
- React-Leaflet for React integration
- Leaflet Draw for geofence polygon creation
- Geofence visualization and GPS track overlays

## File Structure Notes

### Important Configuration Files
- `smartfarm/smartfarm/settings.py` - Django configuration, database, CORS, JWT
- `frontend/tracking/src/api.js` - API client configuration
- `frontend/tracking/src/store/auth.js` - Authentication state management
- `frontend/tracking/tailwind.config.js` - Tailwind CSS configuration

### Key Frontend Components
- `src/pages/Dashboard.js` - Main dashboard with equipment overview
- `src/pages/Track.js` - Live GPS tracking with map visualization
- `src/pages/Alerts.js` - Alert management interface
- Equipment/Employee/Livestock management pages with CRUD operations

## Recent Improvements

### Alert System Enhancements
- **Duplicate Prevention**: Backend now prevents multiple alerts for the same device/alert type
- **Geofence Alerts**: Only one unresolved geofence alert per device at a time
- **Speed Alerts**: Limited to one alert per device every 5 minutes
- **Frontend Display**: Shows one alert per device, displaying the most recent

### User Profile System
- **Complete Profile Management**: Users can edit username, email, first/last name, phone, address
- **Profile Photo Upload**: Image upload functionality with proper backend handling
- **Auto-Create Profiles**: OwnerProfile automatically created when needed
- **Comprehensive Display**: Shows all user information including signup date

### Dashboard Navigation
- **Management Page Redirects**: Quick action buttons now redirect to management pages:
  - "Manage Employees" → `/employeesM`
  - "Manage Equipment" → `/equipmentM` 
  - "Manage Livestock" → `/livestockM`
- **Full CRUD Access**: Users can add, edit, and delete from management pages

## Troubleshooting Common Issues

### API Endpoint Issues
- **Delete Operations**: Use `/api/<resource>/delete/<id>/` endpoints (not `/api/<resource>/<id>/`)
- **Edit Operations**: Use standard REST endpoints `/api/<resource>/<id>/` with PUT method
- **Ownership**: All resources are filtered by `owner=request.user` for security

### Frontend Issues
- **Authentication**: JWT tokens are auto-refreshed via axios interceptors
- **CORS**: Backend must include frontend URL in `CORS_ALLOWED_ORIGINS`
- **API Base URL**: Update `BACKEND_BASE` in `frontend/tracking/src/api.js` for different environments

### Database Issues
- **Migrations**: Run `python manage.py makemigrations tracking` then `python manage.py migrate`
- **Profile Photos**: Requires `python manage.py migrate` after adding ImageField
- **Ownership Mismatch**: All models use `User` directly, not `OwnerProfile`

### Model Relationships
- **Equipment**: `owner` (User) → `device_id` (string)
- **Employee**: `owner` (User) → `tracker_device_id` (optional string) 
- **Livestock**: `owner` (User) → `device_id` (string)
- **OwnerProfile**: `user` (OneToOne) → `profile_photo` (ImageField)
- All models link to GPSData via `device_id` matching

This SmartFarm system is designed for agricultural GPS tracking with multi-user support, real-time monitoring, and IoT device integration.
