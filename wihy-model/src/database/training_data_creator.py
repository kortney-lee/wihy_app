import pandas as pd
import json
import os
import re
from typing import Dict, List, Any, Optional, Tuple
from .connection import get_wihy_ml_db
from .nourish_scorer import get_nourish_scorer
import logging
import random

logger = logging.getLogger(__name__)

class TrainingDataCreator:
    """Create comprehensive training data from wihy_ml database"""
    
    def __init__(self):
        self.wihy_ml_db = get_wihy_ml_db()
        self.nourish_scorer = get_nourish_scorer()
    
    def clean_text_for_training(self, text: str) -> str:
        """Clean text by removing personal names and sensitive information"""
        if not text or pd.isna(text):
            return ""
        
        # Remove common personal names and acknowledgments
        # This is a basic approach - could be enhanced with NLP name recognition
        name_patterns = [
            r'\bTo\s+[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)*\b',  # "To Name, Name, Name"
            r'\b[A-Z][a-z]+\s*,\s*[A-Z][a-z]+\s*,\s*[A-Z][a-z]+\b',  # "Name, Name, Name"
            r'\bStephanie\b|\bRichard\b|\bNick\b|\bJoshua\b|\bAmy\b|\bKevin\b',  # Specific names
            r'\bDr\.\s+[A-Z][a-z]+\b|\bProf\.\s+[A-Z][a-z]+\b',  # Titles with names
            r'special thanks to[^.]*\.?',  # Acknowledgment phrases
            r'dedicated to[^.]*\.?',
            r'I want to thank[^.]*\.?'
        ]
        
        cleaned_text = text
        for pattern in name_patterns:
            cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE)
        
        # Clean up extra whitespace and punctuation
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
        cleaned_text = re.sub(r'[,\s]+\.', '.', cleaned_text)
        cleaned_text = cleaned_text.strip()
        
        return cleaned_text
    
    def get_available_columns(self, table_name: str = 'openfoodfacts') -> List[str]:
        """Get list of available columns in specified table"""
        try:
            schema = self.wihy_ml_db.get_table_schema(table_name)
            return schema['COLUMN_NAME'].tolist()
        except Exception as e:
            logger.error(f"Failed to get table schema for {table_name}: {e}")
            return []
    
    def get_sample_products(self, limit: int = 1000) -> pd.DataFrame:
        """Get sample products with nutritional data from wihy_ml database"""
        
        # Get available columns first
        available_columns = self.get_available_columns('openfoodfacts')
        
        # Build query with only available columns
        base_columns = ['product_name', 'brands', 'categories']
        nutrition_columns = [
            'nutriscore_grade', 'nutriscore_score', 'nova_group',
            'energy_kcal_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g',
            'saturated_fat_100g', 'sugars_100g', 'fiber_100g', 'salt_100g', 
            'sodium_100g', 'ingredients_text', 'allergens', 'added_sugars_100g'
        ]
        
        # Only include columns that exist
        select_columns = []
        for col in base_columns + nutrition_columns:
            if col in available_columns:
                select_columns.append(col)
        
        if not select_columns:
            raise Exception("No required columns found in openfoodfacts table")
        
        query = f"""
        SELECT TOP (?)
            {', '.join(select_columns)}
        FROM openfoodfacts
        WHERE product_name IS NOT NULL
        AND (energy_kcal_100g IS NOT NULL OR energy_100g IS NOT NULL)
        AND proteins_100g IS NOT NULL
        AND carbohydrates_100g IS NOT NULL
        AND fat_100g IS NOT NULL
        ORDER BY NEWID()  -- Random sampling
        """
        
        try:
            df = self.wihy_ml_db.execute_query(query, (limit,))
            logger.info(f"Retrieved {len(df)} products with nutritional data from wihy_ml")
            logger.info(f"Using columns: {select_columns}")
            return df
        except Exception as e:
            logger.error(f"Failed to retrieve product data from wihy_ml: {e}")
            raise
    
    def get_reference_chunks(self, limit: int = 200) -> pd.DataFrame:
        """Get reference text chunks for knowledge-based training"""
        try:
            query = """
            SELECT TOP (?)
                c.chunk_id,
                c.text,
                c.citation_text,
                c.location_hint,
                d.title as doc_title,
                s.section_path
            FROM ref_chunks c
            LEFT JOIN ref_documents d ON c.doc_id = d.doc_id
            LEFT JOIN ref_sections s ON c.section_id = s.section_id
            WHERE c.text IS NOT NULL
            AND LEN(c.text) > 100
            AND (s.section_path NOT LIKE '%acknowledgment%' OR s.section_path IS NULL)
            AND (s.section_path NOT LIKE '%dedication%' OR s.section_path IS NULL)
            ORDER BY NEWID()
            """
            
            df = self.wihy_ml_db.execute_query(query, (limit,))
            logger.info(f"Retrieved {len(df)} reference chunks from wihy_ml")
            return df
        except Exception as e:
            logger.error(f"Failed to retrieve reference chunks: {e}")
            return pd.DataFrame()
    
    def create_nutrition_example(self, product: pd.Series) -> Dict[str, str]:
        """Create a nutrition analysis training example using enhanced scoring"""
        
        # Use the enhanced nourish scorer
        score_result = self.nourish_scorer.calculate_nourish_score(product)
        
        label = score_result['label']
        score = score_result['nourish_score']
        reasons = score_result['reasons']
        
        # Create instruction
        instruction = "Analyze the nutritional value of this food product and provide a health assessment."
        
        # Create input with product details
        input_parts = []
        
        if pd.notna(product.get('product_name')):
            input_parts.append(f"Product: {product['product_name']}")
        
        if pd.notna(product.get('brands')):
            input_parts.append(f"Brand: {product['brands']}")
        
        if pd.notna(product.get('categories')):
            categories = str(product['categories'])[:200]  # Truncate long categories
            input_parts.append(f"Category: {categories}")
        
        # Nutritional information
        nutrition_info = []
        nutrition_mapping = [
            ('energy_kcal_100g', 'Energy', 'kcal'),
            ('proteins_100g', 'Protein', 'g'),
            ('carbohydrates_100g', 'Carbohydrates', 'g'),
            ('fat_100g', 'Fat', 'g'),
            ('saturated_fat_100g', 'Saturated Fat', 'g'),
            ('sugars_100g', 'Sugars', 'g'),
            ('fiber_100g', 'Fiber', 'g'),
            ('salt_100g', 'Salt', 'g'),
            ('sodium_100g', 'Sodium', 'g')
        ]
        
        for column, display_name, unit in nutrition_mapping:
            value = product.get(column)
            if pd.notna(value) and value != 0:
                nutrition_info.append(f"- {display_name}: {value}{unit}")
        
        if nutrition_info:
            input_parts.append("Nutritional Information (per 100g):")
            input_parts.extend(nutrition_info)
        
        if pd.notna(product.get('ingredients_text')):
            ingredients = str(product['ingredients_text'])[:300]  # Truncate long ingredients
            input_parts.append(f"Ingredients: {ingredients}")
        
        if pd.notna(product.get('allergens')):
            allergens = str(product['allergens'])[:100]  # Truncate long allergens
            input_parts.append(f"Allergens: {allergens}")
        
        input_text = "\n".join(input_parts)
        
        # Create enhanced response
        output_text = self.generate_enhanced_nutrition_response(product, score_result)
        
        return {
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "type": "nutrition_analysis"
        }
    
    def generate_enhanced_nutrition_response(self, product: pd.Series, score_result: Dict[str, Any]) -> str:
        """Generate enhanced nutrition response using nourish scorer results"""
        name = product.get('product_name', 'This product')
        brand = product.get('brands', '')
        
        if brand and pd.notna(brand):
            product_desc = f"{name} by {brand}"
        else:
            product_desc = name
        
        label = score_result['label']
        score = score_result['nourish_score']
        reasons = score_result['reasons']
        
        response_parts = []
        response_parts.append(f"I've analyzed {product_desc}.")
        
        # Enhanced assessment based on new scoring system
        if label == "Nourish":
            response_parts.append(f"This product scores {score}/100 and earns a 'Nourish' rating.")
            response_parts.append("It provides excellent nutritional value and beneficial nutrients per calorie.")
            response_parts.append("This is a healthy choice that supports your nutritional goals.")
        elif label == "Mixed":
            response_parts.append(f"This product scores {score}/100 and has a 'Mixed' rating.")
            response_parts.append("It has both nutritional benefits and some concerns to consider.")
            response_parts.append("This can be enjoyed in moderation as part of a balanced diet.")
        elif label == "Fill":
            response_parts.append(f"This product scores {score}/100 and receives a 'Fill' rating.")
            response_parts.append("While it provides calories, the nutritional density is limited.")
            response_parts.append("Best enjoyed occasionally while prioritizing more nutritious options.")
        else:  # Unknown
            response_parts.append("I don't have enough nutritional data to provide a complete assessment.")
            response_parts.append("For the most accurate analysis, look for products with complete nutrition labels.")
        
        # Add key reasons
        if reasons:
            response_parts.append(f"Key factors: {', '.join(reasons[:3])}")
        
        response_parts.append(f"Bottom line: {label}.")
        
        return " ".join(response_parts)
    
    def create_knowledge_example(self, chunk: pd.Series) -> Dict[str, str]:
        """Create a knowledge-based training example from reference chunks"""
        
        text = chunk['text']
        citation = chunk.get('citation_text', '')
        section = chunk.get('section_path', '')
        doc_title = chunk.get('doc_title', '')
        
        # Clean the text to remove personal names
        cleaned_text = self.clean_text_for_training(text)
        
        # Skip if text becomes too short after cleaning
        if len(cleaned_text) < 50:
            raise ValueError("Text too short after cleaning")
        
        # Generate different types of questions based on the content
        question_types = [
            self._create_nutrition_principle_question,
            self._create_health_concept_question,
            self._create_practical_advice_question,
            self._create_research_insight_question
        ]
        
        # Randomly select a question type
        question_creator = random.choice(question_types)
        instruction, input_text, output_text = question_creator(cleaned_text, citation, section)
        
        return {
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "type": "knowledge_qa",
            "source": f"{doc_title} - {section}"
        }
    
    def _create_nutrition_principle_question(self, text: str, citation: str, section: str) -> Tuple[str, str, str]:
        """Create a nutrition principle question"""
        instruction = "Explain key nutrition principles based on current research and evidence."
        
        input_text = f"What are the key nutrition principles we should understand for healthy eating?"
        
        output_text = f"Based on current nutrition research, here are important principles to understand: {text[:400]}..."
        
        return instruction, input_text, output_text
    
    def _create_health_concept_question(self, text: str, citation: str, section: str) -> Tuple[str, str, str]:
        """Create a health concept question"""
        instruction = "Help users understand important health and wellness concepts."
        
        input_text = f"Can you explain how we should think about health and nutrition?"
        
        output_text = f"Understanding health and nutrition involves several key concepts: {text[:400]}..."
        
        return instruction, input_text, output_text
    
    def _create_practical_advice_question(self, text: str, citation: str, section: str) -> Tuple[str, str, str]:
        """Create a practical advice question"""
        instruction = "Provide practical nutrition and health guidance based on evidence."
        
        input_text = f"What practical steps can I take to improve my nutrition and health?"
        
        output_text = f"Here are evidence-based steps you can take: {text[:400]}..."
        
        return instruction, input_text, output_text
    
    def _create_research_insight_question(self, text: str, citation: str, section: str) -> Tuple[str, str, str]:
        """Create a research insight question"""
        instruction = "Share insights from nutrition research to help users make informed decisions."
        
        input_text = f"What does current research tell us about nutrition and health?"
        
        output_text = f"Current research provides valuable insights: {text[:400]}..."
        
        return instruction, input_text, output_text
    
    def create_training_dataset(self, 
                              nutrition_examples: int = 700,
                              knowledge_examples: int = 300,
                              save_path: str = "data/training_data.json") -> Dict[str, Any]:
        """Create comprehensive training dataset from wihy_ml database"""
        try:
            # Create data directory if it doesn't exist
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            training_examples = []
            
            # 1. Create nutrition analysis examples
            logger.info(f"Creating {nutrition_examples} nutrition analysis examples...")
            if nutrition_examples > 0:
                products_df = self.get_sample_products(nutrition_examples)
                
                for idx, product in products_df.iterrows():
                    try:
                        example = self.create_nutrition_example(product)
                        training_examples.append(example)
                    except Exception as e:
                        logger.warning(f"Failed to create nutrition example {idx}: {e}")
                        continue
            
            # 2. Create knowledge-based examples
            logger.info(f"Creating {knowledge_examples} knowledge-based examples...")
            if knowledge_examples > 0:
                chunks_df = self.get_reference_chunks(knowledge_examples * 2)  # Get more to account for filtering
                
                knowledge_count = 0
                for idx, chunk in chunks_df.iterrows():
                    if knowledge_count >= knowledge_examples:
                        break
                    try:
                        example = self.create_knowledge_example(chunk)
                        training_examples.append(example)
                        knowledge_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to create knowledge example {idx}: {e}")
                        continue
            
            # Shuffle the examples to mix nutrition and knowledge examples
            random.shuffle(training_examples)
            
            # Save training data
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(training_examples, f, indent=2, ensure_ascii=False)
            
            # Calculate statistics
            nutrition_count = len([e for e in training_examples if e.get('type') == 'nutrition_analysis'])
            knowledge_count = len([e for e in training_examples if e.get('type') == 'knowledge_qa'])
            
            result = {
                "status": "success",
                "total_examples": len(training_examples),
                "nutrition_examples": nutrition_count,
                "knowledge_examples": knowledge_count,
                "save_path": save_path,
                "source_database": "wihy_ml"
            }
            
            logger.info(f"Created {len(training_examples)} comprehensive training examples:")
            logger.info(f"  - {nutrition_count} nutrition analysis examples")
            logger.info(f"  - {knowledge_count} knowledge-based Q&A examples")
            logger.info(f"  - Saved to {save_path}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to create training dataset from wihy_ml: {e}")
            raise

def get_training_data_creator() -> TrainingDataCreator:
    """Get training data creator instance"""
    return TrainingDataCreator()