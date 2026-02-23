// Edit Plan page - customize meal plan (week/month durations)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Lock, Unlock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { updateDayPlan } from '../utils/planGenerator';
import { DayType } from '../types';
import Button from '../components/Button';
import { toTitleCase } from '../utils/storage';

export default function EditPlan() {
  const { currentPlan, updateCurrentPlan, meals, getMeal } = useApp();
  const navigate = useNavigate();
  const [editedPlan, setEditedPlan] = useState(currentPlan);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  
  if (!editedPlan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No calendar to edit.</p>
        <Button onClick={() => navigate('/plan-week')} className="mt-4">
          Create a Calendar
        </Button>
      </div>
    );
  }
  
  const handleSave = () => {
    if (editedPlan) {
      updateCurrentPlan(editedPlan);
      navigate('/this-week');
    }
  };
  
  const handleToggleLock = (dayIndex: number) => {
    if (!editedPlan) return;
    const day = editedPlan.days[dayIndex];
    const updatedPlan = updateDayPlan(editedPlan, dayIndex, {
      locked: !day.locked
    });
    setEditedPlan(updatedPlan);
  };
  
  const handleChangeMeal = (dayIndex: number, mealId: string | null) => {
    if (!editedPlan) return;
    const updatedPlan = updateDayPlan(editedPlan, dayIndex, {
      mealId,
      type: 'meal' as DayType
    });
    setEditedPlan(updatedPlan);
  };
  
  const handleChangeType = (dayIndex: number, type: DayType) => {
    if (!editedPlan) return;
    let updates: any = { type };
    
    if (type === 'eating_out') {
      updates.mealId = null;
      updates.leftoverFromDate = null;
    } else if (type === 'leftovers') {
      // Find the most recent meal day for leftovers
      const previousMeals = editedPlan.days
        .slice(0, dayIndex)
        .filter(d => d.type === 'meal' && d.mealId);
      
      if (previousMeals.length > 0) {
        const lastMeal = previousMeals[previousMeals.length - 1];
        updates.mealId = lastMeal.mealId;
        updates.leftoverFromDate = lastMeal.date;
      }
    }
    
    const updatedPlan = updateDayPlan(editedPlan, dayIndex, updates);
    setEditedPlan(updatedPlan);
  };
  
  const handleRemoveMeal = (dayIndex: number) => {
    if (!editedPlan) return;
    const updatedPlan = updateDayPlan(editedPlan, dayIndex, {
      mealId: null,
      type: 'eating_out' as DayType
    });
    setEditedPlan(updatedPlan);
  };
  
  return (
    <div className="max-w-3xl mx-auto pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/this-week')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Cancel
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            Edit {editedPlan.duration === 'month' 
              ? `${editedPlan.durationCount} Month${editedPlan.durationCount > 1 ? 's' : ''}`
              : editedPlan.durationCount === 1
                ? 'Weekly'
                : `${editedPlan.durationCount} Weeks`
            } Calendar
          </h2>
        </div>
        
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
      
      {/* Week Navigation for long plans */}
      {editedPlan.days.length > 7 && (
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
              Week {currentWeekIndex + 1} of {Math.ceil(editedPlan.days.length / 7)}
            </p>
            <p className="text-sm text-gray-500">
              {editedPlan.days[currentWeekIndex * 7] && 
                format(parseISO(editedPlan.days[currentWeekIndex * 7].date), 'MMM d')} - {' '}
              {editedPlan.days[Math.min((currentWeekIndex + 1) * 7 - 1, editedPlan.days.length - 1)] && 
                format(parseISO(editedPlan.days[Math.min((currentWeekIndex + 1) * 7 - 1, editedPlan.days.length - 1)].date), 'MMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => setCurrentWeekIndex(Math.min(Math.floor((editedPlan.days.length - 1) / 7), currentWeekIndex + 1))}
            disabled={currentWeekIndex >= Math.floor((editedPlan.days.length - 1) / 7)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next Week
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Days */}
      <div className="space-y-4">
        {editedPlan.days
          .slice(currentWeekIndex * 7, (currentWeekIndex + 1) * 7)
          .map((day, index) => {
          // Adjust index for actual day position in full plan
          const actualIndex = currentWeekIndex * 7 + index;
          const date = parseISO(day.date);
          const meal = day.mealId ? getMeal(day.mealId) : null;
          
          return (
            <div
              key={day.date}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  {format(date, 'EEEE, MMM d')}
                </h3>
                <button
                  onClick={() => handleToggleLock(actualIndex)}
                  className={`p-2 rounded ${
                    day.locked
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={day.locked ? 'Unlock day' : 'Lock day'}
                >
                  {day.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Type selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleChangeType(actualIndex, 'meal')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    day.type === 'meal'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🍴 Meal
                </button>
                <button
                  onClick={() => handleChangeType(actualIndex, 'eating_out')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    day.type === 'eating_out'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🍽️ Eating out/take out
                </button>
                <button
                  onClick={() => handleChangeType(actualIndex, 'leftovers')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    day.type === 'leftovers'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={actualIndex === 0}
                  title={actualIndex === 0 ? 'Cannot have leftovers on first day' : ''}
                >
                  Leftovers
                </button>
              </div>
              
              {/* Meal selector */}
              {day.type === 'meal' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Meal
                  </label>
                  <select
                    value={day.mealId || ''}
                    onChange={(e) => handleChangeMeal(actualIndex, e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Select a meal --</option>
                    {meals.map(m => (
                      <option key={m.id} value={m.id}>
                        {toTitleCase(m.name)} {m.prepTime > 0 ? `(${m.prepTime} min)` : ''}
                      </option>
                    ))}
                  </select>
                  
                  {meal && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{toTitleCase(meal.name)}</p>
                      {meal.description && (
                        <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {day.type === 'eating_out' && (
                <div className="text-gray-600 text-center py-4">
                  <p className="text-lg">🍽️ Eating out/take out</p>
                  <p className="text-sm">Enjoy your meal!</p>
                </div>
              )}
              
              {day.type === 'leftovers' && meal && (
                <div className="text-gray-600">
                  <p className="text-sm mb-2">
                    Leftovers from {day.leftoverFromDate ? 
                      format(parseISO(day.leftoverFromDate), 'EEEE') : 'earlier'}
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{toTitleCase(meal.name)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Save button at bottom */}
      <div className="flex gap-3 sticky bottom-4">
        <Button fullWidth onClick={handleSave} size="lg">
          <Save className="w-5 h-5 mr-2" />
          Save Changes
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate('/this-week')} size="lg">
          Cancel
        </Button>
      </div>
    </div>
  );
}
