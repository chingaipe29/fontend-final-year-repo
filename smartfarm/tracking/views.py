
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Max
from datetime import datetime
from math import radians, cos, sin, sqrt, atan2
from django.http import StreamingHttpResponse
import json
import time
from .models import GPSData, Equipment, Employee, Geofence, Alert, OwnerProfile
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from rest_framework import status
from .serializers import (
    GPSDataSerializer, EquipmentSerializer, EmployeeSerializer,
    GeofenceSerializer, AlertSerializer, OwnerProfileSerializer, 
    UserRegistrationSerializer, UserSerializer, OverviewSerializer
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

# ---------- geofence PATCH endpoint ----------
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def geofence_radius_update(request, pk):
    try:
        # CRITICAL: Add owner check for security
        geofence = Geofence.objects.get(pk=pk, owner=request.user)
    except Geofence.DoesNotExist:
        return Response({"detail": "Geofence not found or access denied"}, status=404)

    radius = request.data.get("radius_meters")
    if radius is None:
        return Response({"detail": "radius_meters is required"}, status=400)

    try:
        geofence.radius_meters = float(radius)
        geofence.save()
    except ValueError:
        return Response({"detail": "radius_meters must be numeric"}, status=400)

    return Response(GeofenceSerializer(geofence).data)

# ---------- ESP32 pulls its config ----------
@api_view(["GET"])
@permission_classes([AllowAny])
def device_config(request, device_id):
    # Find equipment/employee by device_id
    equipment = Equipment.objects.filter(device_id=device_id).first()
    employee = None
    owner = None
    if equipment:
        owner = equipment.owner
    else:
        # FIXED: Use tracker_device_id for employees
        employee = Employee.objects.filter(tracker_device_id=device_id).first()
        if employee:
            owner = employee.owner

    if not owner:
        return Response({"detail": "Unknown device_id"}, status=404)

    # Use the most recent geofence for that owner
    geofence = Geofence.objects.filter(owner=owner).order_by("-id").first()
    if not geofence:
        return Response({"geofence": None, "poll_seconds": 5})

    return Response({
        "geofence": {
            "center_latitude": geofence.center_latitude,
            "center_longitude": geofence.center_longitude,
            "radius_meters": geofence.radius_meters,
            "name": geofence.name,
        },
        "poll_seconds": 5
    })

# ---------- Dashboard overview ----------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview_status(request):
    owner = request.user
    
    geofence = Geofence.objects.filter(owner=owner).order_by("-id").first()
    equipment_qs = Equipment.objects.filter(owner=owner)
    employee_qs = Employee.objects.filter(owner=owner)
    
    results = []

    def compute(obj, kind):
        # FIXED: Use tracker_device_id for employees
        device_id = obj.device_id if kind == "equipment" else obj.tracker_device_id
        last = latest_fix_for_device(device_id) if device_id else None
        inside = False

        if geofence and last:
            d = haversine_m(
                last.latitude, last.longitude,
                geofence.center_latitude, geofence.center_longitude
            )
            inside = d <= geofence.radius_meters

        name = getattr(obj, "name", None) or getattr(obj, "full_name", "")

        return {
            "kind": kind,
            "id": obj.id,
            "name": name,
            "device_id": device_id,
            "owner_id": obj.owner.id if obj.owner else None,
            "geofence": GeofenceSerializer(geofence).data if geofence else None,
            "latest": GPSDataSerializer(last).data if last else None,
            "inside_geofence": inside,
        }

    for e in equipment_qs:
        results.append(compute(e, "equipment"))
    
    for emp in employee_qs:
        results.append(compute(emp, "employee"))

    return Response(results)

# ---------- History endpoint for map ----------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def device_history(request, device_id):
    # FIXED: Check if user owns this device (both equipment and employee tracker_device_id)
    equipment = Equipment.objects.filter(device_id=device_id, owner=request.user).first()
    employee = Employee.objects.filter(tracker_device_id=device_id, owner=request.user).first()
    
    if not equipment and not employee:
        return Response({"detail": "Device not found or not owned by user"}, status=404)
    
    t_from = request.GET.get("from")
    t_to = request.GET.get("to")
    qs = GPSData.objects.filter(device_id=device_id).order_by("timestamp")
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
    except Alert.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    return Response({"status": "acknowledged", "alert_id": alert.id})

# ---------- SSE for live alerts ----------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stream_alerts(request):
    def event_stream():
        last_id = None
        while True:
            # FIXED: Use tracker_device_id for employees
            user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
            user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
            
            # Filter out None/empty values
            user_equipment = [device_id for device_id in user_equipment if device_id]
            user_employees = [device_id for device_id in user_employees if device_id]
            
            all_device_ids = user_equipment + user_employees
            
            qs = Alert.objects.filter(
                gps_data__device_id__in=all_device_ids
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
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def gps_data(request):
    if request.method == "GET":
        latest_data = GPSData.objects.last()
        if latest_data:
            serializer = GPSDataSerializer(latest_data)
            return Response(serializer.data)
        return Response({"status": "no data available"})

    elif request.method == "POST":
        serializer = GPSDataSerializer(data=request.data)
        if serializer.is_valid():
            gps_instance = serializer.save()

            # --- Geofence Check ---
            equipment = Equipment.objects.filter(device_id=gps_instance.device_id).first()
            employee = None
            owner = None
            
            if equipment:
                owner = equipment.owner
            else:
                # FIXED: Check employee tracker_device_id too
                employee = Employee.objects.filter(tracker_device_id=gps_instance.device_id).first()
                if employee:
                    owner = employee.owner

            if owner:
                geofence = Geofence.objects.filter(owner=owner).last()
                if geofence:
                    distance = calculate_distance(
                        gps_instance.latitude,
                        gps_instance.longitude,
                        geofence.center_latitude,
                        geofence.center_longitude,
                    )
                    if distance > geofence.radius_meters:
                        alert_message = f"{equipment.name if equipment else employee.full_name} has left the geofence!"
                        Alert.objects.create(
                            gps_data=gps_instance,
                            alert_type="geofence",
                            message=alert_message,
                        )

            # --- Speed Check (example threshold = 40 km/h) ---
            if gps_instance.speed and gps_instance.speed > 40:
                Alert.objects.create(
                    gps_data=gps_instance,
                    alert_type="speed",
                    message=f"Overspeed detected: {gps_instance.speed} km/h",
                )

            return Response({"status": "success", "data": serializer.data})
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

# ------------------------------
# Geofence Management
# ------------------------------
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def geofence_list(request):
    if request.method == "GET":
        geofences = Geofence.objects.filter(owner=request.user)
        serializer = GeofenceSerializer(geofences, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = GeofenceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status极速.HTTP_400_BAD_REQUEST)

# ------------------------------
# Alerts Management
# ------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def alerts_list(request):
    # FIXED: Use tracker_device_id for employees
    user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
    user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
    
    # Filter out None/empty values
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
        
        # FIXED: Use tracker_device_id for employees
        user_equipment = Equipment.objects.filter(owner=request.user).values_list('device_id', flat=True)
        user_employees = Employee.objects.filter(owner=request.user).values_list('tracker_device_id', flat=True)
        
        # Filter out None values
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
        }, status=status.HTTP极速_201_CREATED)
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

@api_view(["GET"])
@permission_classes([AllowAny])
def test_geofence_endpoint(request, pk):
    return Response({
        "message": "Geofence endpoint is working!",
        "geofence_id": pk,
        "received_data": request.data
    })