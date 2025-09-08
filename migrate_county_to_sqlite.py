import sqlite3
import pandas as pd
import numpy as np
from pathlib import Path

DB_PATH = 'metro_coordinates.db'
CSV_PATH = 'data/county_data.csv'

def migrate_county_data():
    """Migrate county CSV data to SQLite database with optimized schema"""
    
    print("Starting county data migration...")
    
    # Check if CSV exists
    if not Path(CSV_PATH).exists():
        print(f"Error: {CSV_PATH} not found")
        return False
    
    # Read CSV in chunks to handle large file
    print(f"Reading {CSV_PATH}...")
    chunk_size = 10000
    chunks = []
    
    for chunk in pd.read_csv(CSV_PATH, chunksize=chunk_size):
        # Select and rename columns to match database schema
        county_chunk = chunk[[
            'month_date_yyyymm',
            'county_fips', 
            'county_name',
            'median_listing_price',
            'active_listing_count', 
            'new_listing_count',
            'pending_listing_count',
            'median_days_on_market',
            'total_listing_count',
            'pending_ratio'
        ]].copy()
        
        # Rename columns to match database schema
        county_chunk = county_chunk.rename(columns={
            'month_date_yyyymm': 'month_date'
        })
        
        # Clean data
        county_chunk = county_chunk.dropna(subset=['county_fips', 'month_date'])
        county_chunk['county_fips'] = county_chunk['county_fips'].astype(str).str.zfill(5)
        
        chunks.append(county_chunk)
        print(f"Processed {len(chunks) * chunk_size} rows...")
    
    # Combine all chunks
    df = pd.concat(chunks, ignore_index=True)
    print(f"Total records: {len(df)}")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create table with optimized schema
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS county_timeseries (
            month_date INTEGER,
            county_fips TEXT,
            county_name TEXT,
            median_listing_price INTEGER,
            active_listing_count INTEGER, 
            new_listing_count INTEGER,
            pending_listing_count REAL,
            median_days_on_market REAL,
            total_listing_count INTEGER,
            pending_ratio REAL,
            PRIMARY KEY (month_date, county_fips)
        )
    """)
    
    print("Created county_timeseries table...")
    
    # Insert data in smaller chunks to avoid SQL variable limit
    print("Inserting data in chunks...")
    chunk_size = 1000
    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size]
        chunk.to_sql('county_timeseries', conn, if_exists='append' if i > 0 else 'replace', 
                    index=False, method=None)
        if (i // chunk_size + 1) % 50 == 0:
            print(f"Inserted {i + len(chunk)} records...")
    
    # Create indexes after data insertion for better performance
    print("Creating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_county_fips ON county_timeseries(county_fips)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_county_month ON county_timeseries(month_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_county_name ON county_timeseries(county_name)")
    
    # Verify insertion
    cursor.execute("SELECT COUNT(*) FROM county_timeseries")
    count = cursor.fetchone()[0]
    print(f"Successfully inserted {count} county records")
    
    # Sample verification
    cursor.execute("SELECT * FROM county_timeseries LIMIT 3")
    sample = cursor.fetchall()
    print("\nSample data:")
    for row in sample:
        print(f"  {row}")
    
    # Check unique counties
    cursor.execute("SELECT COUNT(DISTINCT county_fips) as unique_counties FROM county_timeseries")
    unique_counties = cursor.fetchone()[0]
    print(f"Unique counties: {unique_counties}")
    
    # Check date range
    cursor.execute("SELECT MIN(month_date), MAX(month_date) FROM county_timeseries")
    min_date, max_date = cursor.fetchone()
    print(f"Date range: {min_date} to {max_date}")
    
    conn.close()
    print("County data migration completed successfully!")
    return True

if __name__ == "__main__":
    migrate_county_data()