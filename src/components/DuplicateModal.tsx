import { X } from 'lucide-react';
import Button from './Button';
import { Meal } from '../types';

interface DuplicateModalProps {
  existingMeal: Meal;
  newMealName: string;
  onKeepBoth: () => void;
  onViewExisting: () => void;
  onCancel: () => void;
}

export default function DuplicateModal({ existingMeal, newMealName, onKeepBoth, onViewExisting, onCancel }: DuplicateModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-forest-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-5 pb-8 sm:pb-5 border border-forest-500/60">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif font-semibold text-cream-100">Duplicate recipe</h3>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-forest-600 active:bg-forest-500">
            <X className="w-5 h-5 text-cream-400" />
          </button>
        </div>

        <p className="text-sm text-cream-300 mb-2">
          <span className="font-semibold text-cream-100">"{newMealName}"</span> already exists in your meals.
        </p>

        {existingMeal.imageUrl && (
          <div className="my-3 rounded-lg overflow-hidden border border-forest-500/40">
            <img src={existingMeal.imageUrl} alt={existingMeal.name} className="w-full h-32 object-cover" />
          </div>
        )}

        <p className="text-sm text-cream-400 mb-5">Would you like to view the existing recipe or add a duplicate?</p>

        <div className="space-y-2">
          <Button onClick={onViewExisting} className="w-full">
            View existing recipe
          </Button>
          <button
            onClick={onKeepBoth}
            className="w-full py-2.5 px-4 text-sm font-medium text-cream-400 hover:text-cream-100 hover:bg-forest-600 rounded-lg transition-colors border border-forest-500/50"
          >
            Add duplicate anyway
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm text-cream-500 hover:text-cream-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
