from src.database.nutrition_facts_holder import get_nutrition_facts_holder, NutritionFactsHolder

def get_nutrition_facts_service() -> NutritionFactsHolder:
    """Dependency to get nutrition facts service"""
    return get_nutrition_facts_holder()