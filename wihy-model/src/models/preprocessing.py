from sklearn.preprocessing import StandardScaler
import pandas as pd

def preprocess_data(data: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocess the input data for the machine learning model.
    
    Parameters:
    - data: pd.DataFrame - The input data to preprocess.
    
    Returns:
    - pd.DataFrame - The preprocessed data.
    """
    # Example preprocessing: standardizing numerical features
    scaler = StandardScaler()
    numerical_features = data.select_dtypes(include=['float64', 'int64']).columns
    data[numerical_features] = scaler.fit_transform(data[numerical_features])
    
    # Additional preprocessing steps can be added here
    
    return data

def handle_missing_values(data: pd.DataFrame) -> pd.DataFrame:
    """
    Handle missing values in the input data.
    
    Parameters:
    - data: pd.DataFrame - The input data with potential missing values.
    
    Returns:
    - pd.DataFrame - The data with missing values handled.
    """
    # Example: filling missing values with the mean of each column
    return data.fillna(data.mean())