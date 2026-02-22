import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { calculateRecipeNutrition, calculateRecipeCost } from '../utils/calculations';
import { Search, DollarSign, Flame, Plus, X, ChevronDown, Sparkles, Salad, BadgeDollarSign, Activity } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { RecipeCard } from '../components/recipecard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { useRecipesList, useTagsList, useRecipesCreate, useIngredientsList } from '../api/mealmodeAPI';
import { getRecipesListQueryKey } from '../api/mealmodeAPI';
import type { Tag, Ingredient } from '../api/mealmodeAPI';

function ingredientUnitLabel(ing: Ingredient): string {
  const u = ing.nutrition_stats?.base_unit;
  if (u === 'kg') return 'kg';
  if (u === 'L') return 'L';
  if (u === 'pc') return 'pc';
  return '—';
}

type SelectedIngredient = { ingredientId: number; quantity: number; name: string; unit: string };

export function MealListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const { data: recipeData, isError: recipeIsError, isLoading: recipeIsLoading } = useRecipesList();
  const { data: tagData } = useTagsList();
  const { data: ingredientsResponse } = useIngredientsList({
    limit: 50,
    ...(ingredientSearch.trim() && { search: ingredientSearch.trim() }),
  });
  const ingredientsList: Ingredient[] = ingredientsResponse?.data?.results ?? [];
  const createRecipe = useRecipesCreate({
    mutation: {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: getRecipesListQueryKey() });
        const res = response as { data?: { id?: number } };
        const id = res?.data?.id ?? (res as { id?: number })?.id;
        if (id != null) navigate(`/meal/${id}`);
      },
    },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [maxCost, setMaxCost] = useState<number | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealServings, setNewMealServings] = useState(1);
  const [newMealSteps, setNewMealSteps] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false);
  const ingredientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ingredientDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ingredientDropdownRef.current && !ingredientDropdownRef.current.contains(e.target as Node)) {
        setIngredientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ingredientDropdownOpen]);

  const filteredMeals = useMemo(() => {
    return recipeData?.data.results?.filter((recipe) => {
      if (searchTerm && !recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedTags.length > 0 && !selectedTags.some((tag) => recipe.tags?.some((t) => t.id === tag.id))) return false;
      if (maxCost !== null) {
        const { costPerServing } = calculateRecipeCost(recipe);
        if (costPerServing > maxCost) return false;
      }
      if (maxCalories !== null) {
        const { nutritionPerServing } = calculateRecipeNutrition(recipe);
        if (nutritionPerServing.kcal_per_unit > maxCalories) return false;
      }
      return true;
    });
  }, [recipeData, searchTerm, selectedTags, maxCost, maxCalories]);

  const recipeInsights = useMemo(() => {
    const recipes = filteredMeals ?? [];
    if (recipes.length === 0) {
      return {
        avgCost: null as number | null,
        avgCalories: null as number | null,
        quickTags: [] as string[],
      };
    }

    let totalCost = 0;
    let totalCalories = 0;
    const tagCounts = new Map<string, number>();

    recipes.forEach((recipe) => {
      const { costPerServing } = calculateRecipeCost(recipe);
      const { nutritionPerServing } = calculateRecipeNutrition(recipe);
      totalCost += Number.isFinite(costPerServing) ? costPerServing : 0;
      totalCalories += Number.isFinite(nutritionPerServing.kcal_per_unit) ? nutritionPerServing.kcal_per_unit : 0;
      recipe.tags?.forEach((tag) => {
        tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
      });
    });

    const quickTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    return {
      avgCost: totalCost / recipes.length,
      avgCalories: totalCalories / recipes.length,
      quickTags,
    };
  }, [filteredMeals]);

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addIngredient = (ing: Ingredient, quantity = 1) => {
    if (selectedIngredients.some((s) => s.ingredientId === ing.id)) return;
    setSelectedIngredients((prev) => [
      ...prev,
      { ingredientId: ing.id, quantity, name: ing.name, unit: ingredientUnitLabel(ing) },
    ]);
  };

  const removeIngredient = (ingredientId: number) => {
    setSelectedIngredients((prev) => prev.filter((s) => s.ingredientId !== ingredientId));
  };

  const setIngredientQuantity = (ingredientId: number, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.map((s) => (s.ingredientId === ingredientId ? { ...s, quantity } : s))
    );
  };

  const addStep = () => setNewMealSteps((prev) => [...prev, '']);
  const removeStep = (index: number) => setNewMealSteps((prev) => prev.filter((_, i) => i !== index));
  const setStep = (index: number, value: string) =>
    setNewMealSteps((prev) => prev.map((s, i) => (i === index ? value : s)));

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;
    const stepsFiltered = newMealSteps.map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: newMealName.trim(),
      servings: newMealServings,
      ...(selectedIngredients.length > 0 && {
        recipe_ingredients: selectedIngredients.map(({ ingredientId, quantity }) => ({
          ingredient: ingredientId,
          quantity,
        })),
      }),
      ...(stepsFiltered.length > 0 && {
        recipe_steps: stepsFiltered.map((description, i) => ({
          step_number: i + 1,
          description,
        })),
      }),
    };
    createRecipe.mutate({ data: payload });
    setNewMealName('');
    setNewMealServings(1);
    setNewMealSteps([]);
    setSelectedIngredients([]);
    setIngredientSearch('');
    setAddMealOpen(false);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-brand font-extrabold text-palette-text mb-1 tracking-tight">Your Recipe Library</h2>
          <p className="text-palette-textMuted text-sm font-medium">Discover, manage, and plan your culinary journey.</p>
        </div>
        <Dialog open={addMealOpen} onOpenChange={setAddMealOpen}>
          <DialogTrigger asChild>
            <Button className="bg-palette-primary hover:bg-palette-primaryDark text-white px-6 shadow-soft transition-all hover:shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMeal} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Recipe Name</label>
                <Input
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="e.g. Greek salad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Servings</label>
                <Input
                  type="number"
                  min={1}
                  value={newMealServings}
                  onChange={(e) => setNewMealServings(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Ingredients</label>
                {selectedIngredients.length > 0 && (
                  <ul className="space-y-2 mb-4 p-4 border border-palette-border rounded-2xl bg-[#F5F4F1]/50">
                    {selectedIngredients.map((sel) => (
                      <li key={sel.ingredientId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate text-palette-text">{sel.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={sel.quantity}
                            onChange={(e) => setIngredientQuantity(sel.ingredientId, Number(e.target.value))}
                            className="w-20 h-10 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-xl border-2 border-transparent transition-all"
                          />
                          <span className="text-palette-textMuted text-xs w-6">{sel.unit}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 shrink-0 p-0 text-[#8A8A86]"
                          onClick={() => removeIngredient(sel.ingredientId)}
                          aria-label="Remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="relative" ref={ingredientDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-12 rounded-2xl font-medium text-[#A3A3A0] border-2 border-palette-border bg-[#F5F4F1] hover:bg-white"
                    onClick={() => setIngredientDropdownOpen((o) => !o)}
                    aria-expanded={ingredientDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span>Add ingredient...</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${ingredientDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {ingredientDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 border-2 border-palette-border rounded-2xl bg-white shadow-glass overflow-hidden">
                      <div className="p-3 border-b border-palette-border bg-[#F5F4F1]">
                        <Input
                          placeholder="Search ingredients..."
                          value={ingredientSearch}
                          onChange={(e) => setIngredientSearch(e.target.value)}
                          className="h-10 rounded-xl"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto p-1" role="listbox">
                        {ingredientsList.length === 0 ? (
                          <li className="px-2 py-2 text-sm text-palette-textMuted">
                            {ingredientSearch.trim() ? 'No ingredients found' : 'Type to search ingredients'}
                          </li>
                        ) : (
                          ingredientsList.map((ing) => (
                            <li key={ing.id} role="option">
                              <button
                                type="button"
                                onClick={() => addIngredient(ing)}
                                disabled={selectedIngredients.some((s) => s.ingredientId === ing.id)}
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-palette-border disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {ing.name}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Steps</label>
                {newMealSteps.length > 0 && (
                  <ul className="space-y-3 mb-4 p-4 border border-palette-border rounded-2xl bg-[#F5F4F1]/50">
                    {newMealSteps.map((step, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="shrink-0 w-5 text-palette-textMuted font-bold">{index + 1}.</span>
                        <Input
                          value={step}
                          onChange={(e) => setStep(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          className="flex-1 h-10 rounded-xl"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 shrink-0 p-0 text-[#8A8A86]"
                          onClick={() => removeStep(index)}
                          aria-label="Remove step"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" variant="outline" onClick={addStep} className="w-full justify-center h-12 rounded-2xl bg-[#F5F4F1] border-2 border-palette-border text-palette-text hover:bg-white hover:border-palette-primary/30 transition-all font-bold">
                  <Plus className="w-4 h-4 mr-2 text-palette-primary" />
                  Add step
                </Button>
              </div>
              {createRecipe.isError && (
                <p className="text-sm text-red-600">Failed to create meal. Try again.</p>
              )}
              <div className="flex gap-3 justify-end mt-8">
                <Button type="button" variant="ghost" onClick={() => setAddMealOpen(false)} className="px-6 text-palette-textMuted">
                  Cancel
                </Button>
                <Button type="submit" disabled={createRecipe.isPending}>
                  {createRecipe.isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter Container */}
      <div className="flex flex-col gap-6 p-6 md:p-8 bg-white rounded-3xl shadow-sm border border-palette-border/60">
        
        {/* Helper Context (Visual Structure) */}
        <div className="flex flex-col mb-2">
            <h3 className="text-lg font-bold text-palette-text mb-1">Find & Filter</h3>
            <p className="text-sm text-[#8A8A86] font-medium">Quickly locate meals by name, cost, or dietary tags.</p>
        </div>
        
        {/* Main Search */}
        <div className="relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#A3A3A0]" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 bg-[#F5F4F1] border-2 border-transparent outline-none rounded-2xl h-16 text-lg font-medium placeholder:text-[#A3A3A0] text-palette-text transition-all"
          />
        </div>

        {/* Sub-Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 bg-[#F5F4F1] rounded-2xl pl-5 pr-2 py-1.5 border-2 border-transparent transition-all">
            <DollarSign className="w-5 h-5 text-palette-amber" />
            <input
              type="number"
              placeholder="Max cost"
              value={maxCost ?? ''}
              onChange={(e) => setMaxCost(e.target.value ? Number(e.target.value) : null)}
              className="w-28 border-none bg-transparent h-10 focus:outline-none focus:ring-0 outline-none shadow-none px-1 text-base font-medium placeholder:text-[#A3A3A0]"
              step="0.5"
            />
          </div>
          <div className="flex items-center gap-2 bg-[#F5F4F1] rounded-2xl pl-5 pr-2 py-1.5 border-2 border-transparent transition-all">
            <Flame className="w-5 h-5 text-palette-emerald" />
            <input
              type="number"
              placeholder="Max cal"
              value={maxCalories ?? ''}
              onChange={(e) => setMaxCalories(e.target.value ? Number(e.target.value) : null)}
              className="w-28 border-none bg-transparent h-10 focus:outline-none focus:ring-0 outline-none shadow-none px-1 text-base font-medium placeholder:text-[#A3A3A0]"
            />
          </div>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="text-[#8A8A86] rounded-2xl h-12 px-6 text-sm font-bold bg-[#F5F4F1] focus:outline-none hover:bg-palette-border/50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-3">
          {tagData?.data.results?.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`cursor-pointer rounded-2xl px-5 py-2 text-sm font-bold m-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-primary/20 shadow-none transition-colors border-2 ${selectedTags.includes(tag) ? 'bg-palette-text border-palette-text text-white' : 'bg-[#F5F4F1] border-transparent text-[#8A8A86] hover:bg-white hover:border-palette-primary/20'}`}
              onClick={() => toggleTag(tag)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {!recipeIsError && !recipeIsLoading && filteredMeals && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <Salad className="h-4 w-4 text-palette-primary" />
              Total Results
            </div>
            <div className="text-2xl font-extrabold text-palette-text">{filteredMeals.length}</div>
          </div>
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <BadgeDollarSign className="h-4 w-4 text-palette-amber" />
              Avg Cost / Serving
            </div>
            <div className="text-2xl font-extrabold text-palette-text">
              {recipeInsights.avgCost !== null ? `$${recipeInsights.avgCost.toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <Activity className="h-4 w-4 text-palette-emerald" />
              Avg Calories
            </div>
            <div className="text-2xl font-extrabold text-palette-text">
              {recipeInsights.avgCalories !== null ? `${Math.round(recipeInsights.avgCalories)} kcal` : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <Sparkles className="h-4 w-4 text-palette-primaryDark" />
              Popular Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {recipeInsights.quickTags.length > 0 ? (
                recipeInsights.quickTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-semibold text-palette-textMuted">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-palette-textMuted">No tags in current results</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!recipeIsError && !recipeIsLoading && filteredMeals && (
        <div className="pt-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px bg-palette-border flex-1" />
            <span className="text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              {filteredMeals.length} {filteredMeals.length === 1 ? 'Recipe' : 'Recipes'}
            </span>
            <div className="h-px bg-palette-border flex-1" />
          </div>
          {
            filteredMeals.length === 0 && (
              <div className="text-center py-16 text-palette-textMuted bg-white rounded-3xl border border-palette-border shadow-sm border-dashed">
                <p className="text-lg font-medium">No recipes found matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            )
          }
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {
              filteredMeals.map((recipe) => { return (<RecipeCard recipe={recipe} key={recipe.id} />) })
            }
          </div>
        </div>
      )}

    </div>
  );
}
