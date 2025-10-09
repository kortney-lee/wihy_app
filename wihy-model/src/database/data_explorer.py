import pandas as pd
from typing import Dict, List, Any
import logging
from .connection import get_vhealth_db, get_wihy_ml_db

logger = logging.getLogger(__name__)

class DataExplorer:
    """Explore available data in both databases for training"""
    
    def __init__(self):
        self.vhealth_db = get_vhealth_db()
        self.wihy_ml_db = get_wihy_ml_db()
    
    def explore_all_databases(self) -> Dict[str, Any]:
        """Get overview of both databases"""
        results = {
            'vhealth': self.explore_database(self.vhealth_db),
            'wihy_ml': self.explore_database(self.wihy_ml_db)
        }
        return results
    
    def explore_database(self, db_connection) -> Dict[str, Any]:
        """Explore a single database"""
        try:
            if not db_connection.test_connection():
                return {"status": "connection_failed", "tables": []}
            
            tables = db_connection.get_table_list()
            
            db_info = {
                "status": "connected",
                "database_name": db_connection.database,
                "table_count": len(tables),
                "tables": {}
            }
            
            # Get info about each table
            for table in tables:
                try:
                    # Get row count
                    count_df = db_connection.execute_query(f"SELECT COUNT(*) as row_count FROM [{table}]")
                    row_count = count_df.iloc[0]['row_count'] if not count_df.empty else 0
                    
                    # Get schema
                    schema = db_connection.get_table_schema(table)
                    
                    db_info["tables"][table] = {
                        "row_count": row_count,
                        "column_count": len(schema),
                        "columns": schema['COLUMN_NAME'].tolist() if not schema.empty else []
                    }
                    
                except Exception as e:
                    logger.warning(f"Could not get info for table {table}: {e}")
                    db_info["tables"][table] = {"error": str(e)}
            
            return db_info
            
        except Exception as e:
            logger.error(f"Failed to explore database {db_connection.database}: {e}")
            return {"status": "error", "error": str(e)}
    
    def find_product_tables(self) -> Dict[str, List[str]]:
        """Find tables that likely contain product/food data"""
        product_keywords = ['product', 'food', 'nutrition', 'ingredient', 'nourish', 'item']
        
        results = {}
        
        for db_name, db_connection in [('vhealth', self.vhealth_db), ('wihy_ml', self.wihy_ml_db)]:
            if db_connection.test_connection():
                tables = db_connection.get_table_list()
                product_tables = []
                
                for table in tables:
                    table_lower = table.lower()
                    if any(keyword in table_lower for keyword in product_keywords):
                        product_tables.append(table)
                
                results[db_name] = product_tables
            else:
                results[db_name] = []
        
        return results
    
    def sample_table_data(self, database: str, table_name: str, limit: int = 5) -> pd.DataFrame:
        """Get sample data from a table"""
        try:
            db_connection = self.vhealth_db if database == 'vhealth' else self.wihy_ml_db
            
            query = f"SELECT TOP {limit} * FROM [{table_name}]"
            return db_connection.execute_query(query)
            
        except Exception as e:
            logger.error(f"Failed to sample data from {database}.{table_name}: {e}")
            return pd.DataFrame()
    
    def search_for_nutrition_data(self) -> Dict[str, Any]:
        """Search for tables with nutritional information"""
        nutrition_columns = [
            'calories', 'protein', 'carb', 'fat', 'fiber', 'sugar', 'sodium', 
            'nourish', 'score', 'rating', 'nutrition'
        ]
        
        results = {}
        
        for db_name, db_connection in [('vhealth', self.vhealth_db), ('wihy_ml', self.wihy_ml_db)]:
            if not db_connection.test_connection():
                results[db_name] = {"status": "connection_failed"}
                continue
                
            tables = db_connection.get_table_list()
            nutrition_tables = {}
            
            for table in tables:
                try:
                    schema = db_connection.get_table_schema(table)
                    if schema.empty:
                        continue
                    
                    columns = schema['COLUMN_NAME'].str.lower().tolist()
                    matching_columns = []
                    
                    for col in columns:
                        if any(nutrition_word in col for nutrition_word in nutrition_columns):
                            matching_columns.append(col)
                    
                    if matching_columns:
                        # Get row count
                        count_df = db_connection.execute_query(f"SELECT COUNT(*) as row_count FROM [{table}]")
                        row_count = count_df.iloc[0]['row_count'] if not count_df.empty else 0
                        
                        nutrition_tables[table] = {
                            "row_count": row_count,
                            "nutrition_columns": matching_columns,
                            "all_columns": columns
                        }
                        
                except Exception as e:
                    logger.warning(f"Error analyzing table {table}: {e}")
            
            results[db_name] = {
                "status": "success",
                "nutrition_tables": nutrition_tables
            }
        
        return results

# Global explorer instance
explorer = DataExplorer()

def get_data_explorer() -> DataExplorer:
    """Get data explorer instance"""
    return explorer