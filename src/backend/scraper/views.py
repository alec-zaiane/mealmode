from rest_framework import viewsets
from . import models, serializers

# Create your views here.


class ScraperViewSet(viewsets.ModelViewSet[models.Scraper]):
    queryset = models.Scraper.objects.all()
    serializer_class = serializers.ScraperSerializer


class SourceViewSet(viewsets.ModelViewSet[models.Source]):
    queryset = models.Source.objects.all()
    serializer_class = serializers.SourceSerializer
