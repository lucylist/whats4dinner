// Add Ingredient form

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem, IngredientCategory } from '../types';
import { generateId } from '../utils/storage';
import Button from '../components/Button';
import Input from '../components/Input';
import TextArea from '../components/TextArea';

const CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: 'produce', label: 'Produce' },
  { value: 'meat', label: 'Meat & Protein' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'other', label: 'Other' }
];

const UNITS = ['', 'pieces', 'lbs', 'oz', 'kg', 'g', 'cups', 'tbsp', 'tsp', 'ml', 'L'];

export default function AddIngredient() {
  const { addInventoryItem } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    ingredientName: '',
    quantity: '',
    unit: '',
    category: 'other' as IngredientCategory,
    expirationDate: '',
    notes: ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const item: InventoryItem = {
      id: generateId(),
      ingredientName: formData.ingredientName,
      quantity: formData.quantity,
      unit: formData.unit,
      category: formData.category,
      expirationDate: formData.expirationDate || null,
      addedAt: new Date().toISOString(),
      notes: formData.notes
    };
    
    addInventoryItem(item);
    navigate('/fridge');
  };
  
  return (
    <div className="max-w-2xl mx-auto pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/fridge')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Cancel
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Add Ingredient</h2>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <Input
          label="Ingredient Name"
          required
          value={formData.ingredientName}
          onChange={(e) => setFormData(prev => ({ ...prev, ingredientName: e.target.value }))}
          placeholder="e.g., Chicken breast"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="2"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {UNITS.map(unit => (
                <option key={unit || 'none'} value={unit}>
                  {unit || 'Select unit'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as IngredientCategory }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        
        <Input
          label="Expiration Date"
          type="date"
          value={formData.expirationDate}
          onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
        />
        
        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes..."
          rows={2}
        />
        
        {/* Quick Add hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Quick Add Mode:</strong> Just enter the ingredient name and save for faster entry!
          </p>
        </div>
        
        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" fullWidth>
            Add Ingredient
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/fridge')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
