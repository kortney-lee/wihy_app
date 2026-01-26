import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface BrandOption {
  name: string;
  isCommon: boolean;
  source: 'database' | 'api' | 'fallback';
  country?: string;
}

interface Props {
  value: string[];              // ["Prego", "Classico"]
  onChange: (brands: string[]) => void;
  ingredientName?: string;      // Phase 3: fetch real brands from API
  placeholder?: string;
}

// Top 10 popular brands (hardcoded fallback)
const FALLBACK_BRANDS: BrandOption[] = [
  { name: 'Prego', isCommon: true, source: 'fallback' },
  { name: 'Ragu', isCommon: true, source: 'fallback' },
  { name: 'Kraft', isCommon: true, source: 'fallback' },
  { name: 'Barilla', isCommon: true, source: 'fallback' },
  { name: 'Organic Valley', isCommon: true, source: 'fallback' },
  { name: 'Chobani', isCommon: false, source: 'fallback' },
  { name: 'Classico', isCommon: false, source: 'fallback' },
  { name: 'De Cecco', isCommon: false, source: 'fallback' },
  { name: 'Horizon', isCommon: false, source: 'fallback' },
  { name: 'Fage', isCommon: false, source: 'fallback' },
];

const API_BASE = 'https://services.wihy.ai/api';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
const brandCache: Record<string, { brands: BrandOption[], timestamp: number }> = {};

export const BrandInput: React.FC<Props> = ({
  value,
  onChange,
  ingredientName,
  placeholder = 'e.g., Prego, Classico'
}) => {
  const [brands, setBrands] = useState<BrandOption[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brandText = value.join(', ');

  // Fetch brands when ingredientName changes (Phase 3)
  useEffect(() => {
    if (ingredientName && ingredientName.length > 2) {
      fetchBrands(ingredientName);
    } else {
      setBrands(FALLBACK_BRANDS);
    }
  }, [ingredientName]);

  const fetchBrands = async (name: string) => {
    const cacheKey = name.toLowerCase();
    
    // Check cache first
    const cached = brandCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[BrandInput] Using cached brands for:', name);
      setBrands(cached.brands);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE}/ingredients/${encodeURIComponent(name)}/brands?country=US`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.brands && data.brands.length > 0) {
        const apiBrands: BrandOption[] = data.brands.map((b: any) => ({
          name: b.name,
          isCommon: b.isCommon || false,
          source: b.source || 'api',
          country: b.country,
        }));
        
        // Cache the result
        brandCache[cacheKey] = { brands: apiBrands, timestamp: Date.now() };
        
        console.log('[BrandInput] Fetched brands for:', name, apiBrands.length);
        setBrands(apiBrands);
      } else {
        // No brands found, use fallback
        setBrands(FALLBACK_BRANDS);
      }
    } catch (err: any) {
      console.warn('[BrandInput] API error, using fallback:', err.message);
      setError('Could not load suggestions');
      setBrands(FALLBACK_BRANDS);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    // Parse comma-separated brands
    const parsedBrands = text
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);
    onChange(parsedBrands);
  };

  const toggleBrand = (brandName: string) => {
    if (value.includes(brandName)) {
      onChange(value.filter(b => b !== brandName));
    } else {
      onChange([...value, brandName]);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'database': return '✓';
      case 'api': return '🌐';
      case 'fallback': return '📋';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preferred Brands (optional)</Text>
      
      <TextInput
        style={styles.input}
        value={brandText}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
      
      <View style={styles.hintRow}>
        <Text style={styles.hint}>
          {ingredientName ? `Suggestions for "${ingredientName}":` : 'Tap examples to add:'}
        </Text>
        {loading && <ActivityIndicator size="small" color="#43B02A" style={styles.loader} />}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <View style={styles.brandsContainer}>
        {brands.map((brand, index) => (
          <TouchableOpacity
            key={`${brand.name}-${index}`}
            style={[
              styles.brandChip,
              value.includes(brand.name) && styles.brandChipSelected
            ]}
            onPress={() => toggleBrand(brand.name)}
          >
            <Text style={[
              styles.brandText,
              value.includes(brand.name) && styles.brandTextSelected
            ]}>
              {brand.isCommon && '⭐ '}{brand.name}
            </Text>
            {brand.source !== 'fallback' && (
              <Text style={[
                styles.sourceIcon,
                value.includes(brand.name) && styles.sourceIconSelected
              ]}>
                {getSourceIcon(brand.source)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  loader: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 8,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 4,
  },
  brandChipSelected: {
    backgroundColor: '#43B02A',
    borderColor: '#43B02A',
  },
  brandText: {
    fontSize: 13,
    color: '#333',
  },
  brandTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  sourceIcon: {
    fontSize: 10,
    color: '#999',
  },
  sourceIconSelected: {
    color: '#E8F5E4',
  },
});
