from src.database.connection import get_wihy_ml_db

db = get_wihy_ml_db()

print('=== REFERENCE TABLES SCHEMA ===')

# Check ref_chunks columns
try:
    chunks_schema = db.get_table_schema('ref_chunks')
    print('ref_chunks columns:')
    for col in chunks_schema['COLUMN_NAME'].tolist():
        print(f'  - {col}')
except Exception as e:
    print(f'Error getting ref_chunks schema: {e}')

print()

# Check ref_sections columns
try:
    sections_schema = db.get_table_schema('ref_sections')
    print('ref_sections columns:')
    for col in sections_schema['COLUMN_NAME'].tolist():
        print(f'  - {col}')
except Exception as e:
    print(f'Error getting ref_sections schema: {e}')

print()

# Check ref_documents columns
try:
    docs_schema = db.get_table_schema('ref_documents')
    print('ref_documents columns:')
    for col in docs_schema['COLUMN_NAME'].tolist():
        print(f'  - {col}')
except Exception as e:
    print(f'Error getting ref_documents schema: {e}')

print()

# Try a simpler query to see what data we have
try:
    simple_chunks = db.execute_query('SELECT TOP 3 * FROM ref_chunks WHERE text IS NOT NULL')
    print(f'Sample ref_chunks data ({len(simple_chunks)} rows):')
    if len(simple_chunks) > 0:
        print('First chunk columns:', list(simple_chunks.columns))
        print('First chunk text length:', len(str(simple_chunks.iloc[0]['text'])) if 'text' in simple_chunks.columns else 'No text column')
except Exception as e:
    print(f'Error querying ref_chunks: {e}')
