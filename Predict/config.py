"""
Configuration for O/L Grade Prediction System
"""

# O/L Grade Boundaries (Standard Sri Lankan O/L System)
GRADE_BOUNDARIES = {
    'A': 75,  # 75-100
    'B': 65,  # 65-74
    'C': 50,  # 50-64
    'S': 35,  # 35-49
    'W': 0    # 0-34 (Weak/Fail)
}

# Subjects for O/L Examination
OL_SUBJECTS = [
    'Mathematics',
    'Science',
    'English',
    'Sinhala',
    'History',
    'Geography',
    'Buddhism',
    'ICT',
    'Commerce'
]

# Attendance Impact Weights
ATTENDANCE_WEIGHTS = {
    'excellent': (90, 100, 1.0),    # 90-100%: No penalty
    'good': (75, 89, 0.95),          # 75-89%: 5% reduction
    'average': (60, 74, 0.85),       # 60-74%: 15% reduction
    'poor': (40, 59, 0.70),          # 40-59%: 30% reduction
    'critical': (0, 39, 0.50)        # 0-39%: 50% reduction
}

# Model Configuration
MODEL_CONFIG = {
    'sequence_length': 5,  # Number of previous exam marks to consider
    'lstm_units': 128,
    'dropout_rate': 0.3,
    'learning_rate': 0.001,
    'batch_size': 32,
    'epochs': 100,
    'validation_split': 0.2
}

# API Configuration
API_CONFIG = {
    'host': '127.0.0.1',
    'port': 5000,
    'debug': False
}

# Risk Thresholds
RISK_THRESHOLDS = {
    'HIGH': 50,      # Predicted average < 50
    'MEDIUM': 65,    # Predicted average 50-64
    'LOW': 65        # Predicted average >= 65
}
