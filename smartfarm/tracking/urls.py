from django.urls import path
from .views import gps_data

urlpatterns = [
    path('gps-data/', gps_data),
]
