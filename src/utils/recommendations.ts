// Meal recommendation engine based on available ingredients

import Fuse from 'fuse.js';
import { Meal, InventoryItem, MealRecommendation, MealIngredient, COMMON_PANTRY_ITEMS } from '../types';
import { differenceInDays } from 'date-fns';

// Fuzzy matching configuration
const fuseOptions = {
  threshold: 0.3,
  keys: ['name']
};

// Normalize ingredient name for comparison
function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
}

// Check if an ingredient is in the "always available" list
function isCommonPantryItem(ingredientName: string): boolean {
  const normalized = normalizeIngredientName(ingredientName);
  return COMMON_PANTRY_ITEMS.some(item => 
    normalizeIngredientName(item) === normalized
  );
}

// Extract ingredient names from a meal
function extractIngredientNames(meal: Meal): string[] {
  return meal.ingredients.map(ing => {
    if (typeof ing === 'string') {
      return ing;
    }
    return (ing as MealIngredient).name;
  }).filter(name => !isCommonPantryItem(name));
}

// Check if ingredient is available in inventory
function isIngredientAvailable(
  ingredientName: string,
  inventory: InventoryItem[]
): boolean {
  const normalized = normalizeIngredientName(ingredientName);
  
  // Create fuzzy search instance for inventory
  const fuse = new Fuse(
    inventory.map(item => ({ name: item.ingredientName })),
    fuseOptions
  );
  
  // Search for matches
  const results = fuse.search(ingredientName);
  return results.length > 0;
}

// Check if any ingredients are expiring soon (within 3 days)
function hasExpiringIngredients(
  availableIngredientNames: string[],
  inventory: InventoryItem[]
): boolean {
  const now = new Date();
  
  return availableIngredientNames.some(ingredientName => {
    const item = inventory.find(i => 
      normalizeIngredientName(i.ingredientName) === normalizeIngredientName(ingredientName)
    );
    
    if (!item || !item.expirationDate) return false;
    
    const expirationDate = new Date(item.expirationDate);
    const daysUntilExpiration = differenceInDays(expirationDate, now);
    
    return daysUntilExpiration >= 0 && daysUntilExpiration <= 3;
  });
}

// Calculate match score and categorize ingredients
export function calculateMealMatch(
  meal: Meal,
  inventory: InventoryItem[]
): MealRecommendation {
  const requiredIngredients = extractIngredientNames(meal);
  
  if (requiredIngredients.length === 0) {
    // If no ingredients listed (or all are common pantry items), assume 100% match
    return {
      meal,
      matchScore: 100,
      availableIngredients: [],
      missingIngredients: [],
      hasExpiringIngredients: false
    };
  }
  
  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];
  
  requiredIngredients.forEach(ingredientName => {
    if (isIngredientAvailable(ingredientName, inventory)) {
      availableIngredients.push(ingredientName);
    } else {
      missingIngredients.push(ingredientName);
    }
  });
  
  const matchScore = Math.round(
    (availableIngredients.length / requiredIngredients.length) * 100
  );
  
  const hasExpiring = hasExpiringIngredients(availableIngredients, inventory);
  
  return {
    meal,
    matchScore,
    availableIngredients,
    missingIngredients,
    hasExpiringIngredients: hasExpiring
  };
}

// Get meal recommendations sorted by match score
export function getMealRecommendations(
  meals: Meal[],
  inventory: InventoryItem[]
): MealRecommendation[] {
  const recommendations = meals.map(meal => 
    calculateMealMatch(meal, inventory)
  );
  
  // Sort by: expiring ingredients first, then by match score, then by prep time
  return recommendations.sort((a, b) => {
    // Prioritize meals with expiring ingredients
    if (a.hasExpiringIngredients && !b.hasExpiringIngredients) return -1;
    if (!a.hasExpiringIngredients && b.hasExpiringIngredients) return 1;
    
    // Then sort by match score
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    
    // Finally, prefer quicker meals
    return (a.meal.prepTime || 999) - (b.meal.prepTime || 999);
  });
}

// Filter recommendations by match threshold
export function filterRecommendations(
  recommendations: MealRecommendation[],
  minMatchScore: number = 0
): MealRecommendation[] {
  return recommendations.filter(rec => rec.matchScore >= minMatchScore);
}

// Get recommendations by category
export function getRecommendationsByCategory(recommendations: MealRecommendation[]) {
  return {
    canMakeNow: recommendations.filter(r => r.matchScore === 100),
    almostThere: recommendations.filter(r => r.matchScore >= 80 && r.matchScore < 100),
    missingSeveral: recommendations.filter(r => r.matchScore >= 50 && r.matchScore < 80),
    notFeasible: recommendations.filter(r => r.matchScore < 50)
  };
}
