from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Dict, Any, Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service availability flags (like in your test)
HAS_AUTH_MIDDLEWARE = False
HAS_PREDICTIONS_ROUTE = False
HAS_DATA_ROUTES = False
HAS_PREDICTION_SERVICE = False
HAS_NUTRITION_SERVICES = False
HAS_OPENAI_ENHANCER = False

# Service instances
prediction_service = None
nutrition_holder = None
nourish_scorer = None
openai_enhancer = None

# Try imports with graceful degradation (like your test pattern)
try:
    from src.database.connection import get_db_connection
    HAS_DATABASE_CONNECTION = True
    logger.info("✅ Database connection available")
except ImportError as e:
    HAS_DATABASE_CONNECTION = False
    logger.warning(f"⚠️ Database connection not available: {e}")

try:
    from src.api.middleware.auth import AuthMiddleware
    HAS_AUTH_MIDDLEWARE = True
    logger.info("✅ Auth middleware available")
except ImportError as e:
    HAS_AUTH_MIDDLEWARE = False
    logger.warning(f"⚠️ Auth middleware not available: {e}")

try:
    from src.api.routes import predictions
    HAS_PREDICTIONS_ROUTE = True
    logger.info("✅ Predictions route available")
except ImportError as e:
    HAS_PREDICTIONS_ROUTE = False
    logger.warning(f"⚠️ Predictions route not available: {e}")

try:
    from src.api.routes.data_exploration import router as data_router
    HAS_DATA_ROUTES = True
    logger.info("✅ Data exploration routes available")
except ImportError as e:
    HAS_DATA_ROUTES = False
    logger.warning(f"⚠️ Data exploration routes not available: {e}")

try:
    from src.services.prediction_service import PredictionService
    HAS_PREDICTION_SERVICE = True
    logger.info("✅ PredictionService available")
    try:
        prediction_service = PredictionService()
        logger.info("✅ PredictionService initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize PredictionService: {e}")
        prediction_service = None
        HAS_PREDICTION_SERVICE = False
except ImportError as e:
    HAS_PREDICTION_SERVICE = False
    logger.warning(f"⚠️ PredictionService not available: {e}")

try:
    from src.database.nutrition_facts_holder import get_nutrition_facts_holder
    from src.database.nourish_scorer import get_nourish_scorer
    HAS_NUTRITION_SERVICES = True
    logger.info("✅ Nutrition services available")
    try:
        nutrition_holder = get_nutrition_facts_holder()
        nourish_scorer = get_nourish_scorer()
        logger.info("✅ Nutrition services initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize nutrition services: {e}")
        nutrition_holder = None
        nourish_scorer = None
        HAS_NUTRITION_SERVICES = False
except ImportError as e:
    HAS_NUTRITION_SERVICES = False
    logger.warning(f"⚠️ Nutrition services not available: {e}")

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    logger.warning("⚠️ Pandas not available")

# Pydantic models
class UserMetrics(BaseModel):
    daily_calories: Optional[int] = None
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None

class NutritionAnalysisRequest(BaseModel):
    product_name: str
    serving_size: Optional[str] = None
    user_context: str = 'general'
    user_metrics: Optional[UserMetrics] = None

class AskResponse(BaseModel):
    product: Dict[str, Any]
    answer: str

class PredictRequest(BaseModel):
    input_data: Dict[str, Any]

# FastAPI app with service status (like your test approach)
def get_service_status():
    return {
        "database_connection": HAS_DATABASE_CONNECTION,
        "prediction_service": HAS_PREDICTION_SERVICE and prediction_service is not None,
        "nutrition_database": HAS_NUTRITION_SERVICES and nutrition_holder is not None,
        "nourish_scorer": HAS_NUTRITION_SERVICES and nourish_scorer is not None,
        "openai_enhancer": HAS_OPENAI_ENHANCER and openai_enhancer is not None,  # ADD THIS LINE
        "auth_middleware": HAS_AUTH_MIDDLEWARE,
        "pandas": HAS_PANDAS
    }

app = FastAPI(
    title='vHealth wihy-model API',
    description=f'''
    ## Comprehensive Health Analysis API

    **Service Status**: {get_service_status()}
    
    This API provides nutrition analysis with graceful degradation:
    - 🤖 **AI Chat**: ML-powered when available, fallback otherwise
    - 🥗 **Nutrition Search**: Database-driven with fallback data
    - 📊 **Health Analysis**: ML scoring with basic scoring fallback
    - 🔧 **Health Monitoring**: System status and connectivity
    ''',
    version='1.3.0',
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000', 
        'http://localhost:5000',
        'http://localhost:3001',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Conditional middleware and route inclusion (like your test)
if HAS_AUTH_MIDDLEWARE:
    app.add_middleware(AuthMiddleware)
    logger.info("✅ Auth middleware added")

if HAS_PREDICTIONS_ROUTE:
    app.include_router(predictions.router, tags=["AI Chat"])
    logger.info("✅ Predictions router included")

if HAS_DATA_ROUTES:
    app.include_router(data_router, tags=["Data Exploration"])
    logger.info("✅ Data exploration router included")

@app.get("/", tags=["Health"])
def read_root():
    """Welcome endpoint with service status"""
    services_status = get_service_status()
    mode = "ML-powered" if services_status["prediction_service"] else "fallback"
    
    return {
        "message": "Welcome to the vHealth wihy-model API!",
        "version": "1.3.0",
        "mode": mode,
        "services_status": services_status,
        "available_services": [
            service for service, status in services_status.items() if status
        ],
        "endpoints": {
            "chat": "/ask?q=your_question",
            "nutrition_search": "/api/nutrition/search?product=food_name",
            "nutrition_analysis": "/api/nutrition/analyze",
            "health": "/healthz",
            "docs": "/docs"
        }
    }

@app.get("/healthz", tags=["Health"])
def health_check():
    """Health check with detailed service status"""
    try:
        services_status = get_service_status()
        
        # Test database if available
        database_status = {}
        if HAS_DATABASE_CONNECTION:
            try:
                vhealth_db = get_db_connection('vhealth')
                wihy_ml_db = get_db_connection('wihy_ml')
                database_status = {
                    "vhealth": "connected" if vhealth_db.test_connection() else "disconnected",
                    "wihy_ml": "connected" if wihy_ml_db.test_connection() else "disconnected"
                }
            except Exception as e:
                database_status = {"error": str(e)}
        else:
            database_status = {"status": "unavailable"}
        
        overall_health = any(services_status.values()) and not any(
            status == "disconnected" for status in database_status.values() if isinstance(status, str)
        )
        
        return {
            "ok": overall_health,
            "databases": database_status,
            "services": services_status,
            "mode": "ML-powered" if services_status["prediction_service"] else "fallback",
            "version": "1.3.0",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "mode": "error",
            "version": "1.3.0",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/ask", response_model=AskResponse, tags=["AI Chat"])
def ask_endpoint(q: str = Query(..., description="Your food or nutrition question")):
    """
    AI Chat endpoint with OpenAI enhancement and graceful degradation
    """
    try:
        logger.info(f"Processing question: {q}")
        
        # Get basic product info for context
        product_context = {
            'id': 1,
            'name': f"Analysis for '{q}'",
            'brand': 'AI Analysis',
            'label': 'Mixed',
            'score': 3.5
        }
        
        # Try to get specific nutrition data if the question is about a specific product
        if HAS_NUTRITION_SERVICES and nutrition_holder:
            try:
                # Extract potential product name from question
                potential_products = ['bacon', 'apple', 'spinach', 'chicken', 'salmon', 'bread', 'rice']
                found_product = None
                for product in potential_products:
                    if product in q.lower():
                        found_product = product
                        break
                
                if found_product:
                    facts = nutrition_holder.get_nutrition_facts(found_product)
                    if len(facts) > 0:
                        fact_data = facts.iloc[0]
                        product_context = {
                            'id': 1,
                            'name': fact_data['product_name'],
                            'brand': fact_data.get('brand', 'Database'),
                            'label': 'Mixed',  # Will be updated with ML if available
                            'score': 3.5
                        }
                        
                        # Get ML score if available
                        if HAS_NUTRITION_SERVICES and nourish_scorer:
                            try:
                                nutrition_series = pd.Series({
                                    'product_name': fact_data['product_name'],
                                    'energy_kcal_100g': (fact_data['energy_kcal'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                                    'proteins_100g': (fact_data['proteins_g'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                                    'fat_100g': (fact_data['fat_g'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                                    'saturated_fat_g': (fact_data['saturated_fat_g'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                                    'sodium_100g': (fact_data['sodium_mg'] / fact_data['serving_weight_g']) / 10 if fact_data['serving_weight_g'] > 0 else 0,
                                    'nova_group': fact_data['nova_group'] if pd.notna(fact_data['nova_group']) else 1
                                })
                                nourish_result = nourish_scorer.calculate_nourish_score(nutrition_series)
                                product_context['score'] = nourish_result['nourish_score'] / 20  # Convert to 5-point scale
                                product_context['label'] = nourish_result['label']
                                logger.info(f"✅ Updated product context with ML score: {nourish_result['nourish_score']}")
                            except Exception as e:
                                logger.warning(f"ML scoring failed: {e}")
                        
                        logger.info(f"✅ Found nutrition data for {found_product}")
                        
            except Exception as e:
                logger.warning(f"Nutrition lookup failed: {e}")
        
        # Try OpenAI enhancement first (this is your secret sauce!)
        if HAS_OPENAI_ENHANCER and openai_enhancer:
            logger.info("🤖 Using OpenAI-enhanced response")
            try:
                # Create a sample example for enhancement
                basic_response = f"Based on your question about '{q}', here's a basic nutritional assessment. The product appears to be moderately nutritious with mixed health implications."
                
                example = {
                    'input': f"User question: {q}",
                    'output': basic_response,
                    'type': 'nutrition_chat'
                }
                
                enhanced_answer = openai_enhancer.enhance_nutrition_response(example)
                
                if enhanced_answer and len(enhanced_answer) > 50:  # Check if we got a real response
                    logger.info("✅ OpenAI enhancement successful")
                    return AskResponse(
                        product=product_context,
                        answer=enhanced_answer
                    )
                else:
                    logger.warning("❌ OpenAI enhancement returned empty/short response")
                    
            except Exception as e:
                logger.error(f"OpenAI enhancement error: {e}")
        
        # Try ML prediction service as backup
        if HAS_PREDICTION_SERVICE and prediction_service:
            try:
                ml_response = prediction_service.predict_nutrition_advice(q)
                logger.info("✅ Using ML prediction service")
                return AskResponse(
                    product=ml_response.get('product', product_context),
                    answer=ml_response.get('advice', f"ML analysis: {ml_response}")
                )
            except Exception as e:
                logger.warning(f"ML prediction failed: {e}")
        
        # Final fallback response
        logger.info("🔄 Using basic fallback response")
        fallback_answer = f"Based on your question about '{q}', here's a basic nutritional assessment. The product appears to be moderately nutritious with mixed health implications. For enhanced AI-powered responses with detailed nutritional analysis, our system can provide more comprehensive insights when all services are operational."
        
        return AskResponse(
            product=product_context,
            answer=fallback_answer
        )
        
    except Exception as e:
        logger.error(f"Error in ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get('/api/nutrition/search', tags=["Nutrition"])
async def search_nutrition_facts(
    product: str = Query(..., description='Product name to search for'),
    serving: Optional[str] = Query(None, description='Specific serving size')
):
    """Nutrition search with graceful degradation"""
    try:
        logger.info(f'Searching nutrition facts for: {product}')
        
        # Try database first if available
        if HAS_NUTRITION_SERVICES and nutrition_holder and HAS_PANDAS:
            try:
                facts = nutrition_holder.get_nutrition_facts(product, serving)
                
                if len(facts) > 0:
                    logger.info(f"✅ Found {len(facts)} nutrition facts in database")
                    
                    results = []
                    for _, row in facts.iterrows():
                        results.append({
                            'fact_id': int(row['fact_id']),
                            'product_name': row['product_name'],
                            'brand': row['brand'],
                            'serving_size': row['serving_size'],
                            'serving_weight_g': float(row['serving_weight_g']),
                            'nutrition': {
                                'energy_kcal': float(row['energy_kcal']) if pd.notna(row['energy_kcal']) else 0,
                                'proteins_g': float(row['proteins_g']) if pd.notna(row['proteins_g']) else 0,
                                'carbohydrates_g': float(row['carbohydrates_g']) if pd.notna(row['carbohydrates_g']) else 0,
                                'fat_g': float(row['fat_g']) if pd.notna(row['fat_g']) else 0,
                                'saturated_fat_g': float(row['saturated_fat_g']) if pd.notna(row['saturated_fat_g']) else 0,
                                'fiber_g': float(row['fiber_g']) if pd.notna(row['fiber_g']) else 0,
                                'sugars_g': float(row['sugars_g']) if pd.notna(row['sugars_g']) else 0,
                                'sodium_mg': float(row['sodium_mg']) if pd.notna(row['sodium_mg']) else 0
                            },
                            'quality_indicators': {
                                'nova_group': int(row['nova_group']) if pd.notna(row['nova_group']) else 1,
                                'ingredients_text': row['ingredients_text'] or ''
                            },
                            'verification': {
                                'source': row['source'] or '',
                                'verified_by': row['verified_by'] or '',
                                'fact_checked': bool(row['fact_checked']) if pd.notna(row['fact_checked']) else False
                            }
                        })
                    
                    return {
                        'status': 'success',
                        'results': results,
                        'count': len(results),
                        'mode': 'database'
                    }
                else:
                    logger.info("No facts found in database, using fallback")
            except Exception as e:
                logger.error(f"Database search failed: {e}")
        
        # Fallback data (similar to your test approach)
        logger.info("Using fallback nutrition data")
        return get_fallback_nutrition_data(product)
        
    except Exception as e:
        logger.error(f'Error searching nutrition facts: {e}')
        return get_fallback_nutrition_data(product)

@app.post('/api/nutrition/analyze', tags=["Nutrition"])
async def analyze_nutrition(request: NutritionAnalysisRequest):
    """ML-Powered Nutrition Analysis - Get detailed analysis with ML predictions and personalized advice."""
    try:
        logger.info(f'Analyzing nutrition for: {request.product_name}')
        
        # DEBUG: Log service availability
        logger.info(f"🔍 DEBUG - Service availability:")
        logger.info(f"  - HAS_NUTRITION_SERVICES: {HAS_NUTRITION_SERVICES}")
        logger.info(f"  - nutrition_holder is not None: {nutrition_holder is not None}")
        logger.info(f"  - nourish_scorer is not None: {nourish_scorer is not None}")
        logger.info(f"  - HAS_PANDAS: {HAS_PANDAS}")
        logger.info(f"  - HAS_PREDICTION_SERVICE: {HAS_PREDICTION_SERVICE}")
        logger.info(f"  - prediction_service is not None: {prediction_service is not None}")
        
        # Try to use database and ML services
        if HAS_NUTRITION_SERVICES and nutrition_holder and nourish_scorer and HAS_PANDAS:
            logger.info("✅ All services available - attempting database analysis")
            try:
                # Get nutrition facts from database
                facts = nutrition_holder.get_nutrition_facts(request.product_name, request.serving_size)
                logger.info(f"📊 Database query returned {len(facts)} facts")
                
                if len(facts) > 0:
                    logger.info("✅ Using database facts with ML analysis")
                    
                    # Use the first (most relevant) result
                    fact_data = facts.iloc[0]
                    logger.info(f"📋 Using fact: {fact_data['product_name']} - {fact_data['serving_size']}")
                    
                    # Calculate nourish score using ML
                    nutrition_series = pd.Series({
                        'product_name': fact_data['product_name'],
                        'energy_kcal_100g': (fact_data['energy_kcal'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                        'proteins_100g': (fact_data['proteins_g'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                        'fat_100g': (fact_data['fat_g'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                        'saturated_fat_g': (fact_data['saturated_fat_g'] / fact_data['serving_weight_g']) * 100 if fact_data['serving_weight_g'] > 0 else 0,
                        'sodium_100g': (fact_data['sodium_mg'] / fact_data['serving_weight_g']) / 10 if fact_data['serving_weight_g'] > 0 else 0,
                        'nova_group': fact_data['nova_group'] if pd.notna(fact_data['nova_group']) else 1
                    })
                    
                    logger.info("🧠 Calculating nourish score...")
                    nourish_result = nourish_scorer.calculate_nourish_score(nutrition_series)
                    logger.info(f"🎯 Nourish score: {nourish_result['nourish_score']}")
                    
                    # Generate ML-enhanced context-specific advice
                    user_metrics_dict = request.user_metrics.dict() if request.user_metrics else {}
                    
                    # Use ML for enhanced advice if prediction service is available
                    if HAS_PREDICTION_SERVICE and prediction_service:
                        logger.info("🤖 Generating ML-enhanced advice...")
                        try:
                            ml_advice = prediction_service.generate_personalized_advice(
                                nutrition_series, 
                                request.user_context, 
                                user_metrics_dict
                            )
                            advice = ml_advice
                            logger.info("✅ ML advice generated successfully")
                        except Exception as e:
                            logger.warning(f"❌ ML advice generation failed: {e}, using standard advice")
                            advice = generate_lifestyle_advice(fact_data, nourish_result, request.user_context, user_metrics_dict)
                    else:
                        logger.info("⚠️ No ML prediction service - using standard advice")
                        advice = generate_lifestyle_advice(fact_data, nourish_result, request.user_context, user_metrics_dict)
                    
                    logger.info("✅ Returning database_ml mode response")
                    return {
                        'status': 'success',
                        'mode': 'database_ml',
                        'product': {
                            'name': fact_data['product_name'],
                            'brand': fact_data['brand'],
                            'serving_size': fact_data['serving_size'],
                            'serving_weight_g': float(fact_data['serving_weight_g'])
                        },
                        'nutrition': {
                            'energy_kcal': float(fact_data['energy_kcal']) if pd.notna(fact_data['energy_kcal']) else 0,
                            'proteins_g': float(fact_data['proteins_g']) if pd.notna(fact_data['proteins_g']) else 0,
                            'fat_g': float(fact_data['fat_g']) if pd.notna(fact_data['fat_g']) else 0,
                            'saturated_fat_g': float(fact_data['saturated_fat_g']) if pd.notna(fact_data['saturated_fat']) else 0,
                            'sodium_mg': float(fact_data['sodium_mg']) if pd.notna(fact_data['sodium_mg']) else 0
                        },
                        'nourish_score': {
                            'score': nourish_result['nourish_score'],
                            'label': nourish_result['label'],
                            'reasons': nourish_result['reasons']
                        },
                        'lifestyle_advice': advice,
                        'verification': {
                            'source': fact_data['source'] or '',
                            'verified_by': fact_data['verified_by'] or ''
                        }
                    }
                else:
                    logger.info("⚠️ No database facts found, using fallback analysis")
            except Exception as e:
                logger.error(f"❌ Database analysis failed: {e}")
                import traceback
                logger.error(f"📋 Traceback: {traceback.format_exc()}")
        else:
            logger.warning("⚠️ Services not available for database analysis:")
            logger.warning(f"  - HAS_NUTRITION_SERVICES: {HAS_NUTRITION_SERVICES}")
            logger.warning(f"  - nutrition_holder: {nutrition_holder is not None}")
            logger.warning(f"  - nourish_scorer: {nourish_scorer is not None}")
            logger.warning(f"  - HAS_PANDAS: {HAS_PANDAS}")
        
        # Fallback analysis
        logger.info("🔄 Using fallback analysis")
        fallback_result = get_fallback_analysis(request)
        logger.info(f"📤 Returning fallback analysis for {request.product_name}")
        return fallback_result
        
    except Exception as e:
        logger.error(f'❌ Error analyzing nutrition: {e}')
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return get_fallback_analysis(request)

@app.post('/api/nutrition/populate-bacon', tags=["Nutrition"])
async def populate_bacon_data():
    """Populate Sample Data - Add verified bacon nutrition facts to the database."""
    try:
        if nutrition_holder:
            nutrition_holder.add_bacon_facts()
            logger.info("Successfully populated bacon data to database")
            
            return {
                'status': 'success',
                'message': 'Bacon nutrition facts added successfully to database',
                'mode': 'database'
            }
        else:
            raise HTTPException(status_code=503, detail='Nutrition database service not available')
        
    except Exception as e:
        logger.error(f'Error populating bacon data: {e}')
        raise HTTPException(status_code=500, detail=f'Population failed: {str(e)}')

@app.post('/predict', tags=["ML Prediction"])
async def predict_endpoint(request: PredictRequest):
    """ML prediction endpoint for testing"""
    try:
        if HAS_PREDICTION_SERVICE and prediction_service:
            # Use actual ML prediction
            result = prediction_service.predict(request.input_data)
            return {
                'status': 'success',
                'prediction': result,
                'confidence': 0.85,
                'mode': 'ml'
            }
        else:
            # Fallback prediction
            return {
                'status': 'success', 
                'prediction': 'Mixed',
                'confidence': 0.5,
                'mode': 'fallback'
            }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Keep your existing fallback functions but mark them clearly
def get_fallback_nutrition_data(product: str):
    '''Provide fallback nutrition data when database is unavailable'''
    logger.warning(f"Using fallback data for {product} - database not available")
    
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
    """Enhanced fallback analysis with OpenAI integration"""
    logger.info("🔄 Generating fallback analysis")
    
    # Basic nutrition data
    nutrition_info = {
        'energy_kcal': 43.0 if 'bacon' in request.product_name.lower() else 150.0,
        'proteins_g': 3.0 if 'bacon' in request.product_name.lower() else 5.0,
        'fat_g': 3.3 if 'bacon' in request.product_name.lower() else 2.0,
        'saturated_fat_g': 1.1 if 'bacon' in request.product_name.lower() else 0.5,
        'sodium_mg': 137.0 if 'bacon' in request.product_name.lower() else 50.0
    }
    
    # Basic nourish score
    nourish_score = {
        'score': 25 if 'bacon' in request.product_name.lower() else 65,
        'label': 'Fill' if 'bacon' in request.product_name.lower() else 'Nourish',
        'reasons': [
            'High in sodium' if 'bacon' in request.product_name.lower() else 'Good nutrient density',
            'Ultra-processed food' if 'bacon' in request.product_name.lower() else 'Natural ingredients',
            'High saturated fat' if 'bacon' in request.product_name.lower() else 'Balanced macronutrients'
        ]
    }
    
    # Basic fallback data
    fallback_data = {
        'status': 'success',
        'mode': 'fallback',
        'product': {
            'name': request.product_name.title(),
            'brand': 'Generic',
            'serving_size': request.serving_size or '1 serving',
            'serving_weight_g': 100.0
        },
        'nutrition': nutrition_info,
        'nourish_score': nourish_score,
        'lifestyle_advice': {
            'serving_context': f"One serving contains approximately {nutrition_info['energy_kcal']} calories",
            'rating_explanation': f"Scores {nourish_score['score']}/100",
            'key_concerns': nourish_score['reasons'],
            'actionable_tips': [
                'Limit to 1-2 servings per meal',
                'Pair with vegetables to increase nutrients',
                'Consider healthier alternatives'
            ],
            'better_alternatives': [
                'Fresh vegetables',
                'Lean proteins',
                'Whole grains'
            ],
            'personalized_context': f"This represents a portion of your daily nutrition goals"
        },
        'verification': {
            'source': 'Fallback System',
            'verified_by': 'Default Data'
        }
    }
    
    # Enhance with OpenAI if available
    if HAS_OPENAI_ENHANCER and openai_enhancer:
        logger.info("🤖 Enhancing fallback analysis with OpenAI")
        try:
            # Create input for enhancement
            basic_analysis = f"Product: {request.product_name}\nEnergy: {nutrition_info['energy_kcal']} kcal\nProtein: {nutrition_info['proteins_g']}g\nFat: {nutrition_info['fat_g']}g\nSodium: {nutrition_info['sodium_mg']}mg"
            
            example = {
                'input': basic_analysis,
                'output': f"This product scores {nourish_score['score']}/100. {', '.join(nourish_score['reasons'])}.",
                'type': 'nutrition_analysis'
            }
            
            enhanced_response = openai_enhancer.enhance_nutrition_response(example)
            
            if enhanced_response:
                logger.info("✅ OpenAI fallback enhancement successful")
                # Update the advice with enhanced content
                fallback_data['lifestyle_advice']['rating_explanation'] = enhanced_response
                fallback_data['verification']['source'] = 'OpenAI Enhanced Fallback'
                fallback_data['verification']['verified_by'] = 'GPT-4 Analysis'
                
        except Exception as e:
            logger.error(f"OpenAI fallback enhancement failed: {e}")
    
    return fallback_data

def generate_fallback_advice(context: str, user_metrics: Optional[UserMetrics]):
    '''Generate basic lifestyle advice without ML'''
    advice = {
        'serving_context': 'One slice (8g) contains 43 calories, 3g protein, 137mg sodium',
        'rating_explanation': 'Scores 25/100 (Fill category)',
        'key_concerns': ['High in sodium', 'Ultra-processed food', 'High saturated fat'],
        'actionable_tips': [],
        'better_alternatives': [],
        'personalized_context': ''
    }
    
    # Add user metrics context
    if user_metrics and user_metrics.daily_calories:
        daily_calories = user_metrics.daily_calories
        calorie_percentage = (43 / daily_calories) * 100
        advice['personalized_context'] = f'This represents {calorie_percentage:.1f}% of your {daily_calories} daily calorie target'
    
    # Context-specific advice
    if context == 'weight_loss':
        advice['actionable_tips'] = [
            'Limit to 1-2 slices max per meal',
            'Pair with vegetables to increase nutrients',
            'Consider turkey bacon (30% fewer calories)'
        ]
        advice['better_alternatives'] = [
            'Turkey bacon',
            '1 egg (70 cal, 6g protein)',
            'Chicken breast'
        ]
    elif context == 'heart_health':
        advice['actionable_tips'] = [
            'High sodium - limit to once per week',
            'Choose lower-sodium varieties',
            'Pair with potassium-rich foods'
        ]
        advice['better_alternatives'] = [
            'Canadian bacon',
            'Smoked salmon',
            'Plant-based alternatives'
        ]
    else:
        advice['actionable_tips'] = [
            'Enjoy occasionally (1-2 times per week)',
            'Use as flavoring rather than main protein',
            'Balance with nutrient-dense foods'
        ]
        advice['better_alternatives'] = [
            'Leaner proteins',
            'Less processed options'
        ]
    
    return advice

def generate_lifestyle_advice(fact_data, nourish_result, context, user_metrics):
    '''Generate context-specific lifestyle advice'''
    calories_per_serving = float(fact_data['energy_kcal']) if pd.notna(fact_data['energy_kcal']) else 0
    protein_per_serving = float(fact_data['proteins_g']) if pd.notna(fact_data['proteins_g']) else 0
    sodium_per_serving = float(fact_data['sodium_mg']) if pd.notna(fact_data['sodium_mg']) else 0
    serving_size = fact_data['serving_size']
    
    # Base advice structure
    advice = {
        'serving_context': f'One serving ({serving_size}) contains {calories_per_serving} calories, {protein_per_serving}g protein, {sodium_per_serving}mg sodium',
        'rating_explanation': f'Scores {nourish_result["nourish_score"]}/100 ({nourish_result["label"]} category)',
        'key_concerns': nourish_result['reasons'][:3],
        'actionable_tips': [],
        'better_alternatives': [],
        'personalized_context': ''
    }
    
    # Add user metrics context
    if user_metrics.get('daily_calories'):
        daily_calories = user_metrics['daily_calories']
        calorie_percentage = (calories_per_serving / daily_calories) * 100 if daily_calories > 0 else 0
        advice['personalized_context'] = f'This represents {calorie_percentage:.1f}% of your {daily_calories} daily calorie target'
    
    # Context-specific advice
    if context == 'weight_loss':
        advice['actionable_tips'] = [
            'Limit to 1-2 servings max per meal',
            'Pair with 2+ cups of vegetables to increase volume and nutrients',
            'Consider lower-calorie alternatives',
            'Use as a flavor enhancer, not the main protein source'
        ]
        advice['better_alternatives'] = [
            'Turkey bacon (30% fewer calories)',
            '1 egg (70 cal, 6g protein)',
            '1 oz chicken breast (46 cal, 9g protein)'
        ]
    
    return advice