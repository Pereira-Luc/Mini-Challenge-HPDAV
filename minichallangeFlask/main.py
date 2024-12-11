from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.dataProcessing import get_first_10_rows_firewall, get_first_10_rows_intrusion_detection, get_firewall_data_by_datetime

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

@app.route('/firewallDataByDateTime', methods=['GET'])
def firewall_data_by_date_time():
    start_datetime = request.args.get('start_datetime')
    end_datetime = request.args.get('end_datetime')

    if not start_datetime or not end_datetime:
        return jsonify({"error": "Please provide start_datetime and end_datetime query parameters in 'YYYY-MM-DD HH:MM:SS' format"}), 400

    try:
        data = get_firewall_data_by_datetime(start_datetime, end_datetime)
        return data.to_json(orient='records', date_format='iso'), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


print("Preloading data...")
print(get_first_10_rows_firewall())
print(get_first_10_rows_intrusion_detection())



# Run the server
if __name__ == '__main__':
    app.run(debug=True)
    
