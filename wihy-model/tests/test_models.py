import pytest
from src.models.model_loader import load_model
from src.models.preprocessing import preprocess_input

def test_load_model():
    model = load_model('path/to/model')
    assert model is not None, "Model should be loaded successfully"

def test_preprocess_input():
    raw_input = {'feature1': 1.0, 'feature2': 2.0}
    processed_input = preprocess_input(raw_input)
    assert processed_input is not None, "Processed input should not be None"
    assert 'feature1' in processed_input, "Processed input should contain 'feature1'"
    assert 'feature2' in processed_input, "Processed input should contain 'feature2'"