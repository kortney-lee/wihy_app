import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ShoppingListItem, InstacartOrder } from '../../types/meals';

interface InstacartOrderBlockProps {
  mealPlanId: string;
  shoppingList: ShoppingListItem[];
  onOrderCreated?: (orderId: string) => void;
}

export const InstacartOrderBlock: React.FC<InstacartOrderBlockProps> = ({
  mealPlanId,
  shoppingList,
  onOrderCreated
}) => {
  const [instacartOrder, setInstacartOrder] = useState<InstacartOrder | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');

  // Mock store options (in real app, these would come from Instacart API)
  const storeOptions = [
    { id: 'costco', name: 'Costco Wholesale', available: true },
    { id: 'kroger', name: 'Kroger', available: true },
    { id: 'safeway', name: 'Safeway', available: true },
    { id: 'whole-foods', name: 'Whole Foods Market', available: true },
    { id: 'walmart', name: 'Walmart Grocery', available: false },
  ];

  useEffect(() => {
    // Check if there's an existing order for this meal plan
    const existingOrder = checkExistingOrder(mealPlanId);
    if (existingOrder) {
      setInstacartOrder(existingOrder);
    }
  }, [mealPlanId]);

  const checkExistingOrder = (planId: string): InstacartOrder | null => {
    // TODO: Replace with actual API call
    // For now, return mock data if order exists
    const savedOrder = localStorage.getItem(`instacart-order-${planId}`);
    return savedOrder ? JSON.parse(savedOrder) : null;
  };

  const generateInstacartLink = async () => {
    if (shoppingList.length === 0) {
      alert('Please add items to your meal plan first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call to generate Instacart link
      const newOrder: InstacartOrder = {
        id: `order-${Date.now()}`,
        mealPlanId,
        status: 'generated',
        createdAt: new Date(),
        link: generateMockInstacartLink()
      };

      // Save order (in real app, this would be API call)
      localStorage.setItem(`instacart-order-${mealPlanId}`, JSON.stringify(newOrder));
      
      setInstacartOrder(newOrder);
      onOrderCreated?.(newOrder.id);
      
      // Show success notification
      console.log('Instacart link generated:', newOrder.link);
      
    } catch (error) {
      console.error('Failed to generate Instacart link:', error);
      alert('Failed to generate Instacart link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockInstacartLink = (): string => {
    // In real implementation, this would use Instacart's API
    const baseUrl = 'https://www.instacart.com/store';
    const storeSlug = selectedStore || 'kroger';
    
    // Create URL with shopping list items as parameters
    const items = shoppingList.map(item => 
      `${item.quantity} ${item.unit} ${item.name}`
    ).join(',');
    
    const encodedItems = encodeURIComponent(items);
    return `${baseUrl}/${storeSlug}/search?query=${encodedItems}&utm_source=wihy&utm_campaign=meal_plan`;
  };

  const copyOrderLink = () => {
    if (instacartOrder?.link) {
      navigator.clipboard.writeText(instacartOrder.link);
      // TODO: Show toast notification
      console.log('Link copied to clipboard');
    }
  };

  const regenerateLink = () => {
    setInstacartOrder(null);
    localStorage.removeItem(`instacart-order-${mealPlanId}`);
    generateInstacartLink();
  };

  const openInstacart = () => {
    if (instacartOrder?.link) {
      window.open(instacartOrder.link, '_blank');
      
      // Update order status to ordered
      const updatedOrder = { ...instacartOrder, status: 'ordered' as const };
      setInstacartOrder(updatedOrder);
      localStorage.setItem(`instacart-order-${mealPlanId}`, JSON.stringify(updatedOrder));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Instacart Shopping</h3>
          <div className="text-green-600">
            <ShoppingCart size={24} />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Order your ingredients directly through Instacart for convenient delivery
        </p>
      </div>

      <div className="space-y-4">
        {/* Store Selector (if no order exists) */}
        {!instacartOrder && (
          <div className="space-y-2">
            <label htmlFor="store-select" className="block text-sm font-medium text-gray-700">Preferred Store:</label>
            <select
              id="store-select"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Auto-select best store</option>
              {storeOptions.map(store => (
                <option 
                  key={store.id} 
                  value={store.id} 
                  disabled={!store.available}
                >
                  {store.name} {!store.available ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Order Status */}
        {instacartOrder ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Order Status:</span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                instacartOrder.status === 'generated' ? 'bg-blue-100 text-blue-700' :
                instacartOrder.status === 'ordered' ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {instacartOrder.status === 'generated' && '🔗 Link Ready'}
                {instacartOrder.status === 'ordered' && '✅ Ordered'}
                {instacartOrder.status === 'pending' && '⏳ Processing'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900 font-medium">
                  {instacartOrder.createdAt.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="text-gray-900 font-medium">{shoppingList.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center space-y-2">
            <div className="text-3xl">📝</div>
            <p className="text-gray-600">No Instacart order created yet</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!instacartOrder ? (
            <button
              onClick={generateInstacartLink}
              disabled={isGenerating || shoppingList.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  🔗 Generate Instacart Link
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={openInstacart}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                <ShoppingCart size={16} />
                Order in Instacart
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={copyOrderLink}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={regenerateLink}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
                >
                  🔄 Regenerate
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Link Preview */}
        {instacartOrder?.link && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Order Link:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={instacartOrder.link}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none"
              />
              <button onClick={copyOrderLink} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                📋
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Generate a link that opens Instacart with your shopping list pre-filled. 
            Select your preferred store and checkout for delivery or pickup.
          </p>
        </div>
      </div>
    </div>
  );
};