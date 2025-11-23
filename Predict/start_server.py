"""
Production server starter using Waitress
"""
from waitress import serve
from api import app
import os

if __name__ == '__main__':
    print("\n" + "="*60)
    print("O/L Grade Prediction API Server (Production Mode)")
    print("="*60)
    print("Server starting on http://127.0.0.1:5001")
    print("="*60 + "\n")
    
    # Serve with waitress (production-ready WSGI server)
    serve(app, host='127.0.0.1', port=5001, threads=4)
