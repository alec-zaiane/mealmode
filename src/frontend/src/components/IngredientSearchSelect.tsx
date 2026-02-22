import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useIngredientsList } from '../api/mealmodeAPI';
import type { Ingredient } from '../api/mealmodeAPI';

type IngredientSearchSelectProps = Readonly<{
    triggerLabel: string;
    placeholder?: string;
    selectedIngredientName?: string;
    excludeIngredientIds?: number[];
    onSelect: (ingredient: Ingredient) => void;
}>;

export function IngredientSearchSelect({
    triggerLabel,
    placeholder = 'Search ingredients...',
    selectedIngredientName,
    excludeIngredientIds = [],
    onSelect,
}: IngredientSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    const { data: ingredientsResponse } = useIngredientsList(
        {
            limit: 100,
            ...(search.trim() && { search: search.trim() }),
        },
        {
            query: {
                enabled: open,
            },
        }
    );

    const ingredients: Ingredient[] = ingredientsResponse?.data?.results ?? [];
    const excluded = useMemo(() => new Set(excludeIngredientIds), [excludeIngredientIds]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const currentLabel = selectedIngredientName?.trim() || triggerLabel;

    return (
        <div className="relative" ref={rootRef}>
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-12 rounded-2xl font-medium text-[#A3A3A0] border-2 border-palette-border bg-[#F5F4F1] hover:bg-white"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="truncate">{currentLabel}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>

            {open && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 border-2 border-palette-border rounded-2xl bg-white shadow-glass overflow-hidden">
                    <div className="p-3 border-b border-palette-border bg-[#F5F4F1]">
                        <Input
                            placeholder={placeholder}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-10 rounded-xl"
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto p-1">
                        {ingredients.length === 0 ? (
                            <li className="px-2 py-2 text-sm text-palette-textMuted">
                                {search.trim() ? 'No ingredients found' : 'Type to search ingredients'}
                            </li>
                        ) : (
                            ingredients.map((ingredient) => {
                                const isExcluded = excluded.has(ingredient.id);
                                return (
                                    <li key={ingredient.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelect(ingredient);
                                                setOpen(false);
                                                setSearch('');
                                            }}
                                            disabled={isExcluded}
                                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-palette-border disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {ingredient.name}
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
