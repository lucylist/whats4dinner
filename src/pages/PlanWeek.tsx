import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Minus, Plus, ChefHat, UtensilsCrossed, Cookie } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateWeeklyPlan } from '../utils/planGenerator';
import { PlannerPreferences, PlanDuration } from '../types';
import Button from '../components/Button';

type DurationOption = { label: string; duration: PlanDuration; count: number; weeks: number };

const DURATION_OPTIONS: DurationOption[] = [
  { label: '1 Week', duration: 'week', count: 1, weeks: 1 },
  { label: '2 Weeks', duration: 'week', count: 2, weeks: 2 },
  { label: '1 Month', duration: 'month', count: 1, weeks: 4 },
];

export default function PlanWeek() {
  const { meals, setCurrentPlan } = useApp();
  const navigate = useNavigate();
  
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [eatingOutPerWeek, setEatingOutPerWeek] = useState(1);
  const [leftoversPerWeek, setLeftoversPerWeek] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const durationOpt = DURATION_OPTIONS[selectedDuration];
  const totalWeeks = durationOpt.weeks;
  const totalDays = totalWeeks * 7;
  const eatingOut = eatingOutPerWeek * totalWeeks;
  const leftoversTotal = leftoversPerWeek * totalWeeks;
  const cookingDays = Math.max(0, totalDays - eatingOut - leftoversTotal);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handleEatingOutChange = (delta: number) => {
    const next = clamp(eatingOutPerWeek + delta, 0, 7 - leftoversPerWeek);
    setEatingOutPerWeek(next);
  };

  const handleLeftoversChange = (delta: number) => {
    const next = clamp(leftoversPerWeek + delta, 0, 7 - eatingOutPerWeek);
    setLeftoversPerWeek(next);
  };

  const handleGenerate = () => {
    if (meals.length === 0) {
      alert('Add some meals to your library first!');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const preferences: PlannerPreferences = {
        duration: durationOpt.duration,
        durationCount: durationOpt.count,
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
  const cookingPerWeek = 7 - eatingOutPerWeek - leftoversPerWeek;

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

  return (
    <div className="max-w-lg mx-auto pt-4 sm:pt-6 space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/calendar')}
          className="p-2 -ml-2 text-cream-400 hover:text-cream-100 rounded-lg active:bg-forest-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-cream-100">Preferences</h2>
      </div>

      {/* Duration selector */}
      <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-4 sm:p-5">
        <p className="text-sm font-semibold text-cream-400 uppercase tracking-wider mb-3">Plan duration</p>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => setSelectedDuration(i)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedDuration === i
                  ? 'bg-gold text-forest-900 shadow-md'
                  : 'bg-forest-600 text-cream-400 hover:text-cream-100 hover:bg-forest-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {totalWeeks > 1 && (
          <p className="text-xs text-cream-500 mt-2.5 text-center">
            {totalDays} days total &middot; eating out &amp; leftovers are set per week
          </p>
        )}
      </div>

      {/* Meal library count */}
      {meals.length > 0 ? (
        <div className="flex items-center gap-2 text-sm text-cream-400">
          <ChefHat className="w-4 h-4 text-gold" />
          <span>{meals.length} recipes in your library</span>
        </div>
      ) : (
        <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-4">
          <p className="text-sm text-terracotta-light font-medium">
            Add some meals to your library first, then come back to plan.
          </p>
          <button
            onClick={() => navigate('/meals')}
            className="mt-2 text-sm font-semibold text-gold underline"
          >
            Go to Meals →
          </button>
        </div>
      )}
      
      {/* Visual week preview */}
      <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-cream-400 uppercase tracking-wider mb-4">
          {totalWeeks === 1 ? 'Your week at a glance' : 'Each week looks like'}
        </h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
          {weekPreview.map((type, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-semibold text-cream-500">{dayLabels[i]}</span>
              <div className={`w-full aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                type === 'cook'
                  ? 'bg-forest-300/20 text-forest-200'
                  : type === 'leftover'
                  ? 'bg-gold/15 text-gold'
                  : 'bg-forest-600 text-cream-500'
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
            <div className="w-3 h-3 rounded-full bg-forest-300" />
            <span className="text-cream-400 font-medium">{cookingPerWeek} cooking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gold" />
            <span className="text-cream-400 font-medium">{leftoversPerWeek} leftovers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-forest-500" />
            <span className="text-cream-400 font-medium">{eatingOutPerWeek} eating out</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Eating out stepper */}
        <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-cream-100">Eating out</p>
            <p className="text-sm text-cream-500">Per week</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEatingOutChange(-1)}
              disabled={eatingOutPerWeek <= 0}
              className="w-10 h-10 rounded-full border-2 border-forest-500 flex items-center justify-center text-cream-300 hover:border-cream-400 active:bg-forest-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-cream-100 w-8 text-center tabular-nums">{eatingOutPerWeek}</span>
            <button
              onClick={() => handleEatingOutChange(1)}
              disabled={eatingOutPerWeek >= 7 - leftoversPerWeek}
              className="w-10 h-10 rounded-full border-2 border-forest-500 flex items-center justify-center text-cream-300 hover:border-cream-400 active:bg-forest-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leftovers stepper */}
        <div className="bg-forest-700 rounded-2xl border border-forest-500/60 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-cream-100">Leftovers</p>
            <p className="text-sm text-cream-500">Per week</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLeftoversChange(-1)}
              disabled={leftoversPerWeek <= 0}
              className="w-10 h-10 rounded-full border-2 border-forest-500 flex items-center justify-center text-cream-300 hover:border-cream-400 active:bg-forest-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-cream-100 w-8 text-center tabular-nums">{leftoversPerWeek}</span>
            <button
              onClick={() => handleLeftoversChange(1)}
              disabled={leftoversPerWeek >= 7 - eatingOutPerWeek}
              className="w-10 h-10 rounded-full border-2 border-forest-500 flex items-center justify-center text-cream-300 hover:border-cream-400 active:bg-forest-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
          disabled={isGenerating || meals.length === 0 || cookingPerWeek < 1}
          className="flex items-center justify-center gap-2 text-lg py-4 rounded-2xl"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'Generating...' : `Generate my ${durationOpt.label.toLowerCase()}`}
        </Button>
        {cookingPerWeek < 1 && meals.length > 0 && (
          <p className="text-sm text-terracotta text-center mt-2">
            You need at least 1 cooking day
          </p>
        )}
      </div>
    </div>
  );
}
