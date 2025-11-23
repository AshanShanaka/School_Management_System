"""
Flask API for O/L Grade Prediction Service
Provides REST API endpoints for grade predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
from train_model import OLGradePredictor
from config import API_CONFIG

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Initialize predictor
predictor = OLGradePredictor()

# Load models on startup
model_loaded = False
if os.path.exists('models/lstm_model.h5'):
    model_loaded = predictor.load_models()
    if model_loaded:
        print("✓ Models loaded successfully!")
else:
    print("⚠ No trained models found. Please train models first using train_model.py")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'model_loaded': model_loaded,
        'service': 'O/L Grade Prediction API',
        'version': '1.0.0'
    })


@app.route('/api/predict/student', methods=['POST'])
def predict_student():
    """
    Predict O/L grades for a single student
    
    Request body:
    {
        "subjects": [
            {"name": "Mathematics", "marks": [75, 80, 78, 82, 85]},
            {"name": "Science", "marks": [65, 70, 72, 75]}
        ],
        "attendance": 85.5
    }
    """
    if not model_loaded:
        return jsonify({
            'error': 'Models not loaded. Please train models first.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or 'subjects' not in data:
            return jsonify({'error': 'Invalid request. "subjects" field is required.'}), 400
        
        # Set default attendance if not provided
        if 'attendance' not in data:
            data['attendance'] = 100
        
        # Perform prediction
        predictions = predictor.predict_all_subjects(data)
        
        return jsonify({
            'success': True,
            'data': predictions
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/predict/class', methods=['POST'])
def predict_class():
    """
    Predict O/L grades for all students in a class
    
    Request body:
    {
        "students": [
            {
                "student_id": "S001",
                "name": "John Doe",
                "subjects": [...],
                "attendance": 85.5
            },
            ...
        ]
    }
    """
    if not model_loaded:
        return jsonify({
            'error': 'Models not loaded. Please train models first.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or 'students' not in data:
            return jsonify({'error': 'Invalid request. "students" field is required.'}), 400
        
        students = data['students']
        results = []
        
        # Class-level statistics
        total_high_risk = 0
        total_medium_risk = 0
        total_low_risk = 0
        total_avg_predicted = 0
        
        for student in students:
            student_data = {
                'subjects': student.get('subjects', []),
                'attendance': student.get('attendance', 100)
            }
            
            prediction = predictor.predict_all_subjects(student_data)
            
            # Count risk levels
            if prediction['risk_level'] == 'HIGH':
                total_high_risk += 1
            elif prediction['risk_level'] == 'MEDIUM':
                total_medium_risk += 1
            else:
                total_low_risk += 1
            
            total_avg_predicted += prediction['overall_average']
            
            results.append({
                'student_id': student.get('student_id'),
                'name': student.get('name'),
                'prediction': prediction
            })
        
        # Calculate class statistics
        class_summary = {
            'total_students': len(students),
            'high_risk_count': total_high_risk,
            'medium_risk_count': total_medium_risk,
            'low_risk_count': total_low_risk,
            'class_average': total_avg_predicted / len(students) if students else 0,
            'high_risk_percentage': (total_high_risk / len(students) * 100) if students else 0
        }
        
        return jsonify({
            'success': True,
            'class_summary': class_summary,
            'student_predictions': results
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/predict/subject', methods=['POST'])
def predict_subject():
    """
    Predict performance for specific subject across multiple students
    
    Request body:
    {
        "subject_name": "Mathematics",
        "students": [
            {
                "student_id": "S001",
                "name": "John Doe",
                "marks": [75, 80, 78, 82, 85],
                "attendance": 85.5
            },
            ...
        ]
    }
    """
    if not model_loaded:
        return jsonify({
            'error': 'Models not loaded. Please train models first.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or 'students' not in data or 'subject_name' not in data:
            return jsonify({
                'error': 'Invalid request. "subject_name" and "students" fields are required.'
            }), 400
        
        subject_name = data['subject_name']
        students = data['students']
        results = []
        
        # Subject-level statistics
        total_predicted = 0
        grade_distribution = {'A': 0, 'B': 0, 'C': 0, 'S': 0, 'W': 0}
        
        for student in students:
            marks = student.get('marks', [])
            attendance = student.get('attendance', 100)
            
            if not marks:
                continue
            
            prediction = predictor.predict_next_mark(marks, attendance)
            
            grade_distribution[prediction['predicted_grade']] += 1
            total_predicted += prediction['predicted_mark']
            
            results.append({
                'student_id': student.get('student_id'),
                'name': student.get('name'),
                'current_average': float(np.mean(marks)),
                'predicted_mark': prediction['predicted_mark'],
                'predicted_grade': prediction['predicted_grade'],
                'confidence': prediction['confidence'],
                'attendance': attendance
            })
        
        # Calculate subject statistics
        subject_summary = {
            'subject_name': subject_name,
            'total_students': len(results),
            'average_predicted': total_predicted / len(results) if results else 0,
            'grade_distribution': grade_distribution,
            'pass_rate': ((len(results) - grade_distribution['W']) / len(results) * 100) if results else 0
        }
        
        return jsonify({
            'success': True,
            'subject_summary': subject_summary,
            'student_predictions': results
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/predict/bulk', methods=['POST'])
def predict_bulk():
    """
    Bulk prediction endpoint for admin view (all classes)
    
    Request body:
    {
        "classes": [
            {
                "class_id": "C001",
                "class_name": "Grade 11-A",
                "students": [...]
            },
            ...
        ]
    }
    """
    if not model_loaded:
        return jsonify({
            'error': 'Models not loaded. Please train models first.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or 'classes' not in data:
            return jsonify({'error': 'Invalid request. "classes" field is required.'}), 400
        
        classes = data['classes']
        results = []
        
        # School-level statistics
        total_students = 0
        total_high_risk = 0
        total_medium_risk = 0
        total_low_risk = 0
        overall_avg = 0
        
        for class_data in classes:
            class_students = class_data.get('students', [])
            class_predictions = []
            
            class_high_risk = 0
            class_medium_risk = 0
            class_low_risk = 0
            class_total_avg = 0
            
            for student in class_students:
                student_data = {
                    'subjects': student.get('subjects', []),
                    'attendance': student.get('attendance', 100)
                }
                
                prediction = predictor.predict_all_subjects(student_data)
                
                # Count risk levels
                if prediction['risk_level'] == 'HIGH':
                    class_high_risk += 1
                    total_high_risk += 1
                elif prediction['risk_level'] == 'MEDIUM':
                    class_medium_risk += 1
                    total_medium_risk += 1
                else:
                    class_low_risk += 1
                    total_low_risk += 1
                
                class_total_avg += prediction['overall_average']
                overall_avg += prediction['overall_average']
                total_students += 1
                
                class_predictions.append({
                    'student_id': student.get('student_id'),
                    'name': student.get('name'),
                    'overall_average': prediction['overall_average'],
                    'risk_level': prediction['risk_level']
                })
            
            results.append({
                'class_id': class_data.get('class_id'),
                'class_name': class_data.get('class_name'),
                'total_students': len(class_students),
                'class_average': class_total_avg / len(class_students) if class_students else 0,
                'high_risk_count': class_high_risk,
                'medium_risk_count': class_medium_risk,
                'low_risk_count': class_low_risk,
                'students': class_predictions
            })
        
        # Overall school statistics
        school_summary = {
            'total_students': total_students,
            'total_classes': len(classes),
            'school_average': overall_avg / total_students if total_students > 0 else 0,
            'total_high_risk': total_high_risk,
            'total_medium_risk': total_medium_risk,
            'total_low_risk': total_low_risk,
            'high_risk_percentage': (total_high_risk / total_students * 100) if total_students > 0 else 0
        }
        
        return jsonify({
            'success': True,
            'school_summary': school_summary,
            'class_predictions': results
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/train', methods=['POST'])
def train_models():
    """Endpoint to trigger model training"""
    try:
        predictor_new = OLGradePredictor()
        history, mae, r2 = predictor_new.train_models()
        
        # Reload models
        global predictor, model_loaded
        predictor = predictor_new
        model_loaded = True
        
        return jsonify({
            'success': True,
            'message': 'Models trained successfully',
            'metrics': {
                'lstm_mae': float(mae),
                'gb_r2_score': float(r2)
            }
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("O/L Grade Prediction API Server")
    print("="*60)
    print(f"Server starting on http://{API_CONFIG['host']}:{API_CONFIG['port']}")
    print(f"Model loaded: {model_loaded}")
    print("="*60 + "\n")
    
    app.run(
        host=API_CONFIG['host'],
        port=API_CONFIG['port'],
        debug=API_CONFIG['debug'],
        threaded=True,
        use_reloader=False
    )
