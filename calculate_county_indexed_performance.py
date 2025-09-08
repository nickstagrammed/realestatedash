#!/usr/bin/env python3
"""
County Indexed Performance Calculator

Implements the National Adjusted Index Methodology from Project_Brief.md
for county-level real estate data. Calculates how county markets perform 
relative to national trends using compound growth indexing.

Based on the methodology:
1. Establish baseline (first data point in 5-year window)  
2. Calculate national periodic returns
3. Apply cumulative national returns to county baseline
4. Compare actual vs indexed performance
"""

import sqlite3
from typing import Dict, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CountyIndexedPerformanceCalculator:
    def __init__(self, db_path: str = 'metro_coordinates.db'):
        self.db_path = db_path
        self.metrics = [
            'active_listing_count', 
            'new_listing_count', 
            'pending_listing_count',
            'median_listing_price'
        ]
        
    def get_analysis_period(self) -> Tuple[int, int]:
        """Get the 5-year analysis period dynamically based on latest data."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get latest date from national data
            cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
            latest_date = cursor.fetchone()[0]
            
            if not latest_date:
                raise ValueError("No national timeseries data found")
            
            # Calculate 5-year window
            latest_year = int(str(latest_date)[:4])
            latest_month = int(str(latest_date)[4:6])
            start_year = latest_year - 5
            start_date = int(f'{start_year}{latest_month:02d}')
            
            logging.info(f"Analysis period: {start_date} to {latest_date}")
            return start_date, latest_date
    
    def get_national_returns(self, metric: str, start_date: int, end_date: int) -> Dict[int, float]:
        """Calculate national periodic returns for the analysis period."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get national data for the period
            cursor.execute(f'''
                SELECT month_date, {metric}
                FROM national_timeseries
                WHERE month_date BETWEEN ? AND ?
                ORDER BY month_date
            ''', (start_date, end_date))
            
            national_data = cursor.fetchall()
            
            if len(national_data) < 2:
                raise ValueError(f"Insufficient national data for {metric}")
            
            # Calculate periodic returns
            returns = {}
            prev_value = None
            
            for month_date, value in national_data:
                if value is None:
                    continue
                    
                if prev_value is not None and prev_value > 0:
                    return_rate = (value / prev_value) - 1
                    returns[month_date] = return_rate
                else:
                    returns[month_date] = 0.0  # First period or invalid previous value
                    
                prev_value = value
            
            logging.info(f"Calculated {len(returns)} national return periods for {metric}")
            return returns
    
    def calculate_county_indexed_performance(self, metric: str) -> List[Dict]:
        """Calculate indexed performance for all counties for a given metric."""
        start_date, end_date = self.get_analysis_period()
        national_returns = self.get_national_returns(metric, start_date, end_date)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get all counties with data in the analysis period
            cursor.execute(f'''
                SELECT DISTINCT county_fips, county_name
                FROM county_timeseries
                WHERE month_date BETWEEN ? AND ?
                AND {metric} IS NOT NULL
            ''', (start_date, end_date))
            
            counties = cursor.fetchall()
            logging.info(f"Processing {len(counties)} counties for {metric}")
            
            results = []
            
            for county_fips, county_name in counties:
                try:
                    county_results = self.process_county(
                        county_fips, county_name, metric, 
                        start_date, end_date, national_returns
                    )
                    results.extend(county_results)
                except Exception as e:
                    logging.warning(f"Failed to process {county_name} ({county_fips}): {e}")
                    continue
            
            return results
    
    def process_county(self, county_fips: str, county_name: str, metric: str, 
                      start_date: int, end_date: int, 
                      national_returns: Dict[int, float]) -> List[Dict]:
        """Process a single county's indexed performance."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get county data for the analysis period
            cursor.execute(f'''
                SELECT month_date, {metric}
                FROM county_timeseries
                WHERE county_fips = ? AND month_date BETWEEN ? AND ?
                AND {metric} IS NOT NULL
                ORDER BY month_date
            ''', (county_fips, start_date, end_date))
            
            county_data = cursor.fetchall()
            
            if len(county_data) < 2:
                raise ValueError(f"Insufficient data for {county_name}")
            
            # Establish baseline
            baseline_date, baseline_value = county_data[0]
            if baseline_value <= 0:
                raise ValueError(f"Invalid baseline value for {county_name}")
            
            results = []
            cumulative_return = 1.0
            
            for month_date, actual_value in county_data:
                if actual_value is None:
                    continue
                
                # Apply cumulative national returns from baseline
                if month_date in national_returns and month_date > baseline_date:
                    cumulative_return *= (1 + national_returns[month_date])
                
                # Calculate indexed value
                indexed_value = baseline_value * cumulative_return
                
                # Calculate performance vs index
                if indexed_value > 0:
                    performance_vs_index = (actual_value / indexed_value) - 1
                else:
                    performance_vs_index = 0.0
                
                results.append({
                    'county_fips': county_fips,
                    'county_name': county_name,
                    'month_date': month_date,
                    'baseline_value': baseline_value,
                    'baseline_date': baseline_date,
                    'actual_value': actual_value,
                    'indexed_value': indexed_value,
                    'performance_vs_index': performance_vs_index,
                    'cumulative_national_return': cumulative_return - 1
                })
            
            return results
    
    def create_indexed_tables(self):
        """Create indexed performance tables for all metrics."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for metric in self.metrics:
                table_name = f'indexed_performance_{metric}_counties'
                
                # Drop existing table
                cursor.execute(f'DROP TABLE IF EXISTS {table_name}')
                
                # Create new table
                cursor.execute(f'''
                    CREATE TABLE {table_name} (
                        county_fips TEXT,
                        county_name TEXT,
                        month_date INTEGER,
                        baseline_value REAL,
                        baseline_date INTEGER,
                        actual_value REAL,
                        indexed_value REAL,
                        performance_vs_index REAL,
                        cumulative_national_return REAL,
                        PRIMARY KEY (county_fips, month_date)
                    )
                ''')
                
                # Create index for faster lookups
                cursor.execute(f'''
                    CREATE INDEX idx_{table_name}_county_fips 
                    ON {table_name}(county_fips)
                ''')
                
                logging.info(f"Created table: {table_name}")
            
            conn.commit()
    
    def populate_indexed_tables(self):
        """Calculate and populate indexed performance data for all metrics."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for metric in self.metrics:
                logging.info(f"Processing metric: {metric}")
                
                try:
                    results = self.calculate_county_indexed_performance(metric)
                    table_name = f'indexed_performance_{metric}_counties'
                    
                    # Insert results
                    cursor.executemany(f'''
                        INSERT OR REPLACE INTO {table_name}
                        (county_fips, county_name, month_date, baseline_value, 
                         baseline_date, actual_value, indexed_value, 
                         performance_vs_index, cumulative_national_return)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', [(
                        r['county_fips'], r['county_name'], r['month_date'],
                        r['baseline_value'], r['baseline_date'], r['actual_value'],
                        r['indexed_value'], r['performance_vs_index'],
                        r['cumulative_national_return']
                    ) for r in results])
                    
                    conn.commit()
                    logging.info(f"Inserted {len(results)} records for {metric}")
                    
                except Exception as e:
                    logging.error(f"Failed to process {metric}: {e}")
                    continue
    
    def generate_summary_stats(self):
        """Generate summary statistics for the indexed performance data."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for metric in self.metrics:
                table_name = f'indexed_performance_{metric}_counties'
                
                try:
                    cursor.execute(f'''
                        SELECT 
                            COUNT(DISTINCT county_fips) as county_count,
                            COUNT(*) as total_records,
                            AVG(performance_vs_index) as avg_performance,
                            MIN(performance_vs_index) as min_performance,
                            MAX(performance_vs_index) as max_performance
                        FROM {table_name}
                    ''')
                    
                    stats = cursor.fetchone()
                    
                    if stats[0] > 0:  # county_count > 0
                        logging.info(f"""
{metric} Summary:
  Counties: {stats[0]}
  Total Records: {stats[1]}
  Avg Performance vs National: {stats[2]:.1%}
  Min Performance: {stats[3]:.1%}
  Max Performance: {stats[4]:.1%}
                        """)
                    
                except Exception as e:
                    logging.error(f"Failed to generate stats for {metric}: {e}")
    
    def run_full_calculation(self):
        """Run the complete indexed performance calculation pipeline."""
        logging.info("Starting county indexed performance calculation...")
        
        try:
            self.create_indexed_tables()
            self.populate_indexed_tables()
            self.generate_summary_stats()
            
            logging.info("County indexed performance calculation completed successfully!")
            
        except Exception as e:
            logging.error(f"Failed to complete calculation: {e}")
            raise

def main():
    """Main execution function."""
    calculator = CountyIndexedPerformanceCalculator()
    calculator.run_full_calculation()

if __name__ == "__main__":
    main()