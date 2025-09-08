import sqlite3

def test_route_logic():
    """Test the exact logic used in the Flask route"""
    cbsa_code = 13820
    
    conn = sqlite3.connect('metro_coordinates.db')
    conn.row_factory = sqlite3.Row  # This should make rows accessible by key
    
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
        print(f"Query returned {len(data)} rows")
        
        if not data:
            print("No data found - this would trigger 404")
            return
            
        # Test the Chart.js formatting logic
        result = {
            'cbsa_code': cbsa_code,
            'data': {
                'labels': [],
                'datasets': [
                    {
                        'label': 'Actual Active Listings',
                        'data': [],
                        'borderColor': '#3B82F6',
                        'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                        'tension': 0.1
                    },
                    {
                        'label': 'National Trend Index',
                        'data': [],
                        'borderColor': '#64748B',
                        'backgroundColor': 'rgba(100, 116, 139, 0.1)',
                        'tension': 0.1,
                        'borderDash': [5, 5]
                    }
                ]
            },
            'performance_stats': {
                'baseline_date': None,
                'baseline_value': None,
                'latest_actual': None,
                'latest_indexed': None,
                'latest_performance_vs_index': None
            }
        }
        
        # This is where the error likely occurs
        print("Testing row access...")
        for i, row in enumerate(data[:3]):
            print(f"Row {i}:")
            try:
                month_date = str(row['month_date'])
                print(f"  month_date: {month_date}")
                year = month_date[:4]
                month = month_date[4:6]
                label = f"{year}-{month}"
                print(f"  label: {label}")
                
                result['data']['labels'].append(label)
                result['data']['datasets'][0]['data'].append(row['actual_value'])
                result['data']['datasets'][1]['data'].append(row['indexed_value'])
                
            except Exception as e:
                print(f"  ERROR accessing row data: {e}")
                break
        
        print("Row access test completed successfully!")
        print(f"Labels created: {len(result['data']['labels'])}")
        
    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    test_route_logic()