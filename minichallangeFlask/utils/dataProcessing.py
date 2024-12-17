import os
import glob
import pandas as pd
import numpy as np
import ipaddress 

"""
Heading Information for Firewall Data and Intrusion Detection Data

Firewall Data:
    | Field                | Description                  |
    |----------------------|------------------------------|
    | Date/time            | 06/Apr/2012 17:40:02         |
    | Syslog priority      | Info (not only)              |
    | Operation            | Built or Teardown            |
    | Message code         | ASA-6-302015 (or others)     |
    | Protocol             | TCP or UDP                   |
    | Source IP            | IPV4 address                 |
    | Destination IP       | IPV4 address                 |
    | Source hostname      | (empty) maybe others         |
    | Destination hostname | (empty) maybe others         |
    | Source port          | some number                  |
    | Destination port     | some number                  |
    | Destination service  | http or other things         |
    | Direction            | Inbound or Outbound          |
    | Connections built    | 0 or 1                       |
    | Connections torn down| 0 or 1                       |
"""
    
# For consistency, the column names in the DataFrame should be:
field_mapping_firewall = {
        'Date/time': 'DateTime',
        'Syslog priority': 'SyslogPriority',
        'Operation': 'Operation',
        'Message code': 'MessageCode',
        'Protocol': 'Protocol',
        'Source IP': 'SourceIP',
        'Destination IP': 'DestinationIP',
        'Source hostname': 'SourceHostname',
        'Destination hostname': 'DestinationHostname',
        'Source port': 'SourcePort',
        'Destination port': 'DestinationPort',
        'Destination service': 'DestinationService',
        'Direction': 'Direction',
        'Connections built': 'ConnectionsBuilt',
        'Connections torn down': 'ConnectionsTornDown'
    }


"""
Intrusion Detection Data:
    | Field          | Description             |
    |----------------|-------------------------|
    | time           | 4/6/2012 17:23          |
    | sourceIP       | IPV4 address            |
    | sourcePort     | some number             |
    | destIP         | IPV4 address            |
    | destPort       | some number             |
    | classification | Text with information   |
    | priority       | number                  |
    | label          |                         |
    | packet info    |                         |
    | packet info cont'd|                      |
    | xref           |                         |
"""
field_mapping_intrusion_detection = {
    'time': 'DateTime',
    ' sourceIP': 'SourceIP',
    ' sourcePort': 'SourcePort',
    ' destIP': 'DestinationIP',
    ' destPort': 'DestinationPort',
    ' classification': 'Classification',
    ' priority': 'Priority',
    ' label': 'Label',
    ' packet info': 'PacketInfo',
    ' packet info cont\'d': 'PacketInfoContd',
    ' xref': 'Xref'
}

# Global variables to cache the data
firewall_data_cache = None
intrusion_detection_data_cache = None


def get_firewall_data(directory='./data/firewall/'):
    """
    Function to get firewall data from CSV files in the specified directory.
    
    Parameters:
    directory (str): The directory containing the firewall CSV files.
    
    Returns:
    pd.DataFrame: A DataFrame containing the concatenated data from all CSV files.
    """
    global firewall_data_cache
    if firewall_data_cache is not None:
        return firewall_data_cache
    
    csv_files = glob.glob(os.path.join(directory, '*.csv'))
    data_frames = []

    for file in csv_files:
        df = pd.read_csv(file, low_memory=False)
        df.rename(columns=field_mapping_firewall, inplace=True)
        
        # Remove rows with "(empty)" IP addresses
        df = df[(df['SourceIP'] != '(empty)') & (df['DestinationIP'] != '(empty)') & (df['Direction'] != '(empty)')]
        data_frames.append(df)

    if data_frames:
        firewall_data_cache = pd.concat(data_frames, ignore_index=True)
    else:
        firewall_data_cache = pd.DataFrame()
        
    return firewall_data_cache
    
def get_intrusion_detection_data(directory='./data/intrusion-detection/'):
    """
    Function to get intrusion detection data from CSV files in the specified directory.
    
    Parameters:
    directory (str): The directory containing the intrusion detection CSV files.
    
    Returns:
    pd.DataFrame: A DataFrame containing the concatenated data from all CSV files.
    """
    global intrusion_detection_data_cache
    if intrusion_detection_data_cache is not None:
        return intrusion_detection_data_cache

    csv_files = glob.glob(os.path.join(directory, '*.csv'))
    data_frames = []

    for file in csv_files:
        df = pd.read_csv(file, low_memory=False)
        df.rename(columns=field_mapping_intrusion_detection, inplace=True)
        df = df[(df['SourceIP'] != '(empty)') & (df['DestinationIP'] != '(empty)')]
        data_frames.append(df)

    if data_frames:
        intrusion_detection_data_cache = pd.concat(data_frames, ignore_index=True)
    else:
        intrusion_detection_data_cache = pd.DataFrame()
        
    return intrusion_detection_data_cache


def get_first_10_rows_firewall():
    """
    Function to get the first 10 rows of firewall data from CSV files in the specified directory.
    
    Parameters:
    directory (str): The directory containing the firewall CSV files.
    
    Returns:
    pd.DataFrame: A DataFrame containing the first 10 rows from the concatenated data of all CSV files.
    """
    df = get_firewall_data()
    return df.head(10)

def get_first_10_rows_intrusion_detection():
    """
    Function to get the first 10 rows of intrusion detection data from CSV files in the specified directory.
    
    Parameters:
    directory (str): The directory containing the intrusion detection CSV files.
    
    Returns:
    pd.DataFrame: A DataFrame containing the first 10 rows from the concatenated data of all CSV files.
    """
    df = get_intrusion_detection_data()
    return df.head(10)

def get_firewall_data_by_datetime(start_datetime, end_datetime):
    """
    Retrieve firewall data within a specific datetime range.
    
    Parameters:
    start_datetime (str or pd.Timestamp): Start datetime in 'YYYY-MM-DD HH:MM:SS' format.
    end_datetime (str or pd.Timestamp): End datetime in 'YYYY-MM-DD HH:MM:SS' format.
    
    Returns:
    pd.DataFrame: Filtered firewall data.
    """
    df = get_firewall_data()
    
    # Convert to datetime because the data is a string in the CSV
    if df['DateTime'].dtype != 'datetime64[ns]':
        df['DateTime'] = pd.to_datetime(df['DateTime'], errors='coerce')
    
    mask = (df['DateTime'] >= pd.to_datetime(start_datetime)) & (df['DateTime'] <= pd.to_datetime(end_datetime))
    return df.loc[mask]

def get_intrusion_detection_data_by_datetime(start_datetime, end_datetime):
    """
    Retrieve intrusion detection data within a specific datetime range.
    
    Parameters:
    start_datetime (str or pd.Timestamp): Start datetime in 'YYYY-MM-DD HH:MM:SS' format.
    end_datetime (str or pd.Timestamp): End datetime in 'YYYY-MM-DD HH:MM:SS' format.
    
    Returns:
    pd.DataFrame: Filtered intrusion detection data.
    """
    df = get_intrusion_detection_data()
    
    # Convert to datetime because the data is a string in the CSV
    if df['DateTime'].dtype != 'datetime64[ns]':
        df['DateTime'] = pd.to_datetime(df['DateTime'], errors='coerce')

    mask = (df['DateTime'] >= pd.to_datetime(start_datetime)) & (df['DateTime'] <= pd.to_datetime(end_datetime))
    return df.loc[mask]


def get_aggregated_data_by_time(start_datetime, end_datetime, interval="1min"):
    """
    Aggregate firewall and IDS data by time intervals.

    Parameters:
    - start_datetime: Start datetime
    - end_datetime: End datetime
    - interval: Resampling interval (e.g., '1min', '5min')

    Returns:
    - pd.DataFrame: Aggregated data
    """
    df_firewall = get_firewall_data_by_datetime(start_datetime, end_datetime)
    df_ids = get_intrusion_detection_data_by_datetime(start_datetime, end_datetime)

    # Combine datasets
    combined_df = pd.concat([df_firewall, df_ids], ignore_index=True)

    # Convert DateTime to pandas datetime
    combined_df['DateTime'] = pd.to_datetime(combined_df['DateTime'], errors='coerce')
    combined_df = combined_df.dropna(subset=['DateTime'])

    # Resample data based on the time interval
    combined_df.set_index('DateTime', inplace=True)
    aggregated_data = combined_df.resample(interval).agg({
        'SourceIP': 'count',  # Total number of connections
        'DestinationIP': 'count',
        'Protocol': lambda x: x.mode()[0] if not x.empty else None,  # Most common protocol
        'Priority': 'mean'  # Average priority (if applicable)
    })

    aggregated_data.rename(columns={'SourceIP': 'TotalConnections'}, inplace=True)
    aggregated_data = aggregated_data.reset_index()

    return aggregated_data

def create_ip_categories():
    """Define IP address categories using network objects"""
    categories = {
        'Firewalls': {
            'ips': {ipaddress.ip_address(ip) for ip in 
                   ['10.32.0.1', '172.23.0.1', '10.32.0.100', '172.25.0.1']},
            'priority': 'High'
        },
        'IDS': {
            'ips': {ipaddress.ip_address('10.99.99.2')},
            'priority': 'High'
        },
        'Financial_Servers': {
            'networks': [ipaddress.ip_network(f'172.23.{x}.0/24') 
                        for x in range(214, 230)],
            'priority': 'High'
        },
        'Core_Servers': {
            'ips': {ipaddress.ip_address(ip) for ip in 
                   ['172.23.0.10', '172.23.0.2']},
            'priority': 'High'
        },
        'Websites': {
            'ranges': [(ipaddress.ip_address('10.32.0.201'), 
                       ipaddress.ip_address('10.32.0.210')),
                      (ipaddress.ip_address('10.32.1.201'), 
                       ipaddress.ip_address('10.32.1.206')),
                      (ipaddress.ip_address('10.32.5.1'), 
                       ipaddress.ip_address('10.32.5.254'))],
            'single_ips': {ipaddress.ip_address('10.32.1.100')},
            'priority': 'Normal'
        },
        'Workstations': {
            'networks': [ipaddress.ip_network('172.23.0.0/16')],
            'priority': 'Normal'
        }
    }
    return categories


def get_aggregated_data_by_ip_and_port(start_datetime, end_datetime):
    """
    Aggregate data by Source IP, Destination IP, and Port.
    """
    df_firewall = get_firewall_data_by_datetime(start_datetime, end_datetime)
    df_ids = get_intrusion_detection_data_by_datetime(start_datetime, end_datetime)

    # Combine datasets
    combined_df = pd.concat([df_firewall, df_ids], ignore_index=True)

    # Group by IPs and Ports
    aggregated_data = combined_df.groupby(['SourceIP', 'DestinationIP', 'SourcePort', 'DestinationPort']).agg({
        'DateTime': ['min', 'max'],  # First and last time of connections
        'Protocol': 'first',
        'ConnectionsBuilt': 'sum',
        'ConnectionsTornDown': 'sum'
    }).reset_index()

    # Rename columns
    aggregated_data.columns = ['SourceIP', 'DestinationIP', 'SourcePort', 'DestinationPort',
                               'StartTime', 'EndTime', 'Protocol', 'ConnectionsBuilt', 'ConnectionsTornDown']

    return aggregated_data

categorized_ips_cache = None

def categorize_ip_addresses(start_datetime=None, end_datetime=None, use_cache=True):
    """
    Categorize IP addresses with caching support
    
    Parameters:
    start_datetime (str, optional): Start datetime
    end_datetime (str, optional): End datetime
    use_cache (bool): Whether to use cached results for full dataset
    
    Returns:
    dict: Categories containing sets of IP addresses
    """
    global categorized_ips_cache
    
    # Return cached results if available and no date filtering
    if use_cache and not start_datetime and not end_datetime and categorized_ips_cache is not None:
        return categorized_ips_cache
    
    # Get data based on whether dates are specified
    if start_datetime and end_datetime:
        df_fw = get_firewall_data_by_datetime(start_datetime, end_datetime)
        df_ids = get_intrusion_detection_data_by_datetime(start_datetime, end_datetime)
    else:
        df_fw = get_firewall_data()
        df_ids = get_intrusion_detection_data()
    
    # Combine unique IPs
    all_ips = pd.concat([
        pd.Series(pd.concat([df_fw['SourceIP'], df_fw['DestinationIP']]).unique()),
        pd.Series(pd.concat([df_ids['SourceIP'], df_ids['DestinationIP']]).unique())
    ]).unique()
    
    # Convert to IP objects once
    ip_objects = np.array([ipaddress.ip_address(ip) for ip in all_ips])
    categories = create_ip_categories()
    
    result = {
        category: set() for category in categories.keys()
    }
    result['Anomalies'] = set()
    
    # Create boolean masks for each category
    for category, rules in categories.items():
        category_mask = np.zeros(len(ip_objects), dtype=bool)
        
        if 'ips' in rules:
            for ip in rules['ips']:
                category_mask |= (ip_objects == ip)
        
        if 'networks' in rules:
            for network in rules['networks']:
                network_mask = np.array([ip in network for ip in ip_objects])
                category_mask |= network_mask
        
        if 'ranges' in rules:
            for start, end in rules['ranges']:
                range_mask = (ip_objects >= start) & (ip_objects <= end)
                category_mask |= range_mask
                
        if 'single_ips' in rules:
            for ip in rules['single_ips']:
                category_mask |= (ip_objects == ip)
        
        result[category].update(set(all_ips[category_mask]))
    
    # Add remaining IPs to anomalies
    categorized = set().union(*[ips for cat, ips in result.items() if cat != 'Anomalies'])
    result['Anomalies'].update(set(all_ips) - categorized)
    
    # Cache results if no date filtering
    if not start_datetime and not end_datetime:
        categorized_ips_cache = result
    
    return result

def clear_ip_categories_cache():
    """Clear the IP categories cache"""
    global categorized_ips_cache
    categorized_ips_cache = None

def get_category_statistics(categories):
    """Get statistics for each category"""
    return {
        category: len(ips)
        for category, ips in categories.items()
    }

categories = categorize_ip_addresses()
stats = get_category_statistics(categories)

print(stats)

def get_firewall_anomaly_traffic(start_datetime=None, end_datetime=None):
    """
    Get firewall traffic data involving anomalous IP addresses
    
    Parameters:
    start_datetime (str, optional): Start datetime
    end_datetime (str, optional): End datetime
    
    Returns:
    pd.DataFrame: Firewall traffic data where source or destination is an anomalous IP
    """
    # Get categorized IPs and extract anomalies
    categories = categorize_ip_addresses(start_datetime, end_datetime)
    anomaly_ips = categories['Anomalies']
    
    # Get firewall data based on date range
    if start_datetime and end_datetime:
        df_fw = get_firewall_data_by_datetime(start_datetime, end_datetime)
    else:
        df_fw = get_firewall_data()
    
    # Filter for traffic involving anomalous IPs
    anomaly_mask = (df_fw['SourceIP'].isin(anomaly_ips) | 
                   df_fw['DestinationIP'].isin(anomaly_ips))
    
    return df_fw[anomaly_mask]

def get_category_traffic(df, category_name, categories):
    """
    Base function to filter traffic data for a specific category
    
    Parameters:
    df (pd.DataFrame): DataFrame containing traffic data
    category_name (str): Name of the category to filter for
    categories (dict): Dictionary of categorized IPs
    
    Returns:
    pd.DataFrame: Traffic data filtered by category
    """
    if category_name not in categories:
        raise ValueError(f"Invalid category: {category_name}")
        
    category_ips = categories[category_name]
    category_mask = (df['SourceIP'].isin(category_ips) | 
                    df['DestinationIP'].isin(category_ips))
    
    return df[category_mask]

def get_firewall_category_traffic(category_name, start_datetime=None, end_datetime=None):
    """
    Get firewall traffic data involving IPs from a specific category
    
    Parameters:
    category_name (str): Category to filter for ('Anomalies', 'Firewalls', etc.)
    start_datetime (str, optional): Start datetime
    end_datetime (str, optional): End datetime
    
    Returns:
    pd.DataFrame: Firewall traffic data filtered by category
    """
    categories = categorize_ip_addresses(start_datetime, end_datetime)
    
    if start_datetime and end_datetime:
        print("Getting firewall data by datetime")
        df_fw = get_firewall_data_by_datetime(start_datetime, end_datetime)
    else:
        df_fw = get_firewall_data()
    
    return get_category_traffic(df_fw, category_name, categories)

def get_ids_category_traffic(category_name, start_datetime=None, end_datetime=None):
    """
    Get IDS traffic data involving IPs from a specific category
    
    Parameters:
    category_name (str): Category to filter for ('Anomalies', 'Firewalls', etc.)
    start_datetime (str, optional): Start datetime
    end_datetime (str, optional): End datetime
    
    Returns:
    pd.DataFrame: IDS traffic data filtered by category
    """
    categories = categorize_ip_addresses(start_datetime, end_datetime)
    
    if start_datetime and end_datetime:
        df_ids = get_intrusion_detection_data_by_datetime(start_datetime, end_datetime)
    else:
        df_ids = get_intrusion_detection_data()
    
    return get_category_traffic(df_ids, category_name, categories)
    
    return df_ids[anomaly_mask]
    