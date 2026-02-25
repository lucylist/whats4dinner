// Meal plan generator (supports week/month durations)

import { startOfWeek, startOfMonth, addDays, format } from 'date-fns';
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
    planStartDate = startOfMonth(startDate);
    // Calculate days for the number of months
    totalDays = preferences.durationCount * 30; // Approximate 30 days per month
  } else {
    // Default to week
    planStartDate = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday
    totalDays = preferences.durationCount * 7;
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
  
  // Shuffle meals for randomness
  const shuffledMeals = shuffleArray(availableMeals);
  
  // We need a meal for every non-eating-out day (leftovers get converted later)
  const mealSlotsNeeded = totalDays - preferences.eatingOutDays;
  
  // Select meals — no repeats until all meals have been used (deck approach)
  const selectedMeals: Meal[] = [];
  let deck: Meal[] = [];
  
  for (let i = 0; i < mealSlotsNeeded; i++) {
    if (deck.length === 0) {
      deck = shuffleArray(availableMeals);
      if (selectedMeals.length > 0 && deck.length > 1 && deck[0].id === selectedMeals[selectedMeals.length - 1].id) {
        deck.push(deck.shift()!);
      }
    }
    selectedMeals.push(deck.shift()!);
  }
  
  // Determine which days are eating out
  const eatingOutIndices = getRandomDayIndices(totalDays, preferences.eatingOutDays);
  
  // Build initial day plans (without leftovers yet)
  const days: DayPlan[] = [];
  let mealIndex = 0;
  
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(planStartDate, i);
    const dateString = format(date, 'yyyy-MM-dd');
    
    let dayPlan: DayPlan;
    
    if (eatingOutIndices.includes(i)) {
      dayPlan = {
        date: dateString,
        mealId: null,
        type: 'eating_out',
        leftoverFromDate: null,
        customNote: '',
        locked: false
      };
    } else {
      // Regular meal day (we'll convert some to leftovers later)
      const meal = selectedMeals[mealIndex] || selectedMeals[0];
      mealIndex++;
      
      dayPlan = {
        date: dateString,
        mealId: meal?.id || null,
        type: 'meal',
        leftoverFromDate: null,
        customNote: '',
        locked: false
      };
    }
    
    days.push(dayPlan);
  }
  
  // Now place leftover days with rules:
  // 1. NOT after eating out
  // 2. Only after at least 2 meal days
  const validLeftoverIndices: number[] = [];
  
  for (let i = 0; i < totalDays; i++) {
    // Skip if already eating out
    if (days[i].type === 'eating_out') continue;
    
    // Check if previous day is eating out
    if (i > 0 && days[i - 1].type === 'eating_out') continue;
    
    // Count previous meal days (not eating out or leftovers)
    const previousMealCount = days.slice(0, i).filter(d => d.type === 'meal').length;
    
    // Need at least 2 previous meals
    if (previousMealCount >= 2) {
      validLeftoverIndices.push(i);
    }
  }
  
  // Randomly select leftover days from valid indices
  const shuffledValidIndices = shuffleArray(validLeftoverIndices);
  const leftoverIndices = shuffledValidIndices.slice(0, Math.min(preferences.leftoverDays, validLeftoverIndices.length));
  
  // Convert selected days to leftover days
  for (const index of leftoverIndices) {
    // Find the most recent meal day before this day
    const previousMealDays = days.slice(0, index).filter(d => d.type === 'meal' && d.mealId);
    const leftoverSource = previousMealDays.length > 0 
      ? previousMealDays[previousMealDays.length - 1]
      : null;
    
    if (leftoverSource) {
      days[index] = {
        ...days[index],
        mealId: leftoverSource.mealId,
        type: 'leftovers',
        leftoverFromDate: leftoverSource.date
      };
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
  let deck: Meal[] = [];
  const selected: Meal[] = [];
  for (let i = 0; i < mealSlotsNeeded; i++) {
    if (deck.length === 0) {
      deck = shuffleArray(available);
      if (selected.length > 0 && deck.length > 1 && deck[0].id === selected[selected.length - 1].id) {
        deck.push(deck.shift()!);
      }
    }
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
