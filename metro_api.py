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
                        'label': 'Pending Listings',
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as count FROM metro_coordinates')
            count = cursor.fetchone()['count']
            conn.close()
            return jsonify({
                'status': 'ok', 
                'database': True,
                'total_cbsa': count
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
    print("  GET /api/health - Health check with database stats")
    print()
    app.run(debug=True, port=5001)