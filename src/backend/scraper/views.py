from rest_framework import viewsets
from . import models, serializers

# Create your views here.


class ScraperViewSet(viewsets.ModelViewSet[models.Scraper]):
    queryset = models.Scraper.objects.all()
    serializer_class = serializers.ScraperSerializer
