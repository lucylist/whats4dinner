// Local storage utilities for persisting app data

import { Meal, WeeklyPlan, InventoryItem } from '../types';

const STORAGE_KEYS = {
  MEALS: 'dinner_app_meals',
  WEEKLY_PLANS: 'dinner_app_weekly_plans',
  CURRENT_PLAN: 'dinner_app_current_plan',
  INVENTORY: 'dinner_app_inventory',
};

// Generic storage functions
function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

// Meal storage functions
export function getAllMeals(): Meal[] {
  return getFromStorage<Meal[]>(STORAGE_KEYS.MEALS) || [];
}

export function saveMeal(meal: Meal): void {
  const meals = getAllMeals();
  const existingIndex = meals.findIndex(m => m.id === meal.id);
  
  if (existingIndex >= 0) {
    meals[existingIndex] = meal;
  } else {
    meals.push(meal);
  }
  
  saveToStorage(STORAGE_KEYS.MEALS, meals);
}

export function deleteMeal(mealId: string): void {
  const meals = getAllMeals();
  const filtered = meals.filter(m => m.id !== mealId);
  saveToStorage(STORAGE_KEYS.MEALS, filtered);
}

export function getMealById(mealId: string): Meal | null {
  const meals = getAllMeals();
  return meals.find(m => m.id === mealId) || null;
}

// Weekly plan storage functions
export function getAllWeeklyPlans(): WeeklyPlan[] {
  return getFromStorage<WeeklyPlan[]>(STORAGE_KEYS.WEEKLY_PLANS) || [];
}

export function saveWeeklyPlan(plan: WeeklyPlan): void {
  const plans = getAllWeeklyPlans();
  const existingIndex = plans.findIndex(p => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  saveToStorage(STORAGE_KEYS.WEEKLY_PLANS, plans);
}

export function getCurrentWeeklyPlan(): WeeklyPlan | null {
  return getFromStorage<WeeklyPlan>(STORAGE_KEYS.CURRENT_PLAN);
}

export function setCurrentWeeklyPlan(plan: WeeklyPlan | null): void {
  if (plan) {
    saveToStorage(STORAGE_KEYS.CURRENT_PLAN, plan);
    saveWeeklyPlan(plan); // Also save to history
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PLAN);
  }
}

// Inventory storage functions
export function getAllInventoryItems(): InventoryItem[] {
  return getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY) || [];
}

export function saveInventoryItem(item: InventoryItem): void {
  const items = getAllInventoryItems();
  const existingIndex = items.findIndex(i => i.id === item.id);
  
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  
  saveToStorage(STORAGE_KEYS.INVENTORY, items);
}

export function deleteInventoryItem(itemId: string): void {
  const items = getAllInventoryItems();
  const filtered = items.filter(i => i.id !== itemId);
  saveToStorage(STORAGE_KEYS.INVENTORY, filtered);
}

export function clearInventory(): void {
  saveToStorage(STORAGE_KEYS.INVENTORY, []);
}

// Utility function to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function to convert text to sentence case (first letter capitalized only)
export function toTitleCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Extract tags from meal name based on common food keywords
export function extractTagsFromName(mealName: string): string[] {
  const name = mealName.toLowerCase();
  const tags: string[] = [];
  
  // Common proteins
  const proteins = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'prawns', 'lamb', 'turkey', 'duck', 'tofu', 'sausage', 'sausages', 'bacon', 'ham', 'meatball', 'meatballs', 'steak'];
  
  // Common carbs/bases
  const carbs = ['rice', 'pasta', 'noodles', 'noodle', 'bread', 'potato', 'potatoes', 'quinoa', 'couscous'];
  
  // Cuisines (detected from dish names)
  const cuisineKeywords: { [key: string]: string } = {
    'pad thai': 'thai',
    'pad seew': 'thai',
    'pad gra prow': 'thai',
    'green curry': 'thai',
    'red curry': 'thai',
    'tom yum': 'thai',
    'pho': 'vietnamese',
    'banh mi': 'vietnamese',
    'sushi': 'japanese',
    'ramen': 'japanese',
    'teriyaki': 'japanese',
    'tempura': 'japanese',
    'udon': 'japanese',
    'bibimbap': 'korean',
    'bulgogi': 'korean',
    'kimchi': 'korean',
    'tacos': 'mexican',
    'burrito': 'mexican',
    'enchilada': 'mexican',
    'quesadilla': 'mexican',
    'fajita': 'mexican',
    'pizza': 'italian',
    'pasta': 'italian',
    'lasagna': 'italian',
    'risotto': 'italian',
    'alfredo': 'italian',
    'carbonara': 'italian',
    'bolognese': 'italian',
    'spaghetti': 'italian',
    'butter chicken': 'indian',
    'tikka masala': 'indian',
    'curry': 'indian',
    'biryani': 'indian',
    'naan': 'indian',
    'tandoori': 'indian',
    'korma': 'indian',
    'souvlaki': 'greek',
    'gyro': 'greek',
    'moussaka': 'greek',
    'burger': 'american',
    'burgers': 'american',
    'hot dog': 'american',
    'mac and cheese': 'american',
    'stir fry': 'asian',
    'fried rice': 'asian',
    'dumplings': 'asian',
    'spring roll': 'asian',
  };
  
  // Check for proteins
  for (const protein of proteins) {
    if (name.includes(protein)) {
      tags.push(protein);
    }
  }
  
  // Check for carbs
  for (const carb of carbs) {
    if (name.includes(carb)) {
      tags.push(carb);
    }
  }
  
  // Check for cuisine keywords
  for (const [keyword, cuisine] of Object.entries(cuisineKeywords)) {
    if (name.includes(keyword) && !tags.includes(cuisine)) {
      tags.push(cuisine);
    }
  }
  
  // If no tags found, use the last word of the meal name (often the main ingredient)
  if (tags.length === 0) {
    const words = mealName.trim().split(/\s+/);
    if (words.length > 0) {
      const lastWord = words[words.length - 1].toLowerCase();
      // Only use if it's more than 2 characters
      if (lastWord.length > 2) {
        tags.push(lastWord);
      }
    }
  }
  
  // Return lowercase tags
  return tags.map(tag => tag.toLowerCase());
}
