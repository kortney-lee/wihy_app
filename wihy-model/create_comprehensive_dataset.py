from src.database.training_data_creator import get_training_data_creator

creator = get_training_data_creator()

print('Creating comprehensive training dataset...')
result = creator.create_training_dataset(
    nutrition_examples=100,
    knowledge_examples=50,
    save_path='data/comprehensive_training.json'
)

print('Training dataset created:')
print(f' Total examples: {result["total_examples"]}')
print(f' Nutrition examples: {result["nutrition_examples"]}')
print(f' Knowledge examples: {result["knowledge_examples"]}')
print(f' Saved to: {result["save_path"]}')

# Quick analysis
import json
with open('data/comprehensive_training.json', 'r') as f:
    data = json.load(f)

print(f'\nDataset composition:')
print(f' Total examples: {len(data)}')

nutrition_examples = [e for e in data if e.get('type') == 'nutrition_analysis']
knowledge_examples = [e for e in data if e.get('type') == 'knowledge_qa']

print(f' Nutrition analysis: {len(nutrition_examples)}')
print(f' Knowledge Q&A: {len(knowledge_examples)}')
print(f' Mix ratio: {len(nutrition_examples)/len(data)*100:.1f}% nutrition, {len(knowledge_examples)/len(data)*100:.1f}% knowledge')

if nutrition_examples:
    print(f'\n=== SAMPLE NUTRITION EXAMPLE ===')
    ex = nutrition_examples[0]
    print(f'Type: {ex["type"]}')
    print(f'Instruction: {ex["instruction"]}')
    print(f'\nInput (first 300 chars):')
    print(ex["input"][:300] + '...')
    print(f'\nOutput (first 300 chars):')
    print(ex["output"][:300] + '...')

if knowledge_examples:
    print(f'\n=== SAMPLE KNOWLEDGE EXAMPLE ===')
    ex = knowledge_examples[0]
    print(f'Type: {ex["type"]}')
    print(f'Instruction: {ex["instruction"]}')
    print(f'\nInput: {ex["input"]}')
    print(f'\nOutput (first 300 chars):')
    print(ex["output"][:300] + '...')
    print(f'\nSource: {ex.get("source", "Unknown")}')
