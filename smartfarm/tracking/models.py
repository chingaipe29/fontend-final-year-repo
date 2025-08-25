from django.db import models
from django.contrib.auth.models import User


class OwnerProfile(models.Model):
    """Extra info for system owners (linked to Django User)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.user.username


class Geofence(models.Model):
    """User-defined geofence settings"""
    # Change from OwnerProfile to User temporarily
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="geofences")
    center_latitude = models.FloatField()
    center_longitude = models.FloatField()
    radius_meters = models.FloatField(default=100.0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Geofence for {self.owner.username} (Radius: {self.radius_meters}m)"


class Equipment(models.Model):
    """Equipment registered in the system"""
    # Change from OwnerProfile to User temporarily
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="equipment")
    name = models.CharField(max_length=100)
    device_id = models.CharField(max_length=100, unique=True)  # links to ESP32
    category = models.CharField(max_length=50, choices=[
        ("tractor", "Tractor"),
        ("vehicle", "Vehicle"),
        ("livestock", "Livestock"),
        ("other", "Other")
    ])
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.device_id})"


class Employee(models.Model):
    """Employees being tracked"""
    # Change from OwnerProfile to User temporarily
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="employees")
    full_name = models.CharField(max_length=150)
    employee_id = models.CharField(max_length=100, unique=True)
    tracker_device_id = models.CharField(max_length=100, blank=True, null=True)  # optional GPS tracker
    position = models.CharField(max_length=100, blank=True, null=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class GPSData(models.Model):
    """Raw telemetry sent from ESP32"""
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="gps_data", null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="gps_data", null=True, blank=True)

    device_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField()
    altitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"GPS {self.device_id} @ {self.timestamp}"


class Alert(models.Model):
    ALERT_TYPES = (
        ("geofence", "Geofence Breach"),
        ("speed", "Overspeed"),
    )
    gps_data = models.ForeignKey("GPSData", on_delete=models.CASCADE, related_name="alerts")
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.alert_type} - {self.message[:30]}"