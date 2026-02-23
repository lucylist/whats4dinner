// Plan Week page - generate new weekly plan

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateWeeklyPlan } from '../utils/planGenerator';
import { PlannerPreferences } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';

export default function PlanWeek() {
  const { meals, setCurrentPlan } = useApp();
  const navigate = useNavigate();
  
  const [preferences, setPreferences] = useState<PlannerPreferences>({
    duration: 'week',
    durationCount: 1,
    eatingOutDays: 1,
    leftoverDays: 1,
    excludedMealIds: [],
    preferQuickMeals: false,
    useIngredientsFromFridge: false
  });
  
  // Calculate total days based on duration
  const totalDays = preferences.duration === 'month' 
    ? preferences.durationCount * 30 
    : preferences.durationCount * 7;
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    if (meals.length === 0) {
      alert('Please add some meals to your library first!');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate slight delay for better UX
    setTimeout(() => {
      const plan = generateWeeklyPlan(meals, new Date(), preferences);
      setCurrentPlan(plan);
      setIsGenerating(false);
      navigate('/calendar');
    }, 500);
  };
  
  return (
    <div className="max-w-2xl mx-auto pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Create Meal Calendar</h2>
      </div>
      
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Configure your preferences below and generate a meal calendar for any duration. 
          You can customize it after generation.
        </p>
      </div>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Duration</h3>
          
          {/* Duration Type Selector */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Calendar duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreferences(prev => ({ 
                  ...prev, 
                  duration: 'week',
                  durationCount: 1,
                  eatingOutDays: Math.min(prev.eatingOutDays, 7),
                  leftoverDays: Math.min(prev.leftoverDays, 7)
                }))}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  preferences.duration === 'week'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Week(s)
              </button>
              <button
                type="button"
                onClick={() => setPreferences(prev => ({ 
                  ...prev, 
                  duration: 'month',
                  durationCount: 1,
                  eatingOutDays: Math.min(prev.eatingOutDays, 30),
                  leftoverDays: Math.min(prev.leftoverDays, 30)
                }))}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  preferences.duration === 'month'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Month(s)
              </button>
            </div>
          </div>
          
          {/* Duration Count */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Number of {preferences.duration === 'week' ? 'weeks' : 'months'}: {preferences.durationCount}
            </label>
            <input
              type="range"
              min="1"
              max={preferences.duration === 'week' ? 4 : 3}
              value={preferences.durationCount}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                durationCount: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>{preferences.duration === 'week' ? '4 weeks' : '3 months'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {totalDays} days
            </p>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Plan preferences</h3>
          
          {/* Eating Out/Take Out Days */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Eating out/take out days: {preferences.eatingOutDays}
            </label>
            <input
              type="range"
              min="0"
              max={totalDays}
              value={preferences.eatingOutDays}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                eatingOutDays: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{totalDays} days</span>
            </div>
          </div>
          
          {/* Leftover Days */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Leftover Days: {preferences.leftoverDays}
            </label>
            <input
              type="range"
              min="0"
              max={totalDays}
              value={preferences.leftoverDays}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                leftoverDays: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{totalDays} days</span>
            </div>
          </div>
          
          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.preferQuickMeals}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  preferQuickMeals: e.target.checked
                }))}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Prefer quick meals (shorter prep time)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.useIngredientsFromFridge}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  useIngredientsFromFridge: e.target.checked
                }))}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Use ingredients from my fridge (prioritize available ingredients)
              </span>
            </label>
          </div>
        </div>
        
        {/* Stats */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{meals.length}</p>
              <p className="text-sm text-gray-600">Meals Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {totalDays - preferences.eatingOutDays - preferences.leftoverDays}
              </p>
              <p className="text-sm text-gray-600">Cooking Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-600">
                {preferences.eatingOutDays + preferences.leftoverDays}
              </p>
              <p className="text-sm text-gray-600">Off Days</p>
            </div>
          </div>
        </div>
        
        {/* Generate Button */}
        <Button
          fullWidth
          onClick={handleGenerate}
          disabled={isGenerating || meals.length === 0}
          className="flex items-center justify-center gap-2 text-lg py-3"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'Generating...' : `Generate ${preferences.durationCount} ${preferences.duration === 'week' ? (preferences.durationCount === 1 ? 'Week' : 'Weeks') : (preferences.durationCount === 1 ? 'Month' : 'Months')}`}
        </Button>
        
        {meals.length === 0 && (
          <p className="text-sm text-red-600 text-center">
            Please add some meals to your library before generating a calendar.
          </p>
        )}
      </div>
    </div>
  );
}
