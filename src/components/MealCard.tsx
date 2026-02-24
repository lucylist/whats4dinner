// Reusable meal card component

import React, { useState } from 'react';
import { Meal } from '../types';
import { Tag, Edit, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toTitleCase } from '../utils/storage';
interface MealCardProps {
  meal: Meal;
  onClick?: () => void;
  showLastMade?: boolean;
  onUpdateName?: (mealId: string, newName: string) => void;
  onUpdateImage?: (mealId: string, newImageUrl: string) => void;
}

export default function MealCard({ meal, onClick, showLastMade = true, onUpdateName, onUpdateImage }: MealCardProps) {
  const isIncomplete = !meal.ingredients || meal.ingredients.length === 0;
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(meal.name);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const searchMealDbImage = async (mealName: string): Promise<string | null> => {
    const words = mealName.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    // Try full name first, then progressively shorter queries
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
      // 1. TheMealDB — free food photo search, no key needed
      let imageUrl = await searchMealDbImage(mealName);

      // 2. Fallback — keyword-based food photo from loremflickr (Creative Commons)
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
  
  // Get placeholder color and initials for a meal
  const getPlaceholderStyle = (mealName: string) => {
    const gradients = [
      'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', // orange to red
      'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', // amber to orange
      'linear-gradient(135deg, #4ade80 0%, #059669 100%)', // green to emerald
      'linear-gradient(135deg, #60a5fa 0%, #4f46e5 100%)', // blue to indigo
      'linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)', // purple to violet
      'linear-gradient(135deg, #f472b6 0%, #e11d48 100%)', // pink to rose
    ];
    const seed = mealName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[seed % gradients.length];
    const initials = mealName.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
    return { gradient, initials };
  };
  
  // Determine if we have an actual image URL to display
  // If there was an error loading the saved image, use AI generated one instead
  const actualImageUrl = imageError ? aiGeneratedImage : (meal.imageUrl || aiGeneratedImage);
  const placeholderStyle = getPlaceholderStyle(meal.name);

  // Track whether we've already attempted generation for this meal
  const [generationAttempted, setGenerationAttempted] = useState(false);

  // Reset state when meal changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setAiGeneratedImage(null);
    setGenerationAttempted(false);
  }, [meal.id, meal.imageUrl]);
  
  // Generate AI image if no image is set and we haven't tried yet
  React.useEffect(() => {
    // Skip if already have a working image or currently generating
    if (aiGeneratedImage || isGeneratingImage || generationAttempted) return;
    // Skip if meal has a real image URL (not a broken data URI)
    if (meal.imageUrl && !meal.imageUrl.startsWith('data:') && meal.imageUrl.startsWith('http')) return;

    setGenerationAttempted(true);
    console.log(`[ImageGen] Queuing generation for: ${meal.name} (current imageUrl: ${meal.imageUrl ? meal.imageUrl.slice(0, 50) + '...' : 'none'})`);
    const timer = setTimeout(() => {
      generateAiImage(meal.name);
    }, 300 + Math.random() * 700);
    return () => clearTimeout(timer);
  }, [meal.imageUrl, meal.name, aiGeneratedImage, isGeneratingImage, generationAttempted]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedName.trim() && editedName !== meal.name && onUpdateName) {
      onUpdateName(meal.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveClick(e as any);
    } else if (e.key === 'Escape') {
      setEditedName(meal.name);
      setIsEditingName(false);
    }
  };

  const handleImageEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewImageUrl(meal.imageUrl || '');
    setIsEditingImage(true);
  };

  const handleImageSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateImage) {
      onUpdateImage(meal.id, newImageUrl.trim());
    }
    setIsEditingImage(false);
  };

  const handleImageCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingImage(false);
    setNewImageUrl('');
  };

  const handleUseDefaultClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateImage) {
      onUpdateImage(meal.id, '');
    }
    setIsEditingImage(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Image */}
      <div className="relative group h-40">
        {isGeneratingImage ? (
          /* Loading state while AI generates image */
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: placeholderStyle.gradient, minHeight: '160px' }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            <span className="text-white text-sm font-medium">Generating...</span>
          </div>
        ) : actualImageUrl ? (
          <img
            src={actualImageUrl}
            alt={meal.name}
            className="w-full h-full object-cover"
            onError={() => {
              setImageError(true);
              setAiGeneratedImage(null);
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: placeholderStyle.gradient, minHeight: '160px' }}
          >
            <span className="text-white text-4xl font-bold drop-shadow-lg">{placeholderStyle.initials}</span>
          </div>
        )}
        {onUpdateImage && (
          <button
            onClick={handleImageEditClick}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Image Edit Modal */}
      {isEditingImage && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4" onClick={handleImageCancelClick}>
          <div className="bg-white rounded-lg p-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-3">Change meal image</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              
              {newImageUrl && (
                <div className="border border-gray-200 rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img 
                    src={newImageUrl} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded"
                    onError={() => {}}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleImageSaveClick}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleUseDefaultClick}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Use default
                </button>
                <button
                  onClick={handleImageCancelClick}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Leave empty or click "Use default" to auto-generate an image based on the meal name
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
              className="flex-1 font-semibold text-lg text-gray-900 border border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          ) : (
            <h3 className="flex-1 font-semibold text-lg text-gray-900 line-clamp-1">
              {toTitleCase(meal.name)}
            </h3>
          )}
          {onUpdateName && (
            <button
              onClick={isEditingName ? handleSaveClick : handleEditClick}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              {isEditingName ? (
                <Check className="w-4 h-4" />
              ) : (
                <Edit className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Tags */}
        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {meal.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {meal.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">
                +{meal.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          
          {showLastMade && meal.lastMadeAt && (
            <div className="text-xs">
              Last: {formatDistanceToNow(new Date(meal.lastMadeAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
