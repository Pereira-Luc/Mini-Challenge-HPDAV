import os
import glob
import pandas as pd

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

