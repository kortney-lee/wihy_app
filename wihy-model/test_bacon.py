from src.database.nourish_scorer import get_nourish_scorer
import pandas as pd

scorer = get_nourish_scorer()

# Test bacon analysis
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

result = scorer.calculate_nourish_score(bacon)

print('=== USER ASKS: IS BACON GOOD FOR ME? ===')
print()
print('AI RESPONSE:')
print(f'I analyzed bacon and found it scores {result["nourish_score"]}/100, earning a "{result["label"]}" rating.')
print()
print('Key factors:')
for reason in result['reasons'][:4]:
    print(f' {reason}')
print()
print('BOTTOM LINE: Bacon is best enjoyed occasionally as a flavor enhancer rather than a dietary staple.')
