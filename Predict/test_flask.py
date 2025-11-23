from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting test Flask server on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, threaded=True, use_reloader=False)
