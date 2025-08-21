from django.db import models

# Create your models here.

class GPSData(models.Model):
    device_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField()
    altitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

# models.py
