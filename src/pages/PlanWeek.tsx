import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Minus, Plus, ChefHat, UtensilsCrossed, Cookie, ChevronDown, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateWeeklyPlan } from '../utils/planGenerator';
import { PlannerPreferences, PlanDuration } from '../types';
import { clearSavedRoom } from '../utils/room';
import Button from '../components/Button';

export default function PlanWeek() {
  const { meals, setCurrentPlan, roomId } = useApp();
  const navigate = useNavigate();
  
  const [durationCount, setDurationCount] = useState(1);
  const [durationType, setDurationType] = useState<PlanDuration>('week');
  const [eatingOutPerWeek, setEatingOutPerWeek] = useState(1);
  const [leftoversPerWeek, setLeftoversPerWeek] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalWeeks = durationType === 'month' ? durationCount * 4 : durationCount;
  const maxCount = durationType === 'week' ? 4 : 3;
  const totalDays = totalWeeks * 7;
  const eatingOut = eatingOutPerWeek * totalWeeks;
  const leftoversTotal = leftoversPerWeek * totalWeeks;
  const cookingPerWeek = 7 - eatingOutPerWeek - leftoversPerWeek;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handleDurationCountChange = (delta: number) => {
    setDurationCount(clamp(durationCount + delta, 1, maxCount));
  };

  const handleEatingOutChange = (delta: number) => {
    setEatingOutPerWeek(clamp(eatingOutPerWeek + delta, 0, 7 - leftoversPerWeek));
  };

  const handleLeftoversChange = (delta: number) => {
    setLeftoversPerWeek(clamp(leftoversPerWeek + delta, 0, 7 - eatingOutPerWeek));
  };

  const handleDurationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as PlanDuration;
    setDurationType(newType);
    const newMax = newType === 'week' ? 4 : 3;
    if (durationCount > newMax) setDurationCount(newMax);
  };

  const handleGenerate = () => {
    if (meals.length === 0) {
      alert('Add some meals to your library first!');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const preferences: PlannerPreferences = {
        duration: durationType,
        durationCount,
        eatingOutDays: eatingOut,
        leftoverDays: leftoversTotal,
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
    for (let i = 0; i < 7; i++) {
      if (i < cookingPerWeek) days.push('cook');
      else if (i < cookingPerWeek + leftoversPerWeek) days.push('leftover');
      else days.push('out');
    }
    return days;
  };

  const weekPreview = buildWeekPreview();

  const durationLabel = durationType === 'week'
    ? `${durationCount} week${durationCount > 1 ? 's' : ''}`
    : `${durationCount} month${durationCount > 1 ? 's' : ''}`;

  const stepperBtnClass = "w-10 h-10 rounded-full border-2 border-forest-300 flex items-center justify-center text-cream-200 hover:border-cream-300 active:bg-forest-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="max-w-lg mx-auto pt-4 sm:pt-6 space-y-5 px-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/calendar')}
          className="p-2 -ml-2 text-cream-300 hover:text-cream-100 rounded-lg active:bg-forest-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-4xl sm:text-5xl font-serif text-cream-100">Preferences</h2>
      </div>

      {/* Meal library count */}
      {meals.length > 0 ? (
        <div className="flex items-center gap-2 text-sm text-cream-300">
          <ChefHat className="w-4 h-4 text-terracotta" />
          <span>{meals.length} recipes in your library</span>
        </div>
      ) : (
        <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-4">
          <p className="text-sm text-cream-200 font-medium">
            Add some meals to your library first, then come back to plan.
          </p>
          <button
            onClick={() => navigate('/meals')}
            className="mt-2 text-sm font-semibold text-cobalt underline"
          >
            Go to Meals →
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {/* Duration stepper */}
        <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-cream-100">Plan duration</p>
            <div className="relative mt-1">
              <select
                value={durationType}
                onChange={handleDurationTypeChange}
                className="appearance-none bg-forest-600 text-cream-200 text-sm font-medium pl-3 pr-9 py-1 rounded-lg border border-forest-300 focus:ring-2 focus:ring-gold focus:border-gold cursor-pointer"
              >
                <option value="week">Weeks</option>
                <option value="month">Months</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cream-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDurationCountChange(-1)}
              disabled={durationCount <= 1}
              className={stepperBtnClass}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-cream-100 w-8 text-center tabular-nums">{durationCount}</span>
            <button
              onClick={() => handleDurationCountChange(1)}
              disabled={durationCount >= maxCount}
              className={stepperBtnClass}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Eating out stepper */}
        <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-cream-100">Eating out</p>
            <p className="text-sm text-cream-300">Per week</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEatingOutChange(-1)}
              disabled={eatingOutPerWeek <= 0}
              className={stepperBtnClass}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-cream-100 w-8 text-center tabular-nums">{eatingOutPerWeek}</span>
            <button
              onClick={() => handleEatingOutChange(1)}
              disabled={eatingOutPerWeek >= 7 - leftoversPerWeek}
              className={stepperBtnClass}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leftovers stepper */}
        <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-cream-100">Leftovers</p>
            <p className="text-sm text-cream-300">Per week</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLeftoversChange(-1)}
              disabled={leftoversPerWeek <= 0}
              className={stepperBtnClass}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-cream-100 w-8 text-center tabular-nums">{leftoversPerWeek}</span>
            <button
              onClick={() => handleLeftoversChange(1)}
              disabled={leftoversPerWeek >= 7 - eatingOutPerWeek}
              className={stepperBtnClass}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual week preview */}
      <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-cream-300 uppercase tracking-wider mb-4">
          {totalWeeks === 1 ? 'Your week at a glance' : 'Each week looks like'}
        </h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-5">
          {weekPreview.map((type, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-semibold text-cream-300">{dayLabels[i]}</span>
              <div className={`w-full aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                type === 'cook'
                  ? 'bg-forest-300/20 text-forest-100'
                  : type === 'leftover'
                  ? 'bg-terracotta/15 text-terracotta'
                  : 'bg-forest-600 text-cream-300'
              }`}>
                {type === 'cook' && <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />}
                {type === 'leftover' && <Cookie className="w-5 h-5 sm:w-6 sm:h-6" />}
                {type === 'out' && <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-forest-200" />
            <span className="text-cream-300 font-medium">{cookingPerWeek} cooking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-terracotta" />
            <span className="text-cream-300 font-medium">{leftoversPerWeek} leftovers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-forest-400" />
            <span className="text-cream-300 font-medium">{eatingOutPerWeek} eating out</span>
          </div>
        </div>

        {totalWeeks > 1 && (
          <p className="text-xs text-cream-300 mt-3 text-center">
            {totalDays} days total &middot; pattern repeats each week
          </p>
        )}
      </div>

      {/* Generate button */}
      <div className="pb-4">
        <Button
          fullWidth
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || meals.length === 0 || cookingPerWeek < 1}
          className="flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'Generating...' : `Generate my ${durationLabel}`}
        </Button>
        {cookingPerWeek < 1 && meals.length > 0 && (
          <p className="text-sm text-terracotta text-center mt-2">
            You need at least 1 cooking day per week
          </p>
        )}
      </div>

      {/* Family code & leave */}
      {roomId && (
        <div className="border-t border-forest-500/40 pt-5 pb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-cream-500 uppercase tracking-wider">Family code</p>
              <p className="text-sm text-cream-300 font-mono tracking-wider">{roomId}</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Leave this family? You can rejoin later with the same code.')) {
                  clearSavedRoom();
                  const url = new URL(window.location.href);
                  url.searchParams.delete('family');
                  url.hash = '';
                  window.location.href = url.toString();
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-cream-400 hover:text-terracotta hover:bg-terracotta/10 border border-forest-500/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave family</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
