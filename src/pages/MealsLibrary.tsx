import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, Link, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import MealCard from '../components/MealCard';
import Button from '../components/Button';
import { Meal } from '../types';
import { generateId, toTitleCase, extractTagsFromName } from '../utils/storage';
import { isUrl, importRecipeFromUrl } from '../utils/recipeImport';

type SortOption = 'alphabetical' | 'dateAdded';

export default function MealsLibrary() {
  const { meals, setSelectedMealId, updateMeal, addMeal } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  
  const filteredMeals = meals
    .filter(meal => {
      if (!searchQuery) return true;
      const query = searchQuery.trim();
      if (query.length === 1 && /^[a-zA-Z]$/.test(query)) {
        return meal.name.charAt(0).toUpperCase() === query.toUpperCase();
      }
      return meal.name.toLowerCase().includes(query.toLowerCase()) ||
             meal.description.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  
  const handleToggleQuickAdd = () => {
    setShowQuickAdd(!showQuickAdd);
    setNewMealName('');
    setImportError(null);
    setImportSuccess(null);
  };

  const inputIsUrl = isUrl(newMealName);

  const handleQuickAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;

    setImportError(null);
    setImportSuccess(null);

    if (inputIsUrl) {
      setIsImporting(true);
      try {
        const result = await importRecipeFromUrl(newMealName.trim());
        if (result.success && result.meal) {
          addMeal(result.meal);
          setImportSuccess(`Imported "${result.meal.name}" with ${result.meal.ingredients.length} ingredients`);
          setNewMealName('');
        } else {
          setImportError(result.error || 'Failed to import recipe from URL.');
        }
      } catch {
        setImportError('An unexpected error occurred while importing the recipe.');
      } finally {
        setIsImporting(false);
      }
      return;
    }

    const mealName = newMealName.trim();
    const autoTags = extractTagsFromName(mealName);
    
    const newMeal: Meal = {
      id: generateId(),
      name: toTitleCase(mealName),
      description: '',
      ingredients: [],
      recipe: '',
      links: [],
      tags: autoTags,
      prepTime: 0,
      imageUrl: '',
      notes: '',
      createdAt: new Date().toISOString(),
      lastMadeAt: null,
    };
    addMeal(newMeal);
    setNewMealName('');
    setImportSuccess(null);
  };
  
  const handleMealClick = (mealId: string) => {
    setSelectedMealId(mealId);
    navigate('/meal-detail');
  };

  const handleUpdateMealName = (mealId: string, newName: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) updateMeal({ ...meal, name: toTitleCase(newName) });
  };

  const handleUpdateMealImage = (mealId: string, newImageUrl: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) updateMeal({ ...meal, imageUrl: newImageUrl });
  };
  
  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-[73px] bg-forest-800 z-30 space-y-4 pb-4 -mx-4 px-4">
        {/* Title + Add */}
        <div className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-4xl sm:text-5xl font-cursive text-cream-100">Meals</h2>
            <span className="px-2.5 py-0.5 bg-cobalt/20 text-cobalt rounded-full text-sm font-semibold">
              {meals.length}
            </span>
          </div>
          {showQuickAdd ? (
            <button 
              onClick={handleToggleQuickAdd} 
              className="p-2 text-cream-400 hover:text-cream-100 hover:bg-forest-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <Button onClick={handleToggleQuickAdd} className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add
            </Button>
          )}
        </div>

        {/* Quick Add Interface */}
        {showQuickAdd && (
          <div className="bg-forest-700 border border-cobalt/30 rounded-xl p-5">
            <h3 className="text-lg font-serif font-semibold text-cream-100 mb-3">Add a recipe</h3>
            <form onSubmit={handleQuickAddMeal} className="flex gap-3">
              <div className="relative flex-1">
                {inputIsUrl && (
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cobalt" />
                )}
                <input
                  type="text"
                  value={newMealName}
                  onChange={(e) => {
                    setNewMealName(e.target.value);
                    setImportError(null);
                    setImportSuccess(null);
                  }}
                  placeholder="Enter meal name or paste a recipe URL..."
                  className={`w-full py-2.5 bg-forest-800 border border-forest-500 rounded-lg text-cream-100 focus:ring-2 focus:ring-gold focus:border-gold text-base placeholder:text-cream-500 ${
                    inputIsUrl ? 'pl-9 pr-4' : 'px-4'
                  }`}
                  autoFocus
                  disabled={isImporting}
                />
              </div>
              <Button type="submit" disabled={!newMealName.trim() || isImporting}>
                {isImporting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Importing...</span>
                  </span>
                ) : inputIsUrl ? (
                  <span className="flex items-center gap-1">
                    <Link className="w-4 h-4" />
                    Import
                  </span>
                ) : (
                  'Add'
                )}
              </Button>
            </form>

            {isImporting && (
              <div className="flex items-center gap-2 mt-3 text-sm text-cobalt bg-cobalt/10 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Fetching recipe data...</span>
              </div>
            )}
            {importError && (
              <div className="mt-3 text-sm text-terracotta bg-terracotta/10 border border-terracotta/30 rounded-lg px-3 py-2">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="mt-3 text-sm text-forest-200 bg-forest-300/10 border border-forest-300/30 rounded-lg px-3 py-2">
                {importSuccess}
              </div>
            )}

            {!isImporting && !importError && !importSuccess && (
              <p className="text-sm text-cream-500 mt-3">
                {inputIsUrl
                  ? 'Paste a recipe URL to import name, ingredients, and instructions.'
                  : 'Enter a meal name or paste a recipe URL.'}
              </p>
            )}
          </div>
        )}
        
        {/* Search + Sort */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cream-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-forest-700 border border-forest-500/60 rounded-lg text-cream-100 focus:ring-2 focus:ring-gold focus:border-gold text-base placeholder:text-cream-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-cream-500 font-medium hidden sm:inline">Sort:</span>
            <div className="flex gap-1 bg-forest-700 rounded-lg p-1 border border-forest-500/40">
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'alphabetical'
                    ? 'bg-cobalt/20 text-cobalt'
                    : 'text-cream-400 hover:text-cream-100'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortBy('dateAdded')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'dateAdded'
                    ? 'bg-cobalt/20 text-cobalt'
                    : 'text-cream-400 hover:text-cream-100'
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Meals Grid */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-cream-400 text-lg mb-4 font-serif">
            {meals.length === 0
              ? "No recipes yet. Start by adding your first meal!"
              : "No recipes match your search."}
          </p>
          {meals.length === 0 ? (
            <Button onClick={handleToggleQuickAdd}>Add your first recipe</Button>
          ) : searchQuery && (
            <Button variant="secondary" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredMeals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onClick={() => handleMealClick(meal.id)}
              onUpdateName={handleUpdateMealName}
              onUpdateImage={handleUpdateMealImage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
