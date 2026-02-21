import { useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useRecipesList } from '../api/mealmodeAPI';
import type { Recipe } from '../api/mealmodeAPI';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SLOTS = ['breakfast', 'lunch', 'dinner'];

const DragTypes = { MEAL: 'meal' };

interface MealCardProps {
  mealId: string;
  mealName: string;
  servings: number;
}

function DraggableMeal({ mealId, mealName, servings }: MealCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragTypes.MEAL,
    item: { mealId, mealName, servings },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={`p-2 bg-palette-cream border border-palette-terracotta rounded text-xs cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="font-semibold truncate">{mealName}</div>
      <div className="text-palette-slate">{servings} servings</div>
    </div>
  );
}

interface DropSlotProps {
  day: string;
  slot: string;
  planEntry?: { id: string; mealId: string; mealName: string; servings: number };
  onDrop: (day: string, slot: string, mealId: string) => void;
  onRemove: (entryId: string) => void;
  onViewMeal: (mealId: string) => void;
}

function DropSlot({ day, slot, planEntry, onDrop, onRemove, onViewMeal }: DropSlotProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DragTypes.MEAL,
    drop: (item: { mealId: string }) => onDrop(day, slot, item.mealId),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div
      ref={drop}
      className={`min-h-20 p-2 border-2 border-dashed rounded transition-colors ${
        isOver
          ? 'border-palette-terracotta bg-palette-cream'
          : planEntry
          ? 'border-palette-taupe bg-white'
          : 'border-palette-mist bg-palette-mist'
      }`}
    >
      {planEntry ? (
        <div className="relative group">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(planEntry.id); }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
          <div
            className="p-2 bg-white border rounded cursor-pointer hover:bg-palette-mist transition-colors"
            onClick={() => onViewMeal(planEntry.mealId)}
          >
            <div className="font-semibold text-sm truncate">{planEntry.mealName}</div>
            <div className="text-xs text-palette-slate">{planEntry.servings} servings</div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-palette-slate text-xs">
          Drag meal here
        </div>
      )}
    </div>
  );
}

function MealPlanContent() {
  const navigate = useNavigate();
  const { mealPlan, addMealToPlan, removeMealFromPlan } = useApp();
  const {data: recipeData, isLoading} = useRecipesList();
  const recipes = useMemo((): Recipe[] => {
    const body =
      recipeData && typeof recipeData === 'object' && 'data' in recipeData
        ? (recipeData as { data: { results?: Recipe[] } }).data?.results
        : (recipeData as { results?: Recipe[] } | undefined)?.results;
    return Array.isArray(body) ? body : [];
  }, [recipeData]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDrop = (day: string, slot: string, mealId: string) => {
    const existingEntry = mealPlan.find((entry) => entry.day === day && entry.slot === slot);
    if (existingEntry) removeMealFromPlan(existingEntry.id);
    const recipe = recipes.find((r) => String(r.id) === mealId);
    if (recipe) addMealToPlan({ mealId, day, slot, servings: recipe.servings ?? 1 });
  };

  const handleRemove = (entryId: string) => removeMealFromPlan(entryId);
  const handleViewMeal = (mealId: string) => navigate(`/meal/${mealId}`);

  const enrichedPlan = mealPlan.map((entry) => {
    const recipe = recipes.find((r) => String(r.id) === entry.mealId);
    return {
      ...entry,
      mealName: recipe?.name ?? 'Unknown',
    };
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-palette-taupe mb-2">Meal Plan</h2>
          <p className="text-palette-slate">Drag meals into your weekly schedule</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              View All Meals
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Drag Meals to Your Plan</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {isLoading ? (
                <p className="text-palette-slate col-span-2">Loading meals…</p>
              ) : (
                recipes.map((recipe) => (
                <DraggableMeal
                  key={recipe.id}
                  mealId={String(recipe.id)}
                  mealName={recipe.name}
                  servings={recipe.servings ?? 1}
                />
              ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-semibold text-sm text-palette-slate" />
                {DAYS.map((day) => (
                  <div key={day} className="font-semibold text-sm text-palette-slate capitalize text-center">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
              {SLOTS.map((slot) => (
                <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-semibold text-sm text-palette-slate capitalize flex items-center">
                    {slot}
                  </div>
                  {DAYS.map((day) => {
                    const planEntry = enrichedPlan.find(
                      (entry) => entry.day === day && entry.slot === slot
                    );
                    return (
                      <DropSlot
                        key={`${day}-${slot}`}
                        day={day}
                        slot={slot}
                        planEntry={planEntry}
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                        onViewMeal={handleViewMeal}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {isLoading ? (
              <p className="text-palette-slate">Loading…</p>
            ) : (
              recipes.slice(0, 10).map((recipe) => (
              <DraggableMeal
                key={recipe.id}
                mealId={String(recipe.id)}
                mealName={recipe.name}
                servings={recipe.servings ?? 1}
              />
            ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MealPlanPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <MealPlanContent />
    </DndProvider>
  );
}
