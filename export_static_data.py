import sqlite3
import json
import os
from pathlib import Path

DB_PATH = 'metro_coordinates.db'
DATA_DIR = Path('data')

def export_static_data():
    """Export all key data from SQLite to static JSON files for GitHub Pages"""
    
    print("Starting static data export...")
    
    # Create data directory
    DATA_DIR.mkdir(exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    cursor = conn.cursor()
    
    try:
        # Export state coordinates and basic info
        print("Exporting state coordinates...")
        cursor.execute("SELECT * FROM state_coordinates")
        states = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'states.json', 'w') as f:
            json.dump(states, f, separators=(',', ':'))
        print(f"  Exported {len(states)} states")
        
        # Export metro coordinates and basic info
        print("Exporting metro coordinates...")
        cursor.execute("SELECT * FROM metro_coordinates")
        metros = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'metros.json', 'w') as f:
            json.dump(metros, f, separators=(',', ':'))
        print(f"  Exported {len(metros)} metros")
        
        # Export national timeseries
        print("Exporting national timeseries...")
        cursor.execute("SELECT * FROM national_timeseries ORDER BY month_date")
        national_data = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'national_timeseries.json', 'w') as f:
            json.dump(national_data, f, separators=(',', ':'))
        print(f"  Exported {len(national_data)} national records")
        
        # Export state indexed performance data
        print("Exporting state indexed performance...")
        metrics = ['active', 'median_price', 'new_listings', 'pending_sale']
        
        for metric in metrics:
            table_name = f'indexed_performance_{metric}_states'
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY state_id, month_date")
            data = [dict(row) for row in cursor.fetchall()]
            
            with open(DATA_DIR / f'state_indexed_{metric}.json', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"  Exported {len(data)} state {metric} records")
        
        # Export metro indexed performance data
        print("Exporting metro indexed performance...")
        metro_metrics = ['active', 'median_price', 'new_listings', 'pending_sale']
        
        for metric in metro_metrics:
            table_name = f'indexed_performance_{metric}'
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY cbsa_code, month_date")
            data = [dict(row) for row in cursor.fetchall()]
            
            with open(DATA_DIR / f'metro_indexed_{metric}.json', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"  Exported {len(data)} metro {metric} records")
        
        # Export county indexed performance data
        print("Exporting county indexed performance...")
        county_metrics = [
            ('active_listing_count', 'active'), 
            ('new_listing_count', 'new_listings'),
            ('pending_listing_count', 'pending_sale'),
            ('median_listing_price', 'median_price')
        ]
        
        for table_suffix, filename_suffix in county_metrics:
            table_name = f'indexed_performance_{table_suffix}_counties'
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY county_fips, month_date")
            data = [dict(row) for row in cursor.fetchall()]
            
            with open(DATA_DIR / f'county_indexed_{filename_suffix}.json', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"  Exported {len(data)} county {filename_suffix} records")
        
        # Export raw timeseries for fallback
        print("Exporting raw timeseries data...")
        
        # State timeseries
        cursor.execute("SELECT * FROM state_timeseries ORDER BY state_id, month_date")
        state_ts = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'state_timeseries.json', 'w') as f:
            json.dump(state_ts, f, separators=(',', ':'))
        print(f"  Exported {len(state_ts)} state timeseries records")
        
        # Metro timeseries
        cursor.execute("SELECT * FROM metro_timeseries ORDER BY cbsa_code, month_date")
        metro_ts = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'metro_timeseries.json', 'w') as f:
            json.dump(metro_ts, f, separators=(',', ':'))
        print(f"  Exported {len(metro_ts)} metro timeseries records")
        
        # County timeseries (sample for key counties to avoid huge files)
        cursor.execute("""
            SELECT * FROM county_timeseries 
            WHERE county_fips IN (
                SELECT DISTINCT county_fips 
                FROM county_timeseries 
                ORDER BY active_listing_count DESC 
                LIMIT 500
            )
            ORDER BY county_fips, month_date
        """)
        county_ts = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'county_timeseries.json', 'w') as f:
            json.dump(county_ts, f, separators=(',', ':'))
        print(f"  Exported {len(county_ts)} county timeseries records (top 500 counties)")
        
    except Exception as e:
        print(f"Error during export: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
    
    # Calculate file sizes
    print("\nExported files:")
    total_size = 0
    for file_path in DATA_DIR.glob('*.json'):
        size = file_path.stat().st_size
        total_size += size
        print(f"  {file_path.name}: {size/1024:.1f}KB")
    
    print(f"\nTotal export size: {total_size/1024/1024:.1f}MB")
    print("Static data export completed!")

if __name__ == "__main__":
    export_static_data()