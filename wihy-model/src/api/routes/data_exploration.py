from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
from src.database.data_explorer import get_data_explorer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/data", tags=["data-exploration"])

@router.get("/explore")
async def explore_databases():
    """Explore both vhealth and wihy_ml databases"""
    try:
        explorer = get_data_explorer()
        results = explorer.explore_all_databases()
        return {
            "status": "success",
            "databases": results
        }
    except Exception as e:
        logger.error(f"Database exploration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nutrition-tables")
async def find_nutrition_tables():
    """Find tables with nutritional data"""
    try:
        explorer = get_data_explorer()
        results = explorer.search_for_nutrition_data()
        return {
            "status": "success",
            "nutrition_data": results
        }
    except Exception as e:
        logger.error(f"Nutrition table search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sample/{database}/{table}")
async def sample_table_data(
    database: str, 
    table: str, 
    limit: int = Query(default=10, le=100)
):
    """Get sample data from a specific table"""
    try:
        if database not in ['vhealth', 'wihy_ml']:
            raise HTTPException(status_code=400, detail="Database must be 'vhealth' or 'wihy_ml'")
        
        explorer = get_data_explorer()
        df = explorer.sample_table_data(database, table, limit)
        
        if df.empty:
            return {
                "status": "no_data",
                "message": f"No data found in {database}.{table}"
            }
        
        return {
            "status": "success",
            "database": database,
            "table": table,
            "row_count": len(df),
            "columns": df.columns.tolist(),
            "sample_data": df.to_dict('records')
        }
        
    except Exception as e:
        logger.error(f"Failed to sample {database}.{table}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/product-tables")
async def find_product_tables():
    """Find tables that likely contain product data"""
    try:
        explorer = get_data_explorer()
        results = explorer.find_product_tables()
        return {
            "status": "success",
            "product_tables": results
        }
    except Exception as e:
        logger.error(f"Product table search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))