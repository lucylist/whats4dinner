// Meal detail view page with always-editable fields

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, X, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import TextArea from '../components/TextArea';
import { toTitleCase } from '../utils/storage';
import { Meal } from '../types';
import { importRecipeFromUrl } from '../utils/recipeImport';

export default function MealDetail() {
  const { selectedMealId, getMeal, deleteMeal, updateMeal, setSelectedMealId } = useApp();
  const navigate = useNavigate();
  
  const meal = selectedMealId ? getMeal(selectedMealId) : null;
  
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
  const [isImporting, setIsImporting] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isHoveringTags, setIsHoveringTags] = useState(false);
  
  // Store original data to detect changes
  const [originalData, setOriginalData] = useState('');
  
  // Initialize form data when meal loads
  useEffect(() => {
    if (meal) {
      const ingredientsText = meal.ingredients
        .map(ing => typeof ing === 'string' ? ing : `${ing.name} - ${ing.quantity}`)
        .join('\n');
      
      const data = {
        name: meal.name,
        description: meal.description || '',
        ingredientsText,
        recipe: meal.recipe || '',
        links: [...meal.links],
        tagsText: meal.tags.join(', '),
        prepTime: meal.prepTime ? meal.prepTime.toString() : '',
        imageUrl: meal.imageUrl || '',
        notes: meal.notes || ''
      };
      
      setFormData(data);
      setOriginalData(JSON.stringify(data));
    }
  }, [meal]);
  
  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== originalData;
  }, [formData, originalData]);
  
  if (!meal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Meal not found.</p>
        <Button onClick={() => navigate('/meals')} className="mt-4">
          Back to all meals
        </Button>
      </div>
    );
  }
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${meal.name}"?`)) {
      deleteMeal(meal.id);
      setSelectedMealId(null);
      navigate('/meals');
    }
  };
  
  const handleBack = () => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    setSelectedMealId(null);
    navigate('/meals');
  };
  
  const handleSave = () => {
    const updatedMeal: Meal = {
      ...meal,
      name: toTitleCase(formData.name),
      description: formData.description,
      ingredients: formData.ingredientsText.split('\n').map(s => s.trim()).filter(Boolean),
      recipe: formData.recipe,
      links: formData.links,
      tags: formData.tagsText.split(',').map(s => s.trim()).filter(Boolean),
      prepTime: parseInt(formData.prepTime) || 0,
      imageUrl: formData.imageUrl,
      notes: formData.notes
    };
    
    updateMeal(updatedMeal);
    setOriginalData(JSON.stringify(formData));
  };
  
  const handleImportRecipe = async () => {
    if (!newLink.trim()) return;
    
    setIsImporting(true);
    try {
      const result = await importRecipeFromUrl(newLink.trim());
      
      if (result.success && result.meal) {
        const imported = result.meal;
        
        // Merge imported data with existing form data (don't overwrite user edits)
        const ingredientsText = imported.ingredients
          .map(ing => typeof ing === 'string' ? ing : (ing.quantity ? `${ing.quantity} ${ing.name}` : ing.name))
          .join('\n');

        const newFormData = {
          name: formData.name && formData.name !== meal.name ? formData.name : imported.name || formData.name,
          description: formData.description || imported.description || '',
          ingredientsText: formData.ingredientsText || ingredientsText,
          recipe: formData.recipe || imported.recipe || '',
          imageUrl: imported.imageUrl || formData.imageUrl || '',
          prepTime: formData.prepTime || (imported.prepTime ? imported.prepTime.toString() : ''),
          tagsText: formData.tagsText || imported.tags.join(', '),
          links: [...formData.links, newLink.trim()],
          notes: formData.notes || imported.notes || ''
        };
        
        setFormData(newFormData);
        
        // Auto-save the imported data
        const updatedMeal: Meal = {
          ...meal,
          name: toTitleCase(newFormData.name),
          description: newFormData.description,
          ingredients: newFormData.ingredientsText.split('\n').map((s: string) => s.trim()).filter(Boolean),
          recipe: newFormData.recipe,
          links: newFormData.links,
          tags: newFormData.tagsText.split(',').map((s: string) => s.trim()).filter(Boolean),
          prepTime: parseInt(newFormData.prepTime) || 0,
          imageUrl: newFormData.imageUrl,
          notes: newFormData.notes
        };
        updateMeal(updatedMeal);
        setOriginalData(JSON.stringify(newFormData));
        
        setNewLink('');
      } else {
        // Import failed - add as link anyway
        setFormData(prev => ({
          ...prev,
          links: [...prev.links, newLink.trim()]
        }));
        setNewLink('');
        alert(result.error || 'Could not import recipe details, but the link was added.');
      }
    } catch (error) {
      console.error('Error importing recipe:', error);
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, newLink.trim()]
      }));
      setNewLink('');
      alert('An error occurred while importing. The link was added.');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };
  
  // Get placeholder style for meals without images
  const getPlaceholderStyle = (mealName: string) => {
    const gradients = [
      'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
      'linear-gradient(135deg, #4ade80 0%, #059669 100%)',
      'linear-gradient(135deg, #60a5fa 0%, #4f46e5 100%)',
      'linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #f472b6 0%, #e11d48 100%)',
    ];
    const seed = mealName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[seed % gradients.length];
    const initials = mealName.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
    return { gradient, initials };
  };
  
  const placeholderStyle = getPlaceholderStyle(formData.name || meal.name);
  const displayImage = formData.imageUrl || meal.imageUrl;
  
  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <Button onClick={handleDelete} variant="danger" className="p-2" title="Delete meal">
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Image */}
        {displayImage ? (
          <img
            src={displayImage}
            alt={formData.name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div 
            className="w-full h-64 flex items-center justify-center"
            style={{ background: placeholderStyle.gradient }}
          >
            <span className="text-white text-9xl font-bold drop-shadow-lg">{placeholderStyle.initials}</span>
          </div>
        )}
        
        <div className="p-6 space-y-6">
          {/* Name and Prep Time */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="text-3xl font-bold text-gray-900 w-full border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 bg-transparent px-0 py-1 transition-colors"
                placeholder="Meal name"
              />
            </div>
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-500 mb-1 text-left">
                Prep time
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                  className="text-gray-700 w-12 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 bg-transparent px-0 py-1 transition-colors text-left"
                  placeholder="30"
                />
                <span className="text-gray-500 text-sm ml-0.5">min</span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="text-gray-600 w-full border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 bg-transparent px-0 py-1 transition-colors"
              placeholder="Brief description (optional)"
            />
          </div>
          
          {/* Recipe Links */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Import from recipe URL
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Paste recipe URL (e.g. allrecipes.com)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImportRecipe())}
                disabled={isImporting}
              />
              <Button 
                type="button" 
                onClick={handleImportRecipe} 
                variant="secondary"
                disabled={isImporting || !newLink.trim()}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Automatically imports ingredients, instructions, and image from recipe sites
            </p>
            {formData.links.length > 0 && (
              <div className="space-y-2">
                {formData.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded group">
                    <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formData.links.length === 0 && (
              <p className="text-sm text-gray-400 italic">No recipe links added yet</p>
            )}
          </div>
          
          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Ingredients (one per line)
            </label>
            <TextArea
              value={formData.ingredientsText}
              onChange={(e) => setFormData(prev => ({ ...prev, ingredientsText: e.target.value }))}
              placeholder="e.g.&#10;500g ground beef&#10;1 onion, diced&#10;2 cloves garlic"
              rows={5}
              className="border-gray-200 hover:border-gray-300 focus:border-primary-500"
            />
          </div>
          
          {/* Recipe Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Recipe instructions
            </label>
            <TextArea
              value={formData.recipe}
              onChange={(e) => setFormData(prev => ({ ...prev, recipe: e.target.value }))}
              placeholder="Step by step instructions..."
              rows={6}
              className="border-gray-200 hover:border-gray-300 focus:border-primary-500"
            />
          </div>
          
          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              className="text-gray-700 w-full border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 bg-transparent px-0 py-1 transition-colors text-sm"
              placeholder="Paste image URL or leave blank for AI-generated"
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Notes
            </label>
            <TextArea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={3}
              className="border-gray-200 hover:border-gray-300 focus:border-primary-500"
            />
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tags
            </label>
            {isEditingTags ? (
              <input
                type="text"
                value={formData.tagsText}
                onChange={(e) => setFormData(prev => ({ ...prev, tagsText: e.target.value }))}
                onBlur={() => setIsEditingTags(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTags(false)}
                className="text-gray-700 w-full border-0 border-b-2 border-primary-500 focus:border-primary-500 focus:ring-0 bg-transparent px-0 py-1 transition-colors"
                placeholder="e.g. Italian, pasta, quick"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingTags(true)}
                onMouseEnter={() => setIsHoveringTags(true)}
                onMouseLeave={() => setIsHoveringTags(false)}
                className="cursor-pointer min-h-[32px] py-1 border-b-2 border-transparent hover:border-gray-200 transition-colors"
              >
                {formData.tagsText ? (
                  isHoveringTags ? (
                    <span className="text-gray-500 italic">{formData.tagsText}</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.tagsText.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                          >
                            {tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  )
                ) : (
                  <span className="text-gray-400 italic">Click to add tags...</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Back Button at Bottom */}
      <div className="flex justify-center pb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to all meals</span>
        </button>
      </div>
      
      {/* Floating Save Button - only shows when there are changes */}
      {hasChanges && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 animate-slideUp">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-4">
            <span className="text-sm text-gray-600">You have unsaved changes</span>
            <Button onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
