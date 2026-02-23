// Fridge page - inventory and recommendations

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, Camera } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useApp } from '../context/AppContext';
import { InventoryItem, IngredientCategory } from '../types';
import Button from '../components/Button';

const CATEGORIES: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: 'produce', label: 'Produce', emoji: '🥬' },
  { value: 'meat', label: 'Meat & Protein', emoji: '🥩' },
  { value: 'dairy', label: 'Dairy', emoji: '🧈' },
  { value: 'pantry', label: 'Pantry', emoji: '🥫' },
  { value: 'frozen', label: 'Frozen', emoji: '❄️' },
  { value: 'other', label: 'Other', emoji: '📦' }
];

export default function Fridge() {
  const { inventory, deleteInventoryItem } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inventory' | 'recommendations'>('inventory');
  
  const groupedInventory = CATEGORIES.map(cat => ({
    ...cat,
    items: inventory.filter(item => item.category === cat.value)
  })).filter(group => group.items.length > 0);
  
  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expirationDate) return false;
    const daysUntil = differenceInDays(new Date(item.expirationDate), new Date());
    return daysUntil >= 0 && daysUntil <= 3;
  };
  
  const handleDelete = (itemId: string) => {
    if (window.confirm('Remove this ingredient from your fridge?')) {
      deleteInventoryItem(itemId);
    }
  };
  
  return (
    <div className="pt-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Fridge</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/photo-scan')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Scan Photo
          </Button>
          <Button
            onClick={() => navigate('/add-ingredient')}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          What I Have
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recommendations
        </button>
      </div>
      
      {/* Content */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {inventory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🥗</div>
              <p className="text-gray-600 text-lg mb-4">
                Your fridge is empty. Start adding ingredients!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/photo-scan')}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Scan Photo (Quick!)
                </Button>
                <Button 
                  onClick={() => navigate('/add-ingredient')}
                  variant="secondary"
                >
                  Add Manually
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                📸 Tip: Use photo scan to add multiple ingredients instantly
              </p>
            </div>
          ) : (
            <>
              {groupedInventory.map(group => (
                <div key={group.value}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">{group.emoji}</span>
                    {group.label}
                  </h3>
                  
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-lg border p-4 flex items-center justify-between ${
                          isExpiringSoon(item)
                            ? 'border-yellow-300 bg-yellow-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {item.ingredientName}
                            </p>
                            {isExpiringSoon(item) && (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {item.quantity && (
                              <span>{item.quantity} {item.unit}</span>
                            )}
                            {item.expirationDate && (
                              <span className={isExpiringSoon(item) ? 'text-yellow-700 font-medium' : ''}>
                                Expires: {new Date(item.expirationDate).toLocaleDateString()}
                                {isExpiringSoon(item) && (
                                  <span className="ml-1">
                                    ({differenceInDays(new Date(item.expirationDate), new Date())} days)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      
      {activeTab === 'recommendations' && (
        <div className="text-center py-12">
          <Button
            onClick={() => navigate('/recommendations')}
            size="lg"
            className="flex items-center gap-2 mx-auto"
          >
            <span className="text-xl">✨</span>
            What Can I Make?
          </Button>
          <p className="text-gray-600 mt-4">
            Get meal recommendations based on your available ingredients
          </p>
        </div>
      )}
    </div>
  );
}
