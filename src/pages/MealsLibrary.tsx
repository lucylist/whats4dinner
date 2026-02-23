// Meals Library page - view and manage all meals

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, LayoutGrid, List, Tag, Edit, Check, Link, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import MealCard from '../components/MealCard';
import Button from '../components/Button';
import { Meal } from '../types';
import { generateId, toTitleCase, extractTagsFromName } from '../utils/storage';
import { isUrl, importRecipeFromUrl } from '../utils/recipeImport';

type SortOption = 'alphabetical' | 'dateAdded';
type ViewMode = 'grid' | 'list';

// List item component for list view
function MealListItem({ 
  meal, 
  onClick, 
  onUpdateName 
}: { 
  meal: Meal; 
  onClick: () => void; 
  onUpdateName: (mealId: string, newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(meal.name);

  const handleSave = () => {
    if (editedName.trim() && editedName !== meal.name) {
      onUpdateName(meal.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(meal.name);
      setIsEditing(false);
    }
  };

  // Generate placeholder color based on meal name
  const getPlaceholderStyle = () => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    ];
    const index = meal.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 p-3"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        {meal.imageUrl ? (
          <img 
            src={meal.imageUrl} 
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: getPlaceholderStyle() }}
          >
            {meal.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Name and Tags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 font-semibold text-gray-900 border border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-gray-900 truncate">{meal.name}</h3>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </button>
        </div>
        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {meal.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {meal.tags.length > 4 && (
              <span className="text-xs text-gray-500">+{meal.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Prep time if available */}
      {meal.prepTime > 0 && (
        <div className="text-sm text-gray-500 flex-shrink-0">
          {meal.prepTime} min
        </div>
      )}
    </div>
  );
}

export default function MealsLibrary() {
  const { meals, setSelectedMealId, updateMeal, addMeal } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Get all unique tags
  const allTags = Array.from(
    new Set(meals.flatMap(meal => meal.tags))
  ).sort();
  
  // Strip quantities, units, and prep notes from an ingredient string
  const cleanIngredientName = (raw: string): string => {
    let s = raw.trim().toLowerCase();
    // Remove leading numbers, fractions, and ranges (e.g. "1.5", "2 3/4", "1-2")
    s = s.replace(/^[\d\s.\/\-–]+/, '');
    // Remove common units at the start
    s = s.replace(/^(ounces?|oz|pounds?|lbs?|cups?|tablespoons?|tbsp|teaspoons?|tsp|cloves?|pieces?|cans?|slices?|pinch(es)?|bunch(es)?|heads?|stalks?|sprigs?|handfuls?)\b\s*/i, '');
    // Remove parenthetical notes like "(, thinly sliced)" or "(optional)"
    s = s.replace(/\s*\(.*?\)/g, '');
    // Remove trailing prep instructions after a comma (e.g. ", diced", ", cut into chunks")
    s = s.replace(/,\s*(diced|minced|chopped|sliced|thinly sliced|divided|cubed|cut .+|to taste|or .+|peeled|grated|shredded|crushed|melted|softened|drained|rinsed|trimmed|halved|quartered).*$/i, '');
    return s.trim();
  };

  // Get all unique ingredients from all meals
  const allIngredients = Array.from(
    new Set(
      meals.flatMap(meal => {
        if (!meal.ingredients || meal.ingredients.length === 0) return [];
        return meal.ingredients.map(ing => {
          const raw = typeof ing === 'string' ? ing : ing.name;
          return cleanIngredientName(raw);
        }).filter(name => name.length > 1);
      })
    )
  ).sort();
  
  // Filter and sort meals
  const filteredMeals = meals
    .filter(meal => {
      // Smart search: if single letter, filter by first letter; otherwise do regular search
      const matchesSearch = !searchQuery || (() => {
        const query = searchQuery.trim();
        // If it's a single letter, filter by first letter
        if (query.length === 1 && /^[a-zA-Z]$/.test(query)) {
          return meal.name.charAt(0).toUpperCase() === query.toUpperCase();
        }
        // Otherwise, do regular search (name or description)
        return meal.name.toLowerCase().includes(query.toLowerCase()) ||
               meal.description.toLowerCase().includes(query.toLowerCase());
      })();
      
      const matchesTag = !selectedTag || meal.tags.includes(selectedTag);
      const isIncomplete = !meal.ingredients || meal.ingredients.length === 0;
      const matchesIncomplete = !showIncompleteOnly || isIncomplete;
      
      // Filter by ingredient (compare cleaned names)
      const matchesIngredient = !selectedIngredient || (() => {
        if (!meal.ingredients || meal.ingredients.length === 0) return false;
        const mealIngredients = meal.ingredients.map(ing => {
          const raw = typeof ing === 'string' ? ing : ing.name;
          return cleanIngredientName(raw);
        });
        return mealIngredients.includes(selectedIngredient.toLowerCase());
      })();
      
      return matchesSearch && matchesTag && matchesIncomplete && matchesIngredient;
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by date added (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  
  const incompleteMealsCount = meals.filter(m => !m.ingredients || m.ingredients.length === 0).length;
  
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

    // If it looks like a URL, import the recipe
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

    // Otherwise, quick-add by name
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
    // Keep the quick add form open so user can add more meals
  };
  
  const handleMealClick = (mealId: string) => {
    setSelectedMealId(mealId);
    navigate('/meal-detail');
  };

  const handleUpdateMealName = (mealId: string, newName: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      updateMeal({ ...meal, name: toTitleCase(newName) });
    }
  };

  const handleUpdateMealImage = (mealId: string, newImageUrl: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      updateMeal({ ...meal, imageUrl: newImageUrl });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-[73px] bg-gray-50 z-30 space-y-4 pb-4 -mx-4 px-4 shadow-[0_-20px_0_0_#f9fafb]">
        {/* Header */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">All meals</h2>
              <span className="px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {meals.length}
              </span>
            </div>
            {showQuickAdd ? (
              <button 
                onClick={handleToggleQuickAdd} 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <Button onClick={handleToggleQuickAdd} className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add meal
              </Button>
            )}
          </div>
        </div>

        {/* Quick Add Interface */}
        {showQuickAdd && (
          <div className="bg-white border-2 border-primary-500 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick add meal</h3>
            <form onSubmit={handleQuickAddMeal} className="flex gap-3">
              <div className="relative flex-1">
                {inputIsUrl && (
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
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
                  className={`w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base ${
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
                    Importing...
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

            {/* Status messages */}
            {isImporting && (
              <div className="flex items-center gap-2 mt-3 text-sm text-primary-600 bg-primary-50 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Fetching recipe data from URL... This may take a few seconds.</span>
              </div>
            )}
            {importError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {importSuccess}
              </div>
            )}

            {!isImporting && !importError && !importSuccess && (
              <p className="text-sm text-gray-500 mt-3">
                {inputIsUrl
                  ? 'Paste a recipe URL and we\'ll automatically extract the name, ingredients, and instructions.'
                  : 'Enter a meal name or paste a recipe URL. Click on the meal card after adding to edit details.'}
              </p>
            )}
          </div>
        )}
        
        {/* Ingredient Filter */}
        {allIngredients.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Filter by ingredient:</label>
              <select
                value={selectedIngredient || ''}
                onChange={(e) => setSelectedIngredient(e.target.value || null)}
                className="flex-1 px-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">All ingredients</option>
                {allIngredients.map(ingredient => (
                  <option key={ingredient} value={ingredient}>
                    {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
                  </option>
                ))}
              </select>
              {selectedIngredient && (
                <button
                  onClick={() => setSelectedIngredient(null)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Active Filters Summary */}
        {(selectedIngredient || selectedTag) && (
          <div className="flex flex-wrap items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm font-medium text-blue-900">Active filters:</span>
            {selectedIngredient && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-sm border border-blue-300">
                Ingredient: <strong>{selectedIngredient}</strong>
                <button
                  onClick={() => setSelectedIngredient(null)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-sm border border-blue-300">
                Tag: <strong>{selectedTag}</strong>
                <button
                  onClick={() => setSelectedTag(null)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedIngredient(null);
                setSelectedTag(null);
              }}
              className="ml-auto text-sm font-medium text-blue-700 hover:text-blue-900 underline"
            >
              Clear all
            </button>
          </div>
        )}
        
        {/* Search, Sort, and View Toggle */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Sort:</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'alphabetical'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortBy('dateAdded')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'dateAdded'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Date added
              </button>
            </div>
          </div>
          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tag filters */}
      </div>
      
      {/* Meals Grid/List */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600 text-lg mb-4">
            {meals.length === 0
              ? "No meals yet. Start by adding your first meal!"
              : (selectedIngredient || selectedTag || searchQuery)
              ? "No meals match your filters. Try adjusting or clearing them."
              : "No meals match your search."}
          </p>
          {meals.length === 0 ? (
            <Button onClick={handleToggleQuickAdd}>Add your first meal</Button>
          ) : (selectedIngredient || selectedTag || searchQuery) && (
            <Button
              onClick={() => {
                setSelectedIngredient(null);
                setSelectedTag(null);
                setSearchQuery('');
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
      ) : (
        <div className="space-y-2">
          {filteredMeals.map(meal => (
            <MealListItem
              key={meal.id}
              meal={meal}
              onClick={() => handleMealClick(meal.id)}
              onUpdateName={handleUpdateMealName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
