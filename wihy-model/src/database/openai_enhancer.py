import openai
import json
import pandas as pd
from typing import Dict, List, Any
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class OpenAITrainingEnhancer:
    """Use GPT-4 to enhance training data quality and variety"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    def enhance_nutrition_response(self, original_example: Dict) -> str:
        """Use GPT-4 to create more natural, comprehensive nutrition responses"""
        
        # Extract product info from input
        input_text = original_example['input']
        original_output = original_example['output']
        
        prompt = f"""
        You are a helpful nutrition expert AI. A user has asked about a food product, and I have basic nutritional analysis. 
        Please rewrite the response to be more natural, conversational, and helpful while keeping the same factual content.

        Original question context: {input_text[:300]}...
        
        Original AI response: {original_output}
        
        Please rewrite this to be:
        - More conversational and friendly
        - Clearer about what the rating means practically
        - More actionable advice
        - Better flow and readability
        - Under 200 words
        
        Keep the same factual information but make it sound more natural and helpful.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # More cost-effective than gpt-4
                messages=[
                    {"role": "system", "content": "You are a helpful nutrition expert who gives clear, friendly, evidence-based advice in a conversational tone."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    def generate_knowledge_qa_pairs(self, knowledge_text: str, source_name: str = "reference") -> List[Dict]:
        """Generate Q&A pairs from knowledge text using OpenAI"""
        try:
            # Fix the f-string formatting issue
            prompt = f"""Based on the following nutrition knowledge, create 3 helpful question-answer pairs that would help users understand nutrition and health concepts.

Knowledge: {knowledge_text}

Create exactly 3 Q&A pairs in this JSON format:
[
    {{
        "instruction": "Help users understand nutrition and health concepts based on evidence.",
        "input": "user question here",
        "output": "helpful answer based on the text",
        "type": "knowledge_qa",
        "source": "enhanced_from_reference"
    }}
]

Make the questions practical and the answers evidence-based. Focus on actionable nutrition advice."""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a nutrition expert. Create helpful Q&A pairs based on nutrition knowledge. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            import json
            qa_pairs = json.loads(response_text)
            
            # Add source information
            for qa in qa_pairs:
                qa['source'] = f"enhanced_from_{source_name}"
            
            return qa_pairs
            
        except Exception as e:
            logger.error(f"Error generating Q&A pairs: {e}")
            return []
    
    def enhance_training_dataset(self, input_file: str, output_file: str, max_enhance_nutrition: int = 30, max_enhance_knowledge: int = 20):
        """Enhance existing training dataset with GPT-4 improvements"""
        
        with open(input_file, 'r', encoding='utf-8') as f:
            training_data = json.load(f)
        
        enhanced_data = []
        nutrition_enhanced = 0
        knowledge_enhanced = 0
        
        print(f"Enhancing training dataset with GPT-4...")
        print(f"Original dataset: {len(training_data)} examples")
        
        for i, example in enumerate(training_data):
            # Keep original
            enhanced_data.append(example)
            
            # Enhance nutrition examples
            if (example['type'] == 'nutrition_analysis' and 
                nutrition_enhanced < max_enhance_nutrition):
                
                print(f"Enhancing nutrition example {nutrition_enhanced + 1}/{max_enhance_nutrition}...")
                enhanced_response = self.enhance_nutrition_response(example)
                
                if enhanced_response:
                    enhanced_example = example.copy()
                    enhanced_example['output'] = enhanced_response
                    enhanced_example['enhanced_by'] = 'gpt-4o-mini'
                    enhanced_example['original_output'] = example['output']
                    enhanced_data.append(enhanced_example)
                    nutrition_enhanced += 1
            
            # Enhance knowledge examples by generating more Q&A pairs
            elif (example['type'] == 'knowledge_qa' and 
                  knowledge_enhanced < max_enhance_knowledge):
                
                print(f"Enhancing knowledge example {knowledge_enhanced + 1}/{max_enhance_knowledge}...")
                # Use the original knowledge text to generate new Q&A pairs
                source_info = example.get('source', 'Reference material')
                new_qas = self.generate_knowledge_qa_pairs(example['output'][:800], source_info)
                
                for qa in new_qas:
                    enhanced_data.append(qa)
                
                knowledge_enhanced += 1
        
        # Save enhanced dataset
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(enhanced_data, f, indent=2, ensure_ascii=False)
        
        print(f"\nEnhanced dataset saved: {len(enhanced_data)} examples")
        print(f"- Original: {len(training_data)}")
        print(f"- Nutrition enhanced: {nutrition_enhanced}")
        print(f"- Knowledge enhanced: {knowledge_enhanced}")
        print(f"- Total new examples: {len(enhanced_data) - len(training_data)}")
        
        return {
            'total_examples': len(enhanced_data),
            'original_examples': len(training_data),
            'nutrition_enhanced': nutrition_enhanced,
            'knowledge_enhanced': knowledge_enhanced,
            'new_examples': len(enhanced_data) - len(training_data)
        }

def get_openai_enhancer() -> OpenAITrainingEnhancer:
    return OpenAITrainingEnhancer()