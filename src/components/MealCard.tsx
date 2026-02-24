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

const CornerFlourishTL = () => (
  <svg viewBox="0 0 80 80" className="absolute top-2 left-2 w-14 h-14 sm:w-16 sm:h-16 text-gold/30 z-10 pointer-events-none" fill="none">
    {/* Main vine curving from bottom-left toward top-right */}
    <path d="M6 74C10 58 18 42 32 30C42 22 56 18 68 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    {/* Branch off the main vine going up */}
    <path d="M18 52C16 44 20 36 28 32" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
    {/* Leaves along the main vine */}
    <path d="M14 60C10 56 12 50 16 48C14 54 16 57 20 58" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M24 44C20 40 22 34 26 32C24 38 26 41 30 42" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M36 32C32 28 34 22 38 20C36 26 38 29 42 30" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M50 24C46 20 48 14 52 12C50 18 52 21 56 22" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    {/* Small leaves on the branch */}
    <path d="M20 46C18 42 20 38 24 36C22 40 23 43 26 44" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.1" />
    {/* Tiny berries/dots */}
    <circle cx="12" cy="64" r="1" fill="currentColor" fillOpacity="0.2" />
    <circle cx="30" cy="36" r="1" fill="currentColor" fillOpacity="0.2" />
    <circle cx="44" cy="26" r="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const CornerFlourishBR = () => (
  <svg viewBox="0 0 80 80" className="absolute bottom-2 right-2 w-14 h-14 sm:w-16 sm:h-16 text-gold/30 z-10 pointer-events-none rotate-180" fill="none">
    <path d="M6 74C10 58 18 42 32 30C42 22 56 18 68 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M18 52C16 44 20 36 28 32" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
    <path d="M14 60C10 56 12 50 16 48C14 54 16 57 20 58" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M24 44C20 40 22 34 26 32C24 38 26 41 30 42" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M36 32C32 28 34 22 38 20C36 26 38 29 42 30" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M50 24C46 20 48 14 52 12C50 18 52 21 56 22" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="currentColor" fillOpacity="0.12" />
    <path d="M20 46C18 42 20 38 24 36C22 40 23 43 26 44" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.1" />
    <circle cx="12" cy="64" r="1" fill="currentColor" fillOpacity="0.2" />
    <circle cx="30" cy="36" r="1" fill="currentColor" fillOpacity="0.2" />
    <circle cx="44" cy="26" r="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

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
      className="group relative bg-forest-700 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-forest-900/50 transition-all duration-300 cursor-pointer"
    >
      {/* Inner inset frame */}
      <div className="absolute inset-[6px] sm:inset-2 border border-cream-300/20 rounded-xl pointer-events-none z-20" />

      {/* Botanical corner flourishes */}
      <CornerFlourishTL />
      <CornerFlourishBR />

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden m-[6px] sm:m-2 rounded-t-xl">
        {isGeneratingImage ? (
          <div 
            className="w-full h-full flex flex-col items-center justify-center rounded-t-xl"
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
            className="w-full h-full flex items-center justify-center rounded-t-xl"
            style={{ background: placeholderStyle.gradient }}
          >
            <span className="text-cream-300/60 text-4xl font-serif font-bold">{placeholderStyle.initials}</span>
          </div>
        )}
      </div>
      
      {/* Name — centered, serif, warm tone */}
      <div className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 text-center relative z-20">
        <h3 className="font-serif font-semibold text-cream-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {toTitleCase(meal.name)}
        </h3>
      </div>
    </div>
  );
}
