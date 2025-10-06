import joblib  # Direct import instead of from sklearn.externals
import pickle
import os
from typing import Any

def load_model(model_path: str) -> Any:
    """Load a trained model from file"""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    # Determine file type and load accordingly
    if model_path.endswith('.joblib') or model_path.endswith('.pkl'):
        return joblib.load(model_path)
    elif model_path.endswith('.pickle'):
        with open(model_path, 'rb') as f:
            return pickle.load(f)
    else:
        raise ValueError(f"Unsupported file format for: {model_path}")

def save_model(model: Any, model_path: str) -> None:
    """Save a trained model to file"""
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    if model_path.endswith('.joblib'):
        joblib.dump(model, model_path)
    elif model_path.endswith('.pkl') or model_path.endswith('.pickle'):
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
    else:
        raise ValueError(f"Unsupported file format for: {model_path}")