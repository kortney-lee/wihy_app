from src.database.training_data_creator import get_training_data_creator

creator = get_training_data_creator()

print('Creating production training dataset...')
result = creator.create_training_dataset(
    nutrition_examples=100,
    knowledge_examples=50,
    save_path='data/wihy_production_training.json'
)

print('Training dataset created:')
print(f' Total examples: {result["total_examples"]}')
print(f' Nutrition examples: {result["nutrition_examples"]}')
print(f' Knowledge examples: {result["knowledge_examples"]}')
print(f' Saved to: {result["save_path"]}')

# Quick analysis of the production dataset
import json
with open('data/wihy_production_training.json', 'r') as f:
    data = json.load(f)

print(f'\nDataset composition:')
print(f' Total training examples: {len(data)}')

nutrition_count = len([e for e in data if e.get('type') == 'nutrition_analysis'])
knowledge_count = len([e for e in data if e.get('type') == 'knowledge_qa'])

print(f' Nutrition analysis examples: {nutrition_count}')
print(f' Knowledge Q&A examples: {knowledge_count}')
print(f' Mix ratio: {nutrition_count/len(data)*100:.1f}% nutrition, {knowledge_count/len(data)*100:.1f}% knowledge')

if data:
    print(f'\nSample training example:')
    ex = data[0]
    print(f'Type: {ex["type"]}')
    print(f'Input length: {len(ex["input"])} chars')
    print(f'Output length: {len(ex["output"])} chars')
