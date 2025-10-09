import json

# Check the training data
with open('data/test_training.json', 'r') as f:
    data = json.load(f)

print(f'=== TRAINING DATA ANALYSIS ===')
print(f'Total examples: {len(data)}')

nutrition_examples = [e for e in data if e.get('type') == 'nutrition_analysis']
knowledge_examples = [e for e in data if e.get('type') == 'knowledge_qa']

print(f'Nutrition examples: {len(nutrition_examples)}')
print(f'Knowledge examples: {len(knowledge_examples)}')

if nutrition_examples:
    print()
    print('=== SAMPLE NUTRITION EXAMPLE ===')
    ex = nutrition_examples[0]
    print('Type:', ex['type'])
    print()
    print('Input (first 400 chars):')
    print(ex['input'][:400] + '...')
    print()
    print('Output (first 400 chars):')
    print(ex['output'][:400] + '...')

if knowledge_examples:
    print()
    print('=== SAMPLE KNOWLEDGE EXAMPLE ===')
    ex = knowledge_examples[0]
    print('Type:', ex['type'])
    print()
    print('Input:')
    print(ex['input'])
    print()
    print('Output (first 400 chars):')
    print(ex['output'][:400] + '...')
    print()
    print('Source:', ex.get('source', 'Unknown'))
else:
    print()
    print('No knowledge examples found - checking why...')
