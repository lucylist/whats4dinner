import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
import { getQuickDB, isQuickPlatform } from '../utils/quick';

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
  roomId: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  roomId?: string | null;
}

function qCol(name: string, roomId: string | null) {
  return roomId ? `${name}_${roomId}` : name;
}

function normalizePlan(plan: WeeklyPlan | null): WeeklyPlan | null {
  if (plan && !plan.duration) { plan.duration = 'week'; plan.durationCount = 1; }
  return plan;
}

// --- Lazy Firestore loader ---
let _fb: any = null;

async function loadFirestore(): Promise<any> {
  if (_fb) return _fb;
  const [{ db }, mod] = await Promise.all([
    import('../config/firebase'),
    import('firebase/firestore')
  ]);
  _fb = { db, ...mod };
  return _fb;
}

export function AppProvider({ children, roomId = null }: AppProviderProps) {
  const [meals, setMeals] = useState<Meal[]>(() => getAllMeals());
  const [currentPlan, setCurrentPlanState] = useState<WeeklyPlan | null>(() => normalizePlan(getCurrentWeeklyPlan()));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getAllInventoryItems());
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [quickDB, setQuickDB] = useState<any>(null);
  const firestoreRef = useRef<any>(null);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      try {
        // --- Quick platform: use Quick DB ---
        if (isQuickPlatform()) {
          const qdb = await getQuickDB();
          setQuickDB(qdb);
          if (!qdb) return;

          if (roomId) {
            try {
              const roomMeals = await qdb.collection(qCol('meals', roomId)).find();
              if (!roomMeals || roomMeals.length === 0) {
                const flat = await qdb.collection('meals').find();
                if (flat && flat.length > 0) {
                  for (const m of flat) await qdb.collection(qCol('meals', roomId)).create(m);
                  const fp = await qdb.collection('plans').find();
                  if (fp) for (const p of fp) await qdb.collection(qCol('plans', roomId)).create(p);
                  const fi = await qdb.collection('inventory').find();
                  if (fi) for (const i of fi) await qdb.collection(qCol('inventory', roomId)).create(i);
                }
              }
            } catch (e) { console.log('Quick DB migration (non-fatal):', e); }
          }

          const [dbMeals, dbPlans, dbInv] = await Promise.all([
            qdb.collection(qCol('meals', roomId)).find(),
            qdb.collection(qCol('plans', roomId)).find(),
            qdb.collection(qCol('inventory', roomId)).find()
          ]);
          setMeals(dbMeals || []);
          setCurrentPlanState(normalizePlan(dbPlans?.[0] || null));
          setInventory(dbInv || []);
          return;
        }

        // --- Non-Quick (GitHub Pages): one-time Firestore read ---
        if (roomId) {
          const fb = await loadFirestore();
          const { db, collection, getDocs, setDoc, doc } = fb;
          const roomCol = (name: string) => collection(db, 'rooms', roomId, name);

          const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000));
          const mealsSnap = await Promise.race([getDocs(roomCol('meals')), timeout]);

          // Migrate localStorage if Firestore room is empty
          if (mealsSnap.size === 0) {
            const localMeals = getAllMeals();
            const localPlan = getCurrentWeeklyPlan();
            const localInv = getAllInventoryItems();
            if (localMeals.length > 0 || localPlan || localInv.length > 0) {
              const writes: Promise<void>[] = [];
              for (const meal of localMeals) writes.push(setDoc(doc(db, 'rooms', roomId, 'meals', meal.id), meal));
              if (localPlan) writes.push(setDoc(doc(db, 'rooms', roomId, 'plans', localPlan.id), localPlan));
              for (const item of localInv) writes.push(setDoc(doc(db, 'rooms', roomId, 'inventory', item.id), item));
              await Promise.all(writes);
            }
          }

          const [plansSnap, invSnap] = await Promise.all([
            getDocs(roomCol('plans')),
            getDocs(roomCol('inventory'))
          ]);

          const fsMeals = mealsSnap.docs.map((d: any) => d.data() as Meal);
          const fsPlans = plansSnap.docs.map((d: any) => d.data() as WeeklyPlan);
          const fsInv = invSnap.docs.map((d: any) => d.data() as InventoryItem);

          if (fsMeals.length > 0 || fsPlans.length > 0 || fsInv.length > 0) {
            setMeals(fsMeals);
            setCurrentPlanState(normalizePlan(fsPlans[0] || null));
            setInventory(fsInv);
          }

          firestoreRef.current = fb;
        }
      } catch (e) {
        console.error('[dinner-app] Init error (using localStorage):', e);
      }
    })();
  }, [roomId]);

  // --- Firestore write helpers ---
  const fsWrite = useCallback(async (colName: string, docId: string, data: any, merge = false) => {
    const fb = firestoreRef.current;
    if (!fb || !roomId) return false;
    try {
      await fb.setDoc(fb.doc(fb.db, 'rooms', roomId, colName, docId), data, merge ? { merge: true } : {});
      return true;
    } catch { return false; }
  }, [roomId]);

  const fsDelete = useCallback(async (colName: string, docId: string) => {
    const fb = firestoreRef.current;
    if (!fb || !roomId) return false;
    try {
      await fb.deleteDoc(fb.doc(fb.db, 'rooms', roomId, colName, docId));
      return true;
    } catch { return false; }
  }, [roomId]);

  // --- Meal operations ---
  const addMeal = async (meal: Meal) => {
    saveMealToStorage(meal);
    if (await fsWrite('meals', meal.id, meal)) return;
    if (quickDB) { try { await quickDB.collection(qCol('meals', roomId)).create(meal); } catch (e) { console.log(e); } }
    setMeals(prev => [...prev, meal]);
  };

  const updateMeal = async (meal: Meal) => {
    saveMealToStorage(meal);
    if (await fsWrite('meals', meal.id, meal, true)) return;
    if (quickDB) { try { await quickDB.collection(qCol('meals', roomId)).update(meal.id, meal); } catch (e) { console.log(e); } }
    setMeals(prev => prev.map(m => m.id === meal.id ? meal : m));
  };

  const deleteMeal = async (mealId: string) => {
    deleteMealFromStorage(mealId);
    if (await fsDelete('meals', mealId)) return;
    if (quickDB) { try { await quickDB.collection(qCol('meals', roomId)).delete(mealId); } catch (e) { console.log(e); } }
    setMeals(prev => prev.filter(m => m.id !== mealId));
  };

  const getMeal = (mealId: string) => meals.find(m => m.id === mealId);

  // --- Weekly plan operations ---
  const setCurrentPlan = async (plan: WeeklyPlan | null) => {
    setCurrentWeeklyPlan(plan);
    if (plan && await fsWrite('plans', plan.id, plan)) return;
    if (quickDB && plan) {
      try {
        const col = qCol('plans', roomId);
        const existing = await quickDB.collection(col).find();
        if (existing?.length > 0) await quickDB.collection(col).update(existing[0].id, plan);
        else await quickDB.collection(col).create(plan);
      } catch (e) { console.log(e); }
    }
    setCurrentPlanState(plan);
  };

  const updateCurrentPlan = async (plan: WeeklyPlan) => {
    setCurrentWeeklyPlan(plan);
    if (await fsWrite('plans', plan.id, plan, true)) return;
    if (quickDB) {
      try {
        const col = qCol('plans', roomId);
        const existing = await quickDB.collection(col).find();
        if (existing?.length > 0) await quickDB.collection(col).update(existing[0].id, plan);
        else await quickDB.collection(col).create(plan);
      } catch (e) { console.log(e); }
    }
    setCurrentPlanState(plan);
  };

  // --- Inventory operations ---
  const addInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);
    if (await fsWrite('inventory', item.id, item)) return;
    if (quickDB) { try { await quickDB.collection(qCol('inventory', roomId)).create(item); } catch (e) { console.log(e); } }
    setInventory(prev => [...prev, item]);
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);
    if (await fsWrite('inventory', item.id, item, true)) return;
    if (quickDB) { try { await quickDB.collection(qCol('inventory', roomId)).update(item.id, item); } catch (e) { console.log(e); } }
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const deleteInventoryItem = async (itemId: string) => {
    deleteInventoryItemFromStorage(itemId);
    if (await fsDelete('inventory', itemId)) return;
    if (quickDB) { try { await quickDB.collection(qCol('inventory', roomId)).delete(itemId); } catch (e) { console.log(e); } }
    setInventory(prev => prev.filter(i => i.id !== itemId));
  };

  const value: AppContextType = {
    meals, addMeal, updateMeal, deleteMeal, getMeal,
    currentPlan, setCurrentPlan, updateCurrentPlan,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    selectedMealId, setSelectedMealId, roomId
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
