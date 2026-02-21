import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface MealPlanEntry {
  id: string;
  mealId: string;
  day: string;
  slot: string;
  servings: number;
}

interface AppContextValue {
  mealPlan: MealPlanEntry[];
  addMealToPlan: (entry: Omit<MealPlanEntry, 'id'>) => void;
  removeMealFromPlan: (entryId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);

  const value = useMemo<AppContextValue>(
    () => ({
      mealPlan,
      addMealToPlan: (entry) => {
        setMealPlan((prev) => [...prev, { ...entry, id: `plan-${Date.now()}` }]);
      },
      removeMealFromPlan: (entryId) => {
        setMealPlan((prev) => prev.filter((e) => e.id !== entryId));
      },
    }),
    [mealPlan]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
