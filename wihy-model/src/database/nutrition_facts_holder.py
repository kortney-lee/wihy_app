import pandas as pd
from typing import Dict, List, Any, Optional
from .connection import get_wihy_ml_db
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class NutritionFactsHolder:
    """Store and verify nutrition facts with proper serving sizes"""
    
    def __init__(self):
        self.wihy_ml_db = get_wihy_ml_db()
        self._ensure_tables_exist()
    
    def _ensure_tables_exist(self):
        """Create nutrition facts tables if they don't exist"""
        
        # Main nutrition facts table
        create_nutrition_facts_sql = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='nutrition_facts' AND xtype='U')
        CREATE TABLE nutrition_facts (
            fact_id INT IDENTITY(1,1) PRIMARY KEY,
            product_name NVARCHAR(255) NOT NULL,
            brand NVARCHAR(255),
            serving_size NVARCHAR(100) NOT NULL,  -- e.g., "1 slice (14g)", "100g", "1 cup"
            serving_weight_g FLOAT,  -- Weight in grams for standardization
            
            -- Core macronutrients
            energy_kcal FLOAT,
            energy_kj FLOAT,
            proteins_g FLOAT,
            carbohydrates_g FLOAT,
            fat_g FLOAT,
            saturated_fat_g FLOAT,
            trans_fat_g FLOAT,
            fiber_g FLOAT,
            sugars_g FLOAT,
            added_sugars_g FLOAT,
            
            -- Micronutrients and minerals
            sodium_mg FLOAT,
            potassium_mg FLOAT,
            calcium_mg FLOAT,
            iron_mg FLOAT,
            vitamin_c_mg FLOAT,
            vitamin_d_mcg FLOAT,
            
            -- Processing and quality indicators
            nova_group INT,  -- 1=unprocessed, 2=processed culinary, 3=processed, 4=ultra-processed
            nutriscore_grade NVARCHAR(1),  -- A, B, C, D, E
            ingredients_text NVARCHAR(MAX),
            allergens NVARCHAR(500),
            
            -- Metadata
            source NVARCHAR(255),  -- e.g., "USDA", "FDA", "Product Label"
            verified_by NVARCHAR(255),
            fact_checked BIT DEFAULT 0,
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE()
        )
        """
        
        # Per 100g standardized table for easy comparison
        create_per_100g_sql = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='nutrition_per_100g' AND xtype='U')
        CREATE TABLE nutrition_per_100g (
            per_100g_id INT IDENTITY(1,1) PRIMARY KEY,
            fact_id INT FOREIGN KEY REFERENCES nutrition_facts(fact_id),
            product_name NVARCHAR(255) NOT NULL,
            
            -- All values standardized per 100g
            energy_kcal_100g FLOAT,
            proteins_100g FLOAT,
            carbohydrates_100g FLOAT,
            fat_100g FLOAT,
            saturated_fat_100g FLOAT,
            fiber_100g FLOAT,
            sugars_100g FLOAT,
            sodium_100g FLOAT,  -- in grams for consistency
            
            -- Calculated nutrient densities (per 100 kcal)
            protein_density FLOAT,      -- g protein per 100 kcal
            fiber_density FLOAT,        -- g fiber per 100 kcal
            sodium_density FLOAT,       -- mg sodium per 100 kcal
            saturated_fat_density FLOAT, -- g sat fat per 100 kcal
            
            created_at DATETIME2 DEFAULT GETDATE()
        )
        """
        
        try:
            self.wihy_ml_db.execute_query(create_nutrition_facts_sql)
            self.wihy_ml_db.execute_query(create_per_100g_sql)
            logger.info("Nutrition facts tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create nutrition facts tables: {e}")
    
    def add_bacon_facts(self):
        """Add properly portioned bacon nutrition facts"""
        
        bacon_facts = [
            {
                'product_name': 'Bacon, cooked, pan-fried',
                'brand': 'Generic/USDA',
                'serving_size': '1 slice (8g)',
                'serving_weight_g': 8.0,
                'energy_kcal': 43,
                'proteins_g': 3.0,
                'carbohydrates_g': 0.1,
                'fat_g': 3.3,
                'saturated_fat_g': 1.1,
                'fiber_g': 0.0,
                'sugars_g': 0.0,
                'sodium_mg': 185,
                'nova_group': 4,
                'ingredients_text': 'Pork belly, salt, sodium nitrite, sugar, natural smoke flavor',
                'source': 'USDA Food Data Central',
                'verified_by': 'USDA',
                'fact_checked': True
            },
            {
                'product_name': 'Bacon, cooked, pan-fried',
                'brand': 'Generic/USDA',
                'serving_size': '2 slices (16g)',
                'serving_weight_g': 16.0,
                'energy_kcal': 86,
                'proteins_g': 6.0,
                'carbohydrates_g': 0.2,
                'fat_g': 6.6,
                'saturated_fat_g': 2.2,
                'fiber_g': 0.0,
                'sugars_g': 0.0,
                'sodium_mg': 370,
                'nova_group': 4,
                'ingredients_text': 'Pork belly, salt, sodium nitrite, sugar, natural smoke flavor',
                'source': 'USDA Food Data Central',
                'verified_by': 'USDA',
                'fact_checked': True
            },
            {
                'product_name': 'Bacon, cooked, pan-fried',
                'brand': 'Generic/USDA',
                'serving_size': '100g',
                'serving_weight_g': 100.0,
                'energy_kcal': 541,
                'proteins_g': 37.0,
                'carbohydrates_g': 1.4,
                'fat_g': 42.0,
                'saturated_fat_g': 14.0,
                'fiber_g': 0.0,
                'sugars_g': 0.0,
                'sodium_mg': 2310,  # 2.31g sodium = 2310mg
                'nova_group': 4,
                'ingredients_text': 'Pork belly, salt, sodium nitrite, sugar, natural smoke flavor',
                'source': 'USDA Food Data Central',
                'verified_by': 'USDA',
                'fact_checked': True
            }
        ]
        
        for facts in bacon_facts:
            fact_id = self._insert_nutrition_facts(facts)
            if fact_id:
                self._calculate_and_store_per_100g(fact_id, facts)
    
    def _insert_nutrition_facts(self, facts: Dict) -> Optional[int]:
        """Insert nutrition facts and return the fact_id"""
        
        insert_sql = """
        INSERT INTO nutrition_facts (
            product_name, brand, serving_size, serving_weight_g,
            energy_kcal, proteins_g, carbohydrates_g, fat_g, saturated_fat_g,
            fiber_g, sugars_g, sodium_mg, nova_group, ingredients_text,
            source, verified_by, fact_checked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        try:
            result = self.wihy_ml_db.execute_query(
                insert_sql + "; SELECT SCOPE_IDENTITY() as fact_id",
                (
                    facts['product_name'], facts.get('brand'), facts['serving_size'], 
                    facts['serving_weight_g'], facts['energy_kcal'], facts['proteins_g'],
                    facts['carbohydrates_g'], facts['fat_g'], facts['saturated_fat_g'],
                    facts['fiber_g'], facts['sugars_g'], facts['sodium_mg'],
                    facts['nova_group'], facts['ingredients_text'], facts['source'],
                    facts['verified_by'], facts['fact_checked']
                )
            )
            
            if len(result) > 0:
                return int(result.iloc[0]['fact_id'])
            return None
            
        except Exception as e:
            logger.error(f"Failed to insert nutrition facts: {e}")
            return None
    
    def _calculate_and_store_per_100g(self, fact_id: int, facts: Dict):
        """Calculate and store per 100g standardized values"""
        
        serving_weight = facts['serving_weight_g']
        if serving_weight <= 0:
            return
        
        # Calculate per 100g values
        multiplier = 100.0 / serving_weight
        
        energy_100g = facts['energy_kcal'] * multiplier
        proteins_100g = facts['proteins_g'] * multiplier
        carbs_100g = facts['carbohydrates_g'] * multiplier
        fat_100g = facts['fat_g'] * multiplier
        sat_fat_100g = facts['saturated_fat_g'] * multiplier
        fiber_100g = facts['fiber_g'] * multiplier
        sugars_100g = facts['sugars_g'] * multiplier
        sodium_100g = (facts['sodium_mg'] * multiplier) / 1000  # Convert to grams
        
        # Calculate nutrient densities (per 100 kcal)
        if energy_100g > 0:
            protein_density = (proteins_100g / energy_100g) * 100
            fiber_density = (fiber_100g / energy_100g) * 100
            sodium_density = (facts['sodium_mg'] * multiplier / energy_100g) * 100  # mg per 100 kcal
            sat_fat_density = (sat_fat_100g / energy_100g) * 100
        else:
            protein_density = fiber_density = sodium_density = sat_fat_density = 0
        
        insert_per_100g_sql = """
        INSERT INTO nutrition_per_100g (
            fact_id, product_name, energy_kcal_100g, proteins_100g, carbohydrates_100g,
            fat_100g, saturated_fat_100g, fiber_100g, sugars_100g, sodium_100g,
            protein_density, fiber_density, sodium_density, saturated_fat_density
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        try:
            self.wihy_ml_db.execute_query(
                insert_per_100g_sql,
                (
                    fact_id, facts['product_name'], energy_100g, proteins_100g, carbs_100g,
                    fat_100g, sat_fat_100g, fiber_100g, sugars_100g, sodium_100g,
                    protein_density, fiber_density, sodium_density, sat_fat_density
                )
            )
            logger.info(f"Stored per-100g data for fact_id {fact_id}")
            
        except Exception as e:
            logger.error(f"Failed to store per-100g data: {e}")
    
    def get_nutrition_facts(self, product_name: str, serving_size: str = None) -> pd.DataFrame:
        """Get nutrition facts with optional serving size filter"""
        
        if serving_size:
            query = """
            SELECT * FROM nutrition_facts 
            WHERE product_name LIKE ? AND serving_size = ?
            ORDER BY created_at DESC
            """
            return self.wihy_ml_db.execute_query(query, (f'%{product_name}%', serving_size))
        else:
            query = """
            SELECT * FROM nutrition_facts 
            WHERE product_name LIKE ?
            ORDER BY serving_weight_g, created_at DESC
            """
            return self.wihy_ml_db.execute_query(query, (f'%{product_name}%',))
    
    def fact_check_nutrition_claim(self, product_name: str, claim_data: Dict) -> Dict[str, Any]:
        """Fact-check nutrition claims against stored verified data"""
        
        verified_facts = self.get_nutrition_facts(product_name)
        if len(verified_facts) == 0:
            return {
                'status': 'no_reference_data',
                'message': f'No verified nutrition data found for {product_name}'
            }
        
        # Find closest serving size match
        claim_weight = claim_data.get('serving_weight_g', 100)
        closest_match = verified_facts.iloc[(verified_facts['serving_weight_g'] - claim_weight).abs().argsort()[:1]]
        
        if len(closest_match) == 0:
            return {'status': 'error', 'message': 'Could not find reference data'}
        
        reference = closest_match.iloc[0]
        discrepancies = []
        
        # Check key nutrients (allowing 10% tolerance for natural variation)
        tolerance = 0.10
        nutrients_to_check = ['energy_kcal', 'proteins_g', 'fat_g', 'sodium_mg']
        
        for nutrient in nutrients_to_check:
            if nutrient in claim_data and reference[nutrient] is not None:
                claim_value = claim_data[nutrient]
                ref_value = reference[nutrient]
                
                if ref_value > 0:
                    difference_pct = abs(claim_value - ref_value) / ref_value
                    if difference_pct > tolerance:
                        discrepancies.append({
                            'nutrient': nutrient,
                            'claimed': claim_value,
                            'verified': ref_value,
                            'difference_pct': difference_pct * 100
                        })
        
        return {
            'status': 'checked',
            'reference_source': reference['source'],
            'verified_by': reference['verified_by'],
            'serving_size_match': reference['serving_size'],
            'discrepancies': discrepancies,
            'accuracy_rating': 'accurate' if len(discrepancies) == 0 else 'questionable' if len(discrepancies) <= 2 else 'inaccurate'
        }

def get_nutrition_facts_holder() -> NutritionFactsHolder:
    return NutritionFactsHolder()