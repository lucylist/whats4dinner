// Recommendations page - meal recommendations based on available ingredients

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Plus, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMealRecommendations, getRecommendationsByCategory } from '../utils/recommendations';
import { MealRecommendation } from '../types';
import Button from '../components/Button';
import { toTitleCase } from '../utils/storage';

export default function Recommendations() {
  const { meals, inventory, setSelectedMealId, currentPlan, updateCurrentPlan } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'canMake' | 'almostThere'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'prepTime'>('match');
  
  const recommendations = useMemo(() => {
    return getMealRecommendations(meals, inventory);
  }, [meals, inventory]);
  
  const categorized = useMemo(() => {
    return getRecommendationsByCategory(recommendations);
  }, [recommendations]);
  
  const filteredRecs = useMemo(() => {
    let recs = recommendations;
    
    switch (filter) {
      case 'canMake':
        recs = categorized.canMakeNow;
        break;
      case 'almostThere':
        recs = categorized.almostThere;
        break;
      default:
        recs = recommendations;
    }
    
    if (sortBy === 'prepTime') {
      recs = [...recs].sort((a, b) => 
        (a.meal.prepTime || 999) - (b.meal.prepTime || 999)
      );
    }
    
    return recs;
  }, [recommendations, categorized, filter, sortBy]);
  
  const handleViewMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    navigate('/meal-detail');
  };
  
  const handleAddToToday = (rec: MealRecommendation) => {
    if (!currentPlan) {
      alert('Please create a meal calendar first!');
      navigate('/plan-week');
      return;
    }
    
    // Find today's day in the plan or the first available day
    const today = new Date().toISOString().split('T')[0];
    const dayIndex = currentPlan.days.findIndex(d => d.date >= today);
    
    if (dayIndex !== -1) {
      const updatedPlan = {
        ...currentPlan,
        days: currentPlan.days.map((day, idx) => 
          idx === dayIndex ? { ...day, mealId: rec.meal.id, type: 'meal' as const } : day
        ),
        modifiedAt: new Date().toISOString()
      };
      
      updateCurrentPlan(updatedPlan);
      alert(`${toTitleCase(rec.meal.name)} added to your plan!`);
      navigate('/calendar');
    }
  };
  
  const getMatchColor = (score: number) => {
    if (score === 100) return 'bg-green-500';
    if (score >= 80) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  if (inventory.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/fridge')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
        </div>
        
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🥗</div>
          <p className="text-gray-600 text-lg mb-4">
            Add ingredients to your fridge to get recommendations!
          </p>
          <Button onClick={() => navigate('/add-ingredient')}>
            Add Ingredients
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/fridge')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">What Can I Make?</h2>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{categorized.canMakeNow.length}</p>
          <p className="text-sm text-gray-600">Can Make Now</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{categorized.almostThere.length}</p>
          <p className="text-sm text-gray-600">Almost There</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{inventory.length}</p>
          <p className="text-sm text-gray-600">Ingredients</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Meals
            </button>
            <button
              onClick={() => setFilter('canMake')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'canMake'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Can Make Now
            </button>
            <button
              onClick={() => setFilter('almostThere')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'almostThere'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Almost There
            </button>
          </div>
          
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'prepTime')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="match">Sort by: Best Match</option>
              <option value="prepTime">Sort by: Quickest</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No meals match your current filter.</p>
          </div>
        ) : (
          filteredRecs.map((rec) => (
            <div
              key={rec.meal.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{toTitleCase(rec.meal.name)}</h3>
                    {rec.hasExpiringIngredients && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Expiring Soon
                      </span>
                    )}
                  </div>
                  
                  {rec.meal.description && (
                    <p className="text-gray-600 text-sm mb-2">{rec.meal.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {rec.meal.prepTime > 0 && <span>{rec.meal.prepTime} min</span>}
                    {rec.meal.tags.length > 0 && <span>• {rec.meal.tags.join(', ')}</span>}
                  </div>
                </div>
                
                {/* Match score */}
                <div className="text-center ml-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={rec.matchScore === 100 ? '#10b981' : rec.matchScore >= 80 ? '#f59e0b' : '#6b7280'}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(rec.matchScore / 100) * 176} 176`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">{rec.matchScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Match</p>
                </div>
              </div>
              
              {/* Ingredients */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {rec.availableIngredients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      ✅ You Have ({rec.availableIngredients.length})
                    </p>
                    <ul className="space-y-1">
                      {rec.availableIngredients.map((ing, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {rec.missingIngredients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      ❌ Missing ({rec.missingIngredients.length})
                    </p>
                    <ul className="space-y-1">
                      {rec.missingIngredients.map((ing, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewMeal(rec.meal.id)}
                  className="flex-1"
                >
                  View Recipe
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAddToToday(rec)}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
