// Photo scanning page for ingredient detection

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, X, Sparkles, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { detectIngredientsFromImage, DetectedIngredient } from '../utils/imageRecognition';
import { generateId } from '../utils/storage';
import { InventoryItem, IngredientCategory } from '../types';
import CameraCapture from '../components/CameraCapture';
import Button from '../components/Button';

export default function PhotoScan() {
  const { addInventoryItem } = useApp();
  const navigate = useNavigate();
  
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const handlePhotoCapture = async (file: File) => {
    setShowCamera(false);
    setIsAnalyzing(true);
    
    // Show preview of captured image
    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);
    
    try {
      const detected = await detectIngredientsFromImage(file);
      setDetectedIngredients(detected);
      
      // Auto-select all detected ingredients
      setSelectedIngredients(new Set(detected.map((_, idx) => idx)));
    } catch (error) {
      console.error('Failed to analyze image:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleIngredient = (index: number) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIngredients(newSelected);
  };

  const handleStartEdit = (index: number) => {
    const ing = detectedIngredients[index];
    setEditingIndex(index);
    setEditName(ing.name);
    setEditQuantity(ing.quantity || '');
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const updated = [...detectedIngredients];
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editName.trim() || updated[editingIndex].name,
      quantity: editQuantity.trim()
    };
    setDetectedIngredients(updated);
    setEditingIndex(null);
    setEditName('');
    setEditQuantity('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditName('');
    setEditQuantity('');
  };

  const handleDeleteIngredient = (index: number) => {
    const updated = detectedIngredients.filter((_, idx) => idx !== index);
    setDetectedIngredients(updated);
    
    // Update selected indices
    const newSelected = new Set<number>();
    selectedIngredients.forEach(idx => {
      if (idx < index) newSelected.add(idx);
      else if (idx > index) newSelected.add(idx - 1);
    });
    setSelectedIngredients(newSelected);
    
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleAddSelected = () => {
    const selected = detectedIngredients.filter((_, idx) => 
      selectedIngredients.has(idx)
    );
    
    selected.forEach(ing => {
      const item: InventoryItem = {
        id: generateId(),
        ingredientName: ing.name,
        quantity: ing.quantity || '',
        unit: '',
        category: (ing.category as IngredientCategory) || 'other',
        expirationDate: null,
        addedAt: new Date().toISOString(),
        notes: `Added via photo scan (${Math.round(ing.confidence * 100)}% confidence)`
      };
      addInventoryItem(item);
    });
    
    // Navigate to recommendations
    navigate('/recommendations');
  };

  const handleStartOver = () => {
    setDetectedIngredients([]);
    setSelectedIngredients(new Set());
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setShowCamera(true);
  };

  return (
    <div className="max-w-3xl mx-auto pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/fridge')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Scan Ingredients</h2>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📸</span>
          <div>
            <h3 className="font-semibold text-gray-900">AI-Powered Ingredient Detection</h3>
            <p className="text-sm text-gray-700 mt-1">
              Take a photo of your fridge or ingredients, and AI will automatically detect and add them to your inventory.
            </p>
            {detectedIngredients.length === 0 && (
              <p className="text-xs text-gray-600 mt-2">
                <strong>Demo Mode:</strong> Using simulated results. Connect a real AI API for actual detection.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      {detectedIngredients.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {isAnalyzing ? (
            <div className="text-center space-y-4">
              <div className="animate-spin w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-lg font-medium text-gray-900">Analyzing your photo...</p>
              <p className="text-sm text-gray-600">
                AI is detecting ingredients from your image
              </p>
              
              {capturedImage && (
                <div className="mt-6">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="max-w-sm mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">📷</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Take a Photo to Get Started
                </h3>
                <p className="text-gray-600">
                  Snap a photo of your fridge or ingredients and let AI do the work!
                </p>
              </div>
              
              <Button
                onClick={() => setShowCamera(true)}
                size="lg"
                className="flex items-center gap-2 mx-auto"
              >
                <Camera className="w-5 h-5" />
                Take or Upload Photo
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-900 font-medium mb-2">✨ What happens next:</p>
                <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>AI analyzes your photo</li>
                  <li>Ingredients are detected automatically</li>
                  <li>You review and confirm the items</li>
                  <li>Selected items are added to your fridge</li>
                  <li>Get instant meal recommendations!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview */}
          {capturedImage && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <img 
                src={capturedImage} 
                alt="Scanned" 
                className="max-w-md mx-auto rounded-lg"
              />
            </div>
          )}

          {/* Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detected Ingredients ({detectedIngredients.length})
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{selectedIngredients.size} selected</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {detectedIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedIngredients.has(idx)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIngredients.has(idx)}
                    onChange={() => toggleIngredient(idx)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                  />
                  
                  {editingIndex === idx ? (
                    // Edit mode
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Item name"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <input
                        type="text"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        placeholder="Quantity (e.g., 2 lbs)"
                        className="w-full sm:w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 text-white bg-primary-500 rounded-lg hover:bg-primary-600"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{ing.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                            {Math.round(ing.confidence * 100)}% confident
                          </span>
                        </div>
                        {ing.quantity && (
                          <span className="text-sm text-gray-600">Qty: {ing.quantity}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(idx);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIngredient(idx);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {selectedIngredients.has(idx) ? (
                          <Check className="w-5 h-5 text-primary-600" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                fullWidth
                onClick={handleAddSelected}
                disabled={selectedIngredients.size === 0}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Add {selectedIngredients.size} & Get Recommendations
              </Button>
              <Button
                variant="secondary"
                onClick={handleStartOver}
              >
                Scan Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
