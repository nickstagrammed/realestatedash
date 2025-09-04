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