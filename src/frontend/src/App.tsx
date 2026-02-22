import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { MealPlanPage } from './pages/MealPlanPage';
import { MealListPage } from './pages/MealListPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { IngredientPage } from './pages/IngredientPage';
import { IngredientListPage } from './pages/IngredientListPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChefHat, UtensilsCrossed, Calendar, Warehouse, ShoppingCart } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-palette-mist">
      <nav className="sticky top-0 z-30 border-b border-white/15 bg-palette-taupe shadow-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 font-brand text-xl font-semibold tracking-tight transition-colors duration-DEFAULT ${isActive ? 'text-palette-cream' : 'text-white hover:text-palette-cream'}`
              }
            >
              <ChefHat className="h-6 w-6 shrink-0 text-palette-cream" aria-hidden />
              <span>MealMode</span>
            </NavLink>
            <span className="h-5 w-px bg-white/25" aria-hidden />
            <div className="ml-auto flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-DEFAULT ${isActive ? 'bg-white/15 text-palette-cream' : 'text-white/90 hover:bg-white/10 hover:text-white'}`
                }
              >
                <UtensilsCrossed className="w-5 h-5" />
                Meals
              </NavLink>
              <NavLink
                to="/plan"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-DEFAULT ${isActive ? 'bg-white/15 text-palette-cream' : 'text-white/90 hover:bg-white/10 hover:text-white'}`
                }
              >
                <Calendar className="w-5 h-5" />
                Meal Plan
              </NavLink>
              <NavLink
                to="/ingredients"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-DEFAULT ${isActive ? 'bg-white/15 text-palette-cream' : 'text-white/90 hover:bg-white/10 hover:text-white'}`
                }
              >
                <Warehouse className="w-5 h-5" />
                Ingredients
              </NavLink>
              <NavLink
                to="/shopping"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-DEFAULT ${isActive ? 'bg-white/15 text-palette-cream' : 'text-white/90 hover:bg-white/10 hover:text-white'}`
                }
              >
                <ShoppingCart className="w-5 h-5" />
                Shopping
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<MealListPage />} />
              <Route path="meal/:id" element={<MealDetailPage />} />
              <Route path="ingredient/:id" element={<IngredientPage />} />
              <Route path="plan" element={<MealPlanPage />} />
              <Route path="shopping" element={<ShoppingListPage />} />
              <Route path="ingredients" element={<IngredientListPage />} />
            </Route>
          </Routes>
          </ToastProvider>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
