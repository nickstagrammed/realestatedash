#!/usr/bin/env python3
"""
Migrate CSV time series data to SQLite for scalable trend analysis.
Creates tables for national, state, and metro time series data.
"""

import sqlite3
import pandas as pd
import os
from datetime import datetime

DB_PATH = 'metro_coordinates.db'

def create_timeseries_tables(conn):
    """Create time series tables for different geographic levels"""
    
    # National time series data
    conn.execute('''
        CREATE TABLE IF NOT EXISTS national_timeseries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month_date INTEGER NOT NULL,  -- YYYYMM format (202507)
            country TEXT NOT NULL,
            median_listing_price REAL,
            active_listing_count INTEGER,
            new_listing_count INTEGER,
            pending_listing_count INTEGER,
            median_days_on_market INTEGER,
            total_listing_count INTEGER,
            pending_ratio REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # State time series data  
    conn.execute('''
        CREATE TABLE IF NOT EXISTS state_timeseries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month_date INTEGER NOT NULL,  -- YYYYMM format
            state TEXT NOT NULL,
            state_id TEXT NOT NULL,
            median_listing_price REAL,
            active_listing_count INTEGER,
            new_listing_count INTEGER,
            pending_listing_count INTEGER,
            median_days_on_market INTEGER,
            total_listing_count INTEGER,
            pending_ratio REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Metro time series data
    conn.execute('''
        CREATE TABLE IF NOT EXISTS metro_timeseries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month_date INTEGER NOT NULL,  -- YYYYMM format
            cbsa_code TEXT NOT NULL,
            cbsa_title TEXT NOT NULL,
            household_rank INTEGER,
            median_listing_price REAL,
            active_listing_count INTEGER,
            new_listing_count INTEGER,
            pending_listing_count INTEGER,
            median_days_on_market INTEGER,
            total_listing_count INTEGER,
            pending_ratio REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for fast querying
    conn.execute('CREATE INDEX IF NOT EXISTS idx_national_date ON national_timeseries(month_date)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_state_date_state ON state_timeseries(month_date, state)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_metro_date_cbsa ON metro_timeseries(month_date, cbsa_code)')
    
    conn.commit()
    print("Created time series tables and indexes")

def migrate_csv_data(conn):
    """Migrate CSV data to SQLite tables"""
    
    # Migrate national data
    if os.path.exists('data/national_data.csv'):
        print("Migrating national data...")
        df = pd.read_csv('data/national_data.csv')
        
        # Select key columns for trend analysis
        national_cols = [
            'month_date_yyyymm', 'country', 'median_listing_price',
            'active_listing_count', 'new_listing_count', 'pending_listing_count',
            'median_days_on_market', 'total_listing_count', 'pending_ratio'
        ]
        
        df_national = df[national_cols].copy()
        df_national.columns = [
            'month_date', 'country', 'median_listing_price',
            'active_listing_count', 'new_listing_count', 'pending_listing_count',
            'median_days_on_market', 'total_listing_count', 'pending_ratio'
        ]
        
        df_national.to_sql('national_timeseries', conn, if_exists='replace', index=False)
        print(f"Migrated {len(df_national)} national records")
    
    # Migrate state data
    if os.path.exists('data/state_data.csv'):
        print("Migrating state data...")
        df = pd.read_csv('data/state_data.csv')
        
        state_cols = [
            'month_date_yyyymm', 'state', 'state_id', 'median_listing_price',
            'active_listing_count', 'new_listing_count', 'pending_listing_count',
            'median_days_on_market', 'total_listing_count', 'pending_ratio'
        ]
        
        df_state = df[state_cols].copy()
        df_state.columns = [
            'month_date', 'state', 'state_id', 'median_listing_price',
            'active_listing_count', 'new_listing_count', 'pending_listing_count',
            'median_days_on_market', 'total_listing_count', 'pending_ratio'
        ]
        
        df_state.to_sql('state_timeseries', conn, if_exists='replace', index=False)
        print(f"Migrated {len(df_state)} state records")
    
    # Migrate metro data
    if os.path.exists('data/metro_data.csv'):
        print("Migrating metro data...")
        df = pd.read_csv('data/metro_data.csv')
        
        metro_cols = [
            'month_date_yyyymm', 'cbsa_code', 'cbsa_title', 'HouseholdRank',
            'median_listing_price', 'active_listing_count', 'new_listing_count', 
            'pending_listing_count', 'median_days_on_market', 'total_listing_count', 
            'pending_ratio'
        ]
        
        df_metro = df[metro_cols].copy()
        df_metro.columns = [
            'month_date', 'cbsa_code', 'cbsa_title', 'household_rank',
            'median_listing_price', 'active_listing_count', 'new_listing_count',
            'pending_listing_count', 'median_days_on_market', 'total_listing_count',
            'pending_ratio'
        ]
        
        df_metro.to_sql('metro_timeseries', conn, if_exists='replace', index=False)
        print(f"Migrated {len(df_metro)} metro records")

def verify_migration(conn):
    """Verify the migration was successful"""
    cursor = conn.cursor()
    
    # Check record counts
    cursor.execute("SELECT COUNT(*) FROM national_timeseries")
    national_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM state_timeseries")
    state_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM metro_timeseries")
    metro_count = cursor.fetchone()[0]
    
    print(f"\nMigration Summary:")
    print(f"National records: {national_count}")
    print(f"State records: {state_count}")  
    print(f"Metro records: {metro_count}")
    
    # Check date ranges
    cursor.execute("SELECT MIN(month_date), MAX(month_date) FROM national_timeseries")
    date_range = cursor.fetchone()
    print(f"Date range: {date_range[0]} to {date_range[1]}")
    
    # Sample recent data
    cursor.execute("""
        SELECT month_date, active_listing_count, new_listing_count, pending_listing_count 
        FROM national_timeseries 
        WHERE month_date >= 202007 
        ORDER BY month_date DESC 
        LIMIT 5
    """)
    recent_data = cursor.fetchall()
    print(f"\nRecent national data (sample):")
    for row in recent_data:
        print(f"  {row[0]}: Active={row[1]}, New={row[2]}, Pending={row[3]}")

def main():
    """Main migration function"""
    print(f"Starting time series data migration to {DB_PATH}")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    
    try:
        # Create tables
        create_timeseries_tables(conn)
        
        # Migrate data
        migrate_csv_data(conn)
        
        # Verify migration
        verify_migration(conn)
        
        print("\n✅ Time series data migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()