import sqlite3
import csv

# Create SQLite database for metro coordinates
def create_metro_database():
    conn = sqlite3.connect('metro_coordinates.db')
    cursor = conn.cursor()
    
    # Create metro_coordinates table with CBSA code
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metro_coordinates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cbsa_code TEXT UNIQUE NOT NULL,
            metro_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            cbsa_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Load CBSA data from CSV file
    metro_data = []
    try:
        with open('cbsa_coordinates.csv', 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Determine CBSA type based on name
                cbsa_type = 'Metro Area' if 'Metro Area' in row['CBSA_NAME'] else 'Micro Area'
                
                metro_data.append((
                    row['CBSA_CODE'],
                    row['CBSA_NAME'],
                    float(row['LATITUDE']),
                    float(row['LONGITUDE']),
                    cbsa_type
                ))
    except FileNotFoundError:
        print("Error: cbsa_coordinates.csv file not found!")
        print("Please ensure the CBSA data file is in the current directory.")
        conn.close()
        return False
    
    # Insert metro data
    cursor.executemany('''
        INSERT OR REPLACE INTO metro_coordinates 
        (cbsa_code, metro_name, latitude, longitude, cbsa_type)
        VALUES (?, ?, ?, ?, ?)
    ''', metro_data)
    
    # Create indexes for faster queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_metro_name ON metro_coordinates(metro_name)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cbsa_code ON metro_coordinates(cbsa_code)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cbsa_type ON metro_coordinates(cbsa_type)')
    
    conn.commit()
    conn.close()
    
    print(f"Created metro_coordinates.db with {len(metro_data)} CBSA areas")
    print(f"Includes both Metro Areas and Micro Areas from official Census Bureau data")
    print("Database ready for use!")
    return True

if __name__ == "__main__":
    create_metro_database()