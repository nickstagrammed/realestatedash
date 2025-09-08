import sqlite3
import os

DB_PATH = 'metro_coordinates.db'

def get_db_connection():
    """Get database connection"""
    if not os.path.exists(DB_PATH):
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def test_api_logic():
    cbsa_code = 13820  # Birmingham
    
    conn = get_db_connection()
    if not conn:
        print("Database not found")
        return
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT month_date, baseline_value, actual_value, indexed_value, 
                   performance_vs_index, cumulative_national_return
            FROM indexed_performance_active
            WHERE cbsa_code = ?
            ORDER BY month_date
        ''', (cbsa_code,))
        
        data = cursor.fetchall()
        print(f"Found {len(data)} records")
        
        if not data:
            print("No data - would return 404")
            return
        
        # Test accessing first row like the API does
        first_row = data[0]
        print(f"First row month_date: {first_row['month_date']}")
        print(f"First row actual_value: {first_row['actual_value']}")
        print("Row access works!")
        
        # Try the exact formatting logic
        month_date = str(first_row['month_date'])
        year = month_date[:4]
        month = month_date[4:6]
        label = f"{year}-{month}"
        print(f"Formatted label: {label}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    test_api_logic()