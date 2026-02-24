import React, { useState } from 'react';
import { Meal } from '../types';
import { toTitleCase } from '../utils/storage';

interface MealCardProps {
  meal: Meal;
  onClick?: () => void;
  showLastMade?: boolean;
  onUpdateName?: (mealId: string, newName: string) => void;
  onUpdateImage?: (mealId: string, newImageUrl: string) => void;
}

export default function MealCard({ meal, onClick, onUpdateImage }: MealCardProps) {
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [generationAttempted, setGenerationAttempted] = useState(false);
  
  const searchMealDbImage = async (mealName: string): Promise<string | null> => {
    const words = mealName.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (let len = words.length; len >= 1; len--) {
      const query = words.slice(0, len).join(' ');
      try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          return data.meals[0].strMealThumb || null;
        }
      } catch { /* try shorter query */ }
    }
    return null;
  };

  const generateAiImage = async (mealName: string) => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      let imageUrl = await searchMealDbImage(mealName);
      if (!imageUrl) {
        const keywords = mealName.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).slice(0, 2).join(',');
        imageUrl = `https://loremflickr.com/400/300/${encodeURIComponent(keywords)},food,dish`;
      }
      setAiGeneratedImage(imageUrl);
      if (onUpdateImage) onUpdateImage(meal.id, imageUrl);
    } catch {
      setImageError(true);
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  const getPlaceholderStyle = (mealName: string) => {
    const hues = [25, 35, 140, 210, 280, 350];
    const seed = mealName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hues[seed % hues.length];
    const gradient = `linear-gradient(135deg, hsl(${hue}, 40%, 25%) 0%, hsl(${(hue + 30) % 360}, 35%, 18%) 100%)`;
    const initials = mealName.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
    return { gradient, initials };
  };
  
  const actualImageUrl = imageError ? aiGeneratedImage : (meal.imageUrl || aiGeneratedImage);
  const placeholderStyle = getPlaceholderStyle(meal.name);

  React.useEffect(() => {
    setImageError(false);
    setAiGeneratedImage(null);
    setGenerationAttempted(false);
  }, [meal.id, meal.imageUrl]);
  
  React.useEffect(() => {
    if (aiGeneratedImage || isGeneratingImage || generationAttempted) return;
    if (meal.imageUrl && !meal.imageUrl.startsWith('data:') && meal.imageUrl.startsWith('http')) return;
    setGenerationAttempted(true);
    const timer = setTimeout(() => {
      generateAiImage(meal.name);
    }, 300 + Math.random() * 700);
    return () => clearTimeout(timer);
  }, [meal.imageUrl, meal.name, aiGeneratedImage, isGeneratingImage, generationAttempted]);

  return (
    <div
      onClick={onClick}
      className="group relative bg-forest-700 rounded-2xl border border-forest-500/60 overflow-hidden hover:border-gold/40 hover:shadow-lg hover:shadow-forest-900/50 transition-all duration-300 cursor-pointer"
    >
      {/* Botanical corner flourishes */}
      <svg viewBox="0 0 40 40" className="absolute top-1.5 left-1.5 w-7 h-7 text-gold/25 z-10 pointer-events-none" fill="none">
        <path d="M4 36C4 36 8 28 14 22C20 16 28 14 28 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 22C12 18 14 14 18 12C16 16 17 19 20 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M20 18C22 14 26 13 28 14C24 15 22 17 22 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="currentColor" fillOpacity="0.15" />
      </svg>
      <svg viewBox="0 0 40 40" className="absolute bottom-1.5 right-1.5 w-7 h-7 text-gold/25 z-10 pointer-events-none rotate-180" fill="none">
        <path d="M4 36C4 36 8 28 14 22C20 16 28 14 28 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 22C12 18 14 14 18 12C16 16 17 19 20 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M20 18C22 14 26 13 28 14C24 15 22 17 22 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="currentColor" fillOpacity="0.15" />
      </svg>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {isGeneratingImage ? (
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: placeholderStyle.gradient }}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cream-100 mb-2"></div>
            <span className="text-cream-400 text-xs">Loading...</span>
          </div>
        ) : actualImageUrl ? (
          <img
            src={actualImageUrl}
            alt={meal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => {
              setImageError(true);
              setAiGeneratedImage(null);
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: placeholderStyle.gradient }}
          >
            <span className="text-cream-300/60 text-4xl font-serif font-bold">{placeholderStyle.initials}</span>
          </div>
        )}
        {/* Subtle gradient overlay at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-forest-900/60 to-transparent" />
      </div>
      
      {/* Name only */}
      <div className="p-3 sm:p-4">
        <h3 className="font-serif font-semibold text-cream-100 text-base sm:text-lg line-clamp-1 group-hover:text-gold transition-colors">
          {toTitleCase(meal.name)}
        </h3>
      </div>
    </div>
  );
}
