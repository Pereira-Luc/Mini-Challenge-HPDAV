from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.dataProcessing import get_firewall_category_traffic,get_ids_category_traffic, categorize_ip_addresses,get_aggregated_data_by_ip_and_port, get_first_10_rows_firewall, get_first_10_rows_intrusion_detection, get_firewall_data_by_datetime,  get_intrusion_detection_data_by_datetime 


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
    start_datetime = request.args.get('start_datetime')
    end_datetime = request.args.get('end_datetime')

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
    

@app.route('/ipCategories', methods=['GET'])
def get_ip_categories():
    """
    Get categorized IP addresses with optional date filtering
    Query parameters:
    - start_datetime (optional): Start datetime in 'YYYY-MM-DDTHH:MM:SS' format
    - end_datetime (optional): End datetime in 'YYYY-MM-DDTHH:MM:SS' format
    - use_cache (optional): Whether to use cached results (default: true)
    """
    try:
        start_datetime = request.args.get('start_datetime')
        end_datetime = request.args.get('end_datetime')
        use_cache = request.args.get('use_cache', 'true').lower() == 'true'

        # Validate dates if provided
        if (start_datetime and not end_datetime) or (end_datetime and not start_datetime):
            return jsonify({
                "error": "Both start_datetime and end_datetime must be provided together"
            }), 400

        # Get categories
        categories = categorize_ip_addresses(
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            use_cache=use_cache
        )

        # Convert sets to lists, null if empty
        result = {
            category: list(ips) if ips else None
            for category, ips in categories.items()
        }

        return jsonify(result), 200

    except ValueError as ve:
        return jsonify({"error": f"Invalid datetime format: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    
@app.route('/categoryTraffic/<source>/<category>', methods=['GET'])
def get_category_traffic_endpoint(source, category):
    """
    Get traffic data for a specific category from firewall or IDS
    Path parameters:
    - source: 'firewall' or 'ids'
    - category: Category name ('Anomalies', 'Firewalls', etc.)
    Query parameters:
    - start_datetime (optional): Start datetime in 'YYYY-MM-DDTHH:MM:SS' format
    - end_datetime (optional): End datetime in 'YYYY-MM-DDTHH:MM:SS' format
    """
    try:
        start_datetime = request.args.get('start_datetime')
        end_datetime = request.args.get('end_datetime')

        # Validate dates if provided
        if (start_datetime and not end_datetime) or (end_datetime and not start_datetime):
            return jsonify({
                "error": "Both start_datetime and end_datetime must be provided together"
            }), 400

        # Validate source
        if source.lower() not in ['firewall', 'ids']:
            return jsonify({
                "error": "Source must be either 'firewall' or 'ids'"
            }), 400

        # Get data based on source
        if source.lower() == 'firewall':
            data = get_firewall_category_traffic(category, start_datetime, end_datetime)
        else:
            data = get_ids_category_traffic(category, start_datetime, end_datetime)

        # Return empty if no data
        if data.empty:
            return jsonify(None), 200

        return data.to_json(orient='records', date_format='iso'), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


print("Preloading data...")
print(get_first_10_rows_firewall())
print(get_first_10_rows_intrusion_detection())
print("Data preloaded!")


# Run the server
if __name__ == '__main__':
    app.run(debug=True)
    
