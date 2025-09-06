from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

DB_PATH = 'metro_coordinates.db'

def get_db_connection():
    """Get database connection"""
    if not os.path.exists(DB_PATH):
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

@app.route('/api/metros', methods=['GET'])
def get_all_metros():
    """Get all CBSA coordinates"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT cbsa_code, metro_name, latitude, longitude, cbsa_type 
            FROM metro_coordinates 
            ORDER BY metro_name
        ''')
        metros = cursor.fetchall()
        
        # Convert to dictionary format expected by frontend (metro_name -> [lat, lng])
        result = {}
        for metro in metros:
            result[metro['metro_name']] = [metro['latitude'], metro['longitude']]
        
        conn.close()
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/metros/detailed', methods=['GET'])
def get_all_metros_detailed():
    """Get all CBSA coordinates with detailed info (CBSA codes, names, types)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT cbsa_code, metro_name, latitude, longitude, cbsa_type 
            FROM metro_coordinates 
            ORDER BY metro_name
        ''')
        metros = cursor.fetchall()
        
        # Convert to dictionary format with additional CBSA info
        result = {}
        for metro in metros:
            result[metro['cbsa_code']] = {
                'name': metro['metro_name'],
                'coordinates': [metro['latitude'], metro['longitude']],
                'type': metro['cbsa_type']
            }
        
        conn.close()
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/metros/search', methods=['GET'])
def search_metros():
    """Search CBSAs by name or code"""
    query = request.args.get('q', '')
    metro_type = request.args.get('type', '')  # Optional filter: 'Metro Area' or 'Micro Area'
    
    if not query:
        return jsonify({'error': 'Query parameter q is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        
        # Search by name or CBSA code
        sql_query = '''
            SELECT cbsa_code, metro_name, latitude, longitude, cbsa_type 
            FROM metro_coordinates 
            WHERE (metro_name LIKE ? OR cbsa_code LIKE ?)
        '''
        params = [f'%{query}%', f'%{query}%']
        
        # Add type filter if specified
        if metro_type:
            sql_query += ' AND cbsa_type = ?'
            params.append(metro_type)
            
        sql_query += ' ORDER BY metro_name LIMIT 50'  # Limit results for performance
        
        cursor.execute(sql_query, params)
        metros = cursor.fetchall()
        
        result = {}
        for metro in metros:
            result[metro['cbsa_code']] = {
                'name': metro['metro_name'],
                'coordinates': [metro['latitude'], metro['longitude']],
                'type': metro['cbsa_type']
            }
        
        conn.close()
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/metros/add', methods=['POST'])
def add_metro():
    """Add a new CBSA coordinate"""
    data = request.get_json()
    
    required_fields = ['cbsa_code', 'metro_name', 'latitude', 'longitude']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'cbsa_code, metro_name, latitude, and longitude are required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO metro_coordinates 
            (cbsa_code, metro_name, latitude, longitude, cbsa_type)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['cbsa_code'], data['metro_name'], data['latitude'], data['longitude'], 
              data.get('cbsa_type', 'Metro Area')))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'CBSA added successfully'})
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/metros/by-type/<cbsa_type>', methods=['GET'])
def get_metros_by_type(cbsa_type):
    """Get CBSAs filtered by type (Metro Area or Micro Area)"""
    valid_types = ['Metro Area', 'Micro Area']
    if cbsa_type not in valid_types:
        return jsonify({'error': f'Invalid type. Must be one of: {valid_types}'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT cbsa_code, metro_name, latitude, longitude, cbsa_type 
            FROM metro_coordinates 
            WHERE cbsa_type = ?
            ORDER BY metro_name
        ''', (cbsa_type,))
        metros = cursor.fetchall()
        
        result = {}
        for metro in metros:
            result[metro['cbsa_code']] = {
                'name': metro['metro_name'],
                'coordinates': [metro['latitude'], metro['longitude']],
                'type': metro['cbsa_type']
            }
        
        conn.close()
        return jsonify({
            'type': cbsa_type,
            'count': len(result),
            'data': result
        })
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/trends/<level>/<identifier>', methods=['GET'])
def get_trend_data(level, identifier):
    """Get 5-year trend data for Active, New, Pending listings"""
    valid_levels = ['national', 'state', 'metro']
    if level not in valid_levels:
        return jsonify({'error': f'Invalid level. Must be one of: {valid_levels}'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        
        # 5-year date range (July 2020 - July 2025)
        start_date = 202007
        end_date = 202507
        
        if level == 'national':
            cursor.execute('''
                SELECT month_date, active_listing_count, new_listing_count, pending_listing_count
                FROM national_timeseries
                WHERE month_date BETWEEN ? AND ?
                ORDER BY month_date
            ''', (start_date, end_date))
            
        elif level == 'state':
            cursor.execute('''
                SELECT month_date, active_listing_count, new_listing_count, pending_listing_count
                FROM state_timeseries
                WHERE state = ? AND month_date BETWEEN ? AND ?
                ORDER BY month_date
            ''', (identifier, start_date, end_date))
            
        elif level == 'metro':
            cursor.execute('''
                SELECT month_date, active_listing_count, new_listing_count, pending_listing_count
                FROM metro_timeseries
                WHERE cbsa_code = ? AND month_date BETWEEN ? AND ?
                ORDER BY month_date
            ''', (identifier, start_date, end_date))
        
        data = cursor.fetchall()
        conn.close()
        
        # Format data for Chart.js
        result = {
            'level': level,
            'identifier': identifier,
            'dateRange': f"{start_date}-{end_date}",
            'data': {
                'labels': [],
                'datasets': [
                    {
                        'label': 'Active Listings',
                        'data': [],
                        'borderColor': '#3B82F6',
                        'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                        'tension': 0.1
                    },
                    {
                        'label': 'New Listings',
                        'data': [],
                        'borderColor': '#10B981',
                        'backgroundColor': 'rgba(16, 185, 129, 0.1)',
                        'tension': 0.1
                    },
                    {
                        'label': 'Pending Sale',
                        'data': [],
                        'borderColor': '#F59E0B',
                        'backgroundColor': 'rgba(245, 158, 11, 0.1)',
                        'tension': 0.1
                    }
                ]
            }
        }
        
        # Convert YYYYMM to readable format and populate data
        for row in data:
            month_date = str(row['month_date'])
            year = month_date[:4]
            month = month_date[4:6]
            label = f"{year}-{month}"
            
            result['data']['labels'].append(label)
            result['data']['datasets'][0]['data'].append(row['active_listing_count'])
            result['data']['datasets'][1]['data'].append(row['new_listing_count'])
            result['data']['datasets'][2]['data'].append(row['pending_listing_count'])
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/betas/metro/<cbsa_code>', methods=['GET'])
def get_metro_betas(cbsa_code):
    """Get beta calculations for a specific metro area"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM metro_betas WHERE cbsa_code = ?
        ''', (cbsa_code,))
        
        metro_beta = cursor.fetchone()
        conn.close()
        
        if not metro_beta:
            return jsonify({'error': f'Metro not found: {cbsa_code}'}), 404
        
        # Convert to dictionary
        result = dict(metro_beta)
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/betas/state/<state>', methods=['GET'])
def get_state_betas(state):
    """Get beta calculations for a specific state"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM state_betas WHERE state = ?
        ''', (state,))
        
        state_beta = cursor.fetchone()
        conn.close()
        
        if not state_beta:
            return jsonify({'error': f'State not found: {state}'}), 404
        
        # Convert to dictionary
        result = dict(state_beta)
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/coordinates/states', methods=['GET'])
def get_state_coordinates():
    """Get coordinates for all states"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT state, state_id, latitude, longitude
            FROM state_coordinates
            ORDER BY state
        ''')
        
        states = cursor.fetchall()
        conn.close()
        
        # Format for map usage
        result = {}
        for state in states:
            result[state['state']] = [state['latitude'], state['longitude']]
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/betas/metro', methods=['GET'])
def get_all_metro_betas():
    """Get beta calculations for all metro areas"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT cbsa_code, cbsa_title, active_listing_beta_5y,
                   latest_active_count, latest_new_count, latest_pending_count,
                   active_mm_change
            FROM metro_betas
            ORDER BY cbsa_title
        ''')
        
        metros = cursor.fetchall()
        conn.close()
        
        # Format for dashboard usage
        result = {}
        for metro in metros:
            result[metro['cbsa_title']] = {
                'cbsa_code': metro['cbsa_code'],
                'active_listing_count_beta_5y': metro['active_listing_beta_5y'],
                'active_listing_count': metro['latest_active_count'],
                'new_listing_count': metro['latest_new_count'],
                'pending_listing_count': metro['latest_pending_count'],
                'active_listing_count_mm': metro['active_mm_change'],
                'active_listing_count_yy': 0  # Placeholder for now
            }
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/indexed-performance/metro/<cbsa_code>', methods=['GET'])
def get_metro_indexed_performance(cbsa_code):
    """Get indexed performance data for a specific metro"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT month_date, baseline_value, baseline_date, actual_value, indexed_value, 
                   performance_vs_index, cumulative_national_return
            FROM indexed_performance_active
            WHERE cbsa_code = ?
            ORDER BY month_date
        ''', (cbsa_code,))
        
        data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({'error': f'No indexed performance data found for metro {cbsa_code}'}), 404
        
        # Determine color based on latest performance vs index
        latest_performance = 0
        for row in data:
            row_dict = dict(row)
            latest_performance = row_dict['performance_vs_index']
        
        # Green/Yellow/Red coloring based on performance
        if latest_performance >= 0.05:  # Outperforming by 5%+
            actual_color = '#22c55e'  # Green
            actual_bg = 'rgba(34, 197, 94, 0.1)'
        elif latest_performance >= -0.05:  # Within 5% of index
            actual_color = '#eab308'  # Yellow
            actual_bg = 'rgba(234, 179, 8, 0.1)'
        else:  # Underperforming by more than 5%
            actual_color = '#ef4444'  # Red
            actual_bg = 'rgba(239, 68, 68, 0.1)'

        # Format for Chart.js
        result = {
            'cbsa_code': cbsa_code,
            'data': {
                'labels': [],
                'datasets': [
                    {
                        'label': 'Actual Active Listings',
                        'data': [],
                        'borderColor': actual_color,
                        'backgroundColor': actual_bg,
                        'tension': 0.1
                    },
                    {
                        'label': 'National Trend Index',
                        'data': [],
                        'borderColor': '#64748B',
                        'backgroundColor': 'rgba(100, 116, 139, 0.1)',
                        'tension': 0.1,
                        'borderDash': [5, 5]
                    }
                ]
            },
            'performance_stats': {
                'baseline_date': None,
                'baseline_value': None,
                'latest_actual': None,
                'latest_indexed': None,
                'latest_performance_vs_index': None
            }
        }
        
        for row in data:
            # Convert row to dict to avoid KeyError issues
            row_dict = dict(row)
            month_date = str(row_dict['month_date'])
            year = month_date[:4]
            month = month_date[4:6]
            label = f"{year}-{month}"
            
            result['data']['labels'].append(label)
            result['data']['datasets'][0]['data'].append(row_dict['actual_value'])
            result['data']['datasets'][1]['data'].append(row_dict['indexed_value'])
            
            # Store stats from last row
            result['performance_stats'] = {
                'baseline_date': row_dict['baseline_date'],
                'baseline_value': row_dict['baseline_value'],
                'latest_actual': row_dict['actual_value'],
                'latest_indexed': row_dict['indexed_value'],
                'latest_performance_vs_index': row_dict['performance_vs_index']
            }
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        print(f"EXCEPTION in indexed performance route: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal error: {str(e)}'}), 500

@app.route('/api/indexed-performance/metro', methods=['GET'])
def get_all_metro_indexed_performance():
    """Get latest indexed performance for all metros"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        # Get latest month's performance for all metros
        cursor.execute('''
            SELECT i.cbsa_code, i.cbsa_title, i.month_date, i.actual_value, 
                   i.indexed_value, i.performance_vs_index
            FROM indexed_performance_active i
            INNER JOIN (
                SELECT cbsa_code, MAX(month_date) as max_date
                FROM indexed_performance_active
                GROUP BY cbsa_code
            ) latest ON i.cbsa_code = latest.cbsa_code AND i.month_date = latest.max_date
            ORDER BY i.performance_vs_index DESC
        ''')
        
        data = cursor.fetchall()
        conn.close()
        
        result = {}
        for row in data:
            result[row['cbsa_title']] = {
                'cbsa_code': row['cbsa_code'],
                'month_date': row['month_date'],
                'actual_value': row['actual_value'],
                'indexed_value': row['indexed_value'],
                'performance_vs_index': row['performance_vs_index'],
                'performance_vs_index_pct': row['performance_vs_index'] * 100
            }
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

# Median Price Indexed Performance Endpoints
@app.route('/api/indexed-performance/median-price/<cbsa_code>', methods=['GET'])
def get_metro_indexed_performance_median_price(cbsa_code):
    """Get indexed performance data for median price for a specific metro"""
    return get_metric_indexed_performance(cbsa_code, 'indexed_performance_median_price', 'Median Price', 'Median Price Index')

@app.route('/api/indexed-performance/new-listings/<cbsa_code>', methods=['GET'])
def get_metro_indexed_performance_new_listings(cbsa_code):
    """Get indexed performance data for new listings for a specific metro"""
    return get_metric_indexed_performance(cbsa_code, 'indexed_performance_new_listings', 'New Listings', 'New Listings Index')

@app.route('/api/indexed-performance/pending-sale/<cbsa_code>', methods=['GET'])
def get_metro_indexed_performance_pending_sale(cbsa_code):
    """Get indexed performance data for pending sale for a specific metro"""
    return get_metric_indexed_performance(cbsa_code, 'indexed_performance_pending_sale', 'Pending Sale', 'Pending Sale Index')

def get_metric_indexed_performance(cbsa_code, table_name, actual_label, index_label):
    """Generic function to get indexed performance for any metric"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute(f'''
            SELECT month_date, baseline_value, baseline_date, actual_value, indexed_value, 
                   performance_vs_index, cumulative_national_return
            FROM {table_name}
            WHERE cbsa_code = ?
            ORDER BY month_date
        ''', (cbsa_code,))
        
        data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({'error': f'No indexed performance data found for metro {cbsa_code}'}), 404
        
        # Determine color based on latest performance vs index
        latest_performance = 0
        for row in data:
            row_dict = dict(row)
            latest_performance = row_dict['performance_vs_index']
        
        # Green/Yellow/Red coloring based on performance
        if latest_performance >= 0.05:  # Outperforming by 5%+
            actual_color = '#22c55e'  # Green
            actual_bg = 'rgba(34, 197, 94, 0.1)'
        elif latest_performance >= -0.05:  # Within 5% of index
            actual_color = '#eab308'  # Yellow
            actual_bg = 'rgba(234, 179, 8, 0.1)'
        else:  # Underperforming by more than 5%
            actual_color = '#ef4444'  # Red
            actual_bg = 'rgba(239, 68, 68, 0.1)'

        # Format for Chart.js
        result = {
            'cbsa_code': cbsa_code,
            'data': {
                'labels': [],
                'datasets': [
                    {
                        'label': actual_label,
                        'data': [],
                        'borderColor': actual_color,
                        'backgroundColor': actual_bg,
                        'tension': 0.1
                    },
                    {
                        'label': index_label,
                        'data': [],
                        'borderColor': '#64748B',
                        'backgroundColor': 'rgba(100, 116, 139, 0.1)',
                        'tension': 0.1,
                        'borderDash': [5, 5]
                    }
                ]
            },
            'performance_stats': {
                'baseline_date': None,
                'baseline_value': None,
                'latest_actual': None,
                'latest_indexed': None,
                'latest_performance_vs_index': None
            }
        }
        
        for row in data:
            # Convert row to dict to avoid KeyError issues
            row_dict = dict(row)
            month_date = str(row_dict['month_date'])
            year = month_date[:4]
            month = month_date[4:6]
            label = f"{year}-{month}"
            
            result['data']['labels'].append(label)
            result['data']['datasets'][0]['data'].append(row_dict['actual_value'])
            result['data']['datasets'][1]['data'].append(row_dict['indexed_value'])
            
            # Store stats from last row
            result['performance_stats'] = {
                'baseline_date': row_dict['baseline_date'],
                'baseline_value': row_dict['baseline_value'],
                'latest_actual': row_dict['actual_value'],
                'latest_indexed': row_dict['indexed_value'],
                'latest_performance_vs_index': row_dict['performance_vs_index']
            }
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        print(f"EXCEPTION in indexed performance route: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal error: {str(e)}'}), 500

@app.route('/api/median-days/metro/<cbsa_code>', methods=['GET'])
def get_metro_median_days(cbsa_code):
    """Get median days comparison data for a specific metro"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        
        # Get latest date and calculate 5-year window dynamically
        cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
        latest_date_result = cursor.fetchone()
        if not latest_date_result or not latest_date_result[0]:
            return jsonify({'error': 'No date data available'}), 404
            
        latest_date = latest_date_result[0]
        latest_year = int(str(latest_date)[:4])
        latest_month = int(str(latest_date)[4:6])
        start_year = latest_year - 5
        start_date = int(f'{start_year}{latest_month:02d}')
        
        # Get metro median days data
        cursor.execute('''
            SELECT month_date, median_days_on_market
            FROM metro_timeseries
            WHERE cbsa_code = ? AND month_date BETWEEN ? AND ?
            ORDER BY month_date
        ''', (cbsa_code, start_date, latest_date))
        
        metro_data = cursor.fetchall()
        
        # Get national median days data for same period
        cursor.execute('''
            SELECT month_date, median_days_on_market
            FROM national_timeseries
            WHERE month_date BETWEEN ? AND ?
            ORDER BY month_date
        ''', (start_date, latest_date))
        
        national_data = cursor.fetchall()
        conn.close()
        
        if not metro_data:
            return jsonify({'error': f'No median days data found for metro {cbsa_code}'}), 404
        
        # Create lookup for national data by month_date
        national_lookup = {}
        for row in national_data:
            national_lookup[row['month_date']] = row['median_days_on_market']
        
        # Calculate final performance for conditional coloring
        final_metro_days = None
        final_national_days = None
        final_difference = None
        
        # First pass to calculate final performance metrics
        for row in metro_data:
            row_dict = dict(row)
            month_date = row_dict['month_date']
            metro_days = row_dict['median_days_on_market']
            
            if metro_days is None:
                continue
                
            national_days = national_lookup.get(month_date)
            if national_days is None:
                continue
            
            # Update final values (last valid entry)
            final_metro_days = metro_days
            final_national_days = national_days
            final_difference = metro_days - national_days
        
        # Determine conditional color based on performance
        # Convert difference to a beta-like scale for color mapping
        # Negative = better (faster), Positive = worse (slower)
        if final_difference is None:
            metro_color = '#ffd700'  # Default gold
            metro_bg = 'rgba(255, 215, 0, 0.1)'
        else:
            # Map days difference to beta-like scale
            # Very fast (< -10 days): Light blue
            # Fast (-10 to -5 days): Turquoise  
            # Average (-5 to +5 days): Gold
            # Slow (+5 to +15 days): Tomato
            # Very slow (> +15 days): Hot pink
            if final_difference < -10:
                metro_color = '#00bfff'
                metro_bg = 'rgba(0, 191, 255, 0.1)'
            elif final_difference < -5:
                metro_color = '#40e0d0'
                metro_bg = 'rgba(64, 224, 208, 0.1)'
            elif final_difference <= 5:
                metro_color = '#ffd700'
                metro_bg = 'rgba(255, 215, 0, 0.1)'
            elif final_difference <= 15:
                metro_color = '#ff6347'
                metro_bg = 'rgba(255, 99, 71, 0.1)'
            else:
                metro_color = '#ff1493'
                metro_bg = 'rgba(255, 20, 147, 0.1)'
        
        # Format for Chart.js
        result = {
            'cbsa_code': cbsa_code,
            'data': {
                'labels': [],
                'datasets': [
                    {
                        'label': 'Metro Median Days',
                        'data': [],
                        'borderColor': metro_color,
                        'backgroundColor': metro_bg,
                        'tension': 0.1
                    },
                    {
                        'label': 'National Median Days',
                        'data': [],
                        'borderColor': '#64748B',
                        'backgroundColor': 'rgba(100, 116, 139, 0.1)',
                        'tension': 0.1,
                        'borderDash': [5, 5]
                    }
                ]
            },
            'stats': {
                'latest_metro': None,
                'latest_national': None,
                'difference': None
            }
        }
        
        for row in metro_data:
            row_dict = dict(row)
            month_date = row_dict['month_date']
            metro_days = row_dict['median_days_on_market']
            
            # Skip null values
            if metro_days is None:
                continue
                
            # Get corresponding national value
            national_days = national_lookup.get(month_date)
            if national_days is None:
                continue
            
            # Format date for display
            month_str = str(month_date)
            year = month_str[:4]
            month = month_str[4:6]
            label = f"{year}-{month}"
            
            result['data']['labels'].append(label)
            result['data']['datasets'][0]['data'].append(metro_days)
            result['data']['datasets'][1]['data'].append(national_days)
            
            # Update stats (last valid entry)
            result['stats'] = {
                'latest_metro': metro_days,
                'latest_national': national_days,
                'difference': metro_days - national_days
            }
        
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        print(f"EXCEPTION in median days route: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal error: {str(e)}'}), 500

@app.route('/api/median-days/state/<state_id>', methods=['GET'])
def get_state_median_days_comparison(state_id):
    """Get median days comparison for state vs national"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        
        # Get latest date and calculate 5-year window dynamically
        cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
        latest_date = cursor.fetchone()[0]
        
        latest_year = int(str(latest_date)[:4])
        latest_month = int(str(latest_date)[4:6])
        start_year = latest_year - 5
        start_date = int(f'{start_year}{latest_month:02d}')
        
        # Get state median days data
        cursor.execute('''
            SELECT month_date, median_days_on_market
            FROM state_timeseries
            WHERE state_id = ? AND month_date BETWEEN ? AND ?
            ORDER BY month_date
        ''', (state_id, start_date, latest_date))
        
        state_data = cursor.fetchall()
        if not state_data:
            conn.close()
            return jsonify({'error': f'No data found for state {state_id}'}), 404
        
        # Get national median days data for same period
        cursor.execute('''
            SELECT month_date, median_days_on_market
            FROM national_timeseries
            WHERE month_date BETWEEN ? AND ?
            ORDER BY month_date
        ''', (start_date, latest_date))
        
        national_data = cursor.fetchall()
        
        # Create lookup for national data by month_date
        national_lookup = {}
        for row in national_data:
            national_lookup[row['month_date']] = row['median_days_on_market']
        
        # Process data for Chart.js
        labels = []
        state_days_data = []
        national_days_data = []
        
        for row in state_data:
            month_date = row['month_date']
            state_days = row['median_days_on_market']
            national_days = national_lookup.get(month_date)
            
            if state_days is not None and national_days is not None:
                # Convert YYYYMM to readable date
                date_str = str(month_date)
                year = date_str[:4]
                month = date_str[4:6]
                labels.append(f"{year}-{month}")
                
                state_days_data.append(state_days)
                national_days_data.append(national_days)
        
        # Get latest values for stats
        latest_state = state_days_data[-1] if state_days_data else 0
        latest_national = national_days_data[-1] if national_days_data else 0
        difference = latest_state - latest_national
        
        # Determine state line color based on performance
        # Using same logic as metro: faster = better (lower days)
        if difference <= -10:
            state_color = '#00bfff'  # Light blue - very fast
        elif difference <= -5:
            state_color = '#40e0d0'  # Turquoise - fast
        elif abs(difference) <= 5:
            state_color = '#ffd700'  # Gold - average
        elif difference <= 15:
            state_color = '#ff6347'  # Tomato - slow
        else:
            state_color = '#ff1493'  # Hot pink - very slow
        
        result = {
            'state_id': state_id,
            'data': {
                'labels': labels,
                'datasets': [
                    {
                        'label': 'State Median Days',
                        'data': state_days_data,
                        'borderColor': state_color,
                        'backgroundColor': state_color + '20',
                        'borderWidth': 2,
                        'fill': False,
                        'tension': 0.1
                    },
                    {
                        'label': 'National Median Days',
                        'data': national_days_data,
                        'borderColor': '#64748B',
                        'backgroundColor': '#64748B20',
                        'borderWidth': 2,
                        'borderDash': [5, 5],
                        'fill': False,
                        'tension': 0.1
                    }
                ]
            },
            'stats': {
                'latest_state': latest_state,
                'latest_national': latest_national,
                'difference': difference
            }
        }
        
        conn.close()
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': f'Internal error: {str(e)}'}), 500

# State Indexed Performance Endpoints
@app.route('/api/indexed-performance/state/active/<state_id>', methods=['GET'])
def get_state_indexed_performance_active(state_id):
    """Get indexed performance data for active listings for a specific state"""
    return get_state_metric_indexed_performance(state_id, 'indexed_performance_active_states', 'Active Listings', 'Active Listings Index')

@app.route('/api/indexed-performance/state/median-price/<state_id>', methods=['GET'])
def get_state_indexed_performance_median_price(state_id):
    """Get indexed performance data for median price for a specific state"""
    return get_state_metric_indexed_performance(state_id, 'indexed_performance_median_price_states', 'Median Price', 'Median Price Index')

@app.route('/api/indexed-performance/state/new-listings/<state_id>', methods=['GET'])
def get_state_indexed_performance_new_listings(state_id):
    """Get indexed performance data for new listings for a specific state"""
    return get_state_metric_indexed_performance(state_id, 'indexed_performance_new_listings_states', 'New Listings', 'New Listings Index')

@app.route('/api/indexed-performance/state/pending-sale/<state_id>', methods=['GET'])
def get_state_indexed_performance_pending_sale(state_id):
    """Get indexed performance data for pending sale for a specific state"""
    return get_state_metric_indexed_performance(state_id, 'indexed_performance_pending_sale_states', 'Pending Sale', 'Pending Sale Index')

def get_state_metric_indexed_performance(state_id, table_name, actual_label, index_label):
    """Generic function to get state indexed performance for any metric"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute(f'''
            SELECT month_date, baseline_value, baseline_date, actual_value, indexed_value, 
                   performance_vs_index, cumulative_national_return, state
            FROM {table_name}
            WHERE state_id = ?
            ORDER BY month_date
        ''', (state_id,))
        
        rows = cursor.fetchall()
        if not rows:
            conn.close()
            return jsonify({'error': f'No data found for state {state_id}'}), 404
        
        # Format data for Chart.js
        labels = []
        actual_data = []
        indexed_data = []
        
        for row in rows:
            # Convert YYYYMM to readable date
            date_str = str(row['month_date'])
            year = date_str[:4]
            month = date_str[4:6]
            labels.append(f"{year}-{month}")
            
            actual_data.append(row['actual_value'])
            indexed_data.append(row['indexed_value'])
        
        # Determine colors based on latest performance
        latest_performance = rows[-1]['performance_vs_index']
        if latest_performance >= 0.05:
            actual_color = '#22c55e'  # Green - outperforming by 5%+
        elif latest_performance <= -0.05:
            actual_color = '#ef4444'  # Red - underperforming by 5%+
        else:
            actual_color = '#eab308'  # Yellow - within 5% of national
        
        result = {
            'state_id': state_id,
            'state_name': rows[0]['state'],
            'data': {
                'labels': labels,
                'datasets': [
                    {
                        'label': f'Actual {actual_label}',
                        'data': actual_data,
                        'borderColor': actual_color,
                        'backgroundColor': actual_color + '20',
                        'borderWidth': 2,
                        'fill': False,
                        'tension': 0.1
                    },
                    {
                        'label': index_label,
                        'data': indexed_data,
                        'borderColor': '#64748B',
                        'backgroundColor': '#64748B20',
                        'borderWidth': 2,
                        'borderDash': [5, 5],
                        'fill': False,
                        'tension': 0.1
                    }
                ]
            },
            'performance_stats': {
                'latest_actual': rows[-1]['actual_value'],
                'latest_indexed': rows[-1]['indexed_value'],
                'latest_performance_vs_index': latest_performance,
                'baseline_value': rows[0]['baseline_value'],
                'cumulative_national_return': rows[-1]['cumulative_national_return']
            }
        }
        
        conn.close()
        return jsonify(result)
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': f'Internal error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as count FROM metro_coordinates')
            count = cursor.fetchone()['count']
            
            # Check indexed performance table
            cursor.execute('SELECT COUNT(*) as indexed_count FROM indexed_performance_active')
            indexed_count = cursor.fetchone()['indexed_count']
            
            conn.close()
            return jsonify({
                'status': 'ok', 
                'database': True,
                'total_cbsa': count,
                'indexed_performance_records': indexed_count
            })
        except:
            if conn:
                conn.close()
            return jsonify({'status': 'error', 'database': False})
    else:
        return jsonify({'status': 'error', 'database': False})

if __name__ == '__main__':
    print("Starting CBSA Coordinates API...")
    print("Endpoints available:")
    print("  GET /api/metros - Get all CBSA coordinates")
    print("  GET /api/metros/search?q=query&type=type - Search CBSAs")
    print("  GET /api/metros/by-type/Metro%20Area - Get Metro Areas only")
    print("  GET /api/metros/by-type/Micro%20Area - Get Micro Areas only") 
    print("  POST /api/metros/add - Add new CBSA")
    print("  GET /api/indexed-performance/metro/<cbsa_code> - Get indexed performance for metro")
    print("  GET /api/indexed-performance/metro - Get all metro indexed performance")
    print("  GET /api/indexed-performance/median-price/<cbsa_code> - Get median price indexed performance")
    print("  GET /api/indexed-performance/new-listings/<cbsa_code> - Get new listings indexed performance")
    print("  GET /api/indexed-performance/pending-sale/<cbsa_code> - Get pending sale indexed performance")
    print("  GET /api/median-days/state/<state_id> - Get state median days vs national comparison")
    print("  GET /api/indexed-performance/state/active/<state_id> - Get state active listings indexed performance")
    print("  GET /api/indexed-performance/state/median-price/<state_id> - Get state median price indexed performance")
    print("  GET /api/indexed-performance/state/new-listings/<state_id> - Get state new listings indexed performance")
    print("  GET /api/indexed-performance/state/pending-sale/<state_id> - Get state pending sale indexed performance")
    print("  GET /api/health - Health check with database stats")
    print()
    app.run(debug=True, port=5001)