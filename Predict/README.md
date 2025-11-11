# 🤖 AI Prediction System Setup Guide

## Overview
This ML prediction system uses TensorFlow to predict student performance based on historical marks.

---

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

---

## 🚀 Quick Start

### 1. Navigate to Predict folder
```bash
cd Predict
```

### 2. Create Virtual Environment (Recommended)

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start Flask API
```bash
python api.py
```

The API will start on **http://localhost:5000**

---

## 🔌 API Endpoints

### Prediction Endpoints

#### 1. Single Subject Prediction
```http
POST http://localhost:5000/predict/single
Content-Type: application/json

{
  "marks": [75, 80, 70, 85, 78, 82, 88, 76, 79]
}
```

**Response:**
```json
{
  "prediction": 81.5
}
```

#### 2. Multi-Subject Prediction
```http
POST http://localhost:5000/predict/multi
Content-Type: application/json

{
  "marks": [/* 81 values: 9 subjects × 9 terms */]
}
```

**Response:**
```json
{
  "predictions": [80, 85, 78, ...],
  "average": 82.5
}
```

---

## 🎯 How It Works

### Model Architecture
- **Type:** Deep Neural Network (TensorFlow/Keras)
- **Input:** 9 historical assessment scores
- **Output:** Predicted next term score
- **Training:** Trained on historical student performance data

### Prediction Process
1. Fetch student's last 9 exam scores
2. Normalize/prepare data
3. Feed to TensorFlow model
4. Return predicted performance
5. Calculate risk level based on prediction

### Risk Levels
- **High Risk:** Predicted score < 40
- **Medium Risk:** Predicted score 40-60
- **Low Risk:** Predicted score > 60

---

## 🖥️ Using the UI

### Access Prediction Dashboard

**Admin:**
1. Login as admin
2. Navigate to **Analytics > AI Predictions**
3. Select student or predict all
4. View results and risk levels

**Teacher:**
1. Login as teacher
2. Navigate to **Analytics > AI Predictions**
3. Generate predictions for your students
4. Identify at-risk students

---

## 📊 Features

### Single Student Prediction
- Select individual student
- View detailed prediction
- See current vs predicted performance
- Identify performance trends

### Batch Prediction
- Predict for all students (up to 20)
- Sort by risk level
- Export predictions
- Track historical predictions

### Risk Analysis
- Visual risk indicators (Red/Yellow/Green)
- Performance trend arrows
- Comparison with current average
- Intervention recommendations

---

## 🔧 Troubleshooting

### Flask API Not Starting

**Error:** `ModuleNotFoundError: No module named 'flask'`
```bash
pip install -r requirements.txt
```

**Error:** `TensorFlow not found`
```bash
pip install tensorflow==2.15.0
```

### Connection Issues

**Error:** `Failed to connect to http://localhost:5000`

1. Ensure Flask API is running:
   ```bash
   cd Predict
   python api.py
   ```

2. Check if port 5000 is in use:
   ```bash
   netstat -ano | findstr :5000
   ```

3. Change port in `api.py` if needed:
   ```python
   app.run(debug=True, port=5001)
   ```

### Model Loading Issues

**Error:** `next_term_predictor.h5 not found`

- Ensure the model file exists in the `Predict` folder
- Check file path in `api.py`

---

## 🔐 Security Notes

### For Development
- CORS is enabled for all origins (development only)
- No authentication required for prediction endpoints
- Flask debug mode is enabled

### For Production
1. Disable debug mode:
   ```python
   app.run(debug=False)
   ```

2. Restrict CORS:
   ```python
   CORS(app, origins=['https://your-domain.com'])
   ```

3. Add authentication to prediction endpoints
4. Use environment variables for secrets
5. Enable HTTPS

---

## 📈 Model Information

### Training Data
- Historical student marks from previous years
- 9 assessment periods per student
- Multiple subjects and grade levels

### Model Performance
- Accuracy: Based on validation set
- Loss function: Mean Squared Error
- Optimizer: Adam

### Limitations
- Requires at least 9 historical data points
- Predictions are probabilistic
- Should be used as guidance, not absolute truth
- Works best with consistent data quality

---

## 🎓 Use Cases

### Early Intervention
- Identify struggling students early
- Provide targeted support
- Monitor improvement over time

### Parent Communication
- Share predicted performance
- Discuss intervention strategies
- Set realistic goals

### Resource Allocation
- Allocate tutors to at-risk students
- Plan remedial classes
- Optimize teacher assignments

### Performance Tracking
- Track prediction accuracy
- Compare predicted vs actual scores
- Refine intervention strategies

---

## 🔄 Integration with Main App

### API Calls from Next.js
The prediction dashboard (`/src/components/PredictionDashboard.tsx`) automatically:
1. Checks Flask API status
2. Fetches student data from main database
3. Calls Flask prediction API
4. Displays results in UI

### Data Flow
```
Next.js App → Fetch students from PostgreSQL
           → Get exam history via API
           → Send to Flask ML service
           → Receive predictions
           → Display in React UI
```

---

## 📝 Sample Data

For testing predictions with sample data:

```javascript
// Good performer (should predict high score)
{
  "marks": [75, 80, 82, 85, 83, 87, 90, 88, 89]
}

// Average performer
{
  "marks": [60, 62, 58, 65, 63, 67, 64, 66, 68]
}

// At-risk student
{
  "marks": [35, 38, 40, 42, 39, 41, 45, 43, 44]
}
```

---

## 🆘 Support

If you encounter issues:
1. Check Flask terminal for error messages
2. Verify all dependencies are installed
3. Ensure model file exists
4. Check network connectivity
5. Review browser console for errors

---

## 📸 Screenshots for Thesis

### Figure: AI Prediction Dashboard
- Login as admin/teacher
- Navigate to Analytics > AI Predictions
- Show prediction interface

### Figure: Prediction Results Table
- Generate batch predictions
- Show risk levels (color-coded)
- Display performance trends

### Figure: At-Risk Student Identification
- Filter by high-risk students
- Show intervention recommendations
- Display comparison charts

---

**🎉 Your AI prediction system is ready to use!**

For thesis documentation, capture screenshots showing:
1. Prediction interface
2. Results table with risk levels
3. Individual student predictions
4. Batch prediction results
5. Flask API status indicator
