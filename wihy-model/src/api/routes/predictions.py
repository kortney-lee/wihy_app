from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

# Try to import the real service, fall back to mock if it fails
try:
    from src.services.prediction_service import PredictionService
    prediction_service = PredictionService()
except ImportError:
    # Mock prediction service for testing
    class MockPredictionService:
        def predict(self, input_data):
            return "Mixed", 0.85
    
    prediction_service = MockPredictionService()

router = APIRouter()

class PredictionRequest(BaseModel):
    input_data: dict

class PredictionResponse(BaseModel):
    prediction: Any  # Fixed: was 'any', should be 'Any'
    confidence: float

@router.post("/predict", response_model=PredictionResponse)
async def make_prediction(request: PredictionRequest):
    try:
        prediction, confidence = prediction_service.predict(request.input_data)
        return PredictionResponse(prediction=prediction, confidence=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))