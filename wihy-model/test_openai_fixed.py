from src.database.openai_enhancer import get_openai_enhancer
from src.database.training_data_creator import get_training_data_creator

print('=== TESTING OPENAI ENHANCEMENT ===')

# First, test OpenAI connection
enhancer = get_openai_enhancer()

# Test with a simple example
test_example = {
    'instruction': 'Analyze the nutritional value of this food product.',
    'input': 'Product: Bacon\nEnergy: 541 kcal\nProtein: 37g\nFat: 42g\nSodium: 1000mg',
    'output': 'This product scores 15/100 and receives a Fill rating. High saturated fat density, Very high sodium density, Ultra-processed.',
    'type': 'nutrition_analysis'
}

print('Testing nutrition response enhancement...')
enhanced_response = enhancer.enhance_nutrition_response(test_example)

if enhanced_response:
    print('SUCCESS! Enhanced response:')
    print(enhanced_response)
    print()
else:
    print('Failed to enhance response')

# Test knowledge Q&A generation
print('Testing knowledge Q&A generation...')
test_knowledge = 'Nutrition research shows that whole foods provide better nutrient density than processed foods. Fiber and protein are important for satiety and metabolic health.'

qa_pairs = enhancer.generate_knowledge_qa_pairs(test_knowledge, 'Nutrition Research')

if qa_pairs:
    print(f'SUCCESS! Generated {len(qa_pairs)} Q&A pairs:')
    for i, qa in enumerate(qa_pairs, 1):
        input_text = qa.get('input', 'No input')
        output_text = qa.get('output', 'No output')
        print(f'{i}. Q: {input_text}')
        print(f'   A: {output_text[:100]}...')
        print()
else:
    print('Failed to generate Q&A pairs')
