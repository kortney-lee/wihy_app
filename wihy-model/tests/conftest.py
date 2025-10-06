import pytest
import os
import sys
from unittest.mock import Mock

# Add src directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

@pytest.fixture
def mock_db_connection():
    """Mock database connection for testing"""
    mock_conn = Mock()
    mock_cursor = Mock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn

@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return {
        "product_id": 1,
        "product_name": "Test Product",
        "brand": "Test Brand",
        "nourish_score": 3.5,
        "nourish_label": "Mixed"
    }