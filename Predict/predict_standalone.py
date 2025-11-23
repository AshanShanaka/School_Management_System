"""
Standalone prediction script that takes JSON input and outputs JSON prediction
Can be called from Node.js via child_process
"""
import sys
import json
from train_model import OLGradePredictor
import os

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize predictor
        predictor = OLGradePredictor()
        
        # Load models
        if not predictor.load_models():
            print(json.dumps({'error': 'Failed to load models'}))
            sys.exit(1)
        
        # Make prediction
        result = predictor.predict_all_subjects(input_data)
        
        # Output result as JSON
        print(json.dumps({
            'success': True,
            'data': result
        }))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()
