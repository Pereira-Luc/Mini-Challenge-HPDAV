import axios from 'axios';
import { FirewallData, IDSData, MergedData } from './interface';
import { createAsyncThunk } from '@reduxjs/toolkit/react';


// Fetch data template
const fetchDataTemplate = createAsyncThunk(
    "example/fetchDataTemplate",
    async (_, { rejectWithValue }) => {
        try {
            const data = await getDataTemplate();
            return data;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

// Fetch firewall data by date range
const fetchFirewallData = createAsyncThunk(
    "example/fetchFirewallData",
    async ({ start, end }: { start: string; end: string }, { rejectWithValue }) => {
        try {
            const data = await getFirewallDataByDateTimeRange(start, end);
            console.log("Fetched data:", data); // Add this to debug the fetched data
            return data;
        } catch (error) {
            console.error("Error in fetchFirewallData:", error);
            return rejectWithValue(error);
        }
    }
);
const getDataTemplate = async () => { 
    try {
        const response = await axios.get('http://127.0.0.1:5000/dataTemplate');
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error; 
    }
};

const getFirewallDataByDateTimeRange = async (start: string, end: string) => {
    try {
        const response = await axios.get('http://127.0.0.1:5000/firewallDataByDateTime', {
            params: { 
                start_datetime: start, 
                end_datetime: end 
            }
        });

        const processedData: FirewallData[] = response.data.map((item: any) => ({
            ...item,
            DateTime: new Date(item.DateTime),
        }));
        return processedData;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

// Fetch IDS data (replace this with your actual fetcher)
const getIDSDataByDateTimeRange = async (start: string, end: string): Promise<IDSData[]> => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/idsDataByDateTime?start_datetime=${start}&end_datetime=${end}`);
        if (!response.ok) throw new Error("Failed to fetch IDS data");
        const data: IDSData[] = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching IDS data:", error);
        throw error;
    }
};

// Merge Firewall and IDS data into MergedData
const getMergedDataByDateTimeRange = async (start: string, end: string): Promise<MergedData[]> => {
    try {
        const [firewallData, idsData] = await Promise.all([
            getFirewallDataByDateTimeRange(start, end),
            getIDSDataByDateTimeRange(start, end),
        ]);
        console.log(`Firewall data records: ${firewallData.length}`);
        console.log(`IDS data records: ${idsData.length}`);

        const mergedData: MergedData[] = firewallData.map((firewall) => {
            const matchingIDS = idsData.find(
                (ids) =>
                    ids.SourceIP === firewall.SourceIP &&
                    ids.DestinationIP === firewall.DestinationIP &&
                    Math.abs(new Date(ids.DateTime).getTime() - firewall.DateTime.getTime()) < 1000 * 60 // Match within 1 minute
            );

            return {
                DateTime: firewall.DateTime,
                SourceIP: firewall.SourceIP,
                DestinationIP: firewall.DestinationIP,
                DestinationService: firewall.DestinationService || "",
                Direction: firewall.Direction || "",
                ConnectionsBuilt: firewall.ConnectionsBuilt || "",
                ConnectionsTornDown: firewall.ConnectionsTornDown || "",
                Protocol: firewall.Protocol || "TCP",
                SyslogPriority: firewall.SyslogPriority || "",
                Operation: firewall.Operation || "",
                MessageCode: firewall.MessageCode || "",
                Classification: matchingIDS?.Classification || "Unclassified", // Default value
                Priority: matchingIDS?.Priority || 0, // Default numeric value
                Label: matchingIDS?.Label || "Unknown", // Default value
                PacketInfo: matchingIDS?.PacketInfo || "",
                PacketInfoContd: matchingIDS?.PacketInfoContd || "",
                XRef: matchingIDS?.XRef || "",
                SourceHostname: firewall.SourceHostname || "",
                DestinationHostname: firewall.DestinationHostname || "",
                SourcePort: matchingIDS?.SourcePort || firewall.SourcePort,
                DestinationPort: matchingIDS?.DestinationPort || firewall.DestinationPort,
            };
        });
        console.log(`Merged data records: ${mergedData.length}`);

        return mergedData;
    } catch (error) {
        console.error("Error merging data:", error);
        throw error;
    }
};





export { getDataTemplate, getFirewallDataByDateTimeRange, getMergedDataByDateTimeRange, fetchFirewallData, fetchDataTemplate};