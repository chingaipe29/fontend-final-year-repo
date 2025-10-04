from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'geofences-api', views.GeofenceViewSet, basename='geofences-api')

urlpatterns = [
    # telemetry & resources
    path("gps-data/", views.gps_data),
    path("equipment/", views.equipment_list),
    path("equipment/<int:pk>/", views.equipment_detail),
    path("livestock/", views.livestock_list),
    path("employees/", views.employee_list),
    path("owners/", views.owner_list),

    # device pulls its config (ESP32)
    path("devices/<str:device_id>/config/", views.device_config),

    # dashboard summary + history
    path("devices/<str:device_id>/history/", views.device_history, name="device_history"),

    # alerts
    path("alerts/", views.alerts_list),
    path("alerts/<int:pk>/resolve/", views.resolve_alert),
    path("alerts/<int:pk>/ack/", views.alert_ack),
    path("alerts/<int:pk>/", views.delete_alert, name="delete-alert"),  # ✅ MOVED here

    # server-sent events for alerts
    path("stream/alerts/", views.stream_alerts),

    # auth
    path("token/", TokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path('register/', views.register_user, name='register'),
    path("status/overview/", views.overview_status),
    path("alerts/clear-all/", views.clear_all_alerts, name="clear_all_alerts"),
    
    # ✅ CORRECTED DELETE ENDPOINTS (added trailing slashes)
    path("equipment/delete/<int:pk>/", views.delete_equipment, name="delete_equipment"),
    path("employees/delete/<int:pk>/", views.delete_employee, name="delete_employee"),
    path("livestock/delete/<int:pk>/", views.delete_livestock, name="delete_livestock"),  # ✅ CORRECTED
    
    # ✅ ADD EDIT ENDPOINTS
    path("employees/<int:pk>/", views.employee_detail, name="employee_detail"),
    path("livestock/<int:pk>/", views.livestock_detail, name="livestock_detail"),

    # user-profile
    path('profile/', views.user_profile_detail, name='user-profile-detail'), 
    path('profile/photo/', views.update_profile_photo, name='update-profile-photo'),
    path('profile/notifications/', views.update_notification_preferences, name='update-notification-preferences'),
    path('change-password/', views.change_password, name='change-password'),
    path('profile/activity/', views.user_activity_logs, name='user-activity-logs'),

    # Include the router URLs at root
    path('', include(router.urls)),
]