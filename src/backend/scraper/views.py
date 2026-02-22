from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from . import models, serializers


class ScraperViewSet(viewsets.ModelViewSet[models.Scraper]):
    queryset = models.Scraper.objects.select_related("cached_source").prefetch_related("sources").all()
    serializer_class = serializers.ScraperSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ingredient"]

    @action(detail=True, methods=["post"])
    def refresh(self, request: Request, pk: int | None = None) -> Response:
        """Scrape all sources, update cached_price/cached_source, return updated scraper."""
        scraper: models.Scraper = self.get_object()
        scraper.update()
        scraper.save()
        scraper.refresh_from_db()
        serializer = self.get_serializer(scraper)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SourceViewSet(viewsets.ModelViewSet[models.Source]):
    queryset = models.Source.objects.all()
    serializer_class = serializers.SourceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scraper"]
