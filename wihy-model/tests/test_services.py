import pytest
from src.services.prediction_service import PredictionService

@pytest.fixture
def prediction_service():
    return PredictionService()

def test_prediction_service_initialization(prediction_service):
    assert prediction_service is not None

def test_predict_method(prediction_service):
    # Assuming the predict method takes some input and returns a prediction
    input_data = {"feature1": 1.0, "feature2": 2.0}  # Example input
    prediction = prediction_service.predict(input_data)
    assert prediction is not None
    assert isinstance(prediction, dict)  # Assuming the prediction is returned as a dictionary

def test_predict_with_invalid_data(prediction_service):
    invalid_input_data = {"feature1": "invalid", "feature2": None}  # Example of invalid input
    with pytest.raises(ValueError):
        prediction_service.predict(invalid_input_data)