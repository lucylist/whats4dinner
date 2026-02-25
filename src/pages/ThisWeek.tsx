import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfWeek } from 'date-fns';
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
          <h2 className="text-4xl sm:text-5xl font-serif text-cream-100 mb-2">No Calendar Yet</h2>
          <p className="text-cream-400 mb-6">
            Plan your week and we'll fill in the meals for you.
          </p>
          <Button onClick={() => navigate('/plan-week')}>
            Plan Your Week
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
    const maxWeek = Math.floor((currentPlan.days.length - 1) / 7);
    if (deltaX < 0 && currentWeekIndex < maxWeek) setCurrentWeekIndex(currentWeekIndex + 1);
    else if (deltaX > 0 && currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1);
  }, [currentWeekIndex, currentPlan]);

  const totalWeeks = Math.ceil(currentPlan.days.length / 7);
  const isMultiWeek = totalWeeks > 1;

  const getWeekDays = (weekIdx: number) =>
    currentPlan.days.slice(weekIdx * 7, (weekIdx + 1) * 7);

  const currentDays = getWeekDays(currentWeekIndex);

  const handleRegenerateWeek = (weekIdx: number) => {
    const updated = regenerateWeek(currentPlan, weekIdx, meals, {
      duration: currentPlan.duration || 'week',
      durationCount: currentPlan.durationCount || 1,
      eatingOutDays: currentPlan.days.filter(d => d.type === 'eating_out').length,
      leftoverDays: currentPlan.days.filter(d => d.type === 'leftovers').length,
      excludedMealIds: [],
      preferQuickMeals: false,
      useIngredientsFromFridge: false,
    });
    setCurrentPlan(updated);
  };

  const renderWeekGrid = (weekDays: DayPlan[], weekIdx: number) => (
    <div ref={!isMultiWeek || viewMode === 'paginated' ? swipeContainerRef : undefined} onTouchStart={!isMultiWeek || viewMode === 'paginated' ? handleTouchStart : undefined} onTouchEnd={!isMultiWeek || viewMode === 'paginated' ? handleTouchEnd : undefined}>
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-7 gap-2.5">
        {weekDays.map((day) => {
          const date = parseISO(day.date);
          const meal = day.mealId ? getMeal(day.mealId) : null;
          const today = isToday(date);
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

      {/* Mobile stacked list */}
      <div className="md:hidden space-y-2">
        {weekDays.map((day) => {
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

  const renderWeekHeader = (weekIdx: number) => {
    const weekDays = getWeekDays(weekIdx);
    if (weekDays.length === 0) return null;
    const startDate = parseISO(weekDays[0].date);
    const endDate = parseISO(weekDays[weekDays.length - 1].date);

    return (
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-semibold text-cream-100">
            Week {weekIdx + 1}
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
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-4xl sm:text-5xl font-serif text-cream-100 truncate">
            This Week's Menu
          </h2>
          <p className="text-sm sm:text-base text-cream-400 mt-0.5">
            Week of {format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'MMM d, yyyy')}
          </p>
        </div>
        
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

      {/* View toggle + paginated nav (multi-week only) */}
      {isMultiWeek && (
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

      {/* Calendar: stacked or paginated */}
      {isMultiWeek && viewMode === 'stacked' ? (
        <div className="space-y-8">
          {Array.from({ length: totalWeeks }, (_, weekIdx) => (
            <div key={weekIdx} className="space-y-3">
              {renderWeekHeader(weekIdx)}
              {renderWeekGrid(getWeekDays(weekIdx), weekIdx)}
            </div>
          ))}
        </div>
      ) : isMultiWeek && viewMode === 'paginated' ? (
        <div className="space-y-3">
          {renderWeekHeader(currentWeekIndex)}
          {renderWeekGrid(currentDays, currentWeekIndex)}
          <p className="md:hidden text-center text-xs text-cream-500">
            Swipe left/right to change weeks
          </p>
        </div>
      ) : (
        renderWeekGrid(currentDays, 0)
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
