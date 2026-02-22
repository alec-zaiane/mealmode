import type { Recipe } from "../api/mealmodeAPI";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Flame, Clock, UtensilsCrossed } from 'lucide-react';
import { Badge } from "./ui/badge";
import { calculateRecipeCost, calculateRecipeNutrition } from "../utils/calculations";

// Helper to generate a deterministic gradient based on a string
function getGradientFromName(name: string) {
  const gradients = [
    "from-rose-400 to-orange-300",
    "from-blue-400 to-emerald-400",
    "from-violet-400 to-fuchsia-400",
    "from-amber-400 to-rose-400",
    "from-emerald-400 to-cyan-400",
    "from-indigo-400 to-cyan-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
    const navigate = useNavigate();
    const { costPerServing, costPartiallyUnknown } = calculateRecipeCost(recipe);
    const { nutritionPerServing } = calculateRecipeNutrition(recipe);
    const gradient = getGradientFromName(recipe.name);

    return (
        <Card
            key={recipe.id}
            className="flex flex-col h-full overflow-hidden border border-palette-border bg-white shadow-soft cursor-pointer transition-all duration-300 hover:shadow-glass hover:-translate-y-1.5 group rounded-2xl"
            onClick={() => navigate(`/meal/${recipe.id}`)}
        >
            {/* "Cover Image" Gradient Area */}
            <div className={`h-40 w-full bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between relative`}>
                <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
                <div className="flex justify-end relative z-10 gap-2">
                    {/* Cost Badge */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                        <DollarSign className="w-3.5 h-3.5 text-palette-amber" />
                        <span className="text-xs font-bold text-palette-text">
                            {costPerServing.toFixed(2)}{costPartiallyUnknown && "?"}
                        </span>
                    </div>
                    {/* Calories Badge */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                        <Flame className="w-3.5 h-3.5 text-palette-emerald" />
                        <span className="text-xs font-bold text-palette-text">
                            {Math.round(nutritionPerServing.kcal_per_unit)}
                        </span>
                    </div>
                </div>
            </div>
            
            <CardHeader className="pt-5 pb-2 px-5">
                <CardTitle className="text-xl font-brand font-bold text-palette-text leading-tight group-hover:text-palette-primary transition-colors line-clamp-2">
                    {recipe.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 pb-5 px-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-palette-textMuted mb-4">
                    <span className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-4 h-4 text-palette-primary/80" />
                        {recipe.servings} servings
                    </span>
                    {(recipe.prep_time_minutes || recipe.cook_time_minutes) ? (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-palette-primary/80" />
                            {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                        </span>
                    ) : null}
                </div>
                
                <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                    {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-2.5 py-0.5 bg-palette-background text-palette-textMuted border border-palette-border font-semibold hover:bg-gray-100 transition-colors">
                            {tag.name}
                        </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 bg-palette-background text-palette-textMuted border border-palette-border font-semibold">
                            +{recipe.tags.length - 3}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}