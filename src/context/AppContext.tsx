// Global app context for state management

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Meal, WeeklyPlan, InventoryItem } from '../types';
import {
  getAllMeals,
  saveMeal as saveMealToStorage,
  deleteMeal as deleteMealFromStorage,
  getCurrentWeeklyPlan,
  setCurrentWeeklyPlan,
  getAllInventoryItems,
  saveInventoryItem as saveInventoryItemToStorage,
  deleteInventoryItem as deleteInventoryItemFromStorage
} from '../utils/storage';
import { getQuickDB } from '../utils/quick';

interface AppContextType {
  // Meals
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  getMeal: (mealId: string) => Meal | undefined;
  
  // Weekly Plan
  currentPlan: WeeklyPlan | null;
  setCurrentPlan: (plan: WeeklyPlan | null) => void;
  updateCurrentPlan: (plan: WeeklyPlan) => void;
  
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => void;
  
  // UI State
  selectedMealId: string | null;
  setSelectedMealId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentPlan, setCurrentPlanState] = useState<WeeklyPlan | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [quickDB, setQuickDB] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize Quick DB and load data
  useEffect(() => {
    const initData = async () => {
      // Try to get Quick DB
      const db = await getQuickDB();
      setQuickDB(db);
      
      if (db) {
        // Load from Quick DB
        try {
          const mealsCollection = db.collection('meals');
          const plansCollection = db.collection('plans');
          const inventoryCollection = db.collection('inventory');
          
          const [dbMeals, dbPlans, dbInventory] = await Promise.all([
            mealsCollection.find(),
            plansCollection.find(),
            inventoryCollection.find()
          ]);
          
          setMeals(dbMeals || []);
          
          const loadedPlan = dbPlans?.[0] || null;
          if (loadedPlan && !loadedPlan.duration) {
            loadedPlan.duration = 'week';
            loadedPlan.durationCount = 1;
          }
          setCurrentPlanState(loadedPlan);
          setInventory(dbInventory || []);
          
          console.log('✅ Loaded data from Quick DB');
        } catch (e) {
          console.log('Quick DB error, falling back to localStorage:', e);
          loadFromLocalStorage();
        }
      } else {
        // Fallback to localStorage
        loadFromLocalStorage();
      }
      
      setIsLoading(false);
    };
    
    const loadFromLocalStorage = () => {
      setMeals(getAllMeals());
      const loadedPlan = getCurrentWeeklyPlan();
      if (loadedPlan && !loadedPlan.duration) {
        loadedPlan.duration = 'week';
        loadedPlan.durationCount = 1;
      }
      setCurrentPlanState(loadedPlan);
      setInventory(getAllInventoryItems());
      console.log('📁 Loaded data from localStorage');
    };
    
    initData();
  }, []);
  
  // Meal operations
  const addMeal = async (meal: Meal) => {
    // Always save to localStorage as backup
    saveMealToStorage(meal);
    
    // Also save to Quick DB if available
    if (quickDB) {
      try {
        await quickDB.collection('meals').create(meal);
      } catch (e) {
        console.error('Quick DB save error:', e);
      }
    }
    
    setMeals(prev => [...prev, meal]);
  };
  
  const updateMeal = async (meal: Meal) => {
    saveMealToStorage(meal);
    
    if (quickDB) {
      try {
        await quickDB.collection('meals').update(meal.id, meal);
      } catch (e) {
        console.error('Quick DB update error:', e);
      }
    }
    
    setMeals(prev => prev.map(m => m.id === meal.id ? meal : m));
  };
  
  const deleteMeal = async (mealId: string) => {
    deleteMealFromStorage(mealId);
    
    if (quickDB) {
      try {
        await quickDB.collection('meals').delete(mealId);
      } catch (e) {
        console.error('Quick DB delete error:', e);
      }
    }
    
    setMeals(prev => prev.filter(m => m.id !== mealId));
  };
  
  const getMeal = (mealId: string) => {
    return meals.find(m => m.id === mealId);
  };
  
  // Weekly plan operations
  const setCurrentPlan = async (plan: WeeklyPlan | null) => {
    setCurrentWeeklyPlan(plan);
    
    if (quickDB && plan) {
      try {
        const plansCollection = quickDB.collection('plans');
        const existing = await plansCollection.find();
        if (existing?.length > 0) {
          await plansCollection.update(existing[0].id, plan);
        } else {
          await plansCollection.create(plan);
        }
      } catch (e) {
        console.error('Quick DB plan save error:', e);
      }
    }
    
    setCurrentPlanState(plan);
  };
  
  const updateCurrentPlan = async (plan: WeeklyPlan) => {
    setCurrentWeeklyPlan(plan);
    
    if (quickDB) {
      try {
        const plansCollection = quickDB.collection('plans');
        const existing = await plansCollection.find();
        if (existing?.length > 0) {
          await plansCollection.update(existing[0].id, plan);
        } else {
          await plansCollection.create(plan);
        }
      } catch (e) {
        console.error('Quick DB plan update error:', e);
      }
    }
    
    setCurrentPlanState(plan);
  };
  
  // Inventory operations
  const addInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);
    
    if (quickDB) {
      try {
        await quickDB.collection('inventory').create(item);
      } catch (e) {
        console.error('Quick DB inventory save error:', e);
      }
    }
    
    setInventory(prev => [...prev, item]);
  };
  
  const updateInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);
    
    if (quickDB) {
      try {
        await quickDB.collection('inventory').update(item.id, item);
      } catch (e) {
        console.error('Quick DB inventory update error:', e);
      }
    }
    
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };
  
  const deleteInventoryItem = async (itemId: string) => {
    deleteInventoryItemFromStorage(itemId);
    
    if (quickDB) {
      try {
        await quickDB.collection('inventory').delete(itemId);
      } catch (e) {
        console.error('Quick DB inventory delete error:', e);
      }
    }
    
    setInventory(prev => prev.filter(i => i.id !== itemId));
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const value: AppContextType = {
    meals,
    addMeal,
    updateMeal,
    deleteMeal,
    getMeal,
    currentPlan,
    setCurrentPlan,
    updateCurrentPlan,
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    selectedMealId,
    setSelectedMealId
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
