import sqlite3
import json
import os
from pathlib import Path

DB_PATH = 'metro_coordinates.db'
DATA_DIR = Path('data')

def export_complete_static_data():
    """Export ALL API endpoints to static JSON files for complete standalone deployment"""
    
    print("Starting complete static data export...")
    
    # Create data directory
    DATA_DIR.mkdir(exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # 1. Core coordinate data (already exported, but let's refresh)
        print("Exporting coordinate data...")
        
        cursor.execute("SELECT * FROM state_coordinates")
        states = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'states.json', 'w') as f:
            json.dump(states, f, separators=(',', ':'))
        print(f"  States: {len(states)} records")
        
        cursor.execute("SELECT * FROM metro_coordinates")
        metros = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'metros.json', 'w') as f:
            json.dump(metros, f, separators=(',', ':'))
        print(f"  Metros: {len(metros)} records")
        
        # 2. All timeseries data (for /api/state/, /api/metro/, /api/county/ endpoints)
        print("Exporting timeseries data...")
        
        cursor.execute("SELECT * FROM national_timeseries ORDER BY month_date")
        national_data = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'national_timeseries.json', 'w') as f:
            json.dump(national_data, f, separators=(',', ':'))
        print(f"  [OK] National timeseries: {len(national_data)} records")
        
        cursor.execute("SELECT * FROM state_timeseries ORDER BY state_id, month_date")
        state_ts = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'state_timeseries.json', 'w') as f:
            json.dump(state_ts, f, separators=(',', ':'))
        print(f"  [OK] State timeseries: {len(state_ts)} records")
        
        cursor.execute("SELECT * FROM metro_timeseries ORDER BY cbsa_code, month_date")
        metro_ts = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'metro_timeseries.json', 'w') as f:
            json.dump(metro_ts, f, separators=(',', ':'))
        print(f"  [OK] Metro timeseries: {len(metro_ts)} records")
        
        # County timeseries (full dataset this time)
        cursor.execute("SELECT * FROM county_timeseries ORDER BY county_fips, month_date")
        county_ts = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'county_timeseries_full.json', 'w') as f:
            json.dump(county_ts, f, separators=(',', ':'))
        print(f"  [OK] County timeseries (full): {len(county_ts)} records")
        
        # 3. Beta/volatility data
        print("Exporting beta data...")
        
        cursor.execute("SELECT * FROM metro_betas")
        metro_betas = [dict(row) for row in cursor.fetchall()]
        with open(DATA_DIR / 'metro_betas.json', 'w') as f:
            json.dump(metro_betas, f, separators=(',', ':'))
        print(f"  [OK] Metro betas: {len(metro_betas)} records")
        
        # 4. All indexed performance data (refresh existing)
        print("Exporting indexed performance data...")
        
        # State indexed performance
        state_metrics = ['active', 'median_price', 'new_listings', 'pending_sale']
        for metric in state_metrics:
            table_name = f'indexed_performance_{metric}_states'
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY state_id, month_date")
            data = [dict(row) for row in cursor.fetchall()]
            with open(DATA_DIR / f'state_indexed_{metric}.json', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"  [OK] State indexed {metric}: {len(data)} records")
        
        # Metro indexed performance
        metro_metrics = ['active', 'median_price', 'new_listings', 'pending_sale']
        for metric in metro_metrics:
            table_name = f'indexed_performance_{metric}'
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY cbsa_code, month_date")
            data = [dict(row) for row in cursor.fetchall()]
            with open(DATA_DIR / f'metro_indexed_{metric}.json', 'w') as f:
                json.dump(data, f, separators=(',', ':'))
            print(f"  [OK] Metro indexed {metric}: {len(data)} records")
        
        # County indexed performance (full datasets)
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
            print(f"  [OK] County indexed {filename_suffix}: {len(data)} records")
        
        # 5. Generate lookup tables for efficient API simulation
        print("Creating lookup tables...")
        
        # County FIPS to name mapping
        cursor.execute("SELECT DISTINCT county_fips, county_name FROM county_timeseries")
        county_lookup = {row['county_fips']: row['county_name'] for row in cursor.fetchall()}
        with open(DATA_DIR / 'county_lookup.json', 'w') as f:
            json.dump(county_lookup, f, separators=(',', ':'))
        print(f"  [OK] County lookup: {len(county_lookup)} mappings")
        
        # State lookup  
        cursor.execute("SELECT DISTINCT state_id, state_name_full FROM state_coordinates")
        state_lookup = {row['state_id']: row['state_name_full'] for row in cursor.fetchall()}
        with open(DATA_DIR / 'state_lookup.json', 'w') as f:
            json.dump(state_lookup, f, separators=(',', ':'))
        print(f"  [OK] State lookup: {len(state_lookup)} mappings")
        
        # Metro lookup
        cursor.execute("SELECT DISTINCT cbsa_code, metro_name FROM metro_coordinates")
        metro_lookup = {row['cbsa_code']: row['metro_name'] for row in cursor.fetchall()}
        with open(DATA_DIR / 'metro_lookup.json', 'w') as f:
            json.dump(metro_lookup, f, separators=(',', ':'))
        print(f"  [OK] Metro lookup: {len(metro_lookup)} mappings")
        
    except Exception as e:
        print(f"Error during export: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
    
    # Calculate file sizes
    print("\nExported files summary:")
    total_size = 0
    for file_path in sorted(DATA_DIR.glob('*.json')):
        size = file_path.stat().st_size
        total_size += size
        print(f"  {file_path.name}: {size/1024:.1f}KB")
    
    print(f"\nCOMPLETE: Complete export finished!")
    print(f"FILES: Total files: {len(list(DATA_DIR.glob('*.json')))}")
    print(f"SIZE: Total size: {total_size/1024/1024:.1f}MB")
    print("READY: Dashboard is now 100% standalone!")

if __name__ == "__main__":
    export_complete_static_data()