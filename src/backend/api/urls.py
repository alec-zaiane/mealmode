from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, RecipeViewSet, TagViewSet, MealPlanEntryViewSet
from ingredient_store.views import OnHandIngredientViewSet
from scraper.views import (
    ScraperViewSet,
    SourceViewSet,
    ConfirmableRecipeViewSet,
    ConfirmableRecipeIngredientViewSet,
    ConfirmableRecipeStepViewSet,
)

router = DefaultRouter()
router.register(r"ingredients", IngredientViewSet, basename="ingredient")
router.register(r"recipes", RecipeViewSet, basename="recipe")
router.register(r"tags", TagViewSet, basename="tag")
router.register(
    r"ingredient-store", OnHandIngredientViewSet, basename="ingredient-store"
)
router.register(r"scrapers", ScraperViewSet, basename="scraper")
router.register(r"sources", SourceViewSet, basename="source")
router.register(r"meal-plan-entries", MealPlanEntryViewSet, basename="meal-plan-entry")
router.register(
    r"confirmable-recipes", ConfirmableRecipeViewSet, basename="confirmable-recipe"
)
router.register(
    r"confirmable-recipe-ingredients",
    ConfirmableRecipeIngredientViewSet,
    basename="confirmable-recipe-ingredient",
)
router.register(
    r"confirmable-recipe-steps",
    ConfirmableRecipeStepViewSet,
    basename="confirmable-recipe-step",
)
urlpatterns = [
    path("", include(router.urls)),
]
