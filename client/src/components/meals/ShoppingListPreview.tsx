import React from 'react';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { ShoppingListItem } from '../../types/meals';

interface ShoppingListPreviewProps {
  shoppingList: ShoppingListItem[];
  showSources?: boolean;
  compact?: boolean;
}

export const ShoppingListPreview: React.FC<ShoppingListPreviewProps> = ({
  shoppingList,
  showSources = false,
  compact = false
}) => {
  // Group items by category
  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  // Sort categories in logical shopping order
  const categoryOrder = ['Produce', 'Protein', 'Dairy', 'Frozen', 'Pantry', 'Other'];
  const sortedCategories = categoryOrder.filter(category => groupedItems[category]);

  if (shoppingList.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Add meals and ingredients to generate your shopping list</p>
        </div>
      </div>
    );
  }

  const formatQuantity = (quantity: number) => {
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Shopping List</h3>
      
      {sortedCategories.map(category => {
        const items = groupedItems[category].sort((a, b) => a.name.localeCompare(b.name));
        
        return (
          <div key={category} className="mb-6 last:mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-[#fa5f06] border-b border-gray-200 pb-1">{category}</h4>
              <span className="text-sm text-gray-500">{items.length} item{items.length > 1 ? 's' : ''}</span>
            </div>
            
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.name}-${index}`} className={`flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200 ${item.needsReview ? 'border-l-4 border-amber-400' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">{formatQuantity(item.quantity)}</span>
                      <span className="text-gray-500">{item.unit}</span>
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                    
                    {item.needsReview && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-amber-600 font-medium">Needs Review</span>
                      </div>
                    )}
                    
                    {showSources && item.sources.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">Used in:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.sources.map((source, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-200 text-xs text-gray-700 rounded">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Summary */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{shoppingList.length}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{sortedCategories.length}</div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
          {shoppingList.some(item => item.needsReview) && (
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{shoppingList.filter(item => item.needsReview).length}</div>
              <div className="text-sm text-amber-600">Need Review</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};