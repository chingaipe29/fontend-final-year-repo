from rest_framework import serializers
from .models import OwnerProfile, Equipment, Employee, Geofence, GPSData,Alert,Geofence2,Livestock
from django.contrib.auth.models import User

class OverviewSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    alert_type = serializers.CharField()
    message = serializers.CharField()
    gps_data = serializers.DictField()
    timestamp = serializers.DateTimeField()
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "date_joined"]


class OwnerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    # Add user fields for easy access
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = OwnerProfile
        fields = "__all__"


class GeofenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Geofence
        fields = "__all__"


class EquipmentSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)  # Just show the username

    class Meta:
        model = Equipment
        fields = "__all__"
        extra_kwargs = {
            "device_id": {"required": True},
            "name": {"required": True},
            "category": {"required": True},
        }

class EmployeeSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)  # read-only for owner

    class Meta:
        model = Employee
        fields = "__all__"
        extra_kwargs = {
            "employee_id": {"required": True},
            "full_name": {"required": True},
        }




class GPSDataSerializer(serializers.ModelSerializer):
    equipment = EquipmentSerializer(read_only=True)
    employee = EmployeeSerializer(read_only=True)

    class Meta:
        model = GPSData
        fields = "__all__"

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = "__all__"

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        # Create the user but skip OwnerProfile creation for now
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # COMMENT OUT OwnerProfile creation temporarily
        # OwnerProfile.objects.create(user=user)
        
        return user
    
class GeofenceSerializer2(serializers.ModelSerializer):
    
    class Meta:
        model = Geofence2
        fields = ['id', 'name', 'description', 'coordinates', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['created_at', 'updated_at']

    def validate_coordinates(self, value):
        """Validate that coordinates form a valid polygon"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Coordinates must be a list")
        
        if len(value) < 3:
            raise serializers.ValidationError("Polygon must have at least 3 points")
        
        for point in value:
            if not isinstance(point, list) or len(point) != 2:
                raise serializers.ValidationError("Each point must be a [lat, lng] array")
            
            lat, lng = point
            if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                raise serializers.ValidationError("Invalid coordinates: lat must be between -90 and 90, lng between -180 and 180")
        
        return value

class LivestockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livestock
        fields = '__all__'
        read_only_fields = ('owner', 'created_at', 'updated_at')