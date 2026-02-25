// Meal plan generator (supports week/month durations)

import { startOfWeek, addDays, endOfWeek, endOfMonth, differenceInCalendarDays, format } from 'date-fns';
import { Meal, WeeklyPlan, DayPlan, PlannerPreferences } from '../types';
import { generateId } from './storage';

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random indices for eating out and leftover days
function getRandomDayIndices(totalDays: number, count: number): number[] {
  if (count >= totalDays) return Array.from({ length: totalDays }, (_, i) => i);
  
  const indices: number[] = [];
  while (indices.length < count) {
    const randomIndex = Math.floor(Math.random() * totalDays);
    if (!indices.includes(randomIndex)) {
      indices.push(randomIndex);
    }
  }
  return indices;
}

export function generateWeeklyPlan(
  meals: Meal[],
  startDate: Date,
  preferences: PlannerPreferences
): WeeklyPlan {
  // Determine plan start date and total days based on duration
  let planStartDate: Date;
  let totalDays: number;
  
  if (preferences.duration === 'month') {
    planStartDate = startDate;
    const monthEnd = endOfMonth(startDate);
    totalDays = differenceInCalendarDays(monthEnd, startDate) + 1;
  } else {
    // Start from today, run to end of the last week (Saturday)
    planStartDate = startDate;
    const lastSaturday = endOfWeek(
      addDays(startDate, (preferences.durationCount - 1) * 7),
      { weekStartsOn: 0 }
    );
    totalDays = differenceInCalendarDays(lastSaturday, startDate) + 1;
  }
  
  // Filter meals based on preferences
  let availableMeals = meals.filter(
    meal => !preferences.excludedMealIds.includes(meal.id)
  );
  
  // If prefer quick meals, sort by prep time
  if (preferences.preferQuickMeals) {
    availableMeals = [...availableMeals].sort((a, b) => 
      (a.prepTime || 999) - (b.prepTime || 999)
    );
  }
  
  // We need a meal for every non-eating-out day (leftovers get converted later)
  const mealSlotsNeeded = totalDays - preferences.eatingOutDays;

  // Select meals week-by-week so the same meal never appears in consecutive weeks
  const numWeeks = Math.ceil(totalDays / 7);
  const slotsPerWeek = Math.ceil(mealSlotsNeeded / Math.max(numWeeks, 1));
  const selectedMeals: Meal[] = [];
  let prevWeekIds = new Set<string>();

  for (let w = 0; w < numWeeks; w++) {
    const slotsThisWeek = Math.min(slotsPerWeek, mealSlotsNeeded - selectedMeals.length);
    if (slotsThisWeek <= 0) break;

    // Prefer meals not used last week; fall back if the library is too small
    let pool = availableMeals.filter(m => !prevWeekIds.has(m.id));
    if (pool.length < slotsThisWeek) pool = availableMeals;
    let deck = shuffleArray(pool);

    const thisWeekIds = new Set<string>();
    for (let s = 0; s < slotsThisWeek; s++) {
      if (deck.length === 0) deck = shuffleArray(pool);
      const meal = deck.shift()!;
      selectedMeals.push(meal);
      thisWeekIds.add(meal.id);
    }
    prevWeekIds = thisWeekIds;
  }
  
  // Distribute eating out per week (not randomly across all days)
  const eoPerWeek = numWeeks > 0 ? Math.round(preferences.eatingOutDays / numWeeks) : preferences.eatingOutDays;
  const loPerWeek = numWeeks > 0 ? Math.round(preferences.leftoverDays / numWeeks) : preferences.leftoverDays;

  const eatingOutIndices = new Set<number>();
  for (let w = 0; w < numWeeks; w++) {
    const weekStart = w * 7;
    const weekEnd = Math.min(weekStart + 7, totalDays);
    const weekLen = weekEnd - weekStart;
    const weekIndices = getRandomDayIndices(weekLen, Math.min(eoPerWeek, weekLen));
    for (const idx of weekIndices) eatingOutIndices.add(weekStart + idx);
  }

  // Build initial day plans (without leftovers yet)
  const days: DayPlan[] = [];
  let mealIndex = 0;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(planStartDate, i);
    const dateString = format(date, 'yyyy-MM-dd');

    if (eatingOutIndices.has(i)) {
      days.push({
        date: dateString,
        mealId: null,
        type: 'eating_out',
        leftoverFromDate: null,
        customNote: '',
        locked: false
      });
    } else {
      const meal = selectedMeals[mealIndex] || selectedMeals[0];
      mealIndex++;
      days.push({
        date: dateString,
        mealId: meal?.id || null,
        type: 'meal',
        leftoverFromDate: null,
        customNote: '',
        locked: false
      });
    }
  }

  // Distribute leftovers per week
  for (let w = 0; w < numWeeks; w++) {
    const weekStart = w * 7;
    const weekEnd = Math.min(weekStart + 7, totalDays);

    const validInWeek: number[] = [];
    for (let i = weekStart; i < weekEnd; i++) {
      if (days[i].type === 'eating_out') continue;
      if (i > 0 && days[i - 1].type === 'eating_out') continue;
      // Need at least 2 meal days before this index (across the whole plan)
      const prevMeals = days.slice(0, i).filter(d => d.type === 'meal').length;
      if (prevMeals >= 2) validInWeek.push(i);
    }

    const chosen = shuffleArray(validInWeek).slice(0, Math.min(loPerWeek, validInWeek.length));
    for (const index of chosen) {
      const previousMealDays = days.slice(0, index).filter(d => d.type === 'meal' && d.mealId);
      const src = previousMealDays[previousMealDays.length - 1];
      if (src) {
        days[index] = {
          ...days[index],
          mealId: src.mealId,
          type: 'leftovers',
          leftoverFromDate: src.date
        };
      }
    }
  }
  
  // Create the meal plan
  const plan: WeeklyPlan = {
    id: generateId(),
    weekStartDate: format(planStartDate, 'yyyy-MM-dd'),
    days,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    duration: preferences.duration || 'week',
    durationCount: preferences.durationCount || 1
  };
  
  return plan;
}

export function regenerateWeek(
  plan: WeeklyPlan,
  weekIndex: number,
  meals: Meal[],
  preferences: PlannerPreferences
): WeeklyPlan {
  const start = weekIndex * 7;
  const end = Math.min(start + 7, plan.days.length);
  const weekDays = plan.days.slice(start, end);

  const eatingOutCount = weekDays.filter(d => d.type === 'eating_out').length;
  const leftoverCount = weekDays.filter(d => d.type === 'leftovers').length;
  const mealSlotsNeeded = weekDays.length - eatingOutCount;

  const available = meals.filter(m => !preferences.excludedMealIds.includes(m.id));

  // Collect meal IDs from the previous and next weeks to avoid repeats
  const adjacentIds = new Set<string>();
  const prevStart = (weekIndex - 1) * 7;
  const nextStart = (weekIndex + 1) * 7;
  for (const slice of [plan.days.slice(Math.max(0, prevStart), start), plan.days.slice(end, Math.min(nextStart + 7, plan.days.length))]) {
    for (const d of slice) {
      if (d.type === 'meal' && d.mealId) adjacentIds.add(d.mealId);
    }
  }

  let pool = available.filter(m => !adjacentIds.has(m.id));
  if (pool.length < mealSlotsNeeded) pool = available;

  let deck = shuffleArray(pool);
  const selected: Meal[] = [];
  for (let i = 0; i < mealSlotsNeeded; i++) {
    if (deck.length === 0) deck = shuffleArray(pool);
    selected.push(deck.shift()!);
  }

  const eatingOutIndices = getRandomDayIndices(weekDays.length, eatingOutCount);

  const newWeekDays: DayPlan[] = [];
  let mealIdx = 0;
  for (let i = 0; i < weekDays.length; i++) {
    const dateString = weekDays[i].date;
    if (eatingOutIndices.includes(i)) {
      newWeekDays.push({ date: dateString, mealId: null, type: 'eating_out', leftoverFromDate: null, customNote: '', locked: false });
    } else {
      const meal = selected[mealIdx] || selected[0];
      mealIdx++;
      newWeekDays.push({ date: dateString, mealId: meal?.id || null, type: 'meal', leftoverFromDate: null, customNote: '', locked: false });
    }
  }

  const validLeftoverIndices: number[] = [];
  for (let i = 0; i < newWeekDays.length; i++) {
    if (newWeekDays[i].type === 'eating_out') continue;
    if (i > 0 && newWeekDays[i - 1].type === 'eating_out') continue;
    if (newWeekDays.slice(0, i).filter(d => d.type === 'meal').length >= 2) {
      validLeftoverIndices.push(i);
    }
  }
  const shuffledValid = shuffleArray(validLeftoverIndices);
  const leftoverIndices = shuffledValid.slice(0, Math.min(leftoverCount, validLeftoverIndices.length));
  for (const idx of leftoverIndices) {
    const prevMeals = newWeekDays.slice(0, idx).filter(d => d.type === 'meal' && d.mealId);
    const src = prevMeals[prevMeals.length - 1];
    if (src) {
      newWeekDays[idx] = { ...newWeekDays[idx], mealId: src.mealId, type: 'leftovers', leftoverFromDate: src.date };
    }
  }

  const allDays = [...plan.days];
  for (let i = 0; i < newWeekDays.length; i++) {
    allDays[start + i] = newWeekDays[i];
  }

  return { ...plan, days: allDays, modifiedAt: new Date().toISOString() };
}

// Update a specific day in the plan
export function updateDayPlan(
  plan: WeeklyPlan,
  dayIndex: number,
  updates: Partial<DayPlan>
): WeeklyPlan {
  const updatedDays = [...plan.days];
  updatedDays[dayIndex] = {
    ...updatedDays[dayIndex],
    ...updates
  };
  
  return {
    ...plan,
    days: updatedDays,
    modifiedAt: new Date().toISOString()
  };
}

// Swap two days in the plan
export function swapDays(
  plan: WeeklyPlan,
  dayIndex1: number,
  dayIndex2: number
): WeeklyPlan {
  const updatedDays = [...plan.days];
  const day1Date = updatedDays[dayIndex1].date;
  const day2Date = updatedDays[dayIndex2].date;
  
  // Swap everything except the dates
  const temp = { ...updatedDays[dayIndex1], date: day2Date };
  updatedDays[dayIndex1] = { ...updatedDays[dayIndex2], date: day1Date };
  updatedDays[dayIndex2] = temp;
  
  return {
    ...plan,
    days: updatedDays,
    modifiedAt: new Date().toISOString()
  };
}
