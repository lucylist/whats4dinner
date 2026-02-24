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
      className="group relative bg-forest-700 rounded-2xl overflow-hidden shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 cursor-pointer border border-forest-500/40"
    >
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
      </div>
      
      {/* Name — centered, serif, warm tone */}
      <div className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 text-center">
        <h3 className="font-sans font-semibold text-cream-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-cobalt-light transition-colors">
          {toTitleCase(meal.name)}
        </h3>
      </div>
    </div>
  );
}
