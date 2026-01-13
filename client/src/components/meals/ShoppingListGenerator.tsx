import React, { useState } from 'react';
import { ShoppingCart, Check, ChevronDown, ChevronUp, Send, Printer, Download, Share2, Store, Mail, X, AlertCircle } from 'lucide-react';
import { ShoppingListItem, InstacartCartResponse } from '../../types/meals';

interface ShoppingListGeneratorProps {
  items: ShoppingListItem[];
  totalCost?: number;
  onExportToInstacart: () => Promise<InstacartCartResponse | null>;
  onEmailList: (email: string) => void;
  onShare: () => void;
  onPrint: () => void;
  onUpdateItem: (itemId: string, updates: Partial<ShoppingListItem>) => void;
  onRemoveItem: (itemId: string) => void;
  preferredStores?: string[];
  instacartConnected?: boolean;
}

interface CategoryGroup {
  name: string;
  icon: string;
  items: ShoppingListItem[];
  expanded: boolean;
}

const categoryConfig: Record<string, { icon: string; order: number }> = {
  'Proteins': { icon: '🥩', order: 1 },
  'Produce': { icon: '🥬', order: 2 },
  'Grains': { icon: '🌾', order: 3 },
  'Dairy': { icon: '🧀', order: 4 },
  'Pantry': { icon: '🫙', order: 5 },
  'Frozen': { icon: '❄️', order: 6 },
  'Beverages': { icon: '🥤', order: 7 },
  'Snacks': { icon: '🍿', order: 8 },
  'Condiments': { icon: '🍯', order: 9 },
  'Spices': { icon: '🧂', order: 10 },
  'Baking': { icon: '🧁', order: 11 },
  'Other': { icon: '📦', order: 99 }
};

export const ShoppingListGenerator: React.FC<ShoppingListGeneratorProps> = ({
  items,
  totalCost,
  onExportToInstacart,
  onEmailList,
  onShare,
  onPrint,
  onUpdateItem,
  onRemoveItem,
  preferredStores = ['Kroger', 'Whole Foods', 'Walmart'],
  instacartConnected = false
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState(preferredStores[0] || '');

  // Group items by category
  const groupedItems = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Sort categories by order
  const sortedCategories = Object.entries(groupedItems).sort(([a], [b]) => {
    const orderA = categoryConfig[a]?.order || 99;
    const orderB = categoryConfig[b]?.order || 99;
    return orderA - orderB;
  });

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Expand all categories
  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(groupedItems)));
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Calculate stats
  const checkedCount = items.filter(i => i.checked).length;
  const totalItems = items.length;
  const estimatedCost = totalCost ?? items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

  // Handle Instacart export
  const handleInstacartExport = async () => {
    setIsExporting(true);
    try {
      const result = await onExportToInstacart();
      if (result?.cartUrl) {
        setExportSuccess('Cart created! Redirecting to Instacart...');
        setTimeout(() => {
          window.open(result.cartUrl, '_blank');
          setExportSuccess(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle email send
  const handleSendEmail = () => {
    if (email.trim()) {
      onEmailList(email.trim());
      setShowEmailModal(false);
      setEmail('');
    }
  };

  return (
    <div className="bg-[#f0f7ff] min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">🛒 Shopping List</h1>
            <p className="text-gray-500 text-sm">
              {checkedCount}/{totalItems} items • Est. ${estimatedCost.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{checkedCount} of {totalItems} items</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
              style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Store Selection */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Store className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Preferred Store</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {preferredStores.map(store => (
              <button
                key={store}
                onClick={() => setSelectedStore(store)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedStore === store
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {store}
              </button>
            ))}
          </div>
        </div>

        {/* Category Groups */}
        <div className="space-y-4 mb-6">
          {sortedCategories.map(([category, categoryItems]) => {
            const config = categoryConfig[category] || categoryConfig['Other'];
            const isExpanded = expandedCategories.has(category);
            const categoryChecked = categoryItems.filter(i => i.checked).length;

            return (
              <div
                key={category}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{category}</h3>
                      <p className="text-xs text-gray-500">
                        {categoryChecked}/{categoryItems.length} items
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-4 border-b border-gray-50 last:border-b-0 ${
                          item.checked ? 'bg-gray-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => onUpdateItem(item.id, { checked: !item.checked })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.checked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.checked && <Check className="w-4 h-4 text-white" />}
                        </button>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} {item.unit}
                            {item.estimatedPrice && ` • ~$${item.estimatedPrice.toFixed(2)}`}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200 mb-6">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items yet</h3>
            <p className="text-gray-500">Add items from your meal plan to create a shopping list.</p>
          </div>
        )}

        {/* Export Options */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Export Options</h2>
          
          {/* Primary Export - Instacart */}
          <button
            onClick={handleInstacartExport}
            disabled={isExporting || items.length === 0}
            className="w-full py-4 bg-gradient-to-r from-[#43B02A] to-[#38A02C] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-[#38A02C] hover:to-[#2D8024] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            <ShoppingCart className="w-6 h-6" />
            {isExporting ? 'Creating Cart...' : 'Add to Instacart Cart'}
          </button>

          {!instacartConnected && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Connect your Instacart account for one-click ordering</span>
            </div>
          )}

          {exportSuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">
              <Check className="w-4 h-4" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Secondary Export Options */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Email</span>
            </button>
            <button
              onClick={onShare}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <Share2 className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Share</span>
            </button>
            <button
              onClick={onPrint}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Printer className="w-5 h-5 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Print</span>
            </button>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Estimated Total</p>
              <p className="text-3xl font-bold">${estimatedCost.toFixed(2)}</p>
              <p className="text-orange-200 text-sm mt-1">at {selectedStore}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm">Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">📧 Email Shopping List</h3>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!email.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
