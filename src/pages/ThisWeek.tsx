// This Week page - view current meal plan (week/month durations)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight, GripVertical, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { DayPlan, Meal } from '../types';
import { toTitleCase, generateId, extractTagsFromName } from '../utils/storage';
import { generateWeeklyPlan } from '../utils/planGenerator';

interface LeftoverPickerState {
  dayDate: string;
  dayIndex: number;
  pendingDays: DayPlan[];
}

export default function ThisWeek() {
  const { currentPlan, getMeal, setSelectedMealId, setCurrentPlan, meals, updateMeal, addMeal } = useApp();
  const navigate = useNavigate();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [draggedDay, setDraggedDay] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editedMealName, setEditedMealName] = useState('');
  const [leftoverPicker, setLeftoverPicker] = useState<LeftoverPickerState | null>(null);
  
  if (!currentPlan) {
    return (
      <div className="text-center py-12 space-y-6">
        <Calendar className="w-24 h-24 mx-auto text-gray-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Calendar Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't created a meal calendar yet. Start planning your meals!
          </p>
          <Button onClick={() => navigate('/plan-week')}>
            Create Calendar
          </Button>
        </div>
      </div>
    );
  }
  
  const handleViewMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    navigate('/meal-detail');
  };
  
  // Start editing a meal name
  const handleStartEdit = (dayDate: string, currentMealName: string) => {
    setEditingDay(dayDate);
    setEditedMealName(currentMealName);
  };
  
  // Save the edited meal name
  const handleSaveEdit = (day: DayPlan) => {
    if (!editedMealName.trim()) {
      setEditingDay(null);
      return;
    }
    
    const newName = toTitleCase(editedMealName.trim());
    
    // Check if this meal already exists in our library
    const existingMeal = meals.find(m => m.name.toLowerCase() === newName.toLowerCase());
    
    if (existingMeal) {
      // Use the existing meal
      if (currentPlan) {
        const updatedDays = currentPlan.days.map(d => 
          d.date === day.date ? { ...d, mealId: existingMeal.id, type: 'meal' as const } : d
        );
        setCurrentPlan({ ...currentPlan, days: updatedDays });
      }
    } else {
      // Create a new meal
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
      
      // Update the plan to use the new meal
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
  
  // Handle key press in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent, day: DayPlan) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(day);
    } else if (e.key === 'Escape') {
      setEditingDay(null);
      setEditedMealName('');
    }
  };
  
  const getDayTitle = (day: typeof currentPlan.days[0]) => {
    if (day.type === 'eating_out') return 'Eating out/take out';
    if (day.type === 'leftovers') return 'Leftovers';
    const meal = day.mealId ? getMeal(day.mealId) : null;
    return meal?.name || 'No meal planned';
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // Get placeholder style for meals without images
  const getPlaceholderStyle = (mealName: string) => {
    const gradients = [
      'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
      'linear-gradient(135deg, #4ade80 0%, #059669 100%)',
      'linear-gradient(135deg, #60a5fa 0%, #4f46e5 100%)',
      'linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #f472b6 0%, #e11d48 100%)',
    ];
    const seed = mealName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[seed % gradients.length];
    const initials = mealName.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
    return { gradient, initials };
  };
  
  // Thumbnail component for meals - with error handling for expired URLs
  const MealThumbnail = ({ meal }: { meal: { name: string; imageUrl?: string } }) => {
    const [hasError, setHasError] = React.useState(false);
    const placeholder = getPlaceholderStyle(meal.name);
    
    // Reset error state when meal changes
    React.useEffect(() => {
      setHasError(false);
    }, [meal.imageUrl]);
    
    if (meal.imageUrl && !hasError) {
      return (
        <img
          src={meal.imageUrl}
          alt={meal.name}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
          onError={() => setHasError(true)}
        />
      );
    }
    
    return (
      <div 
        className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: placeholder.gradient }}
      >
        <span className="text-white text-xs font-bold">{placeholder.initials}</span>
      </div>
    );
  };
  
  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dayDate: string) => {
    setDraggedDay(dayDate);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dayDate);
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedDay(null);
    setDragOverDay(null);
  };
  
  const handleDragOver = (e: React.DragEvent, dayDate: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dayDate !== draggedDay) {
      setDragOverDay(dayDate);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverDay(null);
  };
  
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
        
        newDays[sourceIndex] = {
          ...sourceDay,
          mealId: targetDay.mealId,
          type: targetDay.type,
          leftoverFromDate: targetDay.leftoverFromDate,
          customNote: targetDay.customNote,
        };
        newDays[targetIndex] = {
          ...targetDay,
          mealId: sourceDay.mealId,
          type: sourceDay.type,
          leftoverFromDate: sourceDay.leftoverFromDate,
          customNote: sourceDay.customNote,
        };
        
        // Relink leftover days after the swap
        let pickerNeededIdx: number | null = null;
        for (let i = 0; i < newDays.length; i++) {
          if (newDays[i].type !== 'leftovers') continue;

          // Walk backwards to find the nearest meal, skipping eating out days
          let linked = false;
          for (let back = i - 1; back >= 0; back--) {
            const prev = newDays[back];
            if (prev.type === 'meal' && prev.mealId) {
              newDays[i] = { ...newDays[i], mealId: prev.mealId, leftoverFromDate: prev.date };
              linked = true;
              break;
            }
            if (prev.type === 'eating_out') continue; // skip and keep looking
            break; // anything else (skip, empty, another leftover), stop scanning
          }

          if (!linked && pickerNeededIdx === null) {
            pickerNeededIdx = i;
          }
        }

        if (pickerNeededIdx !== null) {
          setLeftoverPicker({ dayDate: newDays[pickerNeededIdx].date, dayIndex: pickerNeededIdx, pendingDays: newDays });
          setDraggedDay(null);
          setDragOverDay(null);
          return;
        }
        
        setCurrentPlan({
          ...currentPlan,
          days: newDays,
          modifiedAt: new Date().toISOString(),
        });
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
    setCurrentPlan({
      ...currentPlan,
      days: newDays,
      modifiedAt: new Date().toISOString(),
    });
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
  
  return (
    <div className="pt-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentPlan.duration === 'month' 
              ? `${currentPlan.durationCount} Month${currentPlan.durationCount > 1 ? 's' : ''} Calendar`
              : currentPlan.durationCount === 1
                ? "This week's calendar"
                : `${currentPlan.durationCount} Weeks Calendar`
            }
          </h2>
          <p className="text-gray-600 mt-1">
            {currentPlan.duration === 'month' 
              ? `${format(new Date(), 'MMMM yyyy')} - ${currentPlan.days.length} days`
              : `Week of ${format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'MMMM d, yyyy')}`
            }
          </p>
        </div>
        
        <Button
          variant="secondary"
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
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </Button>
      </div>
      
      {/* Week Navigation for long plans */}
      {currentPlan.days.length > 7 && (
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
          <button
            onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
            disabled={currentWeekIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Week
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              Week {currentWeekIndex + 1} of {Math.ceil(currentPlan.days.length / 7)}
            </p>
            <p className="text-sm text-gray-500">
              {currentPlan.days[currentWeekIndex * 7] && 
                format(parseISO(currentPlan.days[currentWeekIndex * 7].date), 'MMM d')} - {' '}
              {currentPlan.days[Math.min((currentWeekIndex + 1) * 7 - 1, currentPlan.days.length - 1)] && 
                format(parseISO(currentPlan.days[Math.min((currentWeekIndex + 1) * 7 - 1, currentPlan.days.length - 1)].date), 'MMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => setCurrentWeekIndex(Math.min(Math.floor((currentPlan.days.length - 1) / 7), currentWeekIndex + 1))}
            disabled={currentWeekIndex >= Math.floor((currentPlan.days.length - 1) / 7)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next Week
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Horizontal Week View */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="grid grid-cols-7 gap-3 min-w-[900px]">
          {currentPlan.days
            .slice(currentWeekIndex * 7, (currentWeekIndex + 1) * 7)
            .map((day) => {
            const date = parseISO(day.date);
            const meal = day.mealId ? getMeal(day.mealId) : null;
            const today = isToday(date);
            
            const isDragOver = dragOverDay === day.date;
            const isDragging = draggedDay === day.date;
            
            return (
              <div
                key={day.date}
                onDragOver={(e) => handleDragOver(e, day.date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day.date)}
                className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden flex flex-col transition-all duration-200 ${
                  today ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'
                } ${isDragOver ? 'border-primary-400 bg-primary-50 scale-105 shadow-lg' : ''}`}
              >
                {/* Day Header - Static, not draggable */}
                <div className={`p-3 text-center ${today ? 'bg-primary-500 text-white' : 'bg-gray-50'}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-primary-100' : 'text-gray-500'}`}>
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${today ? 'text-white' : 'text-gray-900'}`}>
                    {format(date, 'd')}
                  </div>
                </div>
                
                {/* Meal Content - This is the draggable part */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, day.date)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 flex-1 flex flex-col cursor-grab active:cursor-grabbing relative ${isDragging ? 'opacity-50 bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-1 right-1 text-gray-300">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  {/* Meal Name with Thumbnail */}
                  <div className="flex-1">
                    {day.type === 'eating_out' && (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🍽️</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">Eating out/take out</p>
                      </div>
                    )}
                    
                    {day.type === 'leftovers' && meal && (
                      <div className="flex items-center gap-2">
                        <MealThumbnail meal={meal} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900">Leftovers</p>
                        </div>
                      </div>
                    )}
                    
                    {day.type === 'meal' && meal && (
                      <div className="flex items-center gap-2">
                        <MealThumbnail meal={meal} />
                        <div className="min-w-0 flex-1">
                          {editingDay === day.date ? (
                            <input
                              type="text"
                              value={editedMealName}
                              onChange={(e) => setEditedMealName(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, day)}
                              onBlur={() => handleSaveEdit(day)}
                              className="w-full font-semibold text-sm text-gray-900 border border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <p 
                              className="font-semibold text-sm text-gray-900 line-clamp-2 cursor-text hover:bg-gray-100 px-1 py-0.5 rounded -mx-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(day.date, meal.name);
                              }}
                              title="Click to edit"
                            >
                              {toTitleCase(meal.name)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!meal && day.type === 'meal' && (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-400 text-lg">?</span>
                        </div>
                        {editingDay === day.date ? (
                          <input
                            type="text"
                            value={editedMealName}
                            onChange={(e) => setEditedMealName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, day)}
                            onBlur={() => handleSaveEdit(day)}
                            placeholder="Enter meal name..."
                            className="flex-1 font-semibold text-sm text-gray-900 border border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p 
                            className="text-sm text-gray-400 cursor-text hover:bg-gray-100 px-1 py-0.5 rounded -mx-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(day.date, '');
                            }}
                            title="Click to add meal"
                          >
                            No meal - click to add
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* View Button for meals */}
                  {day.type === 'meal' && meal && (
                    <button
                      onClick={() => handleViewMeal(meal.id)}
                      className="mt-2 w-full py-1.5 px-2 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    >
                      View →
                    </button>
                  )}
                  
                  {/* Leftover meal name */}
                  {day.type === 'leftovers' && meal && (
                    <p className="mt-2 w-full py-1.5 px-2 text-xs text-gray-500 text-center truncate">
                      {toTitleCase(meal.name)}
                    </p>
                  )}
                  
                  {/* Custom Note */}
                  {day.customNote && (
                    <div className="mt-2 p-1.5 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800 line-clamp-2">{day.customNote}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leftover meal picker modal */}
      {leftoverPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pick leftover meal</h3>
              <button
                onClick={() => {
                  // Cancel: just save without relinking
                  if (currentPlan) {
                    setCurrentPlan({
                      ...currentPlan,
                      days: leftoverPicker.pendingDays,
                      modifiedAt: new Date().toISOString(),
                    });
                  }
                  setLeftoverPicker(null);
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Which meal are you having leftovers of on{' '}
              <span className="font-medium text-gray-700">
                {format(parseISO(leftoverPicker.dayDate), 'EEEE')}
              </span>?
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getWeekMeals().map(meal => {
                const hasError = !meal.imageUrl;
                return (
                  <button
                    key={meal.id}
                    onClick={() => handlePickLeftoverMeal(meal.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors text-left"
                  >
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ backgroundColor: `hsl(${meal.name.length * 40}, 60%, 55%)` }}
                      >
                        {meal.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-800 truncate">{toTitleCase(meal.name)}</span>
                  </button>
                );
              })}
              {getWeekMeals().length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No meals planned this week</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
