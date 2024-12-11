from flask import Flask, jsonify
from flask_cors import CORS
from utils.dataProcessing import get_first_10_rows_firewall

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Define a route
@app.route('/dataTemplate', methods=['GET'])
def data_template():
    data = {
        "message": "Here is your data!",
        "example_list": [1, 2, 3, 4, 5],
    }
    return jsonify(data)

print("Preloading data...")
print(get_first_10_rows_firewall())
print(get_first_10_rows_intrusion_detection())



# Run the server
if __name__ == '__main__':
    app.run(debug=True)
    
