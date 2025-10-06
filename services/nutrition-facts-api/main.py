from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os
from typing import Optional, Dict, List, Any
import logging
from datetime import datetime
from dotenv import load_dotenv
import httpx
import asyncio

# Load environment variables
load_dotenv()

# Pydantic models for request/response
from pydantic import BaseModel

class UserMetrics(BaseModel):
    daily_calories: Optional[int] = None
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None

class NutritionAnalysisRequest(BaseModel):
    product_name: str
    serving_size: Optional[str] = None
    user_context: str = 'general'
    user_metrics: Optional[UserMetrics] = None

class ChatRequest(BaseModel):
    query: str
    user_context: Optional[str] = "general"
    include_metadata: bool = True

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title='vHealth Nutrition Facts API',
    description='Comprehensive nutrition analysis and lifestyle advice API',
    version='1.0.0'
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:5000', 'http://localhost:8000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Configuration
WIHY_MODEL_BASE_URL = "http://localhost:8000"
wihy_model_available = False

@app.on_event('startup')
async def startup_event():
    global wihy_model_available
    try:
        # Check if wihy-model is running
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{WIHY_MODEL_BASE_URL}/", timeout=5.0)
            if response.status_code == 200:
                wihy_model_available = True
                logger.info('✅ wihy-model API is available at http://localhost:8000')
            else:
                logger.warning('⚠️ wihy-model API responded with non-200 status')
    except Exception as e:
        logger.warning(f'⚠️ wihy-model API not available: {e}')
        logger.info('🔄 Starting in fallback mode')
        wihy_model_available = False

@app.get('/')
async def root():
    return {
        'message': 'vHealth Nutrition Facts API', 
        'status': 'healthy', 
        'version': '1.0.0',
        'mode': 'wihy-model' if wihy_model_available else 'fallback',
        'services': {
            'wihy_model_api': wihy_model_available,
            'wihy_model_url': WIHY_MODEL_BASE_URL if wihy_model_available else None
        }
    }

@app.get('/health')
async def health_check():
    '''Health check endpoint'''
    return {
        'status': 'healthy', 
        'service': 'nutrition-facts-api', 
        'timestamp': datetime.now().isoformat(),
        'mode': 'wihy-model' if wihy_model_available else 'fallback',
        'services_ready': {
            'wihy_model_api': wihy_model_available,
            'wihy_model_url': WIHY_MODEL_BASE_URL
        }
    }

@app.post('/api/chat')
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint that forwards to wihy-model API"""
    try:
        logger.info(f'Processing chat query: {request.query}')
        
        if not wihy_model_available:
            raise HTTPException(status_code=503, detail='wihy-model API not available')
        
        # Forward the request to the wihy-model API
        async with httpx.AsyncClient() as client:
            # Adjust the endpoint based on your wihy-model API structure
            response = await client.post(
                f"{WIHY_MODEL_BASE_URL}/api/chat",  # or whatever the correct endpoint is
                json={
                    "query": request.query,
                    "user_context": request.user_context,
                    "include_metadata": request.include_metadata
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f'wihy-model API error: {response.status_code} - {response.text}')
                raise HTTPException(status_code=response.status_code, detail=f'wihy-model API error: {response.text}')
        
    except httpx.RequestError as e:
        logger.error(f'Network error calling wihy-model API: {e}')
        raise HTTPException(status_code=503, detail='Failed to connect to wihy-model API')
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Chat processing error: {e}', exc_info=True)
        raise HTTPException(status_code=500, detail=f'Chat failed: {str(e)}')

@app.get('/api/nutrition/search')
async def search_nutrition_facts(
    product: str = Query(..., description='Product name to search for'),
    serving: Optional[str] = Query(None, description='Specific serving size')
):
    '''Search for nutrition facts by product name'''
    try:
        if not wihy_model_available:
            return get_fallback_nutrition_data(product)
            
        logger.info(f'Searching nutrition facts for: {product}')
        
        # Forward to wihy-model API
        async with httpx.AsyncClient() as client:
            params = {"product": product}
            if serving:
                params["serving"] = serving
                
            response = await client.get(
                f"{WIHY_MODEL_BASE_URL}/api/nutrition/search",
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return get_fallback_nutrition_data(product)
            else:
                logger.error(f'wihy-model API error: {response.status_code}')
                return get_fallback_nutrition_data(product)
        
    except httpx.RequestError as e:
        logger.error(f'Network error: {e}')
        return get_fallback_nutrition_data(product)
    except Exception as e:
        logger.error(f'Error searching nutrition facts: {e}')
        return get_fallback_nutrition_data(product)

@app.post('/api/nutrition/analyze')
async def analyze_nutrition(request: NutritionAnalysisRequest):
    '''Analyze nutrition and provide lifestyle advice'''
    try:
        if not wihy_model_available:
            return get_fallback_analysis(request)
            
        logger.info(f'Analyzing nutrition for: {request.product_name}')
        
        # Forward to wihy-model API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{WIHY_MODEL_BASE_URL}/api/nutrition/analyze",
                json=request.dict(),
                timeout=15.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f'wihy-model API error: {response.status_code}')
                return get_fallback_analysis(request)
        
    except httpx.RequestError as e:
        logger.error(f'Network error: {e}')
        return get_fallback_analysis(request)
    except Exception as e:
        logger.error(f'Error analyzing nutrition: {e}')
        return get_fallback_analysis(request)

# Test endpoint to check wihy-model connectivity
@app.get('/api/test-wihy-model')
async def test_wihy_model():
    """Test connectivity to wihy-model API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{WIHY_MODEL_BASE_URL}/", timeout=5.0)
            return {
                'status': 'success',
                'wihy_model_status': response.status_code,
                'wihy_model_response': response.json() if response.status_code == 200 else response.text,
                'url': WIHY_MODEL_BASE_URL
            }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'url': WIHY_MODEL_BASE_URL
        }

# Keep your existing fallback functions
def get_fallback_nutrition_data(product: str):
    '''Provide fallback nutrition data for common foods'''
    fallback_data = {
        'bacon': {
            'fact_id': 1,
            'product_name': 'Bacon',
            'brand': 'Generic',
            'serving_size': '1 slice (8g)',
            'serving_weight_g': 8.0,
            'nutrition': {
                'energy_kcal': 43.0,
                'proteins_g': 3.0,
                'carbohydrates_g': 0.1,
                'fat_g': 3.3,
                'saturated_fat_g': 1.1,
                'fiber_g': 0.0,
                'sugars_g': 0.0,
                'sodium_mg': 137.0
            },
            'quality_indicators': {
                'nova_group': 4,
                'ingredients_text': 'Pork, salt, sodium nitrite'
            },
            'verification': {
                'source': 'USDA FoodData Central',
                'verified_by': 'Fallback System',
                'fact_checked': True
            }
        }
    }
    
    product_lower = product.lower()
    if product_lower in fallback_data:
        return {
            'status': 'success',
            'results': [fallback_data[product_lower]],
            'count': 1,
            'mode': 'fallback'
        }
    
    return {
        'status': 'not_found',
        'message': f'No fallback data available for \'{product}\'',
        'results': [],
        'mode': 'fallback'
    }

def get_fallback_analysis(request: NutritionAnalysisRequest):
    '''Provide fallback analysis for common foods'''
    return {
        'status': 'success',
        'mode': 'fallback',
        'message': 'Using fallback analysis - wihy-model API not available',
        'query': request.product_name
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5003)
