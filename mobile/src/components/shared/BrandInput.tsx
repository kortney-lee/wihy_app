import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  value: string[];              // ["Prego", "Classico"]
  onChange: (brands: string[]) => void;
  placeholder?: string;
}

// Top 10 popular brands (hardcoded examples)
const EXAMPLE_BRANDS = [
  'Prego', 'Ragu', 'Kraft', 'Barilla', 'Organic Valley',
  'Chobani', 'Classico', 'De Cecco', 'Horizon', 'Fage'
];

export const BrandInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'e.g., Prego, Classico'
}) => {
  const brandText = value.join(', ');

  const handleTextChange = (text: string) => {
    // Parse comma-separated brands
    const brands = text
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);
    onChange(brands);
  };

  const addBrand = (brand: string) => {
    if (!value.includes(brand)) {
      onChange([...value, brand]);
    } else {
      // Remove if already selected
      onChange(value.filter(b => b !== brand));
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
      
      <Text style={styles.hint}>Separate with commas, or tap examples:</Text>
      
      <View style={styles.examplesContainer}>
        {EXAMPLE_BRANDS.map(brand => (
          <TouchableOpacity
            key={brand}
            style={[
              styles.exampleChip,
              value.includes(brand) && styles.exampleChipSelected
            ]}
            onPress={() => addBrand(brand)}
          >
            <Text style={[
              styles.exampleText,
              value.includes(brand) && styles.exampleTextSelected
            ]}>
              {brand}
            </Text>
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
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 8,
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  exampleChipSelected: {
    backgroundColor: '#43B02A',
    borderColor: '#43B02A',
  },
  exampleText: {
    fontSize: 13,
    color: '#333',
  },
  exampleTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});
