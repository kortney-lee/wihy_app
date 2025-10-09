from src.database.connection import get_wihy_ml_db

db = get_wihy_ml_db()

# Check available reference data
try:
    chunks_count = db.execute_query('SELECT COUNT(*) as count FROM ref_chunks WHERE text IS NOT NULL AND LEN(text) > 100')
    print(f'Available reference chunks (>100 chars): {chunks_count.iloc[0]["count"]}')
except Exception as e:
    print(f'Error checking chunks: {e}')

# Check section paths to see what's available
try:
    sections = db.execute_query('SELECT DISTINCT section_path FROM ref_sections ORDER BY section_path')
    print('Available sections:')
    for idx, row in sections.iterrows():
        print(f'  - {row["section_path"]}')
except Exception as e:
    print(f'Error checking sections: {e}')

# Check the actual JOIN query used in training
try:
    query = '''
    SELECT TOP 5
        c.chunk_id,
        c.text,
        c.citation_text,
        c.location_hint,
        d.title as doc_title,
        s.section_path
    FROM ref_chunks c
    JOIN ref_documents d ON c.doc_id = d.doc_id
    JOIN ref_sections s ON c.section_id = s.section_id
    WHERE c.text IS NOT NULL
    AND LEN(c.text) > 100
    AND s.section_path NOT LIKE '%acknowledgment%'
    AND s.section_path NOT LIKE '%dedication%'
    '''
    
    sample_chunks = db.execute_query(query)
    print(f'\nSample chunks from training query: {len(sample_chunks)}')
    for idx, row in sample_chunks.iterrows():
        print(f'{idx+1}. Section: {row["section_path"]}')
        print(f'   Text: {row["text"][:150]}...')
        print()
except Exception as e:
    print(f'Error with training query: {e}')
