import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

// --- Lazy Firestore helpers (only used on non-Quick platforms) ---
let _fb: any = null;

async function loadFirestore() {
  if (_fb) return _fb;
  try {
    const [{ db }, mod] = await Promise.all([
      import('../config/firebase'),
      import('firebase/firestore')
    ]);
    _fb = { db, ...mod };
    return _fb;
  } catch {
    return null;
  }
}

async function initFirestore(roomId: string, setMeals: any, setCurrentPlanState: any, setInventory: any, cancelled: () => boolean) {
  const fb = await loadFirestore();
  if (!fb) return null;

  const { db, collection, getDocs, onSnapshot, query, setDoc, doc } = fb;
  const roomCol = (name: string) => collection(db, 'rooms', roomId, name);
  const roomDoc = (colName: string, docId: string) => doc(db, 'rooms', roomId, colName, docId);

  try {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    const snapshot = await Promise.race([getDocs(roomCol('meals')), timeout]);
    console.log('[dinner-app] Firestore OK —', (snapshot as any).size, 'meals');
  } catch (e) {
    console.log('[dinner-app] Firestore not reachable:', e);
    return null;
  }

  // Migrate localStorage to Firestore
  try {
    const localMeals = getAllMeals();
    const localPlan = getCurrentWeeklyPlan();
    const localInventory = getAllInventoryItems();
    if (localMeals.length > 0 || localPlan || localInventory.length > 0) {
      const existing = await getDocs(roomCol('meals'));
      if (existing.size === 0) {
        const writes: Promise<void>[] = [];
        for (const meal of localMeals) writes.push(setDoc(roomDoc('meals', meal.id), meal));
        if (localPlan) writes.push(setDoc(roomDoc('plans', localPlan.id), localPlan));
        for (const item of localInventory) writes.push(setDoc(roomDoc('inventory', item.id), item));
        await Promise.all(writes);
      }
    }
  } catch { /* non-fatal */ }

  const unsubs: (() => void)[] = [];

  unsubs.push(
    onSnapshot(query(roomCol('meals')), (snap: any) => {
      if (cancelled()) return;
      setMeals(snap.docs.map((d: any) => d.data() as Meal));
    }, () => {})
  );

  unsubs.push(
    onSnapshot(query(roomCol('plans')), (snap: any) => {
      if (cancelled()) return;
      const docs = snap.docs.map((d: any) => d.data() as WeeklyPlan);
      const plan = docs[0] || null;
      if (plan && !plan.duration) { plan.duration = 'week'; plan.durationCount = 1; }
      setCurrentPlanState(plan);
    }, () => {})
  );

  unsubs.push(
    onSnapshot(query(roomCol('inventory')), (snap: any) => {
      if (cancelled()) return;
      setInventory(snap.docs.map((d: any) => d.data() as InventoryItem));
    }, () => {})
  );

  return { unsubs, fb };
}

export function AppProvider({ children, roomId = null }: AppProviderProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentPlan, setCurrentPlanState] = useState<WeeklyPlan | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [quickDB, setQuickDB] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firestoreRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubs: (() => void)[] = [];

    const loadFromLocalStorage = () => {
      setMeals(getAllMeals());
      const p = getCurrentWeeklyPlan();
      if (p && !p.duration) { p.duration = 'week'; p.durationCount = 1; }
      setCurrentPlanState(p);
      setInventory(getAllInventoryItems());
    };

    const init = async () => {
      setIsLoading(true);

      // --- Quick platform: use Quick DB, skip Firestore ---
      if (isQuickPlatform()) {
        const qdb = await getQuickDB();
        if (!cancelled) setQuickDB(qdb);

        if (qdb) {
          // Migrate flat collections to room-specific if needed
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
            } catch { /* non-fatal */ }
          }

          try {
            const [dbMeals, dbPlans, dbInv] = await Promise.all([
              qdb.collection(qCol('meals', roomId)).find(),
              qdb.collection(qCol('plans', roomId)).find(),
              qdb.collection(qCol('inventory', roomId)).find()
            ]);
            if (!cancelled) {
              setMeals(dbMeals || []);
              const plan = dbPlans?.[0] || null;
              if (plan && !plan.duration) { plan.duration = 'week'; plan.durationCount = 1; }
              setCurrentPlanState(plan);
              setInventory(dbInv || []);
            }
          } catch {
            if (!cancelled) loadFromLocalStorage();
          }
        } else {
          if (!cancelled) loadFromLocalStorage();
        }

        if (!cancelled) setIsLoading(false);
        return;
      }

      // --- Non-Quick (GitHub Pages, local): use Firestore with safety timeout ---
      if (roomId) {
        const firestoreTimeout = new Promise<null>((resolve) => setTimeout(() => {
          console.warn('[dinner-app] Firestore init timed out after 8s');
          resolve(null);
        }, 8000));

        try {
          const result = await Promise.race([
            initFirestore(roomId, setMeals, setCurrentPlanState, setInventory, () => cancelled),
            firestoreTimeout
          ]);
          if (result) {
            unsubs.push(...result.unsubs);
            if (!cancelled) firestoreRef.current = result.fb;
            if (!cancelled) setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('[dinner-app] Firestore init error:', e);
        }
      }

      if (!cancelled) loadFromLocalStorage();
      if (!cancelled) setIsLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
    };
  }, [roomId]);

  // --- Firestore write helpers ---
  const fsWrite = async (colName: string, docId: string, data: any, merge = false) => {
    const fb = firestoreRef.current;
    if (!fb || !roomId) return false;
    try {
      await fb.setDoc(fb.doc(fb.db, 'rooms', roomId, colName, docId), data, merge ? { merge: true } : {});
      return true;
    } catch { return false; }
  };

  const fsDelete = async (colName: string, docId: string) => {
    const fb = firestoreRef.current;
    if (!fb || !roomId) return false;
    try {
      await fb.deleteDoc(fb.doc(fb.db, 'rooms', roomId, colName, docId));
      return true;
    } catch { return false; }
  };

  // --- Meal operations ---
  const addMeal = async (meal: Meal) => {
    saveMealToStorage(meal);
    if (await fsWrite('meals', meal.id, meal)) return;
    if (quickDB) { try { await quickDB.collection(qCol('meals', roomId)).create(meal); } catch {} }
    setMeals(prev => [...prev, meal]);
  };

  const updateMeal = async (meal: Meal) => {
    saveMealToStorage(meal);
    if (await fsWrite('meals', meal.id, meal, true)) return;
    if (quickDB) { try { await quickDB.collection(qCol('meals', roomId)).update(meal.id, meal); } catch {} }
    setMeals(prev => prev.map(m => m.id === meal.id ? meal : m));
  };

  const deleteMeal = async (mealId: string) => {
    deleteMealFromStorage(mealId);
    if (await fsDelete('meals', mealId)) return;
    if (quickDB) { try { await quickDB.collection(qCol('meals', roomId)).delete(mealId); } catch {} }
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
      } catch {}
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
      } catch {}
    }
    setCurrentPlanState(plan);
  };

  // --- Inventory operations ---
  const addInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);
    if (await fsWrite('inventory', item.id, item)) return;
    if (quickDB) { try { await quickDB.collection(qCol('inventory', roomId)).create(item); } catch {} }
    setInventory(prev => [...prev, item]);
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    saveInventoryItemToStorage(item);
    if (await fsWrite('inventory', item.id, item, true)) return;
    if (quickDB) { try { await quickDB.collection(qCol('inventory', roomId)).update(item.id, item); } catch {} }
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const deleteInventoryItem = async (itemId: string) => {
    deleteInventoryItemFromStorage(itemId);
    if (await fsDelete('inventory', itemId)) return;
    if (quickDB) { try { await quickDB.collection(qCol('inventory', roomId)).delete(itemId); } catch {} }
    setInventory(prev => prev.filter(i => i.id !== itemId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-800">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cream-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

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
