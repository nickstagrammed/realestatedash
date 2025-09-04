#!/usr/bin/env python3
"""
Real Estate Dashboard Server
Starts both the metro API and HTTP file server
"""

import subprocess
import threading
import time
import os
import http.server
import socketserver
from pathlib import Path

def start_metro_api():
    """Start the Metro Coordinates API"""
    print("Starting Metro API on port 5001...")
    try:
        subprocess.run(['python', 'metro_api.py'], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Metro API failed: {e}")
    except KeyboardInterrupt:
        print("Metro API stopping...")

def start_file_server():
    """Start HTTP file server for dashboard files"""
    print("Starting file server on port 8000...")
    os.chdir(Path(__file__).parent)
    
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Add CORS headers
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    try:
        with socketserver.TCPServer(("", 8000), CustomHandler) as httpd:
            print("Dashboard available at: http://localhost:8000")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("File server stopping...")

def main():
    print("🚀 Starting Real Estate Dashboard Server")
    print("=" * 50)
    
    # Check if database exists
    if not os.path.exists('metro_coordinates.db'):
        print("Database not found. Creating it...")
        subprocess.run(['python', 'create_metro_db.py'])
    
    # Start Metro API in background thread
    api_thread = threading.Thread(target=start_metro_api, daemon=True)
    api_thread.start()
    
    # Give API time to start
    time.sleep(2)
    
    # Start file server (main thread)
    try:
        start_file_server()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        print("Goodbye!")

if __name__ == '__main__':
    main()