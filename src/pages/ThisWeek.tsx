import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfWeek, startOfMonth, endOfMonth, addDays, getDay, isBefore, startOfDay } from 'date-fns';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight, X, Layers, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { DayPlan, Meal } from '../types';
import { toTitleCase, generateId, extractTagsFromName } from '../utils/storage';
import { generateWeeklyPlan, regenerateWeek } from '../utils/planGenerator';

interface LeftoverPickerState {
  dayDate: string;
  dayIndex: number;
  pendingDays: DayPlan[];
}

function getPlaceholderStyle(mealName: string) {
  const hues = [25, 35, 140, 210, 280, 350];
  const seed = mealName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hues[seed % hues.length];
  const bg = `hsl(${hue}, 30%, 22%)`;
  const initials = mealName.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
  return { bg, initials };
}

function MealThumbnail({ meal, size = 'md' }: { meal: { name: string; imageUrl?: string }; size?: 'sm' | 'md' }) {
  const [hasError, setHasError] = React.useState(false);
  const placeholder = getPlaceholderStyle(meal.name);
  const sizeClass = size === 'sm' ? 'w-10 h-10 rounded-lg' : 'w-14 h-14 rounded-xl';

  React.useEffect(() => { setHasError(false); }, [meal.imageUrl]);

  if (meal.imageUrl && !hasError) {
    return (
      <img
        src={meal.imageUrl}
        alt={meal.name}
        className={`${sizeClass} object-cover flex-shrink-0 border border-forest-500/40`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center flex-shrink-0 border border-forest-500/40`}
      style={{ backgroundColor: placeholder.bg }}
    >
      <span className="text-cream-300/60 text-xs font-bold">{placeholder.initials}</span>
    </div>
  );
}

function DesktopMealImage({ meal }: { meal: { name: string; imageUrl?: string } }) {
  const [hasError, setHasError] = React.useState(false);
  React.useEffect(() => { setHasError(false); }, [meal.imageUrl]);
  if (!meal.imageUrl || hasError) {
    const p = getPlaceholderStyle(meal.name);
    return (
      <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: p.bg }}>
        <span className="text-cream-300/30 text-4xl font-serif font-bold">{p.initials}</span>
      </div>
    );
  }
  return (
    <img src={meal.imageUrl} alt={meal.name} className="aspect-[4/3] w-full object-cover" onError={() => setHasError(true)} />
  );
}

export default function ThisWeek() {
  const { currentPlan, getMeal, setSelectedMealId, setCurrentPlan, meals, updateMeal, addMeal } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'stacked' | 'paginated'>(() => {
    if (!currentPlan || currentPlan.days.length <= 7) return 'paginated';
    return 'stacked';
  });
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [draggedDay, setDraggedDay] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editedMealName, setEditedMealName] = useState('');
  const [leftoverPicker, setLeftoverPicker] = useState<LeftoverPickerState | null>(null);
  
  if (!currentPlan) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-forest-700 border border-forest-500/60 flex items-center justify-center">
          <Calendar className="w-10 h-10 text-cobalt" />
        </div>
        <div>
          <h2 className="text-4xl sm:text-5xl font-serif text-cream-100 mb-2">No calendar yet</h2>
          <p className="text-cream-400 mb-6">
            Plan your week and we'll fill in the meals for you.
          </p>
          <Button onClick={() => navigate('/plan-week')}>
            Plan your week
          </Button>
        </div>
      </div>
    );
  }
  
  const handleViewMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    navigate('/meal-detail');
  };
  
  const handleStartEdit = (dayDate: string, currentMealName: string) => {
    setEditingDay(dayDate);
    setEditedMealName(currentMealName);
  };
  
  const handleSaveEdit = (day: DayPlan) => {
    if (!editedMealName.trim()) {
      setEditingDay(null);
      return;
    }
    const newName = toTitleCase(editedMealName.trim());
    const existingMeal = meals.find(m => m.name.toLowerCase() === newName.toLowerCase());
    
    if (existingMeal) {
      if (currentPlan) {
        const updatedDays = currentPlan.days.map(d => 
          d.date === day.date ? { ...d, mealId: existingMeal.id, type: 'meal' as const } : d
        );
        setCurrentPlan({ ...currentPlan, days: updatedDays });
      }
    } else {
      const newMeal: Meal = {
        id: generateId(),
        name: newName,
        description: '',
        ingredients: [],
        recipe: '',
        links: [],
        tags: extractTagsFromName(newName),
        prepTime: 0,
        imageUrl: '',
        notes: '',
        createdAt: new Date().toISOString(),
        lastMadeAt: null,
      };
      addMeal(newMeal);
      if (currentPlan) {
        const updatedDays = currentPlan.days.map(d => 
          d.date === day.date ? { ...d, mealId: newMeal.id, type: 'meal' as const } : d
        );
        setCurrentPlan({ ...currentPlan, days: updatedDays });
      }
    }
    setEditingDay(null);
    setEditedMealName('');
  };
  
  const handleEditKeyDown = (e: React.KeyboardEvent, day: DayPlan) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(day);
    } else if (e.key === 'Escape') {
      setEditingDay(null);
      setEditedMealName('');
    }
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dayDate: string) => {
    setDraggedDay(dayDate);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dayDate);
    setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.5'; }, 0);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedDay(null);
    setDragOverDay(null);
  };
  
  const handleDragOver = (e: React.DragEvent, dayDate: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dayDate !== draggedDay) setDragOverDay(dayDate);
  };
  
  const handleDragLeave = () => { setDragOverDay(null); };
  
  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const sourceDate = e.dataTransfer.getData('text/plain');
    
    if (sourceDate && sourceDate !== targetDate && currentPlan) {
      const sourceIndex = currentPlan.days.findIndex(d => d.date === sourceDate);
      const targetIndex = currentPlan.days.findIndex(d => d.date === targetDate);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newDays = [...currentPlan.days];
        const sourceDay = { ...newDays[sourceIndex] };
        const targetDay = { ...newDays[targetIndex] };
        
        newDays[sourceIndex] = { ...sourceDay, mealId: targetDay.mealId, type: targetDay.type, leftoverFromDate: targetDay.leftoverFromDate, customNote: targetDay.customNote };
        newDays[targetIndex] = { ...targetDay, mealId: sourceDay.mealId, type: sourceDay.type, leftoverFromDate: sourceDay.leftoverFromDate, customNote: sourceDay.customNote };
        
        let pickerNeededIdx: number | null = null;
        for (let i = 0; i < newDays.length; i++) {
          if (newDays[i].type !== 'leftovers') continue;
          let linked = false;
          for (let back = i - 1; back >= 0; back--) {
            const prev = newDays[back];
            if (prev.type === 'meal' && prev.mealId) {
              newDays[i] = { ...newDays[i], mealId: prev.mealId, leftoverFromDate: prev.date };
              linked = true;
              break;
            }
            if (prev.type === 'eating_out') continue;
            break;
          }
          if (!linked && pickerNeededIdx === null) pickerNeededIdx = i;
        }

        if (pickerNeededIdx !== null) {
          setLeftoverPicker({ dayDate: newDays[pickerNeededIdx].date, dayIndex: pickerNeededIdx, pendingDays: newDays });
          setDraggedDay(null);
          setDragOverDay(null);
          return;
        }
        
        setCurrentPlan({ ...currentPlan, days: newDays, modifiedAt: new Date().toISOString() });
      }
    }
    setDraggedDay(null);
    setDragOverDay(null);
  };

  const handlePickLeftoverMeal = (mealId: string) => {
    if (!leftoverPicker || !currentPlan) return;
    const { dayIndex, pendingDays } = leftoverPicker;
    const meal = getMeal(mealId);
    const newDays = [...pendingDays];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      mealId,
      leftoverFromDate: meal ? newDays.find(d => d.mealId === mealId && d.type === 'meal')?.date || null : null,
    };
    setCurrentPlan({ ...currentPlan, days: newDays, modifiedAt: new Date().toISOString() });
    setLeftoverPicker(null);
  };

  const getWeekMeals = (): Meal[] => {
    if (!currentPlan) return [];
    const seen = new Set<string>();
    const weekMeals: Meal[] = [];
    for (const day of currentPlan.days) {
      if (day.type === 'meal' && day.mealId && !seen.has(day.mealId)) {
        seen.add(day.mealId);
        const meal = getMeal(day.mealId);
        if (meal) weekMeals.push(meal);
      }
    }
    return weekMeals;
  };
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (currentPlan.days.length <= 7) return;
    const maxWeek = weekRows.length - 1;
    if (deltaX < 0 && currentWeekIndex < maxWeek) setCurrentWeekIndex(currentWeekIndex + 1);
    else if (deltaX > 0 && currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1);
  }, [currentWeekIndex, currentPlan]);

  const isMonthPlan = (currentPlan.duration === 'month');

  // Build full Sun-Sat week rows, with null for days not in the plan
  const weekRows = useMemo(() => {
    if (isMonthPlan || currentPlan.days.length === 0) return [];
    const firstDate = parseISO(currentPlan.days[0].date);
    const lastDate = parseISO(currentPlan.days[currentPlan.days.length - 1].date);
    const weekStart = startOfWeek(firstDate, { weekStartsOn: 0 });

    const dateMap = new Map<string, DayPlan>();
    for (const d of currentPlan.days) dateMap.set(d.date, d);

    const rows: (DayPlan | null)[][] = [];
    let cursor = weekStart;
    while (cursor <= lastDate) {
      const row: (DayPlan | null)[] = [];
      for (let i = 0; i < 7; i++) {
        const key = format(cursor, 'yyyy-MM-dd');
        row.push(dateMap.get(key) || null);
        cursor = addDays(cursor, 1);
      }
      rows.push(row);
    }
    return rows;
  }, [currentPlan.days, isMonthPlan]);

  const totalWeeks = isMonthPlan ? 1 : weekRows.length;
  const isMultiWeek = totalWeeks > 1;

  const getWeekRow = (weekIdx: number) => weekRows[weekIdx] || [];
  const currentRow = getWeekRow(currentWeekIndex);

  // Build a Map for quick date → DayPlan lookups in month view
  const daysByDate = useMemo(() => {
    const m = new Map<string, DayPlan>();
    for (const d of currentPlan.days) m.set(d.date, d);
    return m;
  }, [currentPlan.days]);

  // Monthly calendar grid: full month from 1st to last day, with padding
  const monthGridRows = useMemo(() => {
    if (!isMonthPlan || currentPlan.days.length === 0) return [];
    const firstPlanDate = parseISO(currentPlan.days[0].date);
    const monthStart = startOfMonth(firstPlanDate);
    const monthLast = endOfMonth(firstPlanDate);
    const startDow = getDay(monthStart); // 0=Sun

    const cells: (string | null)[] = [];
    // Pad for day-of-week alignment
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Fill every day of the month
    let cursor = monthStart;
    while (cursor <= monthLast) {
      cells.push(format(cursor, 'yyyy-MM-dd'));
      cursor = addDays(cursor, 1);
    }
    // Also include any plan days that spill into the next month
    const lastPlanDate = parseISO(currentPlan.days[currentPlan.days.length - 1].date);
    if (lastPlanDate > monthLast) {
      cursor = addDays(monthLast, 1);
      while (cursor <= lastPlanDate) {
        cells.push(format(cursor, 'yyyy-MM-dd'));
        cursor = addDays(cursor, 1);
      }
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [isMonthPlan, currentPlan.days]);

  const handleRegenerateWeek = (weekIdx: number) => {
    // Map display week index to plan day indices
    const row = getWeekRow(weekIdx);
    const planDays = row.filter((d): d is DayPlan => d !== null);
    if (planDays.length === 0) return;
    const firstDate = planDays[0].date;
    const lastDate = planDays[planDays.length - 1].date;
    const startIdx = currentPlan.days.findIndex(d => d.date === firstDate);
    const endIdx = currentPlan.days.findIndex(d => d.date === lastDate);
    if (startIdx < 0) return;

    // Use a custom regeneration range
    const sliceLen = endIdx - startIdx + 1;
    const available = [...meals];

    const adjacentIds = new Set<string>();
    for (const d of currentPlan.days.slice(Math.max(0, startIdx - 7), startIdx)) {
      if (d.type === 'meal' && d.mealId) adjacentIds.add(d.mealId);
    }
    for (const d of currentPlan.days.slice(endIdx + 1, Math.min(endIdx + 8, currentPlan.days.length))) {
      if (d.type === 'meal' && d.mealId) adjacentIds.add(d.mealId);
    }

    const eatingOutCount = planDays.filter(d => d.type === 'eating_out').length;
    const leftoverCount = planDays.filter(d => d.type === 'leftovers').length;
    const mealSlotsNeeded = sliceLen - eatingOutCount;

    let pool = available.filter(m => !adjacentIds.has(m.id));
    if (pool.length < mealSlotsNeeded) pool = available;
    const shuffleArr = <T,>(arr: T[]) => { const s = [...arr]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; };

    let deck = shuffleArr(pool);
    const selected: Meal[] = [];
    for (let i = 0; i < mealSlotsNeeded; i++) {
      if (deck.length === 0) deck = shuffleArr(pool);
      selected.push(deck.shift()!);
    }

    const getRandomIndices = (total: number, count: number) => {
      const indices: number[] = [];
      while (indices.length < Math.min(count, total)) {
        const r = Math.floor(Math.random() * total);
        if (!indices.includes(r)) indices.push(r);
      }
      return indices;
    };

    const eoIndices = getRandomIndices(sliceLen, eatingOutCount);
    const newDays: DayPlan[] = [];
    let mIdx = 0;
    for (let i = 0; i < sliceLen; i++) {
      const dateStr = currentPlan.days[startIdx + i].date;
      if (eoIndices.includes(i)) {
        newDays.push({ date: dateStr, mealId: null, type: 'eating_out', leftoverFromDate: null, customNote: '', locked: false });
      } else {
        const meal = selected[mIdx] || selected[0];
        mIdx++;
        newDays.push({ date: dateStr, mealId: meal?.id || null, type: 'meal', leftoverFromDate: null, customNote: '', locked: false });
      }
    }

    // Place leftovers
    const validLO: number[] = [];
    for (let i = 0; i < newDays.length; i++) {
      if (newDays[i].type === 'eating_out') continue;
      if (i > 0 && newDays[i - 1].type === 'eating_out') continue;
      if (newDays.slice(0, i).filter(d => d.type === 'meal').length >= 2) validLO.push(i);
    }
    for (const idx of shuffleArr(validLO).slice(0, Math.min(leftoverCount, validLO.length))) {
      const prev = newDays.slice(0, idx).filter(d => d.type === 'meal' && d.mealId);
      const src = prev[prev.length - 1];
      if (src) newDays[idx] = { ...newDays[idx], mealId: src.mealId, type: 'leftovers', leftoverFromDate: src.date };
    }

    const allDays = [...currentPlan.days];
    for (let i = 0; i < newDays.length; i++) allDays[startIdx + i] = newDays[i];
    setCurrentPlan({ ...currentPlan, days: allDays, modifiedAt: new Date().toISOString() });
  };

  const renderWeekGrid = (weekRow: (DayPlan | null)[], weekIdx: number) => {
    // Compute the date for each slot (Sun-Sat) using the first non-null day as anchor
    const anchorDay = weekRow.find(d => d !== null);
    const anchorDate = anchorDay ? parseISO(anchorDay.date) : new Date();
    const anchorIdx = weekRow.indexOf(anchorDay!);
    const slotDates = weekRow.map((_, i) => addDays(anchorDate, i - anchorIdx));

    // Filter to only plan days for mobile
    const mobileDays = weekRow.filter((d): d is DayPlan => d !== null);

    return (
    <div ref={!isMultiWeek || viewMode === 'paginated' ? swipeContainerRef : undefined} onTouchStart={!isMultiWeek || viewMode === 'paginated' ? handleTouchStart : undefined} onTouchEnd={!isMultiWeek || viewMode === 'paginated' ? handleTouchEnd : undefined}>
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-7 gap-2.5">
        {weekRow.map((day, slotIdx) => {
          const date = slotDates[slotIdx];
          const today = isToday(date);

          // Blank cell for days not in the plan
          if (!day) {
            return (
              <div
                key={format(date, 'yyyy-MM-dd')}
                className={`rounded-2xl border overflow-hidden flex flex-col shadow-md shadow-black/20 ${
                  today ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-forest-500/20'
                }`}
                style={{ backgroundColor: '#1e3a1e' }}
              >
                <div className={`py-2 text-center ${today ? 'bg-terracotta/15' : ''}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${today ? 'text-terracotta' : 'text-cream-500/40'}`}>
                    {format(date, 'EEEE')}
                  </div>
                  <div className={`text-xl font-serif font-bold leading-tight ${today ? 'text-terracotta' : 'text-cream-500/30'}`}>
                    {format(date, 'd')}
                  </div>
                </div>
                <div className="flex-1 min-h-[6rem]" />
              </div>
            );
          }

          const meal = day.mealId ? getMeal(day.mealId) : null;
          const isDragOver = dragOverDay === day.date;
          const isDragging = draggedDay === day.date;
          const isClickable = (day.type === 'meal' || day.type === 'leftovers') && meal;
          
          return (
            <div
              key={day.date}
              onDragOver={(e) => handleDragOver(e, day.date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.date)}
              className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 shadow-md shadow-black/20 ${
                today ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-forest-500/50'
              } ${isDragOver ? 'border-cobalt/60 scale-105 shadow-lg shadow-forest-900/50' : ''}`}
              style={{ backgroundColor: '#243424' }}
            >
              <div className={`py-2 text-center ${today ? 'bg-terracotta/15' : ''}`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${today ? 'text-terracotta' : 'text-cream-500'}`}>
                  {format(date, 'EEEE')}
                </div>
                <div className={`text-xl font-serif font-bold leading-tight ${today ? 'text-terracotta' : 'text-cream-100'}`}>
                  {format(date, 'd')}
                </div>
              </div>
              
              <div 
                draggable
                onDragStart={(e) => handleDragStart(e, day.date)}
                onDragEnd={handleDragEnd}
                onClick={() => { if (isClickable) handleViewMeal(meal!.id); }}
                className={`flex-1 flex flex-col cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''} ${isClickable ? 'hover:bg-forest-600/40' : ''}`}
              >
                {day.type === 'meal' && meal && (
                  <>
                    {meal.imageUrl ? (
                      <DesktopMealImage meal={meal} />
                    ) : (
                      <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: getPlaceholderStyle(meal.name).bg }}>
                        <span className="text-cream-300/30 text-4xl font-serif font-bold">{getPlaceholderStyle(meal.name).initials}</span>
                      </div>
                    )}
                    <div className="px-2.5 py-2 flex-1 flex flex-col justify-between">
                      {editingDay === day.date ? (
                        <input type="text" value={editedMealName} onChange={(e) => setEditedMealName(e.target.value)} onKeyDown={(e) => handleEditKeyDown(e, day)} onBlur={() => handleSaveEdit(day)} className="w-full text-xs font-semibold text-cream-100 bg-forest-800 border border-gold rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gold" autoFocus onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <p className="text-xs font-semibold text-cream-100 line-clamp-2 leading-snug cursor-text hover:text-gold transition-colors" onClick={(e) => { e.stopPropagation(); handleStartEdit(day.date, meal.name); }} title="Click to edit">{toTitleCase(meal.name)}</p>
                      )}
                    </div>
                  </>
                )}
                {day.type === 'leftovers' && meal && (
                  <>
                    <div className="aspect-[4/3] relative">
                      {meal.imageUrl ? (
                        <DesktopMealImage meal={meal} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: getPlaceholderStyle(meal.name).bg }}>
                          <span className="text-cream-300/30 text-4xl font-serif font-bold">{getPlaceholderStyle(meal.name).initials}</span>
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5 bg-forest-800/80 backdrop-blur-sm text-cream-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Leftovers</div>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-semibold text-cream-200 line-clamp-2 leading-snug">{toTitleCase(meal.name)}</p>
                    </div>
                  </>
                )}
                {day.type === 'eating_out' && (
                  <>
                    <div className="aspect-[4/3] flex items-center justify-center" style={{
                      backgroundImage: `
                        linear-gradient(0deg, rgba(62,100,62,0.45) 50%, transparent 50%),
                        linear-gradient(90deg, rgba(62,100,62,0.45) 50%, transparent 50%)
                      `,
                      backgroundSize: '16px 16px',
                      backgroundColor: '#1e3a1e'
                    }}>
                      <span className="text-3xl">🍽️</span>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-semibold text-cream-100 line-clamp-2 leading-snug">Eating out</p>
                    </div>
                  </>
                )}
                {!meal && day.type === 'meal' && (
                  <div className="flex-1 flex flex-col items-center justify-center py-4 px-2">
                    {editingDay === day.date ? (
                      <input type="text" value={editedMealName} onChange={(e) => setEditedMealName(e.target.value)} onKeyDown={(e) => handleEditKeyDown(e, day)} onBlur={() => handleSaveEdit(day)} placeholder="Meal name..." className="w-full text-xs font-semibold text-cream-100 bg-forest-800 border border-gold rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gold" autoFocus onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <p className="text-xs text-cream-500 cursor-text hover:text-cream-300 transition-colors" onClick={(e) => { e.stopPropagation(); handleStartEdit(day.date, ''); }} title="Click to add meal">+ Add meal</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile stacked list — only plan days, no blanks */}
      <div className="md:hidden space-y-2">
        {mobileDays.map((day) => {
          const date = parseISO(day.date);
          const meal = day.mealId ? getMeal(day.mealId) : null;
          const today = isToday(date);
          const isClickable = (day.type === 'meal' || day.type === 'leftovers') && meal;
          
          return (
            <div
              key={day.date}
              onClick={() => {
                if (isClickable) handleViewMeal(meal!.id);
              }}
              className={`bg-forest-700 rounded-xl border overflow-hidden transition-all duration-200 ${isClickable ? 'active:scale-[0.98]' : ''} ${
                today ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-forest-500/60'
              }`}
            >
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl flex-shrink-0 ${
                  today ? 'bg-terracotta/15 text-terracotta' : 'bg-forest-600 text-cream-100'
                }`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${today ? 'text-terracotta/70' : 'text-cream-400'}`}>
                    {format(date, 'EEE')}
                  </span>
                  <span className="text-xl font-serif font-bold leading-tight">{format(date, 'd')}</span>
                </div>

                {meal ? (
                  <MealThumbnail meal={meal} />
                ) : day.type === 'eating_out' ? (
                  <div className="w-14 h-14 rounded-xl bg-terracotta/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🍽️</span>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-forest-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-cream-500 text-lg">?</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {day.type === 'eating_out' && (
                    <p className="font-semibold text-cream-100">Eating out</p>
                  )}
                  {day.type === 'leftovers' && meal && (
                    <div>
                      <p className="font-semibold text-cream-100 truncate">{toTitleCase(meal.name)}</p>
                      <p className="text-xs text-cream-500">Leftovers</p>
                    </div>
                  )}
                  {day.type === 'meal' && meal && (
                    <div>
                      <p className="font-semibold text-cream-100 truncate">{toTitleCase(meal.name)}</p>
                      {meal.prepTime > 0 && <p className="text-xs text-cream-500">{meal.prepTime} min</p>}
                    </div>
                  )}
                  {!meal && day.type === 'meal' && (
                    <p
                      className="text-cream-500 cursor-text active:text-cream-300 rounded px-1 py-0.5"
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(day.date, ''); }}
                    >
                      Tap to add meal
                    </p>
                  )}
                  {editingDay === day.date && (
                    <input
                      type="text"
                      value={editedMealName}
                      onChange={(e) => setEditedMealName(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, day)}
                      onBlur={() => handleSaveEdit(day)}
                      placeholder="Enter meal name..."
                      className="w-full font-semibold text-cream-100 bg-forest-800 border border-gold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold mt-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>

                {isClickable ? (
                  <ChevronRight className="w-5 h-5 text-cream-500 flex-shrink-0" />
                ) : (
                  <div className="w-5 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  };

  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderMonthGrid = () => (
    <div>
      {/* Desktop month grid */}
      <div className="hidden md:block">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DOW_LABELS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-cream-500 py-1">
              {d}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {monthGridRows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1.5 mb-1.5">
            {row.map((dateStr, ci) => {
              if (!dateStr) return <div key={ci} />;
              const date = parseISO(dateStr);
              const day = daysByDate.get(dateStr);
              const today = isToday(date);

              // Day not in the plan (past days) — blank green cell
              if (!day) {
                return (
                  <div
                    key={dateStr}
                    className={`rounded-xl border overflow-hidden flex flex-col ${
                      today ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-forest-500/20'
                    }`}
                    style={{ backgroundColor: '#1e3a1e' }}
                  >
                    <div className={`text-right px-2 pt-1.5 pb-0.5 ${today ? 'bg-terracotta/15' : ''}`}>
                      <span className={`text-sm font-serif font-bold ${today ? 'text-terracotta' : 'text-cream-500/40'}`}>
                        {format(date, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-h-[3.5rem]" />
                  </div>
                );
              }

              const meal = day.mealId ? getMeal(day.mealId) : null;
              const isClickable = (day.type === 'meal' || day.type === 'leftovers') && meal;

              return (
                <div
                  key={dateStr}
                  onClick={() => { if (isClickable) handleViewMeal(meal!.id); }}
                  className={`rounded-xl border overflow-hidden flex flex-col transition-all duration-200 ${
                    isClickable ? 'cursor-pointer hover:bg-forest-600/40' : ''
                  } ${today ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-forest-500/40'}`}
                  style={{ backgroundColor: '#243424' }}
                >
                  {/* Date number */}
                  <div className={`text-right px-2 pt-1.5 pb-0.5 ${today ? 'bg-terracotta/15' : ''}`}>
                    <span className={`text-sm font-serif font-bold ${today ? 'text-terracotta' : 'text-cream-300'}`}>
                      {format(date, 'd')}
                    </span>
                  </div>
                  {/* Compact meal info */}
                  <div className="px-1.5 pb-1.5 flex-1 flex flex-col gap-1 min-h-[3.5rem]">
                    {day.type === 'meal' && meal && (
                      <>
                        {meal.imageUrl ? (
                          <img src={meal.imageUrl} alt="" className="w-full aspect-[3/2] object-cover rounded-md" />
                        ) : (
                          <div className="w-full aspect-[3/2] rounded-md flex items-center justify-center" style={{ backgroundColor: getPlaceholderStyle(meal.name).bg }}>
                            <span className="text-cream-300/30 text-lg font-serif font-bold">{getPlaceholderStyle(meal.name).initials}</span>
                          </div>
                        )}
                        <p className="text-[10px] font-semibold text-cream-100 line-clamp-2 leading-tight">{toTitleCase(meal.name)}</p>
                      </>
                    )}
                    {day.type === 'leftovers' && meal && (
                      <>
                        <div className="relative">
                          {meal.imageUrl ? (
                            <img src={meal.imageUrl} alt="" className="w-full aspect-[3/2] object-cover rounded-md" />
                          ) : (
                            <div className="w-full aspect-[3/2] rounded-md flex items-center justify-center" style={{ backgroundColor: getPlaceholderStyle(meal.name).bg }}>
                              <span className="text-cream-300/30 text-lg font-serif font-bold">{getPlaceholderStyle(meal.name).initials}</span>
                            </div>
                          )}
                          <div className="absolute top-0.5 left-0.5 bg-forest-800/80 text-cream-400 text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded">L</div>
                        </div>
                        <p className="text-[10px] font-semibold text-cream-200 line-clamp-2 leading-tight">{toTitleCase(meal.name)}</p>
                      </>
                    )}
                    {day.type === 'eating_out' && (
                      <>
                        <div className="w-full aspect-[3/2] rounded-md flex items-center justify-center" style={{
                          backgroundImage: `
                            linear-gradient(0deg, rgba(62,100,62,0.45) 50%, transparent 50%),
                            linear-gradient(90deg, rgba(62,100,62,0.45) 50%, transparent 50%)
                          `,
                          backgroundSize: '12px 12px',
                          backgroundColor: '#1e3a1e'
                        }}>
                          <span className="text-lg">🍽️</span>
                        </div>
                        <p className="text-[10px] font-semibold text-cream-100 leading-tight">Eating out</p>
                      </>
                    )}
                    {!meal && day.type === 'meal' && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] text-cream-500">—</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile month: stacked list grouped by week (only plan days) */}
      <div className="md:hidden space-y-6">
        {monthGridRows.map((row, ri) => {
          const weekDays = row.filter(Boolean).map(d => daysByDate.get(d!)).filter(Boolean) as DayPlan[];
          if (weekDays.length === 0) return null;
          const wStart = parseISO(weekDays[0].date);
          const wEnd = parseISO(weekDays[weekDays.length - 1].date);
          return (
            <div key={ri} className="space-y-2">
              <p className="text-xs font-semibold text-cream-400 uppercase tracking-wider">
                {format(wStart, 'MMM d')} &ndash; {format(wEnd, 'MMM d')}
              </p>
              {weekDays.map((day) => {
                const date = parseISO(day.date);
                const meal = day.mealId ? getMeal(day.mealId) : null;
                const today = isToday(date);
                const isClickable = (day.type === 'meal' || day.type === 'leftovers') && meal;
                return (
                  <div
                    key={day.date}
                    onClick={() => { if (isClickable) handleViewMeal(meal!.id); }}
                    className={`bg-forest-700 rounded-xl border overflow-hidden transition-all duration-200 ${isClickable ? 'active:scale-[0.98]' : ''} ${
                      today ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-forest-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${
                        today ? 'bg-terracotta/15 text-terracotta' : 'bg-forest-600 text-cream-100'
                      }`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${today ? 'text-terracotta/70' : 'text-cream-400'}`}>
                          {format(date, 'EEE')}
                        </span>
                        <span className="text-lg font-serif font-bold leading-tight">{format(date, 'd')}</span>
                      </div>
                      {meal ? (
                        <MealThumbnail meal={meal} size="sm" />
                      ) : day.type === 'eating_out' ? (
                        <div className="w-10 h-10 rounded-lg bg-terracotta/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-base">🍽️</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-forest-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-cream-500 text-sm">?</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {day.type === 'eating_out' && <p className="font-semibold text-cream-100 text-sm">Eating out</p>}
                        {day.type === 'leftovers' && meal && (
                          <div><p className="font-semibold text-cream-100 truncate text-sm">{toTitleCase(meal.name)}</p><p className="text-xs text-cream-500">Leftovers</p></div>
                        )}
                        {day.type === 'meal' && meal && (
                          <p className="font-semibold text-cream-100 truncate text-sm">{toTitleCase(meal.name)}</p>
                        )}
                        {!meal && day.type === 'meal' && <p className="text-cream-500 text-sm">No meal</p>}
                      </div>
                      {isClickable && <ChevronRight className="w-4 h-4 text-cream-500 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekHeader = (weekIdx: number) => {
    const row = getWeekRow(weekIdx);
    const planDays = row.filter((d): d is DayPlan => d !== null);
    if (planDays.length === 0) return null;
    const anchorDay = row.find(d => d !== null)!;
    const anchorIdx = row.indexOf(anchorDay);
    const startDate = addDays(parseISO(anchorDay.date), -anchorIdx);
    const endDate = addDays(startDate, 6);

    return (
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-semibold text-cream-100">
            Week {weekIdx + 1} of {totalWeeks}
          </h3>
          <p className="text-xs sm:text-sm text-cream-400">
            {format(startDate, 'MMM d')} &ndash; {format(endDate, 'MMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => handleRegenerateWeek(weekIdx)}
          className="flex items-center justify-center text-cream-400 hover:text-cream-100 bg-forest-700 hover:bg-forest-600 border border-forest-500/60 rounded-lg p-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center gap-3">
          <h2 className="text-4xl sm:text-5xl font-serif text-cream-100 truncate min-w-0">
            {isMonthPlan ? 'This month\'s menu' : 'This week\'s menu'}
          </h2>
          <Button
            onClick={() => {
              const plan = generateWeeklyPlan(meals, new Date(), {
                duration: currentPlan.duration || 'week',
                durationCount: currentPlan.durationCount || 1,
                eatingOutDays: currentPlan.days.filter(d => d.type === 'eating_out').length,
                leftoverDays: currentPlan.days.filter(d => d.type === 'leftovers').length,
                excludedMealIds: [],
                preferQuickMeals: false,
                useIngredientsFromFridge: false,
              });
              setCurrentPlan(plan);
            }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
        </div>
        <p className="text-sm sm:text-base text-cream-400 mt-0.5">
          {isMonthPlan
            ? format(parseISO(currentPlan.days[0].date), 'MMMM yyyy')
            : `Week of ${format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'MMM d, yyyy')}`}
        </p>
      </div>

      {/* View toggle + paginated nav (multi-week, non-month only) */}
      {isMultiWeek && !isMonthPlan && (
        <div className="space-y-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('stacked')}
              className={`p-1.5 rounded-lg border transition-colors ${
                viewMode === 'stacked'
                  ? 'bg-cobalt/20 border-cobalt/40 text-cobalt'
                  : 'bg-forest-700 border-forest-500/60 text-cream-400 hover:text-cream-100'
              }`}
              title="All weeks"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('paginated')}
              className={`p-1.5 rounded-lg border transition-colors ${
                viewMode === 'paginated'
                  ? 'bg-cobalt/20 border-cobalt/40 text-cobalt'
                  : 'bg-forest-700 border-forest-500/60 text-cream-400 hover:text-cream-100'
              }`}
              title="One at a time"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* Paginated week nav */}
          {viewMode === 'paginated' && (
            <div className="flex items-center justify-between bg-forest-700 rounded-xl p-3 sm:p-4 border border-forest-500/60">
              <button
                onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                disabled={currentWeekIndex === 0}
                className="p-2 text-cream-400 hover:text-cream-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg active:bg-forest-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-cream-100 text-sm sm:text-base">
                  Week {currentWeekIndex + 1} of {totalWeeks}
                </p>
                <p className="text-xs sm:text-sm text-cream-400">
                  {currentPlan.days[currentWeekIndex * 7] && 
                    format(parseISO(currentPlan.days[currentWeekIndex * 7].date), 'MMM d')} &ndash;{' '}
                  {currentPlan.days[Math.min((currentWeekIndex + 1) * 7 - 1, currentPlan.days.length - 1)] && 
                    format(parseISO(currentPlan.days[Math.min((currentWeekIndex + 1) * 7 - 1, currentPlan.days.length - 1)].date), 'MMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => setCurrentWeekIndex(Math.min(totalWeeks - 1, currentWeekIndex + 1))}
                disabled={currentWeekIndex >= totalWeeks - 1}
                className="p-2 text-cream-400 hover:text-cream-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg active:bg-forest-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      {isMonthPlan ? (
        renderMonthGrid()
      ) : isMultiWeek && viewMode === 'stacked' ? (
        <div className="space-y-8">
          {Array.from({ length: totalWeeks }, (_, weekIdx) => (
            <div key={weekIdx} className="space-y-3">
              {renderWeekHeader(weekIdx)}
              {renderWeekGrid(getWeekRow(weekIdx), weekIdx)}
            </div>
          ))}
        </div>
      ) : isMultiWeek && viewMode === 'paginated' ? (
        <div className="space-y-3">
          {renderWeekHeader(currentWeekIndex)}
          {renderWeekGrid(currentRow, currentWeekIndex)}
          <p className="md:hidden text-center text-xs text-cream-500">
            Swipe left/right to change weeks
          </p>
        </div>
      ) : (
        renderWeekGrid(currentRow, 0)
      )}

      {/* Leftover meal picker modal */}
      {leftoverPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-forest-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-5 pb-8 sm:pb-5 max-h-[80vh] flex flex-col border border-forest-500/60">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif font-semibold text-cream-100">Pick leftover meal</h3>

              <button
                onClick={() => {
                  if (currentPlan) {
                    setCurrentPlan({ ...currentPlan, days: leftoverPicker.pendingDays, modifiedAt: new Date().toISOString() });
                  }
                  setLeftoverPicker(null);
                }}
                className="p-2 rounded-full hover:bg-forest-600 active:bg-forest-500"
              >
                <X className="w-5 h-5 text-cream-400" />
              </button>
            </div>
            <p className="text-sm text-cream-400 mb-4">
              Which meal are you having leftovers of on{' '}
              <span className="font-medium text-cream-200">
                {format(parseISO(leftoverPicker.dayDate), 'EEEE')}
              </span>?
            </p>
            <div className="space-y-2 overflow-y-auto flex-1">
              {getWeekMeals().map(meal => (
                <button
                  key={meal.id}
                  onClick={() => handlePickLeftoverMeal(meal.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-forest-600 active:bg-forest-500 border border-forest-500/60 transition-colors text-left"
                >
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-cream-300/60 text-xs font-bold"
                      style={{ backgroundColor: `hsl(${meal.name.length * 40}, 30%, 22%)` }}
                    >
                      {meal.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-cream-100 truncate">{toTitleCase(meal.name)}</span>
                </button>
              ))}
              {getWeekMeals().length === 0 && (
                <p className="text-sm text-cream-500 text-center py-4">No meals planned this week</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
