import React, { useState } from 'react';
import { Download, Copy, Printer } from 'lucide-react';
import { ShoppingListPreview } from './ShoppingListPreview';
import { InstacartOrderBlock } from './InstacartOrderBlock';
import { ShoppingListItem } from '../../types/meals';

interface ShoppingOutputsProps {
  shoppingList: ShoppingListItem[];
  mealPlanId: string;
}

export const ShoppingOutputs: React.FC<ShoppingOutputsProps> = ({
  shoppingList,
  mealPlanId
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'print'>('csv');

  const exportShoppingList = (format: 'csv' | 'print' | 'copy') => {
    const groupedItems = groupItemsByCategory(shoppingList);
    
    if (format === 'copy') {
      const textList = formatAsText(groupedItems);
      navigator.clipboard.writeText(textList);
      // TODO: Show toast notification
      return;
    }

    if (format === 'csv') {
      downloadAsCSV(shoppingList);
    } else if (format === 'print') {
      printShoppingList(groupedItems);
    }
  };

  const groupItemsByCategory = (items: ShoppingListItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    // Sort categories in logical shopping order
    const categoryOrder = ['Produce', 'Protein', 'Dairy', 'Frozen', 'Pantry', 'Other'];
    return categoryOrder.reduce((ordered, category) => {
      if (grouped[category]) {
        ordered[category] = grouped[category].sort((a, b) => a.name.localeCompare(b.name));
      }
      return ordered;
    }, {} as Record<string, ShoppingListItem[]>);
  };

  const formatAsText = (groupedItems: Record<string, ShoppingListItem[]>) => {
    let text = 'Shopping List\n\n';
    
    Object.entries(groupedItems).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      items.forEach(item => {
        const quantity = item.quantity % 1 === 0 ? item.quantity.toString() : item.quantity.toFixed(1);
        text += `• ${quantity} ${item.unit} ${item.name}${item.needsReview ? ' (needs review)' : ''}\n`;
      });
      text += '\n';
    });
    
    return text;
  };

  const downloadAsCSV = (items: ShoppingListItem[]) => {
    const csvContent = [
      'Item,Quantity,Unit,Category,Notes',
      ...items.map(item => 
        `"${item.name}",${item.quantity},"${item.unit}","${item.category}","${item.needsReview ? 'Needs review' : ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping-list-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const printShoppingList = (groupedItems: Record<string, ShoppingListItem[]>) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopping List</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 600px;
            }
            h1 { 
              color: #fa5f06; 
              margin-bottom: 20px;
            }
            h2 { 
              color: #1f2937; 
              margin-top: 20px; 
              margin-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 4px;
            }
            ul { 
              list-style: none; 
              padding-left: 0;
              margin: 0;
            }
            li { 
              margin-bottom: 4px; 
              padding: 4px 0;
            }
            .needs-review {
              color: #e74c3c;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <h1>WiHY Shopping List</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          ${Object.entries(groupedItems).map(([category, items]) => `
            <h2>${category}</h2>
            <ul>
              ${items.map(item => {
                const quantity = item.quantity % 1 === 0 ? item.quantity.toString() : item.quantity.toFixed(1);
                return `<li>• ${quantity} ${item.unit} ${item.name}${item.needsReview ? ' <span class="needs-review">(needs review)</span>' : ''}</li>`;
              }).join('')}
            </ul>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Count validation issues
  const validationIssues = {
    needsReview: shoppingList.filter(item => item.needsReview).length,
    emptyItems: shoppingList.filter(item => !item.name.trim()).length,
    zeroQuantity: shoppingList.filter(item => item.quantity <= 0).length
  };

  const totalIssues = Object.values(validationIssues).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {totalIssues > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex flex-wrap gap-2">
            {validationIssues.needsReview > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {validationIssues.needsReview} item{validationIssues.needsReview > 1 ? 's' : ''} need units
              </span>
            )}
            {validationIssues.emptyItems > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {validationIssues.emptyItems} empty item{validationIssues.emptyItems > 1 ? 's' : ''}
              </span>
            )}
            {validationIssues.zeroQuantity > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {validationIssues.zeroQuantity} item{validationIssues.zeroQuantity > 1 ? 's' : ''} with zero quantity
              </span>
            )}
          </div>
        </div>
      )}

      {/* Section C: Combined Shopping List */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Shopping List ({shoppingList.length} items)</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => exportShoppingList('copy')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              title="Copy to clipboard"
            >
              <Copy size={16} />
              Copy
            </button>
            <div className="export-dropdown">
              <button className="export-btn export">
                <Download size={16} />
                Export
              </button>
              <div className="dropdown-content">
                <button onClick={() => exportShoppingList('csv')}>
                  Download CSV
                </button>
                <button onClick={() => exportShoppingList('print')}>
                  Print List
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="shopping-list-container">
          <ShoppingListPreview 
            shoppingList={shoppingList}
            showSources={true}
          />
        </div>
      </div>

      {/* Section D: Instacart Ordering */}
      <div className="instacart-section">
        <InstacartOrderBlock 
          mealPlanId={mealPlanId}
          shoppingList={shoppingList}
        />
      </div>
    </div>
  );
};