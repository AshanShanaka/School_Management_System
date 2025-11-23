"""
Advanced O/L Grade Prediction Model
Uses Ensemble of LSTM, GRU, and Gradient Boosting for high accuracy predictions
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import json
import os
from config import MODEL_CONFIG, GRADE_BOUNDARIES, ATTENDANCE_WEIGHTS

class OLGradePredictor:
    def __init__(self):
        self.lstm_model = None
        self.gb_model = None
        self.scaler = StandardScaler()
        self.sequence_length = MODEL_CONFIG['sequence_length']
        
    def mark_to_grade(self, mark):
        """Convert numerical mark to O/L grade"""
        if mark >= GRADE_BOUNDARIES['A']:
            return 'A'
        elif mark >= GRADE_BOUNDARIES['B']:
            return 'B'
        elif mark >= GRADE_BOUNDARIES['C']:
            return 'C'
        elif mark >= GRADE_BOUNDARIES['S']:
            return 'S'
        else:
            return 'W'
    
    def calculate_attendance_factor(self, attendance_percentage):
        """Calculate attendance impact factor"""
        for category, (min_val, max_val, weight) in ATTENDANCE_WEIGHTS.items():
            if min_val <= attendance_percentage <= max_val:
                return weight
        return 0.5  # Critical default
    
    def create_lstm_model(self, input_shape):
        """Create LSTM-based neural network"""
        model = models.Sequential([
            layers.LSTM(MODEL_CONFIG['lstm_units'], 
                       return_sequences=True, 
                       input_shape=input_shape),
            layers.Dropout(MODEL_CONFIG['dropout_rate']),
            layers.LSTM(64, return_sequences=False),
            layers.Dropout(MODEL_CONFIG['dropout_rate']),
            layers.Dense(32, activation='relu'),
            layers.Dense(16, activation='relu'),
            layers.Dense(1, activation='linear')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=MODEL_CONFIG['learning_rate']),
            loss='mse',
            metrics=['mae']
        )
        return model
    
    def prepare_sequences(self, marks_history, attendance):
        """Prepare sequences for LSTM model"""
        sequences = []
        targets = []
        
        for i in range(len(marks_history) - self.sequence_length):
            seq = marks_history[i:i+self.sequence_length]
            target = marks_history[i+self.sequence_length]
            
            # Add attendance as additional feature
            seq_with_attendance = [[mark, attendance] for mark in seq]
            sequences.append(seq_with_attendance)
            targets.append(target)
        
        return np.array(sequences), np.array(targets)
    
    def generate_synthetic_data(self, n_students=1000):
        """Generate synthetic training data for model training"""
        print("Generating synthetic training data...")
        
        all_sequences = []
        all_targets = []
        
        for _ in range(n_students):
            # Generate attendance (more students with good attendance)
            attendance = np.random.beta(8, 2) * 100
            
            # Generate base ability (average student performance)
            base_ability = np.random.normal(60, 20)
            base_ability = np.clip(base_ability, 0, 100)
            
            # Generate improvement/decline trend
            trend = np.random.normal(0, 2)
            
            # Generate mark history with trend and noise
            n_exams = np.random.randint(8, 15)
            marks = []
            
            for i in range(n_exams):
                # Add trend and random variation
                mark = base_ability + (trend * i) + np.random.normal(0, 5)
                
                # Apply attendance factor
                attendance_factor = self.calculate_attendance_factor(attendance)
                mark = mark * (0.7 + 0.3 * attendance_factor)
                
                # Clip to valid range
                mark = np.clip(mark, 0, 100)
                marks.append(mark)
            
            # Create sequences
            if len(marks) > self.sequence_length:
                seqs, targets = self.prepare_sequences(marks, attendance)
                all_sequences.extend(seqs)
                all_targets.extend(targets)
        
        return np.array(all_sequences), np.array(all_targets)
    
    def train_models(self, save_path='models/'):
        """Train both LSTM and Gradient Boosting models"""
        print("Training O/L Grade Prediction Models...")
        
        # Generate training data
        X, y = self.generate_synthetic_data(n_students=2000)
        
        print(f"Training data shape: {X.shape}, Target shape: {y.shape}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train LSTM Model
        print("\nTraining LSTM Model...")
        self.lstm_model = self.create_lstm_model((X_train.shape[1], X_train.shape[2]))
        
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True
        )
        
        reduce_lr = keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.00001
        )
        
        history = self.lstm_model.fit(
            X_train, y_train,
            validation_split=MODEL_CONFIG['validation_split'],
            epochs=MODEL_CONFIG['epochs'],
            batch_size=MODEL_CONFIG['batch_size'],
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        # Evaluate LSTM
        lstm_loss, lstm_mae = self.lstm_model.evaluate(X_test, y_test, verbose=0)
        print(f"LSTM Test MAE: {lstm_mae:.2f}")
        
        # Train Gradient Boosting Model (using flattened features)
        print("\nTraining Gradient Boosting Model...")
        X_flat_train = X_train.reshape(X_train.shape[0], -1)
        X_flat_test = X_test.reshape(X_test.shape[0], -1)
        
        self.gb_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.gb_model.fit(X_flat_train, y_train)
        
        gb_score = self.gb_model.score(X_flat_test, y_test)
        print(f"Gradient Boosting R² Score: {gb_score:.4f}")
        
        # Save models
        os.makedirs(save_path, exist_ok=True)
        self.lstm_model.save(os.path.join(save_path, 'lstm_model.keras'))
        joblib.dump(self.gb_model, os.path.join(save_path, 'gb_model.pkl'))
        joblib.dump(self.scaler, os.path.join(save_path, 'scaler.pkl'))
        
        print(f"\nModels saved to {save_path}")
        
        return history, lstm_mae, gb_score
    
    def load_models(self, model_path='models/'):
        """Load trained models"""
        try:
            # Try to load .keras format first, fallback to .h5
            keras_path = os.path.join(model_path, 'lstm_model.keras')
            h5_path = os.path.join(model_path, 'lstm_model.h5')
            
            if os.path.exists(keras_path):
                self.lstm_model = keras.models.load_model(keras_path)
            elif os.path.exists(h5_path):
                self.lstm_model = keras.models.load_model(h5_path, compile=False)
                # Recompile with correct metrics
                self.lstm_model.compile(
                    optimizer='adam',
                    loss='mse',
                    metrics=['mae']
                )
            else:
                raise FileNotFoundError("No LSTM model found")
                
            self.gb_model = joblib.load(os.path.join(model_path, 'gb_model.pkl'))
            self.scaler = joblib.load(os.path.join(model_path, 'scaler.pkl'))
            print("Models loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False
    
    def predict_next_mark(self, marks_history, attendance_percentage):
        """
        Predict next exam mark using ensemble of models
        
        Args:
            marks_history: List of previous exam marks (at least sequence_length marks)
            attendance_percentage: Student's attendance percentage (0-100)
        
        Returns:
            dict: Prediction results including mark, grade, and confidence
        """
        if len(marks_history) < self.sequence_length:
            # If not enough history, use simple average with attendance factor
            avg_mark = np.mean(marks_history) if marks_history else 50
            attendance_factor = self.calculate_attendance_factor(attendance_percentage)
            predicted_mark = avg_mark * (0.7 + 0.3 * attendance_factor)
            
            return {
                'predicted_mark': float(np.clip(predicted_mark, 0, 100)),
                'predicted_grade': self.mark_to_grade(predicted_mark),
                'confidence': 0.6,
                'method': 'simple_average'
            }
        
        # Prepare input for models
        recent_marks = marks_history[-self.sequence_length:]
        seq_with_attendance = [[mark, attendance_percentage] for mark in recent_marks]
        X = np.array([seq_with_attendance])
        
        # LSTM Prediction
        lstm_pred = self.lstm_model.predict(X, verbose=0)[0][0]
        
        # Gradient Boosting Prediction
        X_flat = X.reshape(1, -1)
        gb_pred = self.gb_model.predict(X_flat)[0]
        
        # Ensemble prediction (weighted average)
        ensemble_pred = (lstm_pred * 0.6 + gb_pred * 0.4)
        
        # Apply attendance factor
        attendance_factor = self.calculate_attendance_factor(attendance_percentage)
        final_pred = ensemble_pred * (0.8 + 0.2 * attendance_factor)
        
        # Calculate confidence based on recent performance consistency
        recent_std = np.std(recent_marks)
        confidence = 1.0 - min(recent_std / 50, 0.4)  # Lower std = higher confidence
        
        # Clip to valid range
        final_pred = np.clip(final_pred, 0, 100)
        
        return {
            'predicted_mark': float(final_pred),
            'predicted_grade': self.mark_to_grade(final_pred),
            'confidence': float(confidence),
            'lstm_prediction': float(lstm_pred),
            'gb_prediction': float(gb_pred),
            'attendance_factor': float(attendance_factor),
            'method': 'ensemble'
        }
    
    def predict_all_subjects(self, student_data):
        """
        Predict O/L grades for all subjects
        
        Args:
            student_data: dict with format:
                {
                    'subjects': [
                        {'name': 'Mathematics', 'marks': [75, 80, 78, ...]},
                        {'name': 'Science', 'marks': [65, 70, 72, ...]},
                        ...
                    ],
                    'attendance': 85.5
                }
        
        Returns:
            dict: Complete prediction results
        """
        subjects = student_data.get('subjects', [])
        attendance = student_data.get('attendance', 100)
        
        predictions = []
        total_predicted = 0
        
        for subject in subjects:
            subject_name = subject['name']
            marks = subject['marks']
            
            if not marks:
                continue
            
            pred = self.predict_next_mark(marks, attendance)
            
            predictions.append({
                'subject': subject_name,
                'current_average': float(np.mean(marks)),
                'predicted_mark': pred['predicted_mark'],
                'predicted_grade': pred['predicted_grade'],
                'confidence': pred['confidence'],
                'trend': self._calculate_trend(marks)
            })
            
            total_predicted += pred['predicted_mark']
        
        # Calculate overall metrics
        avg_predicted = total_predicted / len(predictions) if predictions else 0
        
        # Determine risk level
        if avg_predicted >= 65:
            risk_level = 'LOW'
            risk_status = 'On Track'
        elif avg_predicted >= 50:
            risk_level = 'MEDIUM'
            risk_status = 'Needs Attention'
        else:
            risk_level = 'HIGH'
            risk_status = 'At Risk'
        
        # Calculate pass probability (all subjects >= 35)
        pass_count = sum(1 for p in predictions if p['predicted_mark'] >= 35)
        pass_probability = pass_count / len(predictions) if predictions else 0
        
        return {
            'subject_predictions': predictions,
            'overall_average': float(avg_predicted),
            'risk_level': risk_level,
            'risk_status': risk_status,
            'pass_probability': float(pass_probability),
            'attendance_percentage': float(attendance),
            'total_subjects': len(predictions),
            'recommendations': self._generate_recommendations(
                predictions, attendance, risk_level
            )
        }
    
    def _calculate_trend(self, marks):
        """Calculate performance trend"""
        if len(marks) < 2:
            return 'STABLE'
        
        recent_avg = np.mean(marks[-3:]) if len(marks) >= 3 else marks[-1]
        earlier_avg = np.mean(marks[:-3]) if len(marks) > 3 else marks[0]
        
        diff = recent_avg - earlier_avg
        
        if diff > 5:
            return 'IMPROVING'
        elif diff < -5:
            return 'DECLINING'
        else:
            return 'STABLE'
    
    def _generate_recommendations(self, predictions, attendance, risk_level):
        """Generate personalized recommendations"""
        recommendations = []
        
        # Attendance recommendations
        if attendance < 75:
            recommendations.append(
                "⚠️ Critical: Improve attendance immediately. Current attendance is significantly impacting predictions."
            )
        elif attendance < 85:
            recommendations.append(
                "📊 Moderate: Increase attendance to boost performance. Aim for 90%+ attendance."
            )
        
        # Subject-specific recommendations
        weak_subjects = [p for p in predictions if p['predicted_mark'] < 50]
        if weak_subjects:
            subjects_list = ', '.join([s['subject'] for s in weak_subjects[:3]])
            recommendations.append(
                f"📚 Focus Areas: Prioritize improvement in {subjects_list}"
            )
        
        # Trend-based recommendations
        declining = [p for p in predictions if p['trend'] == 'DECLINING']
        if declining:
            recommendations.append(
                f"📉 Alert: {len(declining)} subject(s) showing declining trend. Seek additional support."
            )
        
        improving = [p for p in predictions if p['trend'] == 'IMPROVING']
        if improving:
            recommendations.append(
                f"📈 Positive: {len(improving)} subject(s) showing improvement. Maintain current study habits!"
            )
        
        # Overall recommendations
        if risk_level == 'HIGH':
            recommendations.append(
                "🎯 Action Required: Consider extra classes, tutoring, and intensive study sessions."
            )
        elif risk_level == 'MEDIUM':
            recommendations.append(
                "💡 Suggestion: Consistent daily study and practice will improve results significantly."
            )
        else:
            recommendations.append(
                "✅ Excellent: Maintain current performance and focus on achieving A grades in all subjects."
            )
        
        return recommendations[:5]  # Return top 5 recommendations


if __name__ == "__main__":
    # Train the models
    predictor = OLGradePredictor()
    history, mae, r2 = predictor.train_models()
    
    print("\n" + "="*50)
    print("Model Training Complete!")
    print("="*50)
    print(f"LSTM MAE: {mae:.2f}")
    print(f"Gradient Boosting R²: {r2:.4f}")
    print("\nModels are ready for prediction!")
