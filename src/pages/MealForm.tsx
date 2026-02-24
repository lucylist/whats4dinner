// Meal form for adding/editing meals

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Meal } from '../types';
import { generateId, toTitleCase } from '../utils/storage';
import Button from '../components/Button';
import Input from '../components/Input';
import TextArea from '../components/TextArea';
import DuplicateModal from '../components/DuplicateModal';

export default function MealForm() {
  const { selectedMealId, getMeal, addMeal, updateMeal, meals, setSelectedMealId } = useApp();
  const navigate = useNavigate();
  const isEditing = !!selectedMealId;
  const existingMeal = isEditing && selectedMealId ? getMeal(selectedMealId) : null;
  
  const [quickAddMode, setQuickAddMode] = useState(!isEditing); // Show full form when editing
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastAddedMealName, setLastAddedMealName] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredientsText: '',
    recipe: '',
    links: [] as string[],
    tagsText: '',
    prepTime: '',
    imageUrl: '',
    notes: ''
  });
  
  const [newLink, setNewLink] = useState('');
  const [duplicateCheck, setDuplicateCheck] = useState<{ existing: Meal; pending: Meal } | null>(null);
  
  useEffect(() => {
    if (existingMeal) {
      const ingredientsText = existingMeal.ingredients
        .map(ing => typeof ing === 'string' ? ing : `${ing.name} - ${ing.quantity}`)
        .join('\n');
      
      setFormData({
        name: existingMeal.name,
        description: existingMeal.description,
        ingredientsText,
        recipe: existingMeal.recipe,
        links: existingMeal.links,
        tagsText: existingMeal.tags.join(', '),
        prepTime: existingMeal.prepTime.toString(),
        imageUrl: existingMeal.imageUrl,
        notes: existingMeal.notes
      });
    }
  }, [existingMeal]);
  
  const handleImportRecipe = async () => {
    if (!importUrl.trim()) return;
    
    setIsImporting(true);
    
    try {
      const url = importUrl.trim();
      
      // Add URL to links
      if (!formData.links.includes(url)) {
        setFormData(prev => ({
          ...prev,
          links: [...prev.links, url]
        }));
      }
      
      // Try to extract image from the recipe URL
      if (!formData.imageUrl) {
        try {
          const response = await fetch('http://localhost:3001/api/extract-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.imageUrl) {
              setFormData(prev => ({
                ...prev,
                imageUrl: data.imageUrl
              }));
              alert('Recipe link added and image extracted! You can view the recipe at the link and manually add other details if needed.');
              setImportUrl('');
              setIsImporting(false);
              return;
            }
          }
        } catch (error) {
          console.log('Could not extract image:', error);
        }
      }
      
      // Show message if no image was extracted
      alert('Recipe link added! You can view the recipe at the link and manually add details if needed.');
      
      setImportUrl('');
    } catch (error) {
      alert('Failed to import recipe. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ingredients = formData.ingredientsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const tags = formData.tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const meal: Meal = {
      id: existingMeal?.id || generateId(),
      name: toTitleCase(formData.name),
      description: formData.description,
      ingredients,
      recipe: formData.recipe,
      links: formData.links,
      tags,
      prepTime: parseInt(formData.prepTime) || 0,
      imageUrl: formData.imageUrl,
      notes: formData.notes,
      createdAt: existingMeal?.createdAt || new Date().toISOString(),
      lastMadeAt: existingMeal?.lastMadeAt || null
    };
    
    if (isEditing) {
      updateMeal(meal);
      navigate('/meal-detail');
    } else {
      const existing = meals.find(m => m.name.toLowerCase() === meal.name.toLowerCase());
      if (existing) {
        setDuplicateCheck({ existing, pending: meal });
        return;
      }
      commitNewMeal(meal);
    }
  };

  const commitNewMeal = (meal: Meal) => {
    addMeal(meal);
    setLastAddedMealName(meal.name);
    setShowSuccessMessage(true);
    setFormData({
      name: '',
      description: '',
      ingredientsText: '',
      recipe: '',
      links: [],
      tagsText: '',
      prepTime: '',
      imageUrl: '',
      notes: ''
    });
    setQuickAddMode(true);
    setTimeout(() => setShowSuccessMessage(false), 4000);
  };
  
  const [isExtractingImage, setIsExtractingImage] = useState(false);

  const handleAddLink = async () => {
    if (newLink.trim()) {
      const url = newLink.trim();
      
      // Add the link first
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, url]
      }));
      setNewLink('');
      
      // Try to extract image from the recipe URL (only if no image is set yet)
      if (!formData.imageUrl) {
        setIsExtractingImage(true);
        try {
          const response = await fetch('http://localhost:3001/api/extract-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.imageUrl) {
              setFormData(prev => ({
                ...prev,
                imageUrl: data.imageUrl
              }));
              console.log('Extracted recipe image:', data.imageUrl);
            }
          }
        } catch (error) {
          console.log('Could not extract image from recipe URL:', error);
        } finally {
          setIsExtractingImage(false);
        }
      }
    }
  };
  
  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };
  
  return (
    <div className="max-w-3xl mx-auto pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit meal' : 'Add meal'}
        </h2>
        
        {!isEditing && (
          <Button
            onClick={() => navigate('/meals')}
            variant="outline"
            className="flex items-center gap-2"
          >
            View all meals
            {meals.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                {meals.length}
              </span>
            )}
          </Button>
        )}
        
        {isEditing && (
          <button
            onClick={() => navigate('/meal-detail')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
            Close
          </button>
        )}
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">"{lastAddedMealName}" added!</p>
                <p className="text-sm text-green-100">Ready to add another, or view all meals</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/meals')}
              className="px-3 py-1 bg-white text-green-600 rounded font-medium text-sm hover:bg-green-50 transition-colors"
            >
              View all →
            </button>
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Quick Add Mode: Inline Input + Button */}
        {!isEditing && quickAddMode ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Chicken stir fry"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button type="submit" size="lg" className="whitespace-nowrap">
                ⚡ Quick add
              </Button>
            </div>
          </div>
        ) : (
          <Input
            label="Meal name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Chicken stir fry"
          />
        )}
        
        {/* Collapse button when expanded */}
        {!isEditing && !quickAddMode && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium text-blue-900">Full details mode</span>
            </div>
            <button
              type="button"
              onClick={() => setQuickAddMode(true)}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
            >
              <span>↑</span>
              <span>Back to quick add</span>
            </button>
          </div>
        )}
        
        {!quickAddMode && (
          <>
            {/* Recipe Import Section */}
            <div className="border-t border-b border-gray-200 py-4 -mx-6 px-6 bg-gradient-to-r from-primary-50 to-accent-50">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🔗</span>
                Import from recipe URL
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Paste a recipe link to automatically add it to your meal (ingredients extraction coming soon!)
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.recipeblog.com/chicken-stir-fry"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isImporting}
                />
                <Button 
                  type="button" 
                  onClick={handleImportRecipe}
                  disabled={!importUrl.trim() || isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
        
            <TextArea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the meal..."
              rows={2}
            />
            
            <TextArea
              label="Ingredients"
              value={formData.ingredientsText}
              onChange={(e) => setFormData(prev => ({ ...prev, ingredientsText: e.target.value }))}
              placeholder="One ingredient per line, e.g.&#10;Chicken breast - 1 lb&#10;Bell peppers - 2&#10;Soy sauce - 3 tbsp"
              rows={6}
              helperText="Enter one ingredient per line, or import from a recipe URL above"
            />
            
            <TextArea
              label="Recipe / instructions"
              value={formData.recipe}
              onChange={(e) => setFormData(prev => ({ ...prev, recipe: e.target.value }))}
              placeholder="1. Step one...&#10;2. Step two..."
              rows={6}
              helperText="Or keep this empty if you're using a recipe link"
            />
            
            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipe links</label>
              
              {formData.links.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <a 
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-primary-600 hover:text-primary-700 truncate"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Button type="button" onClick={handleAddLink} variant="secondary">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <Input
              label="Tags"
              value={formData.tagsText}
              onChange={(e) => setFormData(prev => ({ ...prev, tagsText: e.target.value }))}
              placeholder="e.g., quick, healthy, asian"
              helperText="Separate tags with commas"
            />
            
            <Input
              label="Prep time (minutes)"
              type="number"
              min="0"
              value={formData.prepTime}
              onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
              placeholder="30"
            />
            
            <Input
              label="Image URL (optional)"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
            
            <TextArea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={3}
            />
          </>
        )}
        
        {/* Submit - Only show for full mode and editing */}
        {(!quickAddMode || isEditing) && (
          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth size="lg">
              {isEditing 
                ? 'Save changes' 
                : '💾 Save meal'}
            </Button>
            {isEditing && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setSelectedMealId(null);
                  navigate('/meals');
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
        
        {!isEditing && quickAddMode && (
          <div className="-mx-6 px-6 -mb-6">
            <button
              type="button"
              onClick={() => setQuickAddMode(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <span>Add more details</span>
              <span className="text-xs text-gray-500">(ingredients, recipe, links, etc.)</span>
              <span className="ml-1">↓</span>
            </button>
          </div>
        )}
      </form>

      {duplicateCheck && (
        <DuplicateModal
          existingMeal={duplicateCheck.existing}
          newMealName={duplicateCheck.pending.name}
          onKeepBoth={() => {
            commitNewMeal(duplicateCheck.pending);
            setDuplicateCheck(null);
          }}
          onViewExisting={() => {
            setSelectedMealId(duplicateCheck.existing.id);
            setDuplicateCheck(null);
            navigate('/meal-detail');
          }}
          onCancel={() => setDuplicateCheck(null)}
        />
      )}
    </div>
  );
}
