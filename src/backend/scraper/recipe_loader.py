from __future__ import annotations
from scraper import models
from bs4 import BeautifulSoup
import requests
from dataclasses import dataclass
import json
import re
from typing import Any, Optional, cast
from api import models as api_models
from django.db import transaction


class StageOne:
    """Stage one scans the site for a recipe schema, and if found, extracts recipe information from it"""

    @dataclass
    class RecipeLoadingStageOneResult:
        error: str | None
        recipe_data: Optional[StageOne.RecipeLoaderInitialFetch] = None

    @dataclass
    class RecipeLoaderInitialFetch:
        name: str
        ingredients: list[str]
        steps: list[str]
        prep_time_minutes: Optional[int]
        cook_time_minutes: Optional[int]
        description: Optional[str]

    @staticmethod
    def iter_json_ld_items(data: Any) -> list[dict[str, Any]]:
        if isinstance(data, dict):
            data_dict = cast(dict[str, Any], data)
            items: list[dict[str, Any]] = [data_dict]
            graph_items = data_dict.get("@graph")
            if isinstance(graph_items, list):
                for item in cast(list[Any], graph_items):
                    if isinstance(item, dict):
                        items.append(cast(dict[str, Any], item))
            return items

        if isinstance(data, list):
            items: list[dict[str, Any]] = []
            for item in cast(list[Any], data):
                if isinstance(item, dict):
                    items.append(cast(dict[str, Any], item))
            return items

        return []

    @staticmethod
    def is_recipe_schema(item: dict[str, Any]) -> bool:
        schema_type = item.get("@type")
        if isinstance(schema_type, str):
            return schema_type == "Recipe"
        if isinstance(schema_type, list):
            return "Recipe" in schema_type
        return False

    @staticmethod
    def duration_to_minutes(duration_str: str) -> int:
        # This function converts ISO 8601 duration strings to minutes.
        # For example, "PT1H30M" would be converted to 90.
        hours = 0
        minutes = 0

        if "H" in duration_str:
            hours_part = duration_str.split("H")[0].replace("PT", "")
            hours = int(hours_part)

        if "M" in duration_str:
            minutes_part = duration_str.split("M")[0].split("H")[-1].replace("PT", "")
            minutes = int(minutes_part)

        return hours * 60 + minutes

    @staticmethod
    def parse_optional_duration_minutes(duration: Any) -> Optional[int]:
        if not isinstance(duration, str):
            return None

        try:
            return StageOne.duration_to_minutes(duration)
        except ValueError:
            return None

    @staticmethod
    def parse_ingredient_list(raw_ingredients: Any) -> list[str]:
        if not isinstance(raw_ingredients, list):
            return []

        ingredients: list[str] = []
        for item in cast(list[Any], raw_ingredients):
            if isinstance(item, str) and item.strip():
                ingredients.append(item.strip())

        return ingredients

    @staticmethod
    def parse_instruction_item(item: Any) -> Optional[str]:
        if isinstance(item, str):
            step = item.strip()
            return step if step else None

        if isinstance(item, dict):
            text = cast(dict[str, Any], item).get("text")
            if isinstance(text, str):
                step = text.strip()
                return step if step else None

        return None

    @staticmethod
    def parse_instruction_steps(raw_instructions: Any) -> list[str]:
        if isinstance(raw_instructions, str):
            return [raw_instructions.strip()] if raw_instructions.strip() else []

        if not isinstance(raw_instructions, list):
            return []

        steps: list[str] = []
        for item in cast(list[Any], raw_instructions):
            parsed_step = StageOne.parse_instruction_item(item)
            if parsed_step:
                steps.append(parsed_step)

        return steps

    @staticmethod
    def parse_yield(raw_yield: Any) -> Optional[int]:
        if isinstance(raw_yield, str):
            try:
                return int(raw_yield.strip())
            except ValueError:
                return None
        if isinstance(raw_yield, (int, float)):
            return int(raw_yield)
        try:
            # just in case it's in QuantitativeValue format or something weird
            return int(cast(dict[str, Any], raw_yield).get("value", ""))
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def load_recipe_stage_one(url: str) -> RecipeLoadingStageOneResult:
        # Step 1: Scan the site for a recipe schema, and if found, extract recipe information from it.
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")

        # Look for a script tag with type "application/ld+json"
        recipe_data = None
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.get_text() or "")
                for item in StageOne.iter_json_ld_items(data):
                    if StageOne.is_recipe_schema(item):
                        recipe_data = item
                        break

                if recipe_data:
                    break
            except json.JSONDecodeError:
                continue

        if not recipe_data:
            return StageOne.RecipeLoadingStageOneResult(
                error="No recipe schema found on the page."
            )

        name = recipe_data.get("name")
        if not isinstance(name, str) or not name.strip():
            return StageOne.RecipeLoadingStageOneResult(
                error="Recipe schema found, but missing a valid recipe name."
            )

        return StageOne.RecipeLoadingStageOneResult(
            error=None,
            recipe_data=StageOne.RecipeLoaderInitialFetch(
                name=name.strip(),
                ingredients=StageOne.parse_ingredient_list(
                    recipe_data.get("recipeIngredient")
                ),
                steps=StageOne.parse_instruction_steps(
                    recipe_data.get("recipeInstructions")
                ),
                prep_time_minutes=StageOne.parse_optional_duration_minutes(
                    recipe_data.get("prepTime")
                ),
                cook_time_minutes=StageOne.parse_optional_duration_minutes(
                    recipe_data.get("cookTime")
                ),
                description=recipe_data.get("description")
                if isinstance(recipe_data.get("description"), str)
                else None,
            ),
        )


class StageTwo:
    """Stage two takes the output of stage one, tries to match the ingredients to our database, and prepares a recipe draft that can be confirmed by the user before being added to the actual Recipe model"""

    @dataclass
    class RecipeLoadingStageTwoResult:
        error: str | None
        recipe_data: Optional[StageTwo.RecipeDraft] = None

    @dataclass
    class IngredientMatch:
        ingredient: Optional[models.Ingredient]
        source_text: str
        confidence: float
        quantity: float

    @dataclass
    class RecipeDraft:
        name: str
        ingredients: list[StageTwo.IngredientMatch]
        steps: list[str]
        prep_time_minutes: Optional[int]
        cook_time_minutes: Optional[int]
        description: Optional[str]

    @staticmethod
    def parse_quantity(source_text: str) -> float:
        text = source_text.strip()
        if not text:
            return 0.0

        mixed_fraction_match = re.match(r"^(\d+)\s+(\d+)\s*/\s*(\d+)\b", text)
        if mixed_fraction_match:
            whole = float(mixed_fraction_match.group(1))
            numerator = float(mixed_fraction_match.group(2))
            denominator = float(mixed_fraction_match.group(3))
            return whole + (numerator / denominator) if denominator else 0.0

        fraction_match = re.match(r"^(\d+)\s*/\s*(\d+)\b", text)
        if fraction_match:
            numerator = float(fraction_match.group(1))
            denominator = float(fraction_match.group(2))
            return numerator / denominator if denominator else 0.0

        decimal_match = re.match(r"^(\d+(?:\.\d+)?)\b", text)
        if decimal_match:
            return float(decimal_match.group(1))

        return 0.0

    @staticmethod
    def strip_leading_quantity(source_text: str) -> str:
        text = source_text.strip()
        text = re.sub(r"^(\d+)\s+(\d+)\s*/\s*(\d+)\b\s*", "", text)
        text = re.sub(r"^(\d+)\s*/\s*(\d+)\b\s*", "", text)
        text = re.sub(r"^(\d+(?:\.\d+)?)\b\s*", "", text)
        return text.strip()

    @staticmethod
    def tokenize_name(text: str) -> list[str]:
        return text.lower().split()

    @staticmethod
    def confidence_from_tokens(
        candidate_tokens: list[str], ingredient_name: str
    ) -> float:
        ingredient_tokens = StageTwo.tokenize_name(ingredient_name)
        if not candidate_tokens or not ingredient_tokens:
            return 0.0

        candidate_set = set(candidate_tokens)
        ingredient_set = set(ingredient_tokens)
        overlap_count = len(candidate_set.intersection(ingredient_set))
        if overlap_count == 0:
            return 0.0

        precision = overlap_count / len(ingredient_set)
        recall = overlap_count / len(candidate_set)
        denominator = precision + recall
        return (2 * precision * recall / denominator) if denominator > 0 else 0.0

    @staticmethod
    def build_match(
        ingredient: Optional[models.Ingredient],
        source_text: str,
        quantity: float,
        confidence: float,
    ) -> StageTwo.IngredientMatch:
        return StageTwo.IngredientMatch(
            ingredient=ingredient,
            source_text=source_text,
            confidence=confidence,
            quantity=quantity,
        )

    @staticmethod
    def match_ingredient(ingredient_str: str) -> StageTwo.IngredientMatch:
        source_text = ingredient_str.strip()
        quantity = StageTwo.parse_quantity(source_text)
        normalized_source = StageTwo.strip_leading_quantity(source_text)
        candidate = normalized_source.lower()
        if not candidate:
            return StageTwo.build_match(None, source_text, quantity, 0.0)

        exact_match = models.Ingredient.objects.filter(name__iexact=source_text).first()
        if exact_match is not None:
            return StageTwo.build_match(exact_match, source_text, quantity, 1.0)

        exact_match_without_quantity = models.Ingredient.objects.filter(
            name__iexact=normalized_source
        ).first()
        if exact_match_without_quantity is not None:
            return StageTwo.build_match(
                exact_match_without_quantity,
                source_text,
                quantity,
                1.0,
            )

        candidate_tokens = StageTwo.tokenize_name(candidate)

        best_match: Optional[models.Ingredient] = None
        best_confidence = 0.0

        partial_matches = models.Ingredient.objects.filter(name__icontains=candidate)
        for ingredient in partial_matches:
            confidence = StageTwo.confidence_from_tokens(
                candidate_tokens, ingredient.name
            )
            if confidence > best_confidence:
                best_match = ingredient
                best_confidence = confidence

        for ingredient in models.Ingredient.objects.all():
            confidence = StageTwo.confidence_from_tokens(
                candidate_tokens, ingredient.name
            )
            if confidence > best_confidence:
                best_match = ingredient
                best_confidence = confidence

        if best_match is not None:
            return StageTwo.build_match(
                best_match,
                source_text,
                quantity,
                best_confidence,
            )

        return StageTwo.build_match(None, source_text, quantity, 0.0)

    @staticmethod
    def load_recipe_stage_two(
        stage_one_result: StageOne.RecipeLoaderInitialFetch,
    ) -> RecipeLoadingStageTwoResult:
        ingredient_matches = [
            StageTwo.match_ingredient(ingredient_str)
            for ingredient_str in stage_one_result.ingredients
        ]

        return StageTwo.RecipeLoadingStageTwoResult(
            error=None,
            recipe_data=StageTwo.RecipeDraft(
                name=stage_one_result.name,
                ingredients=ingredient_matches,
                steps=stage_one_result.steps,
                prep_time_minutes=stage_one_result.prep_time_minutes,
                cook_time_minutes=stage_one_result.cook_time_minutes,
                description=stage_one_result.description,
            ),
        )

    @staticmethod
    def save_recipe_draft_as_confirmable_recipe(
        recipe_draft: RecipeDraft, source_url: Optional[str]
    ) -> models.ConfirmableRecipe:
        confirmable_recipe = models.ConfirmableRecipe.objects.create(
            name=recipe_draft.name,
            source_url=source_url,
            prep_time_minutes=recipe_draft.prep_time_minutes,
            cook_time_minutes=recipe_draft.cook_time_minutes,
            description=recipe_draft.description or "",
        )

        for ingredient_match in recipe_draft.ingredients:
            models.ConfirmableRecipeIngredient.objects.create(
                confirmable_recipe=confirmable_recipe,
                best_guess_ingredient=ingredient_match.ingredient,
                quantity=ingredient_match.quantity,
                confidence=ingredient_match.confidence,
                source_text=ingredient_match.source_text,
            )

        for step_number, step_description in enumerate(recipe_draft.steps, start=1):
            models.ConfirmableRecipeStep.objects.create(
                confirmable_recipe=confirmable_recipe,
                step_number=step_number,
                description=step_description,
            )

        return confirmable_recipe


class StageThree:
    """only runs after the user confirms a recipe draft (after possibly making changes)
    Saves the confirmable recipe as an actual Recipe in the database, and deletes the confirmable recipe"""

    @dataclass
    class RecipeSavingResult:
        error: str | None
        recipe: Optional[api_models.Recipe] = None

    @staticmethod
    def save_confirmable_recipe_as_actual_recipe(
        confirmable_recipe: models.ConfirmableRecipe,
    ) -> RecipeSavingResult:
        try:
            with transaction.atomic():  # so that failures don't mess stuff up, either the whole recipe is saved correctly and draft deleted, or nothign happens
                recipe = api_models.Recipe.objects.create(
                    name=confirmable_recipe.name,
                    prep_time_minutes=confirmable_recipe.prep_time_minutes,
                    cook_time_minutes=confirmable_recipe.cook_time_minutes,
                    servings=confirmable_recipe.servings or 1,
                    notes=f"Source URL: {confirmable_recipe.source_url}",
                )

                for confirmable_ingredient in confirmable_recipe.ingredients_list.all():
                    if confirmable_ingredient.best_guess_ingredient is None:
                        raise ValueError(
                            f"Ingredient '{confirmable_ingredient.source_text}' could not be matched to any ingredient in the database. Cannot save recipe without valid ingredient matches."
                        )
                    api_models.RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=confirmable_ingredient.best_guess_ingredient,
                        quantity=confirmable_ingredient.quantity,
                        notes=f"Original text: {confirmable_ingredient.source_text}, Confidence: {confirmable_ingredient.confidence:.2f}",
                    )
                    confirmable_ingredient.delete()  # delete the confirmable ingredient after saving it to the actual recipe

                for confirmable_step in confirmable_recipe.steps_list.all():
                    api_models.RecipeStep.objects.create(
                        recipe=recipe,
                        step_number=confirmable_step.step_number,
                        description=confirmable_step.description,
                    )
                    confirmable_step.delete()  # delete the confirmable step after saving it to the actual recipe

                confirmable_recipe.delete()  # delete the confirmable recipe after saving all its data to the actual recipe
                return StageThree.RecipeSavingResult(error=None, recipe=recipe)
        except ValueError as e:
            return StageThree.RecipeSavingResult(error=str(e), recipe=None)


@dataclass
class RecipeLoadingResult:
    error: str | None
    confirmable_recipe: Optional[models.ConfirmableRecipe] = None


def load_recipe_from_url(url: str) -> RecipeLoadingResult:
    stage_one_result = StageOne.load_recipe_stage_one(url)
    if stage_one_result.error:
        return RecipeLoadingResult(error=stage_one_result.error)

    assert stage_one_result.recipe_data is not None
    stage_two_result = StageTwo.load_recipe_stage_two(stage_one_result.recipe_data)
    if stage_two_result.error:
        return RecipeLoadingResult(error=stage_two_result.error)
    assert stage_two_result.recipe_data is not None
    confirmable_recipe = StageTwo.save_recipe_draft_as_confirmable_recipe(
        stage_two_result.recipe_data, url
    )
    return RecipeLoadingResult(error=None, confirmable_recipe=confirmable_recipe)


RecipeSavingResult = StageThree.RecipeSavingResult


def save_confirmable_recipe_as_actual_recipe(
    confirmable_recipe: models.ConfirmableRecipe,
) -> RecipeSavingResult:
    return StageThree.save_confirmable_recipe_as_actual_recipe(confirmable_recipe)
