from rest_framework import serializers
from . import models


class SourceSerializer(serializers.ModelSerializer[models.Source]):
    class Meta:  # type: ignore
        model = models.Source
        fields = "__all__"
