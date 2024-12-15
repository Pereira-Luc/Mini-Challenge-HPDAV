from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.dataProcessing import get_aggregated_data_by_ip_and_port, get_first_10_rows_firewall, get_first_10_rows_intrusion_detection, get_firewall_data_by_datetime,  get_intrusion_detection_data_by_datetime 


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
    start_datetime = request.args.get('start')
    end_datetime = request.args.get('end')

    if not start_datetime or not end_datetime:
        return jsonify({
            "error": "Please provide start_datetime and end_datetime query parameters in 'YYYY-MM-DDTHH:MM:SS' format"
        }), 400

    try:
        # Debugging Logs
        print(f"Start datetime: {start_datetime}")
        print(f"End datetime: {end_datetime}")

        # Fetch and filter data
        data = get_firewall_data_by_datetime(start_datetime, end_datetime)

        # Ensure non-empty data
        if data.empty:
            return jsonify({"error": "No data found for the given date range"}), 404

        return data.to_json(orient='records', date_format='iso'), 200
    except ValueError as ve:
        return jsonify({"error": f"Invalid datetime format: {str(ve)}"}), 400
    except KeyError as ke:
        return jsonify({"error": f"Missing expected key: {str(ke)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    


# Route for IDS data by date range
@app.route('/idsDataByDateTime', methods=['GET'])
def ids_data_by_date_time():
    start_datetime = request.args.get('start')
    end_datetime = request.args.get('end')

    if not start_datetime or not end_datetime:
        return jsonify({
            "error": "Please provide start_datetime and end_datetime query parameters in 'YYYY-MM-DDTHH:MM:SS' format"
        }), 400

    try:
        # Debugging Logs
        print(f"Start datetime: {start_datetime}")
        print(f"End datetime: {end_datetime}")

        # Fetch and filter IDS data
        data = get_intrusion_detection_data_by_datetime(start_datetime, end_datetime)

        # Ensure non-empty data
        if data.empty:
            return jsonify({"error": "No data found for the given date range"}), 404

        return data.to_json(orient='records', date_format='iso'), 200
    except ValueError as ve:
        return jsonify({"error": f"Invalid datetime format: {str(ve)}"}), 400
    except KeyError as ke:
        return jsonify({"error": f"Missing expected key: {str(ke)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@app.route('/paginatedData', methods=['GET'])
def paginated_data():
    start_datetime = request.args.get('start')
    end_datetime = request.args.get('end')
    limit = int(request.args.get('limit', 100))  # Default to 100
    offset = int(request.args.get('offset', 0))  # Default to 0

    if not start_datetime or not end_datetime:
        return jsonify({"error": "Missing 'start' or 'end' query parameters"}), 400

    try:
        data = get_aggregated_data_by_ip_and_port(start_datetime, end_datetime)

        # Paginate the data
        paginated_data = data.iloc[offset:offset + limit]

        return paginated_data.to_json(orient='records', date_format='iso'), 200
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


print("Preloading data...")
print(get_first_10_rows_firewall())
print(get_first_10_rows_intrusion_detection())



# Run the server
if __name__ == '__main__':
    app.run(debug=True)
    
