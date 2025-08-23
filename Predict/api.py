import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import sqlite3
import hashlib
import jwt
import datetime
from functools import wraps
import tensorflow as tf

# Suppress TensorFlow warnings
tf.get_logger().setLevel('ERROR')

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'asdadaiusdyau313123auidyayd123123'

# Load ML models
single_subject_model = tf.keras.models.load_model("next_term_predictor.h5", compile=False)

# Initialize database
def init_db():
   conn = sqlite3.connect('users.db')
   c = conn.cursor()
   c.execute('''CREATE TABLE IF NOT EXISTS users
                (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 name TEXT NOT NULL,
                 age INTEGER NOT NULL,
                 grade TEXT NOT NULL,
                 email TEXT UNIQUE NOT NULL,
                 contact TEXT NOT NULL,
                 password TEXT NOT NULL)''')
   conn.commit()
   conn.close()

def hash_password(password):
   return hashlib.sha256(password.encode()).hexdigest()

def verify_token(f):
   @wraps(f)
   def decorated(*args, **kwargs):
       token = request.headers.get('Authorization')
       if not token:
           return jsonify({'message': 'Token missing'}), 401
       try:
           token = token.split(' ')[1]
           data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
       except:
           return jsonify({'message': 'Token invalid'}), 401
       return f(*args, **kwargs)
   return decorated

# Auth routes
@app.route('/register', methods=['POST'])
def register():
   data = request.get_json()
   conn = sqlite3.connect('users.db')
   c = conn.cursor()

   try:
       hashed_pw = hash_password(data['password'])
       c.execute("INSERT INTO users (name, age, grade, email, contact, password) VALUES (?, ?, ?, ?, ?, ?)",
                 (data['name'], data['age'], data['grade'], data['email'], data['contact'], hashed_pw))
       conn.commit()
       return jsonify({'message': 'User created successfully'}), 201
   except sqlite3.IntegrityError:
       return jsonify({'message': 'Email already exists'}), 400
   finally:
       conn.close()

@app.route('/login', methods=['POST'])
def login():
   data = request.get_json()
   conn = sqlite3.connect('users.db')
   c = conn.cursor()

   c.execute("SELECT * FROM users WHERE email = ?", (data['email'],))
   user = c.fetchone()
   conn.close()

   if user and user[6] == hash_password(data['password']):
       token = jwt.encode({
           'user_id': user[0],
           'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
       }, app.config['SECRET_KEY'])
       return jsonify({'token': token, 'user_id': user[0]})

   return jsonify({'message': 'Invalid credentials'}), 401

# User CRUD
@app.route('/users', methods=['GET'])
@verify_token
def get_users():
   conn = sqlite3.connect('users.db')
   c = conn.cursor()
   c.execute("SELECT id, name, age, grade, email, contact FROM users")
   users = [{'id': row[0], 'name': row[1], 'age': row[2], 'grade': row[3], 'email': row[4], 'contact': row[5]} for row in c.fetchall()]
   conn.close()
   return jsonify(users)

@app.route('/users/<int:user_id>', methods=['GET'])
@verify_token
def get_user(user_id):
   conn = sqlite3.connect('users.db')
   c = conn.cursor()
   c.execute("SELECT id, name, age, grade, contact FROM users WHERE id = ?", (user_id,))
   user = c.fetchone()
   conn.close()

   if user:
       return jsonify({'id': user[0], 'name': user[1], 'age': user[2], 'grade': user[3], 'email': user[4], 'contact': user[5]})
   return jsonify({'message': 'User not found'}), 404

@app.route('/users/<int:user_id>', methods=['PUT'])
@verify_token
def update_user(user_id):
   data = request.get_json()
   conn = sqlite3.connect('users.db')
   c = conn.cursor()

   if 'password' in data:
       data['password'] = hash_password(data['password'])
       c.execute("UPDATE users SET name=?, age=?, grade=?, email=?, contact=?, password=? WHERE id=?",
                 (data['name'], data['age'], data['grade'], data['email'], data['contact'], data['password'], user_id))
   else:
       c.execute("UPDATE users SET name=?, age=?, grade=?, email=?, contact=? WHERE id=?",
                 (data['name'], data['age'], data['grade'], data['email'], data['contact'], user_id))

   conn.commit()
   conn.close()
   return jsonify({'message': 'User updated successfully'})

@app.route('/users/<int:user_id>', methods=['DELETE'])
@verify_token
def delete_user(user_id):
   conn = sqlite3.connect('users.db')
   c = conn.cursor()
   c.execute("DELETE FROM users WHERE id = ?", (user_id,))
   conn.commit()
   conn.close()
   return jsonify({'message': 'User deleted successfully'})

# ML Prediction routes
@app.route('/predict/single', methods=['POST'])
def predict_single():
   data = request.get_json()
   marks = np.array(data['marks'], dtype="float32").reshape(1, -1)
   prediction = single_subject_model.predict(marks, verbose=0)
   return jsonify({'prediction': float(prediction[0][0])})

@app.route('/predict/multi', methods=['POST'])
def predict_multi():
   data = request.get_json()
   marks = np.array(data['marks'], dtype="float32")

   if len(marks) != 81:
       return jsonify({'error': 'Expected 81 marks (9 subjects x 9 terms)'}), 400

   predictions = []
   for subject in range(9):
       start_idx = subject * 9
       end_idx = start_idx + 9
       subject_marks = marks[start_idx:end_idx].reshape(1, -1)
       prediction = single_subject_model.predict(subject_marks, verbose=0)
       predictions.append(float(prediction[0][0]))

   return jsonify({'predictions': predictions, 'average': float(np.mean(predictions))})

if __name__ == '__main__':
   init_db()
   app.run(debug=True)