// Core data models for the Dinner Planner App

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: MealIngredient[] | string[];
  recipe: string;
  links: string[];
  tags: string[];
  prepTime: number; // in minutes
  imageUrl: string;
  notes: string;
  createdAt: string;
  lastMadeAt: string | null;
}

export interface MealIngredient {
  name: string;
  quantity: string;
  optional: boolean;
}

export interface InventoryItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  expirationDate: string | null;
  category: IngredientCategory;
  addedAt: string;
  notes: string;
}

export type IngredientCategory = 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';

export interface WeeklyPlan {
  id: string;
  weekStartDate: string;
  days: DayPlan[];
  createdAt: string;
  modifiedAt: string;
  duration: PlanDuration;
  durationCount: number; // Number of weeks/months
}

export interface DayPlan {
  date: string;
  mealId: string | null;
  type: DayType;
  leftoverFromDate: string | null;
  customNote: string;
  locked: boolean;
}

export type DayType = 'meal' | 'eating_out' | 'leftovers';

export type PlanDuration = 'week' | 'month';

export interface MealRecommendation {
  meal: Meal;
  matchScore: number;
  availableIngredients: string[];
  missingIngredients: string[];
  hasExpiringIngredients: boolean;
}

export interface PlannerPreferences {
  duration: PlanDuration;
  durationCount: number; // Number of weeks or months
  eatingOutDays: number;
  leftoverDays: number;
  excludedMealIds: string[];
  preferQuickMeals: boolean;
  useIngredientsFromFridge: boolean;
}

// Common pantry items that are always assumed to be available
export const COMMON_PANTRY_ITEMS = [
  'salt',
  'pepper',
  'black pepper',
  'olive oil',
  'vegetable oil',
  'oil',
  'water',
  'sugar',
  'flour',
  'butter'
];
