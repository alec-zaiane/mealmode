import { useNavigate } from "react-router-dom";
import type { Ingredient } from "../api/mealmodeAPI";
import { DollarSign, Flame, AlertCircle, ChevronRight, PackageOpen } from "lucide-react";

export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
    const navigate = useNavigate();
    const unit = ingredient.nutrition_stats?.base_unit ?? "unit";
    const estimatedCost = typeof ingredient.estimated_cost === "number" ? ingredient.estimated_cost : null;
    const scrapedCost = typeof ingredient.scraper?.cached_price === "number" ? ingredient.scraper.cached_price : null;
    const displayCost = scrapedCost ?? estimatedCost;

    return (
        <div
            role="button"
            tabIndex={0}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-palette-border bg-white rounded-3xl cursor-pointer hover:border-palette-primary/40 focus-visible:border-palette-primary/40 hover:shadow-soft transition-all duration-300 outline-none hover:-translate-y-0.5"
            onClick={() => navigate(`/ingredient/${ingredient.id}`)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/ingredient/${ingredient.id}`);
                }
            }}
        >
            <div className="flex flex-col mb-4 sm:mb-0">
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-brand font-bold text-palette-text group-hover:text-palette-primary transition-colors">
                        {ingredient.name}
                    </h2>
                    {ingredient.on_hand && ingredient.on_hand.desired_quantity && ingredient.on_hand.quantity !== null && ingredient.on_hand.quantity !== undefined && ingredient.on_hand.quantity < ingredient.on_hand.desired_quantity && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full shadow-sm">
                            <AlertCircle className="w-3 h-3" />
                            Low Stock
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-palette-textMuted">
                    {displayCost === null ? (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-palette-border text-palette-textMuted opacity-80">
                            <DollarSign className="w-4 h-4" />
                            No price data
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 bg-palette-amber/10 text-palette-amber px-3 py-1.5 rounded-xl border border-palette-amber/20">
                            <DollarSign className="w-4 h-4" />
                            {displayCost.toFixed(2)} / {unit}
                        </span>
                    )}

                    {ingredient.nutrition_stats ? (
                        <span className="flex items-center gap-1.5 bg-palette-emerald/10 text-palette-emerald px-3 py-1.5 rounded-xl border border-palette-emerald/20">
                            <Flame className="w-4 h-4" />
                            {Math.round((ingredient.nutrition_stats.kcal_per_unit ?? 0) * 10) / 10} Kcal / {unit}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-palette-border text-palette-textMuted opacity-80">
                            <Flame className="w-4 h-4" />
                            No nutrition data
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-palette-border/50 pt-4 sm:pt-0">
                {ingredient.on_hand ? (
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border-2 border-palette-border border-dashed group-hover:border-palette-primary/20 transition-colors">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-palette-border">
                            <PackageOpen className="w-4 h-4 text-palette-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-palette-text">
                                {ingredient.on_hand.quantity ?? "?"} / {ingredient.on_hand.desired_quantity || '—'} <span className="text-palette-textMuted font-medium text-xs">{unit}</span>
                            </span>
                            <span className="text-[10px] text-palette-textMuted uppercase tracking-wider font-bold">In Pantry</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-sm font-bold text-palette-textMuted opacity-50 px-4 py-2 border border-transparent">Not in pantry</span>
                )}

                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-palette-primary group-hover:shadow-md transition-all duration-300 shrink-0 border border-palette-border group-hover:border-palette-primary">
                    <ChevronRight className="w-5 h-5 text-palette-textMuted group-hover:text-white transition-colors" />
                </div>
            </div>
        </div>
    );
}