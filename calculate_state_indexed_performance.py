#!/usr/bin/env python3

import sqlite3
import pandas as pd

def calculate_state_indexed_performance_all_metrics():
    """Calculate indexed performance for all metrics for states: Active, Median Price, New Listings, Pending Sale"""
    
    conn = sqlite3.connect('metro_coordinates.db')
    cursor = conn.cursor()
    
    # Get latest date and calculate 5-year window dynamically
    cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
    latest_date = cursor.fetchone()[0]
    
    latest_year = int(str(latest_date)[:4])
    latest_month = int(str(latest_date)[4:6])
    start_year = latest_year - 5
    start_date = int(f'{start_year}{latest_month:02d}')
    
    print(f"📊 STATE INDEXED PERFORMANCE CALCULATION")
    print(f"   Analysis Period: {start_date} to {latest_date}")
    print(f"   Window: {start_year}-{latest_month:02d} to {latest_year}-{latest_month:02d} (5 years)")
    
    # Define metrics to process
    metrics = {
        'active': {
            'column': 'active_listing_count',
            'table': 'indexed_performance_active_states'
        },
        'median_price': {
            'column': 'median_listing_price', 
            'table': 'indexed_performance_median_price_states'
        },
        'new_listings': {
            'column': 'new_listing_count',
            'table': 'indexed_performance_new_listings_states'
        },
        'pending_sale': {
            'column': 'pending_listing_count',
            'table': 'indexed_performance_pending_sale_states'
        }
    }
    
    for metric_name, metric_config in metrics.items():
        print(f"\n{'='*50}")
        print(f"📈 PROCESSING: {metric_name.upper().replace('_', ' ')} ({metric_config['column']})")
        print(f"   Target Table: {metric_config['table']}")
        
        # Step 1: Get national data and calculate periodic returns
        print("1. Calculating national periodic returns...")
        
        national_query = f"""
            SELECT month_date, {metric_config['column']} 
            FROM national_timeseries 
            WHERE month_date >= ? AND month_date <= ?
            ORDER BY month_date
        """
        
        national_df = pd.read_sql_query(national_query, conn, params=(start_date, latest_date))
        
        # Calculate national periodic returns
        national_df['prev_count'] = national_df[metric_config['column']].shift(1)
        national_df['national_return'] = (national_df[metric_config['column']] / national_df['prev_count']) - 1
        national_df['national_return'] = national_df['national_return'].fillna(0)  # First month = 0% return
        
        print(f"   National data points: {len(national_df)}")
        
        # Step 2: Calculate indexed performance for states
        print("2. Calculating state indexed performance...")
        
        state_query = f"""
            SELECT state, state_id, month_date, {metric_config['column']} 
            FROM state_timeseries 
            WHERE month_date >= ? AND month_date <= ?
            ORDER BY state, month_date
        """
        
        state_df = pd.read_sql_query(state_query, conn, params=(start_date, latest_date))
        
        # Group by state and calculate indexed performance
        indexed_results = []
        states = state_df.groupby(['state', 'state_id'])
        total_states = len(states)
        
        for processed, ((state_name, state_id), group) in enumerate(states, 1):
            print(f"   Processing {state_name} ({processed}/{total_states})", end='\r')
            
            # Skip if insufficient data
            if len(group) < 12:  # Need at least 1 year of data
                continue
                
            # Get baseline (first month value)
            baseline_value = group.iloc[0][metric_config['column']]
            baseline_date = group.iloc[0]['month_date']
            
            # Calculate indexed performance for each month
            for idx, row in group.iterrows():
                month_date = row['month_date']
                actual_value = row[metric_config['column']]
                
                # Skip null values
                if pd.isna(actual_value) or actual_value == 0:
                    continue
                
                # Get national returns from baseline to current month
                cumulative_return = 1.0
                national_subset = national_df[
                    (national_df['month_date'] > baseline_date) & 
                    (national_df['month_date'] <= month_date)
                ]
                
                for _, nat_row in national_subset.iterrows():
                    if not pd.isna(nat_row['national_return']):
                        cumulative_return *= (1 + nat_row['national_return'])
                
                # Calculate what the value should be following national trends
                indexed_value = baseline_value * cumulative_return
                
                # Calculate performance differential
                performance_vs_index = (actual_value / indexed_value) - 1
                
                indexed_results.append({
                    'state': state_name,
                    'state_id': state_id,
                    'month_date': month_date,
                    'baseline_value': baseline_value,
                    'baseline_date': baseline_date,
                    'actual_value': actual_value,
                    'indexed_value': indexed_value,
                    'performance_vs_index': performance_vs_index,
                    'cumulative_national_return': cumulative_return - 1
                })
        
        print(f"   ✅ Processed {total_states} states                    ")
        
        # Step 3: Store results in database
        print("3. Storing results in database...")
        
        # Drop and recreate table
        cursor.execute(f"DROP TABLE IF EXISTS {metric_config['table']}")
        cursor.execute(f"""
            CREATE TABLE {metric_config['table']} (
                state TEXT,
                state_id TEXT,
                month_date INTEGER,
                baseline_value REAL,
                baseline_date INTEGER,
                actual_value REAL,
                indexed_value REAL,
                performance_vs_index REAL,
                cumulative_national_return REAL,
                PRIMARY KEY (state, month_date)
            )
        """)
        
        # Insert data
        results_df = pd.DataFrame(indexed_results)
        results_df.to_sql(metric_config['table'], conn, if_exists='append', index=False)
        
        print(f"   ✅ Inserted {len(results_df)} records")
        
        # Show sample data
        print(f"\n4️⃣ Sample Data - California:")
        cursor.execute(f"""
            SELECT month_date, baseline_value, actual_value, indexed_value, 
                   ROUND(performance_vs_index * 100, 2) as perf_pct
            FROM {metric_config['table']}
            WHERE state = 'California'
            ORDER BY month_date DESC
            LIMIT 3
        """)
        
        sample_data = cursor.fetchall()
        if sample_data:
            print("   Date    | Baseline | Actual   | Indexed  | Performance")
            print("   --------|----------|----------|----------|------------")
            for row in sample_data:
                month_date, baseline, actual, indexed, perf = row
                print(f"   {month_date} | {baseline:8,.0f} | {actual:8,.0f} | {indexed:8,.0f} | {perf:+6.1f}%")
    
    conn.close()
    print(f"\n🎉 STATE INDEXED PERFORMANCE CALCULATION COMPLETE!")
    print(f"   Created 4 indexed performance tables for states")
    print(f"   Ready for API integration and frontend display")

if __name__ == "__main__":
    calculate_state_indexed_performance_all_metrics()