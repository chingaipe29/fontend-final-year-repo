from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    gps_data, equipment_list, employee_list, geofence_list, alerts_list,
    resolve_alert, owner_list, geofence_radius_update, device_config,
    overview_status, device_history, alert_ack, stream_alerts, register_user, get_user_profile,test_geofence_endpoint
)

urlpatterns = [
    # telemetry & resources
    path("gps-data/", gps_data),
    path("equipment/", equipment_list),
    path("employees/", employee_list),
    path("owners/", owner_list),
    
    # device pulls its config (ESP32)
    path("devices/<str:device_id>/config/", device_config),
    
    # dashboard summary + history
    path("devices/<str:device_id>/history/", device_history),
    
    # alerts
    path("alerts/", alerts_list),
    path("alerts/<int:pk>/resolve/", resolve_alert),
    path("alerts/<int:pk>/ack/", alert_ack),
    
    # optional: server-sent events for alerts
    path("stream/alerts/", stream_alerts),

    # auth
    path("token/", TokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path('register/', register_user, name='register'),
    path('profile/', get_user_profile, name='profile'),
    path("status/overview/", overview_status),
    
    path("geofences/",geofence_list, name="geofence-list"),
    path("geofences/<int:pk>/radius/",geofence_radius_update, name="geofence-radius-update"),
]