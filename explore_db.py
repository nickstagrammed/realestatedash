import sqlite3
import pandas as pd

# Connect to the database
conn = sqlite3.connect('metro_coordinates.db')

# Get all table names
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Available tables:")
for table in tables:
    print(f"  - {table[0]}")

print("\n" + "="*50)

# Look at the structure of key tables
for table_name in ['national_timeseries', 'state_timeseries', 'metro_timeseries']:
    if (table_name,) in tables:
        print(f"\nTable: {table_name}")
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # Sample data
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
        sample = cursor.fetchall()
        print(f"Sample data (first 3 rows):")
        for row in sample:
            print(f"  {row}")
        print("-" * 30)

conn.close()