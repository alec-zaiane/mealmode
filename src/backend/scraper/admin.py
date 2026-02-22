from django.contrib import admin
from . import models


class ConfirmableRecipeIngredientInline(
    admin.TabularInline[models.ConfirmableRecipeIngredient, models.ConfirmableRecipe]
):
    model = models.ConfirmableRecipeIngredient
    extra = 0


class ConfirmableRecipeStepInline(
    admin.TabularInline[models.ConfirmableRecipeStep, models.ConfirmableRecipe]
):
    model = models.ConfirmableRecipeStep
    extra = 0


@admin.register(models.ConfirmableRecipe)
class ConfirmableRecipeAdmin(admin.ModelAdmin[models.ConfirmableRecipe]):
    inlines = (ConfirmableRecipeIngredientInline, ConfirmableRecipeStepInline)
    list_display = ("id", "name", "source_url", "servings")
    search_fields = ("name", "source_url")


admin.site.register(models.Source)
admin.site.register(models.Scraper)
