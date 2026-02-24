import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Minus, Plus, ChefHat, UtensilsCrossed, Cookie } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateWeeklyPlan } from '../utils/planGenerator';
import { PlannerPreferences } from '../types';
import Button from '../components/Button';

export default function PlanWeek() {
  const { meals, setCurrentPlan } = useApp();
  const navigate = useNavigate();
  
  const [eatingOut, setEatingOut] = useState(1);
  const [leftovers, setLeftovers] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalDays = 7;
  const cookingDays = Math.max(0, totalDays - eatingOut - leftovers);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handleEatingOutChange = (delta: number) => {
    const next = clamp(eatingOut + delta, 0, totalDays - leftovers);
    setEatingOut(next);
  };

  const handleLeftoversChange = (delta: number) => {
    const next = clamp(leftovers + delta, 0, totalDays - eatingOut);
    setLeftovers(next);
  };

  const handleGenerate = () => {
    if (meals.length === 0) {
      alert('Add some meals to your library first!');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const preferences: PlannerPreferences = {
        duration: 'week',
        durationCount: 1,
        eatingOutDays: eatingOut,
        leftoverDays: leftovers,
        excludedMealIds: [],
        preferQuickMeals: false,
        useIngredientsFromFridge: false,
      };
      const plan = generateWeeklyPlan(meals, new Date(), preferences);
      setCurrentPlan(plan);
      setIsGenerating(false);
      navigate('/calendar');
    }, 400);
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const buildWeekPreview = () => {
    const days: ('cook' | 'out' | 'leftover')[] = [];
    for (let i = 0; i < totalDays; i++) {
      if (i < cookingDays) days.push('cook');
      else if (i < cookingDays + leftovers) days.push('leftover');
      else days.push('out');
    }
    return days;
  };

  const weekPreview = buildWeekPreview();

  return (
    <div className="max-w-lg mx-auto pt-4 sm:pt-6 space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/calendar')}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg active:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Plan your week</h2>
      </div>

      {/* Meal library count */}
      {meals.length > 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ChefHat className="w-4 h-4" />
          <span>{meals.length} meals in your library</span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium">
            Add some meals to your library first, then come back to plan your week.
          </p>
          <button
            onClick={() => navigate('/meals')}
            className="mt-2 text-sm font-semibold text-amber-700 underline"
          >
            Go to Meals →
          </button>
        </div>
      )}
      
      {/* Visual week preview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Your week at a glance</h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
          {weekPreview.map((type, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-400">{dayLabels[i]}</span>
              <div className={`w-full aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                type === 'cook'
                  ? 'bg-primary-100 text-primary-600'
                  : type === 'leftover'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {type === 'cook' && <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />}
                {type === 'leftover' && <Cookie className="w-5 h-5 sm:w-6 sm:h-6" />}
                {type === 'out' && <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-gray-600 font-medium">{cookingDays} cooking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-gray-600 font-medium">{leftovers} leftovers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-gray-600 font-medium">{eatingOut} eating out</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Eating out stepper */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Eating out</p>
            <p className="text-sm text-gray-500">Nights you won't cook</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEatingOutChange(-1)}
              disabled={eatingOut <= 0}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-gray-900 w-8 text-center tabular-nums">{eatingOut}</span>
            <button
              onClick={() => handleEatingOutChange(1)}
              disabled={eatingOut >= totalDays - leftovers}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leftovers stepper */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Leftovers</p>
            <p className="text-sm text-gray-500">Nights you'll reheat</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLeftoversChange(-1)}
              disabled={leftovers <= 0}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-gray-900 w-8 text-center tabular-nums">{leftovers}</span>
            <button
              onClick={() => handleLeftoversChange(1)}
              disabled={leftovers >= totalDays - eatingOut}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="pb-8">
        <Button
          fullWidth
          onClick={handleGenerate}
          disabled={isGenerating || meals.length === 0 || cookingDays < 1}
          className="flex items-center justify-center gap-2 text-lg py-4 rounded-2xl"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'Generating...' : 'Generate my week'}
        </Button>
        {cookingDays < 1 && meals.length > 0 && (
          <p className="text-sm text-amber-600 text-center mt-2">
            You need at least 1 cooking day
          </p>
        )}
      </div>
    </div>
  );
}
