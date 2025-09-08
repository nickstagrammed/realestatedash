import sqlite3
import pandas as pd

def calculate_indexed_performance():
    """Calculate indexed performance for active listings vs national trends"""
    
    conn = sqlite3.connect('metro_coordinates.db')
    cursor = conn.cursor()
    
    # Get latest date and calculate 5-year window dynamically (same as sidebar)
    cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
    latest_date = cursor.fetchone()[0]
    
    latest_year = int(str(latest_date)[:4])
    latest_month = int(str(latest_date)[4:6])
    start_year = latest_year - 5
    start_date = int(f'{start_year}{latest_month:02d}')
    
    print(f"Analysis Period: {start_date} to {latest_date} (5-year window)")
    
    # Step 1: Get national active listing data and calculate periodic returns
    print("\n1. Calculating national periodic returns...")
    
    national_query = """
        SELECT month_date, active_listing_count 
        FROM national_timeseries 
        WHERE month_date >= ? AND month_date <= ?
        ORDER BY month_date
    """
    
    national_df = pd.read_sql_query(national_query, conn, params=(start_date, latest_date))
    
    # Calculate national periodic returns (month-over-month)
    national_df['prev_count'] = national_df['active_listing_count'].shift(1)
    national_df['national_return'] = (national_df['active_listing_count'] / national_df['prev_count']) - 1
    national_df['national_return'] = national_df['national_return'].fillna(0)  # First month has no return
    
    print(f"   National data points: {len(national_df)}")
    print("   Sample national returns:")
    for i, row in national_df.head(3).iterrows():
        return_pct = row['national_return'] * 100
        print(f"      {int(row['month_date'])}: {int(row['active_listing_count']):,} ({return_pct:+.2f}%)")
    
    # Step 2: Calculate indexed performance for metros
    print("\n2. Calculating metro indexed performance...")
    
    # Get all metro data for the period
    metro_query = """
        SELECT cbsa_code, cbsa_title, month_date, active_listing_count 
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
        if processed % 50 == 0 or processed == total_metros:
            print(f"   Processing metro {processed}/{total_metros}...")
        
        # Sort by date and get baseline (first month's value)
        group = group.sort_values('month_date').reset_index(drop=True)
        
        if len(group) == 0:
            continue
            
        baseline_value = group.iloc[0]['active_listing_count']
        baseline_date = group.iloc[0]['month_date']
        
        # Calculate indexed performance for each month
        for idx, row in group.iterrows():
            month_date = row['month_date']
            actual_value = row['active_listing_count']
            
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
    
    print(f"\n3. Creating database table...")
    
    # Drop and recreate table
    cursor.execute("DROP TABLE IF EXISTS indexed_performance_active")
    cursor.execute("""
        CREATE TABLE indexed_performance_active (
            cbsa_code INTEGER,
            cbsa_title TEXT,
            month_date INTEGER,
            baseline_value INTEGER,
            baseline_date INTEGER,
            actual_value INTEGER,
            indexed_value REAL,
            performance_vs_index REAL,
            cumulative_national_return REAL,
            PRIMARY KEY (cbsa_code, month_date)
        )
    """)
    
    # Insert data
    results_df = pd.DataFrame(indexed_results)
    results_df.to_sql('indexed_performance_active', conn, if_exists='append', index=False)
    
    print(f"   Inserted {len(results_df)} records")
    
    # Show Birmingham example
    print(f"\n4. Birmingham, AL Example:")
    cursor.execute("""
        SELECT month_date, baseline_value, actual_value, indexed_value, performance_vs_index
        FROM indexed_performance_active
        WHERE cbsa_title = 'Birmingham, AL'
        ORDER BY month_date
        LIMIT 5
    """)
    
    for row in cursor.fetchall():
        month, baseline, actual, indexed, perf = row
        perf_pct = perf * 100
        print(f"   {month}: Baseline={baseline:,} -> Actual={actual:,} vs Indexed={indexed:,.0f} ({perf_pct:+.1f}%)")
    
    conn.commit()
    conn.close()
    
    print(f"\nIndexed performance calculation complete!")

if __name__ == "__main__":
    calculate_indexed_performance()