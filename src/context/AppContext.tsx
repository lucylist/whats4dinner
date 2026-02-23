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
import { db as firestoreDb } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe
} from 'firebase/firestore';

interface AppContextType {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  getMeal: (mealId: string) => Meal | undefined;
  currentPlan: WeeklyPlan | null;
  setCurrentPlan: (plan: WeeklyPlan | null) => void;
  updateCurrentPlan: (plan: WeeklyPlan) => void;
  inventory: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => void;
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
  const [useFirestore, setUseFirestore] = useState(false);

  useEffect(() => {
    const unsubs: Unsubscribe[] = [];
    let cancelled = false;

    const initData = async () => {
      setIsLoading(true);

      // Try Firestore first for shared family data
      try {
        const mealsQuery = query(collection(firestoreDb, 'meals'));
        unsubs.push(
          onSnapshot(mealsQuery, (snapshot) => {
            if (cancelled) return;
            const docs = snapshot.docs.map(d => d.data() as Meal);
            setMeals(docs);
          }, () => {
            // Firestore listener failed, will fall through to other sources
          })
        );

        const plansQuery = query(collection(firestoreDb, 'plans'));
        unsubs.push(
          onSnapshot(plansQuery, (snapshot) => {
            if (cancelled) return;
            const docs = snapshot.docs.map(d => d.data() as WeeklyPlan);
            const plan = docs[0] || null;
            if (plan && !plan.duration) {
              plan.duration = 'week';
              plan.durationCount = 1;
            }
            setCurrentPlanState(plan);
          }, () => {})
        );

        const invQuery = query(collection(firestoreDb, 'inventory'));
        unsubs.push(
          onSnapshot(invQuery, (snapshot) => {
            if (cancelled) return;
            const docs = snapshot.docs.map(d => d.data() as InventoryItem);
            setInventory(docs);
          }, () => {})
        );

        setUseFirestore(true);
        setIsLoading(false);
        console.log('🔥 Connected to Firestore (shared family data)');
        return;
      } catch (e) {
        console.log('Firestore not available, trying Quick DB...', e);
      }

      // Try Quick DB next
      const qdb = await getQuickDB();
      setQuickDB(qdb);

      if (qdb) {
        try {
          const [dbMeals, dbPlans, dbInventory] = await Promise.all([
            qdb.collection('meals').find(),
            qdb.collection('plans').find(),
            qdb.collection('inventory').find()
          ]);
          if (!cancelled) {
            setMeals(dbMeals || []);
            const loadedPlan = dbPlans?.[0] || null;
            if (loadedPlan && !loadedPlan.duration) {
              loadedPlan.duration = 'week';
              loadedPlan.durationCount = 1;
            }
            setCurrentPlanState(loadedPlan);
            setInventory(dbInventory || []);
            console.log('✅ Loaded data from Quick DB');
          }
        } catch (e) {
          console.log('Quick DB error, falling back to localStorage:', e);
          if (!cancelled) loadFromLocalStorage();
        }
      } else {
        if (!cancelled) loadFromLocalStorage();
      }

      if (!cancelled) setIsLoading(false);
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

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
    };
  }, []);

  // --- Meal operations ---
  const addMeal = async (meal: Meal) => {
    saveMealToStorage(meal);

    if (useFirestore) {
      try {
        await setDoc(doc(firestoreDb, 'meals', meal.id), meal);
        return;
      } catch (e) {
        console.error('Firestore save error:', e);
      }
    }

    if (quickDB) {
      try { await quickDB.collection('meals').create(meal); } catch (e) { console.error('Quick DB save error:', e); }
    }

    setMeals(prev => [...prev, meal]);
  };

  const updateMeal = async (meal: Meal) => {
    saveMealToStorage(meal);

    if (useFirestore) {
      try {
        await setDoc(doc(firestoreDb, 'meals', meal.id), meal, { merge: true });
        return;
      } catch (e) {
        console.error('Firestore update error:', e);
      }
    }

    if (quickDB) {
      try { await quickDB.collection('meals').update(meal.id, meal); } catch (e) { console.error('Quick DB update error:', e); }
    }

    setMeals(prev => prev.map(m => m.id === meal.id ? meal : m));
  };

  const deleteMeal = async (mealId: string) => {
    deleteMealFromStorage(mealId);

    if (useFirestore) {
      try {
        await deleteDoc(doc(firestoreDb, 'meals', mealId));
        return;
      } catch (e) {
        console.error('Firestore delete error:', e);
      }
    }

    if (quickDB) {
      try { await quickDB.collection('meals').delete(mealId); } catch (e) { console.error('Quick DB delete error:', e); }
    }

    setMeals(prev => prev.filter(m => m.id !== mealId));
  };

  const getMeal = (mealId: string) => meals.find(m => m.id === mealId);

  // --- Weekly plan operations ---
  const setCurrentPlan = async (plan: WeeklyPlan | null) => {
    setCurrentWeeklyPlan(plan);

    if (useFirestore && plan) {
      try {
        await setDoc(doc(firestoreDb, 'plans', plan.id), plan);
        return;
      } catch (e) {
        console.error('Firestore plan save error:', e);
      }
    }

    if (quickDB && plan) {
      try {
        const existing = await quickDB.collection('plans').find();
        if (existing?.length > 0) {
          await quickDB.collection('plans').update(existing[0].id, plan);
        } else {
          await quickDB.collection('plans').create(plan);
        }
      } catch (e) {
        console.error('Quick DB plan save error:', e);
      }
    }

    setCurrentPlanState(plan);
  };

  const updateCurrentPlan = async (plan: WeeklyPlan) => {
    setCurrentWeeklyPlan(plan);

    if (useFirestore) {
      try {
        await setDoc(doc(firestoreDb, 'plans', plan.id), plan, { merge: true });
        return;
      } catch (e) {
        console.error('Firestore plan update error:', e);
      }
    }

    if (quickDB) {
      try {
        const existing = await quickDB.collection('plans').find();
        if (existing?.length > 0) {
          await quickDB.collection('plans').update(existing[0].id, plan);
        } else {
          await quickDB.collection('plans').create(plan);
        }
      } catch (e) {
        console.error('Quick DB plan update error:', e);
      }
    }

    setCurrentPlanState(plan);
  };

  // --- Inventory operations ---
  const addInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);

    if (useFirestore) {
      try {
        await setDoc(doc(firestoreDb, 'inventory', item.id), item);
        return;
      } catch (e) {
        console.error('Firestore inventory save error:', e);
      }
    }

    if (quickDB) {
      try { await quickDB.collection('inventory').create(item); } catch (e) { console.error('Quick DB inventory save error:', e); }
    }

    setInventory(prev => [...prev, item]);
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);

    if (useFirestore) {
      try {
        await setDoc(doc(firestoreDb, 'inventory', item.id), item, { merge: true });
        return;
      } catch (e) {
        console.error('Firestore inventory update error:', e);
      }
    }

    if (quickDB) {
      try { await quickDB.collection('inventory').update(item.id, item); } catch (e) { console.error('Quick DB inventory update error:', e); }
    }

    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const deleteInventoryItem = async (itemId: string) => {
    deleteInventoryItemFromStorage(itemId);

    if (useFirestore) {
      try {
        await deleteDoc(doc(firestoreDb, 'inventory', itemId));
        return;
      } catch (e) {
        console.error('Firestore inventory delete error:', e);
      }
    }

    if (quickDB) {
      try { await quickDB.collection('inventory').delete(itemId); } catch (e) { console.error('Quick DB inventory delete error:', e); }
    }

    setInventory(prev => prev.filter(i => i.id !== itemId));
  };

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
    meals, addMeal, updateMeal, deleteMeal, getMeal,
    currentPlan, setCurrentPlan, updateCurrentPlan,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    selectedMealId, setSelectedMealId
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
