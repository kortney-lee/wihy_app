import React from 'react';
import SearchResults from './SearchResults';
import './VHealthSearch.css'; // Use the existing CSS file

const SearchResultsPage: React.FC = () => {
  // Sample dummy data to display
  const mockQuery = "healthy foods";
  const mockResults = `
# Healthy Foods

Eating a balanced diet rich in whole foods is essential for optimal health and wellbeing. Here are some of the healthiest foods you can incorporate into your diet:

## Fruits and Vegetables
- **Leafy greens** (spinach, kale, swiss chard)
- **Berries** (blueberries, strawberries, raspberries)
- **Cruciferous vegetables** (broccoli, cauliflower, brussels sprouts)
- **Citrus fruits** (oranges, lemons, grapefruits)

## Proteins
- **Fatty fish** rich in omega-3s (salmon, mackerel, sardines)
- **Lean poultry** (chicken, turkey)
- **Eggs**
- **Legumes** (beans, lentils, chickpeas)

## Whole Grains
- **Oats**
- **Quinoa**
- **Brown rice**
- **Whole wheat products**

## Healthy Fats
- **Avocados**
- **Olive oil**
- **Nuts and seeds**

These foods provide essential nutrients, antioxidants, and fiber that help reduce inflammation, support immune function, and lower risk of chronic diseases.

**Remember:** The best diet includes a variety of different whole foods to ensure you get a broad spectrum of nutrients.`;

  // Mock handlers
  const handleBackToSearch = () => {
    console.log("Back to search clicked");
  };

  const handleNewSearch = (query: string, results?: string, dataSource?: string) => {
    console.log(`New search: ${query}`);
  };

  return (
    <SearchResults 
      query={mockQuery}
      results={mockResults}
      onBackToSearch={handleBackToSearch}
      onNewSearch={handleNewSearch}
      isLoading={false}
      dataSource="openai"
    />
  );
};

export default SearchResultsPage;