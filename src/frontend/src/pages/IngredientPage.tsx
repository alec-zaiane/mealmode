import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';

export function IngredientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ingredients } = useApp();
  const ingredient = ingredients.find((i) => i.id === id);

  if (!ingredient) {
    return (
      <div className="text-center py-12">
        <p className="text-palette-taupe">Ingredient not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go back</Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <h2 className="text-2xl font-semibold text-palette-taupe">{ingredient.name}</h2>
      <p className="text-palette-slate mt-2">Unit: {ingredient.unit}</p>
      {ingredient.costPerUnit != null && (
        <p className="text-palette-slate">Cost per unit: ${ingredient.costPerUnit.toFixed(2)}</p>
      )}
      {ingredient.nutrition && (
        <div className="mt-4 p-4 bg-palette-cream rounded-lg text-sm text-palette-slate">
          <div>Calories per unit: {ingredient.nutrition.kcalPerUnit ?? '—'}</div>
          <div>Protein per unit: {ingredient.nutrition.proteinPerUnit ?? '—'}g</div>
          <div>Carbs per unit: {ingredient.nutrition.carbsPerUnit ?? '—'}g</div>
          <div>Fat per unit: {ingredient.nutrition.fatPerUnit ?? '—'}g</div>
        </div>
      )}
    </div>
  );
}
