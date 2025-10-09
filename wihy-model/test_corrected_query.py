from src.database.connection import get_wihy_ml_db

db = get_wihy_ml_db()

# Test the corrected query
try:
    corrected_query = '''
    SELECT TOP 5
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
    '''
    
    corrected_result = db.execute_query(corrected_query)
    print(f'Corrected JOIN query: {len(corrected_result)} rows found')
    
    if len(corrected_result) > 0:
        print('Columns available:', list(corrected_result.columns))
        for idx, row in corrected_result.iterrows():
            section_path = row.get('section_path', 'Unknown')
            doc_title = row.get('doc_title', 'Unknown')
            text_preview = str(row['text'])[:150] + '...'
            print(f'{idx+1}. {doc_title} - {section_path}')
            print(f'   Text: {text_preview}')
            print()
            
except Exception as e:
    print(f'Corrected query error: {e}')
