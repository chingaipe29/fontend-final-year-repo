# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import GPSDataSerializer
from .models import GPSData
from django.views.decorators.csrf import csrf_exempt

@api_view(['GET', 'POST'])
@csrf_exempt  # Only for development!
def gps_data(request):
    if request.method == 'GET':
        # Return the latest GPS data for frontend
        latest_data = GPSData.objects.last()
        if latest_data:
            serializer = GPSDataSerializer(latest_data)
            return Response(serializer.data)
        return Response({"status": "no data available"})
    
    elif request.method == 'POST':
        # Handle data from ESP32
        serializer = GPSDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "data": serializer.data})
        return Response(serializer.errors, status=400)

