import pandas as pd
import re
from typing import Dict, List, Any, Optional, Tuple
from .connection import get_wihy_ml_db
import logging

logger = logging.getLogger(__name__)

class NourishScorer:
    """Enhanced nutrition scoring system with Nourish/Mixed/Fill logic"""
    
    def __init__(self):
        self.wihy_ml_db = get_wihy_ml_db()
    
    def calculate_per_100_kcal(self, value_per_100g: float, kcal_per_100g: float) -> Optional[float]:
        """Calculate nutrient density per 100 kcal"""
        if not kcal_per_100g or kcal_per_100g <= 0:
            return None
        return (value_per_100g / kcal_per_100g) * 100
    
    def parse_numeric_value(self, value) -> Optional[float]:
        """Safely parse numeric values from database"""
        if pd.isna(value) or value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def analyze_ingredients(self, ingredients_text: str) -> Dict[str, bool]:
        """Analyze ingredients text for various heuristics"""
        if not ingredients_text or pd.isna(ingredients_text):
            return {
                'few_ingredients': False,
                'whole_word_hit': False,
                'industrial_fats': False,
                'artificial_sweeteners': False
            }
        
        ingredients_lower = ingredients_text.lower()
        ingredients_list = [i.strip() for i in ingredients_lower.split(',')]
        
        # Few ingredients (≤5)
        few_ingredients = len(ingredients_list) <= 5
        
        # Whole word hit
        whole_word_hit = 'whole' in ingredients_lower
        
        # Industrial fats
        industrial_fat_keywords = ['hydrogenated', 'interesterified']
        industrial_fats = any(keyword in ingredients_lower for keyword in industrial_fat_keywords)
        
        # Artificial sweeteners
        artificial_sweetener_keywords = ['acesulfame', 'sucralose', 'aspartame']
        artificial_sweeteners = any(keyword in ingredients_lower for keyword in artificial_sweetener_keywords)
        
        return {
            'few_ingredients': few_ingredients,
            'whole_word_hit': whole_word_hit,
            'industrial_fats': industrial_fats,
            'artificial_sweeteners': artificial_sweeteners
        }
    
    def calculate_nourish_score(self, product: pd.Series) -> Dict[str, Any]:
        """Calculate comprehensive nourish score with detailed reasoning"""
        
        # Extract basic nutrition values
        energy_kcal = self.parse_numeric_value(product.get('energy_kcal_100g'))
        
        # If no calorie data, we can't score properly
        if energy_kcal is None or energy_kcal <= 0:
            return {
                'label': 'Unknown',
                'nourish_score': 0,
                'reasons': ['Missing calories per 100g - cannot calculate nutrition density'],
                'data_sources': ['wihy_ml'],
                'confidence': 0.0,
                'signals': {}
            }
        
        # Extract nutrient values
        protein = self.parse_numeric_value(product.get('proteins_100g', 0)) or 0
        fiber = self.parse_numeric_value(product.get('fiber_100g', 0)) or 0
        added_sugars = self.parse_numeric_value(product.get('added_sugars_100g'))
        sugars = self.parse_numeric_value(product.get('sugars_100g', 0)) or 0
        sodium_g = self.parse_numeric_value(product.get('sodium_100g', 0)) or 0
        nova_group = self.parse_numeric_value(product.get('nova_group'))
        
        # Use added sugars if available, otherwise fall back to total sugars
        sugar_value = added_sugars if added_sugars is not None else sugars
        
        # Convert sodium from grams to mg (handle both cases)
        sodium_mg = sodium_g * 1000 if sodium_g <= 20 else sodium_g
        
        # Calculate per-100-kcal densities
        protein_per_100kcal = self.calculate_per_100_kcal(protein, energy_kcal) or 0
        fiber_per_100kcal = self.calculate_per_100_kcal(fiber, energy_kcal) or 0
        sugar_per_100kcal = self.calculate_per_100_kcal(sugar_value, energy_kcal) or 0
        sodium_mg_per_100kcal = self.calculate_per_100_kcal(sodium_mg, energy_kcal) or 0
        
        # Analyze ingredients
        ingredients_analysis = self.analyze_ingredients(product.get('ingredients_text', ''))
        
        # Calculate individual signal scores
        signals = {}
        
        # Positive signals
        signals['protein'] = min(20.0, protein_per_100kcal * 4.0)
        signals['fiber'] = min(15.0, fiber_per_100kcal * 7.5)
        
        # Whole food heuristic
        if ingredients_analysis['few_ingredients'] and ingredients_analysis['whole_word_hit']:
            signals['whole'] = 10.0
        elif ingredients_analysis['few_ingredients']:
            signals['whole'] = 5.0
        else:
            signals['whole'] = 0.0
        
        # NOVA score
        if nova_group == 1:
            signals['nova'] = 10.0
        elif nova_group == 2:
            signals['nova'] = 5.0
        elif nova_group == 4:
            signals['nova'] = -15.0
        else:
            signals['nova'] = 0.0
        
        # Negative signals
        if sugar_per_100kcal >= 10:
            signals['sugar'] = -20.0
        elif sugar_per_100kcal >= 5:
            signals['sugar'] = -10.0
        else:
            signals['sugar'] = 0.0
        
        if sodium_mg_per_100kcal >= 400:
            signals['sodium'] = -10.0
        elif sodium_mg_per_100kcal >= 200:
            signals['sodium'] = -5.0
        else:
            signals['sodium'] = 0.0
        
        signals['industrial_fats'] = -10.0 if ingredients_analysis['industrial_fats'] else 0.0
        signals['artificial_sweeteners'] = -5.0 if ingredients_analysis['artificial_sweeteners'] else 0.0
        
        # Calculate total score
        total_score = sum(signals.values())
        
        # Determine label
        if total_score >= 60:
            label = 'Nourish'
        elif total_score >= 40:
            label = 'Mixed'
        else:
            label = 'Fill'
        
        # Generate detailed reasons
        reasons = self.generate_reasons(signals, protein_per_100kcal, fiber_per_100kcal, 
                                      sugar_per_100kcal, sodium_mg_per_100kcal, 
                                      ingredients_analysis, nova_group)
        
        # Calculate confidence based on data availability
        total_signals = 8
        available_signals = sum([
            1 if protein > 0 else 0,
            1 if fiber > 0 else 0,
            1 if product.get('ingredients_text') else 0,
            1 if nova_group is not None else 0,
            1 if sugar_value > 0 else 0,
            1 if sodium_mg > 0 else 0,
            1,  # Always have energy if we got here
            1   # Industrial fats/sweeteners can be determined from ingredients
        ])
        confidence = available_signals / total_signals
        
        return {
            'label': label,
            'nourish_score': round(total_score, 1),
            'reasons': reasons,
            'data_sources': ['wihy_ml'],
            'confidence': round(confidence, 2),
            'signals': {k: round(v, 1) for k, v in signals.items()},
            'densities': {
                'protein_per_100kcal': round(protein_per_100kcal, 1),
                'fiber_per_100kcal': round(fiber_per_100kcal, 1),
                'sugar_per_100kcal': round(sugar_per_100kcal, 1),
                'sodium_mg_per_100kcal': round(sodium_mg_per_100kcal, 1)
            }
        }
    
    def generate_reasons(self, signals: Dict[str, float], protein_density: float, 
                        fiber_density: float, sugar_density: float, sodium_density: float,
                        ingredients_analysis: Dict[str, bool], nova_group: Optional[float]) -> List[str]:
        """Generate human-readable reasons for the score"""
        reasons = []
        
        # Positive reasons
        if signals['protein'] >= 10:
            reasons.append(f"Good protein density ({protein_density:.1f}g per 100 kcal)")
        elif signals['protein'] >= 5:
            reasons.append(f"Moderate protein content ({protein_density:.1f}g per 100 kcal)")
        
        if signals['fiber'] >= 10:
            reasons.append(f"High fiber density ({fiber_density:.1f}g per 100 kcal)")
        elif signals['fiber'] >= 5:
            reasons.append(f"Good fiber content ({fiber_density:.1f}g per 100 kcal)")
        
        if signals['whole'] == 10:
            reasons.append("Short ingredient list with whole foods")
        elif signals['whole'] == 5:
            reasons.append("Simple ingredient list")
        
        if signals['nova'] == 10:
            reasons.append("Minimally processed (NOVA Group 1)")
        elif signals['nova'] == 5:
            reasons.append("Lightly processed (NOVA Group 2)")
        elif signals['nova'] == -15:
            reasons.append("Ultra-processed (NOVA Group 4)")
        
        # Negative reasons
        if signals['sugar'] <= -15:
            reasons.append(f"Very high sugar density ({sugar_density:.1f}g per 100 kcal)")
        elif signals['sugar'] <= -5:
            reasons.append(f"High sugar density ({sugar_density:.1f}g per 100 kcal)")
        
        if signals['sodium'] <= -8:
            reasons.append(f"Very high sodium density ({sodium_density:.0f}mg per 100 kcal)")
        elif signals['sodium'] <= -3:
            reasons.append(f"High sodium density ({sodium_density:.0f}mg per 100 kcal)")
        
        if signals['industrial_fats'] < 0:
            reasons.append("Contains industrial fats (hydrogenated oils)")
        
        if signals['artificial_sweeteners'] < 0:
            reasons.append("Contains artificial sweeteners")
        
        # Data availability notes
        if nova_group is None:
            reasons.append("NOVA processing level not available")
        
        if not ingredients_analysis.get('few_ingredients') and not any([
            ingredients_analysis.get('whole_word_hit'),
            ingredients_analysis.get('industrial_fats'),
            ingredients_analysis.get('artificial_sweeteners')
        ]):
            reasons.append("Ingredient analysis limited - no ingredient text available")
        
        return reasons[:6]  # Limit to 6 most important reasons
    
    def score_product_by_name(self, product_name: str) -> Dict[str, Any]:
        """Score a product by searching for it by name"""
        try:
            query = """
            SELECT TOP 1
                product_name,
                brands,
                categories,
                energy_kcal_100g,
                proteins_100g,
                carbohydrates_100g,
                fat_100g,
                fiber_100g,
                sugars_100g,
                added_sugars_100g,
                sodium_100g,
                nova_group,
                ingredients_text,
                nutriscore_grade
            FROM openfoodfacts
            WHERE product_name LIKE ?
            AND energy_kcal_100g IS NOT NULL
            ORDER BY 
                CASE WHEN LOWER(product_name) = LOWER(?) THEN 1 ELSE 2 END,
                LEN(product_name)
            """
            
            search_term = f"%{product_name}%"
            results = self.wihy_ml_db.execute_query(query, (search_term, product_name))
            
            if results.empty:
                return {
                    'label': 'Unknown',
                    'nourish_score': 0,
                    'reasons': [f'No product found matching "{product_name}"'],
                    'data_sources': ['wihy_ml'],
                    'confidence': 0.0,
                    'product_info': None
                }
            
            product = results.iloc[0]
            score_result = self.calculate_nourish_score(product)
            
            # Add product info
            score_result['product_info'] = {
                'name': product.get('product_name'),
                'brand': product.get('brands'),
                'category': product.get('categories')
            }
            
            return score_result
            
        except Exception as e:
            logger.error(f"Error scoring product '{product_name}': {e}")
            return {
                'label': 'Unknown',
                'nourish_score': 0,
                'reasons': [f'Error analyzing product: {str(e)}'],
                'data_sources': ['wihy_ml'],
                'confidence': 0.0,
                'product_info': None
            }

def get_nourish_scorer() -> NourishScorer:
    """Get nourish scorer instance"""
    return NourishScorer()