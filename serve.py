#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP server for the Real Estate Dashboard
Run this to serve your files and avoid CORS issues
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Set console encoding to UTF-8 for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Change to the script's directory
script_dir = Path(__file__).parent
os.chdir(script_dir)

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        # Disable caching for JS files
        if self.path.endswith('.js'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    try:
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            print(f"🚀 Real Estate Dashboard Server")
            print(f"📍 Serving at: http://localhost:{PORT}")
            print(f"📂 Directory: {script_dir}")
            print(f"🌐 Open: http://localhost:{PORT}/index.html")
            print(f"\n💡 Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use")
            print(f"💡 Try a different port or stop the existing server")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()