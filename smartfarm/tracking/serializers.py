from rest_framework import serializers
from .models import OwnerProfile, Equipment, Employee, Geofence, GPSData,Alert
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
        fields = ["id", "username", "email"]


class OwnerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = OwnerProfile
        fields = "__all__"


class GeofenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Geofence
        fields = "__all__"


class EquipmentSerializer(serializers.ModelSerializer):
    owner = OwnerProfileSerializer(read_only=True)

    class Meta:
        model = Equipment
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
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

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
    
    