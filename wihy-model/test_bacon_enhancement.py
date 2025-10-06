from src.database.nourish_scorer import get_nourish_scorer
from src.database.openai_enhancer import get_openai_enhancer
import pandas as pd

print('=== BACON ANALYSIS: ORIGINAL VS ENHANCED ===')

# Create bacon data
bacon = pd.Series({
    'product_name': 'Bacon, cooked',
    'energy_kcal_100g': 541,
    'proteins_100g': 37,
    'fat_100g': 42,
    'saturated_fat_100g': 14,
    'salt_100g': 2.5,
    'sodium_100g': 1.0,
    'nova_group': 4,
    'ingredients_text': 'Pork belly, salt, sodium nitrite'
})

# Get original nourish score analysis
scorer = get_nourish_scorer()
result = scorer.calculate_nourish_score(bacon)

# Create original response
original_response = f'I analyzed bacon and found it scores {result["nourish_score"]}/100, earning a "{result["label"]}" rating. Key factors: {", ".join(result["reasons"][:3])}. Best enjoyed occasionally while prioritizing more nutritious protein sources.'

print('ORIGINAL RESPONSE:')
print(original_response)
print()

# Create enhanced response using GPT-4
enhancer = get_openai_enhancer()
test_example = {
    'input': 'Product: Bacon, cooked\nEnergy: 541 kcal\nProtein: 37g\nFat: 42g\nSodium: 1000mg',
    'output': original_response,
    'type': 'nutrition_analysis'
}

enhanced_response = enhancer.enhance_nutrition_response(test_example)

print('GPT-4 ENHANCED RESPONSE:')
if enhanced_response:
    print(enhanced_response)
else:
    print('Enhancement failed - check API key and connection')
