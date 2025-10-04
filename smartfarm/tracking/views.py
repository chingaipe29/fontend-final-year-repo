# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.utils import timezone
from django.db.models import Max, Q
from datetime import datetime
from rest_framework.decorators import action
from math import radians, cos, sin, sqrt, atan2
from django.http import StreamingHttpResponse
import json
import time
from .models import GPSData, Equipment, Employee, Alert, OwnerProfile, Geofence2,Livestock
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .serializers import (
    GPSDataSerializer, EquipmentSerializer, EmployeeSerializer,
    AlertSerializer, OwnerProfileSerializer, 
    UserRegistrationSerializer, UserSerializer, OverviewSerializer, GeofenceSerializer2,LivestockSerializer
)

# ---------- helpers ----------
def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(p1)*cos(p2)*sin(dl/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))

def latest_fix_for_device(device_id):
    return GPSData.objects.filter(device_id=device_id).order_by("-timestamp").first()

def calculate_distance(lat1, lon1, lat2, lon2):
    return haversine_m(lat1, lon1, lat2, lon2)

@api_view(["GET"])
@permission_classes([AllowAny])
def device_config(request, device_id):
    """
    Return device configuration for a given device_id (MAC address)
    This includes:
        - Assigned device_id
        - Latest active geofence for the owner
        - Polling interval
    """

    # Clean incoming device_id
    device_id = device_id.strip()  # remove spaces
    assigned_device_id = None
    owner = None

    # 1️⃣ Check if the device_id belongs to an Equipment
    equipment = Equipment.objects.filter(device_id__iexact=device_id).first()
    if equipment:
        owner = equipment.owner
        assigned_device_id = equipment.device_id
    else:
        # 2️⃣ Check if the device_id belongs to an Employee tracker
        employee = Employee.objects.filter(tracker_device_id__iexact=device_id).first()
        if employee:
            owner = employee.owner
            assigned_device_id = employee.tracker_device_id

    # 3️⃣ If no owner/device found, return default config
    if not owner:
        return Response({
            "device_id": None,
            "geofence": None,
            "poll_seconds": 5
        })

    # 4️⃣ Get the latest active geofence for this owner
    geofence = Geofence2.objects.filter(owner=owner, is_active=True).order_by("-id").first()

    # 5️⃣ Build geofence data if available
    geofence_data = None
    if geofence:
        geofence_data = {
            "id": geofence.id,
            "name": geofence.name,
            "coordinates": geofence.coordinates
        }

    # 6️⃣ Return full config JSON
    return Response({
        "device_id": assigned_device_id,
        "geofence": geofence_data,
        "poll_seconds": 5
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview_status(request):
    try:
        user = request.user
        owner_profile = getattr(user, 'profile', None)  # optional

        geofences = Geofence2.objects.filter(owner=user, is_active=True)
        equipment_qs = Equipment.objects.filter(owner=user)
        employee_qs = Employee.objects.filter(owner=user)
        livestock_qs = Livestock.objects.filter(owner=user)

        results = []

        def compute(obj, kind):
            device_id = obj.device_id if kind == "equipment" else getattr(obj, "tracker_device_id", None)
            last = latest_fix_for_device(device_id) if device_id else None

            inside_any_geofence = False
            if last and geofences.exists():
                for geofence in geofences:
                    if geofence.contains_point(last.latitude, last.longitude):
                        inside_any_geofence = True
                        break

            name = getattr(obj, "name", None) or getattr(obj, "full_name", "")
            return {
                "kind": kind,
                "id": obj.id,
                "name": name,
                "device_id": device_id,
                "owner_id": obj.owner.id if obj.owner else None,
                "latest": GPSDataSerializer(last).data if last else None,
                "inside_geofence": inside_any_geofence,
            }

        for e in equipment_qs:
            results.append(compute(e, "equipment"))
        for emp in employee_qs:
            results.append(compute(emp, "employee"))
        for livestock in livestock_qs:
            results.append(compute(livestock, "livestock"))

        return Response(results)

    except Exception as e:
        print(f"Error in overview_status: {str(e)}")
        return Response({"detail": f"Server error: {str(e)}"}, status=500)

    except OwnerProfile.DoesNotExist:
        return Response({"detail": "Owner profile not found. Please complete your profile."}, status=400)
    except Exception as e:
        print(f"Error in overview_status: {str(e)}")  # Debug logging
        return Response({"detail": f"Server error: {str(e)}"}, status=500)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def device_history(request, device_id):
    equipment = Equipment.objects.filter(device_id=device_id, owner=request.user).first()
    employee = Employee.objects.filter(tracker_device_id=device_id, owner=request.user).first()

    if not equipment and not employee:
        return Response({"detail": f"Device '{device_id}' not found or not owned by user"}, status=404)

    qs = GPSData.objects.filter(device_id=device_id).order_by("timestamp")

    t_from = request.GET.get("from")
    t_to = request.GET.get("to")

    if t_from:
        qs = qs.filter(timestamp__gte=t_from)
    if t_to:
        qs = qs.filter(timestamp__lte=t_to)

    return Response(GPSDataSerializer(qs, many=True).data)

# ---------- Alert ack ----------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def alert_ack(request, pk):
    try:
        alert = Alert.objects.get(pk=pk)
        alert.is_resolved = True
        alert.save()
        return Response({"status": "acknowledged", "alert_id": alert.id})
    except Alert.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

# ---------- SSE for live alerts ----------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stream_alerts(request):
    def event_stream():
        last_id = None
        while True:
            user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
            user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
            
            user_equipment = [device_id for device_id in user_equipment if device_id]
            user_employees = [device_id for device_id in user_employees if device_id]
            
            all_device_ids = user_equipment + user_employees
            
            qs = Alert.objects.filter(
                gps_data__device_id__in=all_device_ids,
                is_resolved=False
            ).order_by("-created_at")
            
            if qs.exists():
                latest = qs.first()
                if last_id != latest.id:
                    last_id = latest.id
                    payload = AlertSerializer(latest).data
                    yield f"data: {json.dumps(payload)}\n\n"
            time.sleep(2)

    resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    resp["Cache-Control"] = "no-cache"
    return resp

# ------------------------------
# GPS Telemetry
# ------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def gps_data(request):
    """
    Receive GPS data from ESP32
    """
    serializer = GPSDataSerializer(data=request.data)
    
    if serializer.is_valid():
        gps_instance = serializer.save()

        # Identify the owner
        equipment = Equipment.objects.filter(device_id=gps_instance.device_id).first()
        employee = None
        owner = None
        
        if equipment:
            owner = equipment.owner
        else:
            employee = Employee.objects.filter(tracker_device_id=gps_instance.device_id).first()
            if employee:
                owner = employee.owner

        # Check against all active geofences for this owner
        inside_geofence = False
        if owner:
            geofences = Geofence2.objects.filter(owner=owner, is_active=True)
            for geofence in geofences:
                if geofence.contains_point(gps_instance.latitude, gps_instance.longitude):
                    inside_geofence = True
                    break

        # Create alert if device is outside all geofences
        if owner and not inside_geofence:
            # Check if there's already an unresolved geofence alert for this device
            existing_alert = Alert.objects.filter(
                gps_data__device_id=gps_instance.device_id,
                alert_type="geofence",
                is_resolved=False
            ).first()
            
            if not existing_alert:
                alert_message = f"{equipment.name if equipment else employee.full_name} has left the geofence!"
                Alert.objects.create(
                    gps_data=gps_instance,
                    alert_type="geofence",
                    message=alert_message
                )

        # Speed alert - only create if no recent unresolved speed alert exists
        if gps_instance.speed and gps_instance.speed > 40:
            from django.utils import timezone
            from datetime import timedelta
            
            # Check for recent speed alerts (within last 5 minutes)
            recent_speed_alert = Alert.objects.filter(
                gps_data__device_id=gps_instance.device_id,
                alert_type="speed",
                is_resolved=False,
                created_at__gte=timezone.now() - timedelta(minutes=5)
            ).first()
            
            if not recent_speed_alert:
                Alert.objects.create(
                    gps_data=gps_instance,
                    alert_type="speed",
                    message=f"Overspeed detected: {gps_instance.speed} km/h",
                )

        return Response({"status": "success", "data": serializer.data, "inside_geofence": inside_geofence})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------
# Equipment Management
# ------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def equipment_list(request):
    if request.method == "GET":
        equipment = Equipment.objects.filter(owner=request.user)
        serializer = EquipmentSerializer(equipment, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------
# Employee Management
# ------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def employee_list(request):
    if request.method == "GET":
        employees = Employee.objects.filter(owner=request.user)
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def livestock_list(request):
    if request.method == "GET":
        # Filter directly by User
        livestock = Livestock.objects.filter(owner=request.user)
        serializer = LivestockSerializer(livestock, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = LivestockSerializer(data=request.data)
        if serializer.is_valid():
            # Save with request.user as owner
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------------------
# Alerts Management
# ------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def alerts_list(request):
    user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
    user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
    
    user_equipment = [device_id for device_id in user_equipment if device_id]
    user_employees = [device_id for device_id in user_employees if device_id]
    
    all_device_ids = user_equipment + user_employees
    
    alerts = Alert.objects.filter(
        is_resolved=False,
        gps_data__device_id__in=all_device_ids
    ).order_by("-created_at")
    
    serializer = AlertSerializer(alerts, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resolve_alert(request, pk):
    try:
        alert = Alert.objects.get(pk=pk)
        
        user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
        user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
        
        user_equipment = [device_id for device_id in user_equipment if device_id]
        user_employees = [device_id for device_id in user_employees if device_id]
        
        all_device_ids = user_equipment + user_employees
        
        if alert.gps_data.device_id not in all_device_ids:
            return Response({"error": "Alert not found or access denied"}, status=404)
            
        alert.is_resolved = True
        alert.save()
        return Response({"status": "resolved"})
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=404)

# ------------------------------
# Owner Management
# ------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def owner_list(request):
    if request.method == "GET":
        try:
            owner = OwnerProfile.objects.get(user=request.user)
            serializer = OwnerProfileSerializer(owner)
            return Response([serializer.data])
        except OwnerProfile.DoesNotExist:
            return Response([])

    elif request.method == "POST":
        serializer = OwnerProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    try:
        profile = OwnerProfile.objects.get(user=request.user)
        serializer = OwnerProfileSerializer(profile)
        return Response(serializer.data)
    except OwnerProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

# ------------------------------
# Geofence ViewSet (Primary Geofence Handler)
# ------------------------------
class GeofenceViewSet(viewsets.ModelViewSet):
    serializer_class = GeofenceSerializer2
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Geofence2.objects.filter(owner=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        coordinates = request.data.get('coordinates')
        if coordinates:
            try:
                # Ensure polygon is closed
                if coordinates[0] != coordinates[-1]:
                    coordinates.append(coordinates[0])
                
                # Save the geofence
                self.perform_create(serializer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {'error': f'Invalid polygon coordinates: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {'error': 'Coordinates are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['patch'])
    def update_coordinates(self, request, pk=None):
        """Update geofence coordinates"""
        geofence = self.get_object()
        coordinates = request.data.get('coordinates')
        
        if not coordinates:
            return Response(
                {'error': 'Coordinates are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ensure polygon is closed
            if coordinates[0] != coordinates[-1]:
                coordinates.append(coordinates[0])
                
            geofence.coordinates = coordinates
            geofence.save()
            
            return Response(GeofenceSerializer2(geofence).data)
            
        except Exception as e:
            return Response(
                {'error': f'Invalid coordinates: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def check_location(self, request):
        """Check if a location is inside any of the user's geofences"""
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
            
            matching_geofences = []
            user_geofences = self.get_queryset()
            
            for geofence in user_geofences:
                if geofence.contains_point(lat, lng):
                    matching_geofences.append(geofence)
            
            serializer = self.get_serializer(matching_geofences, many=True)
            return Response({
                'inside_geofences': len(matching_geofences) > 0,
                'geofences': serializer.data
            })
            
        except ValueError:
            return Response(
                {'error': 'Invalid coordinates'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle geofence active status"""
        geofence = self.get_object()
        geofence.is_active = not geofence.is_active
        geofence.save()
        
        return Response({
            'status': 'success',
            'is_active': geofence.is_active,
            'message': f'Geofence {"activated" if geofence.is_active else "deactivated"}'
        })

@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def user_profile_detail(request):
    """
    Get, update, or partially update user profile
    """
    # Get or create OwnerProfile
    try:
        profile = OwnerProfile.objects.get(user=request.user)
    except OwnerProfile.DoesNotExist:
        profile = OwnerProfile.objects.create(user=request.user)

    if request.method == "GET":
        serializer = OwnerProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method in ["PUT", "PATCH"]:
        # Handle User model updates
        user = request.user
        user_fields = ['username', 'email', 'first_name', 'last_name']
        
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        
        # Handle OwnerProfile updates
        profile_fields = ['phone_number', 'address']
        for field in profile_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()
        
        # Return updated data
        serializer = OwnerProfileSerializer(profile)
        return Response(serializer.data)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile_photo(request):
    """
    Update user profile photo
    """
    try:
        profile = OwnerProfile.objects.get(user=request.user)
    except OwnerProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if 'profile_photo' not in request.FILES:
        return Response({'error': 'Profile photo is required'}, status=status.HTTP_400_BAD_REQUEST)

    profile.profile_photo = request.FILES['profile_photo']
    profile.save()
    
    serializer = OwnerProfileSerializer(profile)
    return Response(serializer.data)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_notification_preferences(request):
    """
    Update user notification preferences
    """
    try:
        profile = OwnerProfile.objects.get(user=request.user)
    except OwnerProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    notification_preferences = request.data.get('notification_preferences')
    
    if notification_preferences is None:
        return Response({'error': 'Notification preferences are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Update notification preferences
    if hasattr(profile, 'notification_preferences'):
        profile.notification_preferences = {
            **profile.notification_preferences,
            **notification_preferences
        }
    else:
        profile.notification_preferences = notification_preferences
    
    profile.save()
    
    serializer = OwnerProfileSerializer(profile)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response(
            {'error': 'Current password and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check current password
    if not user.check_password(current_password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password updated successfully'})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_activity_logs(request):
    """
    Get user activity logs
    """
    limit = int(request.GET.get('limit', 50))
    # You would need to implement activity logging in your models
    # For now, return empty array or implement your activity tracking
    return Response([])

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clear_all_alerts(request):
    """
    Mark all alerts for the authenticated user's devices as resolved.
    """
    user = request.user

    # Get all device IDs for this user
    user_equipment_ids = Equipment.objects.filter(owner=user).values_list('device_id', flat=True)
    user_employee_ids = Employee.objects.filter(owner=user).values_list('tracker_device_id', flat=True)
    all_device_ids = list(user_equipment_ids) + list(user_employee_ids)

    if not all_device_ids:
        return Response({"status": "no devices found, no alerts cleared"})

    # Update all unresolved alerts for these devices
    updated_count = Alert.objects.filter(
        gps_data__device_id__in=all_device_ids,
        is_resolved=False
    ).update(is_resolved=True)

    return Response({
        "status": "success",
        "cleared_alerts_count": updated_count
    })

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_alert(request, pk):
    try:
        alert = Alert.objects.get(pk=pk)
        user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
        user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
        all_device_ids = list(user_equipment) + list(user_employees)

        if alert.gps_data.device_id not in all_device_ids:
            return Response({"error": "Alert not found or access denied"}, status=404)

        alert.delete()
        return Response({"status": "deleted"}, status=200)
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=404)


# ------------------------------
# Equipment Delete
# ------------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_equipment(request, pk):
    try:
        equipment = Equipment.objects.get(pk=pk, owner=request.user)
        equipment.delete()
        return Response({"status": "deleted"}, status=200)
    except Equipment.DoesNotExist:
        return Response({"error": "Equipment not found or access denied"}, status=404)


# ------------------------------
# Employee Delete
# ------------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_employee(request, pk):
    try:
        employee = Employee.objects.get(pk=pk, owner=request.user)
        employee.delete()
        return Response({"status": "deleted"}, status=200)
    except Employee.DoesNotExist:
        return Response({"error": "Employee not found or access denied"}, status=404)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_livestock(request, pk):
    try:
        livestock = Livestock.objects.get(pk=pk, owner=request.user)  # ✅ Fixed: use request.user directly
        livestock.delete()
        return Response({"status": "deleted"}, status=200)
    except Livestock.DoesNotExist:
        return Response({"error": "Livestock not found or access denied"}, status=404)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def equipment_detail(request, pk):
    try:
        equipment = Equipment.objects.get(pk=pk, owner=request.user)  # ✅ Add ownership check
    except Equipment.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EquipmentSerializer(equipment)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = EquipmentSerializer(equipment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        equipment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    try:
        employee = Employee.objects.get(pk=pk, owner=request.user)
    except Employee.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = EmployeeSerializer(employee, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def livestock_detail(request, pk):
    try:
        livestock = Livestock.objects.get(pk=pk, owner=request.user)
    except Livestock.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = LivestockSerializer(livestock)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = LivestockSerializer(livestock, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        livestock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
