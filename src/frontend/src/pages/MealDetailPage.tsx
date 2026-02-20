import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculateMealCost, calculateMealNutrition, getIngredientBreakdown } from '../utils/calculations';
import { ArrowLeft, Users, Clock, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { meals, ingredients } = useApp();

  const meal = meals.find((m) => m.id === id);
  const [servings, setServings] = useState(meal?.servings ?? 1);

  const breakdown = useMemo(() => {
    if (!meal) return [];
    return getIngredientBreakdown(meal, ingredients, servings);
  }, [meal, ingredients, servings]);

  const totalCost = useMemo(() => {
    if (!meal) return 0;
    return calculateMealCost(meal, ingredients, servings);
  }, [meal, ingredients, servings]);

  const nutrition = useMemo(() => {
    if (!meal) return null;
    return calculateMealNutrition(meal, ingredients, servings);
  }, [meal, ingredients, servings]);

  if (!meal) {
    return (
      <div className="text-center py-12">
        <p className="text-palette-taupe">Meal not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Back to Meals
        </Button>
      </div>
    );
  }

  const costPerServing = totalCost / servings;

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meals
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-palette-taupe mb-2">{meal.name}</h2>
            <div className="flex flex-wrap gap-2">
              {meal.tags.map((tag) => (
                <Badge key={tag} variant="palette-taupe">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-palette-slate text-xl">
              <DollarSign className="w-6 h-6" />
              <span>{costPerServing.toFixed(2)}/serving</span>
            </div>
            <div className="text-sm text-palette-taupe mt-1">${totalCost.toFixed(2)} total</div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 text-sm text-palette-slate">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Prep: {meal.prepTime}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Cook: {meal.cookTime}m</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Servings
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                  className="w-23 h-8 text-center text-sm py-1"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(servings + 1)}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  +
                </Button>
                <span className="text-xs text-palette-taupe">(Original: {meal.servings})</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((item, index) => (
                    <TableRow
                      key={index}
                      className="cursor-pointer hover:bg-palette-mist"
                      onClick={() => navigate(`/ingredient/${item.ingredient.id}`)}
                    >
                      <TableCell>{item.ingredient.name}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity.toFixed(2)} {item.ingredient.unit}
                      </TableCell>
                      <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">${totalCost.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-palette-slate">Total Cost:</span>
                <span className="font-semibold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-palette-slate">Cost per Serving:</span>
                <span className="font-semibold">${costPerServing.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-palette-slate">Servings:</span>
                <span className="font-semibold">{servings}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {nutrition && (
            <Card>
              <CardHeader>
                <CardTitle>Nutrition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-4 bg-palette-cream rounded-lg">
                    <div className="text-3xl font-semibold text-palette-terracotta">
                      {Math.round(nutrition.perServing.calories)}
                    </div>
                    <div className="text-sm text-palette-slate">Calories per serving</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-palette-mist">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-palette-slate">
                        {Math.round(nutrition.perServing.protein)}g
                      </div>
                      <div className="text-xs text-palette-slate">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-palette-taupe">
                        {Math.round(nutrition.perServing.carbs)}g
                      </div>
                      <div className="text-xs text-palette-slate">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-palette-terracotta">
                        {Math.round(nutrition.perServing.fat)}g
                      </div>
                      <div className="text-xs text-palette-slate">Fat</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-palette-mist text-xs text-palette-taupe">
                    <div className="flex justify-between">
                      <span>Total for {servings} servings:</span>
                      <span>{Math.round(nutrition.total.calories)} cal</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cooking Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {meal.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-palette-cream text-palette-terracotta flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span className="text-sm text-palette-slate pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
