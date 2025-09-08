import sqlite3
import pandas as pd

def calculate_indexed_performance_all_metrics():
    """Calculate indexed performance for all metrics: Active, Median Price, New Listings, Pending Sale"""
    
    conn = sqlite3.connect('metro_coordinates.db')
    cursor = conn.cursor()
    
    # Get latest date and calculate 5-year window dynamically
    cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
    latest_date = cursor.fetchone()[0]
    
    latest_year = int(str(latest_date)[:4])
    latest_month = int(str(latest_date)[4:6])
    start_year = latest_year - 5
    start_date = int(f'{start_year}{latest_month:02d}')
    
    print(f"Analysis Period: {start_date} to {latest_date} (5-year window)")
    
    # Define metrics to process
    metrics = {
        'active': {
            'column': 'active_listing_count',
            'table': 'indexed_performance_active'
        },
        'median_price': {
            'column': 'median_listing_price', 
            'table': 'indexed_performance_median_price'
        },
        'new_listings': {
            'column': 'new_listing_count',
            'table': 'indexed_performance_new_listings'
        },
        'pending_sale': {
            'column': 'pending_listing_count',
            'table': 'indexed_performance_pending_sale'
        }
    }
    
    for metric_name, metric_config in metrics.items():
        print(f"\n{'='*50}")
        print(f"Processing {metric_name.title()} ({metric_config['column']})")
        print(f"{'='*50}")
        
        # Step 1: Calculate national periodic returns
        print("1. Calculating national periodic returns...")
        
        national_query = f"""
            SELECT month_date, {metric_config['column']} 
            FROM national_timeseries 
            WHERE month_date >= ? AND month_date <= ?
            ORDER BY month_date
        """
        
        national_df = pd.read_sql_query(national_query, conn, params=(start_date, latest_date))
        
        # Calculate national periodic returns (month-over-month)
        national_df['prev_count'] = national_df[metric_config['column']].shift(1)
        national_df['national_return'] = (national_df[metric_config['column']] / national_df['prev_count']) - 1
        national_df['national_return'] = national_df['national_return'].fillna(0)  # First month has no return
        
        print(f"   National data points: {len(national_df)}")
        
        # Step 2: Calculate indexed performance for metros
        print("2. Calculating metro indexed performance...")
        
        metro_query = f"""
            SELECT cbsa_code, cbsa_title, month_date, {metric_config['column']} 
            FROM metro_timeseries 
            WHERE month_date >= ? AND month_date <= ?
            ORDER BY cbsa_code, month_date
        """
        
        metro_df = pd.read_sql_query(metro_query, conn, params=(start_date, latest_date))
        
        # Group by metro and calculate indexed performance
        indexed_results = []
        metros = metro_df.groupby(['cbsa_code', 'cbsa_title'])
        total_metros = len(metros)
        
        for processed, ((cbsa_code, cbsa_title), group) in enumerate(metros, 1):
            if processed % 100 == 0 or processed == total_metros:
                print(f"   Processing metro {processed}/{total_metros}...")
            
            # Sort by date and get baseline (first month's value)
            group = group.sort_values('month_date').reset_index(drop=True)
            
            if len(group) == 0:
                continue
                
            baseline_value = group.iloc[0][metric_config['column']]
            baseline_date = group.iloc[0]['month_date']
            
            # Skip metros with null or zero baseline values
            if pd.isna(baseline_value) or baseline_value == 0:
                continue
            
            # Calculate indexed performance for each month
            for idx, row in group.iterrows():
                month_date = row['month_date']
                actual_value = row[metric_config['column']]
                
                # Skip null values
                if pd.isna(actual_value):
                    continue
                
                # Get national returns from baseline to current month
                national_subset = national_df[
                    (national_df['month_date'] >= baseline_date) & 
                    (national_df['month_date'] <= month_date)
                ].copy()
                
                # Calculate cumulative return by multiplying (1 + return) for each month
                cumulative_return = 1.0
                for _, nat_row in national_subset.iterrows():
                    if nat_row['month_date'] > baseline_date:  # Skip baseline month
                        cumulative_return *= (1 + nat_row['national_return'])
                
                # What this metro would be if it followed national trends exactly
                indexed_value = baseline_value * cumulative_return
                
                # Performance vs index: positive = outperforming, negative = underperforming
                performance_vs_index = (actual_value / indexed_value) - 1 if indexed_value != 0 else 0
                
                indexed_results.append({
                    'cbsa_code': cbsa_code,
                    'cbsa_title': cbsa_title,
                    'month_date': month_date,
                    'baseline_value': baseline_value,
                    'baseline_date': baseline_date,
                    'actual_value': actual_value,
                    'indexed_value': indexed_value,
                    'performance_vs_index': performance_vs_index,
                    'cumulative_national_return': cumulative_return - 1
                })
        
        print(f"3. Creating database table: {metric_config['table']}")
        
        # Drop and recreate table
        cursor.execute(f"DROP TABLE IF EXISTS {metric_config['table']}")
        cursor.execute(f"""
            CREATE TABLE {metric_config['table']} (
                cbsa_code INTEGER,
                cbsa_title TEXT,
                month_date INTEGER,
                baseline_value REAL,
                baseline_date INTEGER,
                actual_value REAL,
                indexed_value REAL,
                performance_vs_index REAL,
                cumulative_national_return REAL,
                PRIMARY KEY (cbsa_code, month_date)
            )
        """)
        
        # Insert data
        if indexed_results:
            results_df = pd.DataFrame(indexed_results)
            results_df.to_sql(metric_config['table'], conn, if_exists='append', index=False)
            
            print(f"   Inserted {len(results_df)} records")
        else:
            print(f"   No records to insert")
    
    conn.commit()
    conn.close()
    
    print(f"\nIndexed performance calculation complete for all metrics!")

if __name__ == "__main__":
    calculate_indexed_performance_all_metrics()