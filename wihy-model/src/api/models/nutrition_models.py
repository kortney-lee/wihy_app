from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class NutritionFactsBase(BaseModel):
    product_name: str
    brand: Optional[str] = None
    serving_size: str
    serving_weight_g: float
    energy_kcal: Optional[float] = None
    proteins_g: Optional[float] = None
    carbohydrates_g: Optional[float] = None
    fat_g: Optional[float] = None
    saturated_fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugars_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    nova_group: Optional[int] = None
    ingredients_text: Optional[str] = None
    source: Optional[str] = None

class NutritionFactsCreate(NutritionFactsBase):
    verified_by: Optional[str] = None
    fact_checked: bool = False

class NutritionFactsResponse(NutritionFactsBase):
    fact_id: int
    verified_by: Optional[str] = None
    fact_checked: bool
    created_at: datetime
    updated_at: datetime

class FactCheckClaim(BaseModel):
    product_name: str
    serving_weight_g: float
    energy_kcal: Optional[float] = None
    proteins_g: Optional[float] = None
    fat_g: Optional[float] = None
    sodium_mg: Optional[float] = None

class FactCheckResponse(BaseModel):
    status: str
    message: Optional[str] = None
    reference_source: Optional[str] = None
    verified_by: Optional[str] = None
    serving_size_match: Optional[str] = None
    discrepancies: List[Dict[str, Any]] = []
    accuracy_rating: Optional[str] = None