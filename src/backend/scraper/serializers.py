from rest_framework import serializers
from . import models


class SourceSerializer(serializers.ModelSerializer[models.Source]):
    class Meta:  # type: ignore
        model = models.Source
        fields = "__all__"


class ScraperSerializer(serializers.ModelSerializer[models.Scraper]):
    cached_source = SourceSerializer(read_only=True)
    sources = SourceSerializer(many=True, read_only=True)

    class Meta:  # type: ignore
        model = models.Scraper
        fields = "__all__"


class ConfirmableRecipeIngredientSerializer(
    serializers.ModelSerializer[models.ConfirmableRecipeIngredient]
):
    class Meta:  # type: ignore
        model = models.ConfirmableRecipeIngredient
        fields = "__all__"


class ConfirmableRecipeStepSerializer(
    serializers.ModelSerializer[models.ConfirmableRecipeStep]
):
    class Meta:  # type: ignore
        model = models.ConfirmableRecipeStep
        fields = "__all__"


class ConfirmableRecipeSerializer(
    serializers.ModelSerializer[models.ConfirmableRecipe]
):
    ingredients_list = ConfirmableRecipeIngredientSerializer(many=True, read_only=True)
    steps_list = ConfirmableRecipeStepSerializer(many=True, read_only=True)

    class Meta:  # type: ignore
        model = models.ConfirmableRecipe
        fields = "__all__"
