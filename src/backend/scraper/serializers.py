from rest_framework import serializers
from . import models


class SourceSerializer(serializers.ModelSerializer[models.Source]):
    class Meta:  # type: ignore
        model = models.Source
        fields = "__all__"


class ScraperSerializer(serializers.ModelSerializer[models.Scraper]):
    cached_source = SourceSerializer(read_only=True)

    class Meta:  # type: ignore
        model = models.Scraper
        fields = "__all__"
