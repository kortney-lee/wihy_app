import pyodbc
import os
from dotenv import load_dotenv
import pandas as pd
from typing import Optional, List, Dict, Any
import logging
from pathlib import Path

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Database connection handler for Azure SQL Database"""
    
    def __init__(self, database_name: Optional[str] = None):
        # Load from environment variables - using DB_USERNAME to match your .env file
        self.server = os.getenv('DB_SERVER')
        self.database = database_name or os.getenv('DB_NAME')
        self.username = os.getenv('DB_USERNAME')  # Changed back to DB_USERNAME
        self.password = os.getenv('DB_PASSWORD')
        self.driver = os.getenv('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')
        self.connection = None
        
        # Validate required environment variables
        if not all([self.server, self.database, self.username, self.password]):
            missing = []
            if not self.server: missing.append('DB_SERVER')
            if not self.database: missing.append('DB_NAME')
            if not self.username: missing.append('DB_USERNAME')
            if not self.password: missing.append('DB_PASSWORD')
            
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        logger.info(f"DatabaseConnection initialized for {self.database} on {self.server}")
    
    def get_connection_string(self) -> str:
        """Build connection string for Azure SQL Database"""
        return (
            f"DRIVER={self.driver};"
            f"SERVER={self.server};"
            f"DATABASE={self.database};"
            f"UID={self.username};"
            f"PWD={self.password};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30;"
        )
    
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            conn_str = self.get_connection_string()
            self.connection = pyodbc.connect(conn_str)
            logger.info(f"Successfully connected to Azure SQL Database: {self.database}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database {self.database}: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
            logger.info(f"Database connection closed: {self.database}")
    
    def execute_query(self, query: str, params: Optional[tuple] = None) -> pd.DataFrame:
        """Execute a SELECT query and return results as DataFrame"""
        try:
            if not self.connection:
                if not self.connect():
                    raise Exception("Failed to establish database connection")
            
            # Suppress the pandas warning about pyodbc
            import warnings
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message="pandas only supports SQLAlchemy")
                df = pd.read_sql(query, self.connection, params=params)
            
            logger.info(f"Query executed successfully, returned {len(df)} rows from {self.database}")
            return df
        
        except Exception as e:
            logger.error(f"Query execution failed on {self.database}: {e}")
            raise
    
    def execute_non_query(self, query: str, params: Optional[tuple] = None) -> int:
        """Execute INSERT, UPDATE, DELETE queries"""
        try:
            if not self.connection:
                if not self.connect():
                    raise Exception("Failed to establish database connection")
            
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            rows_affected = cursor.rowcount
            self.connection.commit()
            cursor.close()
            
            logger.info(f"Non-query executed successfully, {rows_affected} rows affected in {self.database}")
            return rows_affected
        
        except Exception as e:
            logger.error(f"Non-query execution failed on {self.database}: {e}")
            if self.connection:
                self.connection.rollback()
            raise
    
    def test_connection(self) -> bool:
        """Test the database connection"""
        try:
            if self.connect():
                # Test with a simple query
                test_df = self.execute_query("SELECT 1 as test_column")
                self.disconnect()
                return len(test_df) == 1
            return False
        except Exception as e:
            logger.error(f"Connection test failed for {self.database}: {e}")
            return False
    
    def get_table_list(self) -> List[str]:
        """Get list of tables in the database"""
        try:
            df = self.execute_query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
            )
            return df['TABLE_NAME'].tolist()
        except Exception as e:
            logger.error(f"Failed to get table list from {self.database}: {e}")
            return []
    
    def get_table_schema(self, table_name: str) -> pd.DataFrame:
        """Get schema information for a specific table"""
        try:
            query = """
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
            """
            return self.execute_query(query, (table_name,))
        except Exception as e:
            logger.error(f"Failed to get schema for table {table_name}: {e}")
            return pd.DataFrame()

# Lazy initialization to avoid import-time errors
_vhealth_db = None
_wihy_ml_db = None

def get_db_connection(database: str = 'wihy_ml') -> DatabaseConnection:
    """Get database connection instance"""
    global _vhealth_db, _wihy_ml_db
    
    if database.lower() == 'vhealth':
        if _vhealth_db is None:
            _vhealth_db = DatabaseConnection('vhealth')
        return _vhealth_db
    else:
        if _wihy_ml_db is None:
            _wihy_ml_db = DatabaseConnection('wihy_ml')
        return _wihy_ml_db

def get_vhealth_db() -> DatabaseConnection:
    """Get vhealth database connection"""
    return get_db_connection('vhealth')

def get_wihy_ml_db() -> DatabaseConnection:
    """Get wihy_ml database connection"""
    return get_db_connection('wihy_ml')