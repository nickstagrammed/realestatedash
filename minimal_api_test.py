from flask import Flask, jsonify
import sqlite3
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = 'metro_coordinates.db'

def get_db_connection():
    """Get database connection"""
    if not os.path.exists(DB_PATH):
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

@app.route('/api/test-indexed/<cbsa_code>', methods=['GET'])
def test_indexed_performance(cbsa_code):
    """Minimal test of indexed performance query"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database not found'}), 404
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT month_date, actual_value, indexed_value
            FROM indexed_performance_active
            WHERE cbsa_code = ?
            ORDER BY month_date
            LIMIT 3
        ''', (cbsa_code,))
        
        data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({'error': f'No data found for {cbsa_code}'}), 404
        
        # Test row access
        result = []
        for row in data:
            result.append({
                'month_date': row['month_date'],
                'actual_value': row['actual_value'], 
                'indexed_value': row['indexed_value']
            })
        
        return jsonify({'cbsa_code': cbsa_code, 'data': result})
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)