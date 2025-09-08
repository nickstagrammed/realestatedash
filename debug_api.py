import sqlite3

def test_indexed_performance_query():
    conn = sqlite3.connect('metro_coordinates.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cbsa_code = 13820
    
    try:
        cursor.execute('''
            SELECT month_date, baseline_value, actual_value, indexed_value, 
                   performance_vs_index, cumulative_national_return
            FROM indexed_performance_active
            WHERE cbsa_code = ?
            ORDER BY month_date
        ''', (cbsa_code,))
        
        data = cursor.fetchall()
        print(f"Found {len(data)} records for CBSA {cbsa_code}")
        
        if data:
            print("First few records:")
            for i, row in enumerate(data[:3]):
                print(f"  {i+1}. Month: {row['month_date']}, Actual: {row['actual_value']}, Indexed: {row['indexed_value']}")
                
            # Try to access like the API does
            print("\nTesting row access:")
            first_row = data[0]
            print(f"  row['month_date']: {first_row['month_date']}")
            print(f"  row['actual_value']: {first_row['actual_value']}")
        else:
            print("No data found!")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    test_indexed_performance_query()