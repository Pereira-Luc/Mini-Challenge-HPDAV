import axios from 'axios';
import { CategoryTrafficSource, FirewallData, IDSData, IPCategoriesResponse, IPCategory, MergedData } from './interface';
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
            console.log("Fetched Firewall Data:", data);
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
                end_datetime: end,
            },
        });

        const processedData: FirewallData[] = response.data.map((item: any) => ({
            ...item,
            DateTime: new Date(item.DateTime),
        }));
        console.log("Processed Firewall Data:", processedData);
        return processedData;
    } catch (error) {
        console.error("Error fetching Firewall Data:", error);
        throw error;
    }
};

const getIDSDataByDateTimeRange = async (start: string, end: string): Promise<IDSData[]> => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/idsDataByDateTime?start_datetime=${start}&end_datetime=${end}`);
        if (!response.ok) throw new Error("Failed to fetch IDS data");
        const data: IDSData[] = await response.json();
        console.log("Fetched IDS Data:", data);
        return data;
    } catch (error) {
        console.error("Error fetching IDS data:", error);
        throw error;
    }
};

const normalizeIP = (ip: string) => ip.trim();

const getMergedDataByDateTimeRange = async (start: string, end: string): Promise<MergedData[]> => {
    try {
        const [firewallData, idsData] = await Promise.all([
            getFirewallDataByDateTimeRange(start, end),
            getIDSDataByDateTimeRange(start, end),
        ]);

        console.log(`Firewall data records: ${firewallData.length}`);
        console.log(`IDS data records: ${idsData.length}`);

        firewallData.forEach((firewall) => {
            const matches = idsData.filter((ids) => {
                const isSourceMatch = normalizeIP(ids.SourceIP) === normalizeIP(firewall.SourceIP);
                const isDestinationMatch = normalizeIP(ids.DestinationIP) === normalizeIP(firewall.DestinationIP);
                const firewallTime = new Date(firewall.DateTime).getTime();
                const idsTime = new Date(ids.DateTime).getTime();
                const isTimeMatch = Math.abs(idsTime - firewallTime) < 1000 * 60;

                if (!isSourceMatch) {
                    console.warn(`Source IP mismatch: Firewall (${firewall.SourceIP}) vs IDS (${ids.SourceIP})`);
                }
                if (!isDestinationMatch) {
                    console.warn(`Destination IP mismatch: Firewall (${firewall.DestinationIP}) vs IDS (${ids.DestinationIP})`);
                }
                if (!isTimeMatch) {
                    console.warn(`Time mismatch: Firewall (${firewall.DateTime}) vs IDS (${ids.DateTime})`);
                }

                return isSourceMatch && isDestinationMatch && isTimeMatch;
            });

            if (matches.length === 0) {
                console.warn(`No match for Firewall entry:`, firewall);
            } else {
                console.log(`Match found for Firewall entry:`, firewall, matches);
            }
        });

        const mergedData: MergedData[] = firewallData.map((firewall) => {
            const matchingIDS = idsData.find(
                (ids) =>
                    normalizeIP(ids.SourceIP) === normalizeIP(firewall.SourceIP) &&
                    normalizeIP(ids.DestinationIP) === normalizeIP(firewall.DestinationIP) &&
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
                Classification: matchingIDS?.Classification || "Unclassified",
                Priority: matchingIDS?.Priority || 0,
                Label: matchingIDS?.Label || firewall.Direction || "Unknown",
                PacketInfo: matchingIDS?.PacketInfo || "",
                PacketInfoContd: matchingIDS?.PacketInfoContd || "",
                XRef: matchingIDS?.XRef || "",
                SourceHostname: firewall.SourceHostname || "",
                DestinationHostname: firewall.DestinationHostname || "",
                SourcePort: matchingIDS?.SourcePort || firewall.SourcePort || "",
                DestinationPort: matchingIDS?.DestinationPort || firewall.DestinationPort || "",
                Betweenness: 0,
                Eigenvector: 0,
                Degree: 0,
                Closeness: 0,
            };
        });

        console.log(`Merged data records: ${mergedData.length}`);

        return mergedData;
    } catch (error) {
        console.error("Error merging data:", error);
        throw error;
    }
};

export const fetchCategoryTraffic = async (
    source: CategoryTrafficSource,
    category: IPCategory,
    startDateTime?: string,
    endDateTime?: string
): Promise<FirewallData[] | IDSData[]> => {
    try {
        const baseUrl = `http://localhost:5000/categoryTraffic/${source}/${category}`;
        const params = new URLSearchParams();

        if (startDateTime) params.append('start_datetime', startDateTime);
        if (endDateTime) params.append('end_datetime', endDateTime);

        const url = `${baseUrl}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to fetch ${source} ${category} data`);
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error(`Error fetching ${source} ${category} data:`, error);
        throw error;
    }
};

export const fetchAllCategoryData = async (
    category: IPCategory,
    startDateTime?: string,
    endDateTime?: string
): Promise<{
    firewall: FirewallData[],
    ids: IDSData[]
}> => {
    try {
        const [firewallData, idsData] = await Promise.all([
            fetchCategoryTraffic('firewall', category, startDateTime, endDateTime),
            fetchCategoryTraffic('ids', category, startDateTime, endDateTime)
        ]);

        return {
            firewall: firewallData as FirewallData[],
            ids: idsData as IDSData[]
        };
    } catch (error) {
        console.error(`Error fetching all ${category} data:`, error);
        throw error;
    }
};


// Add new fetcher function
export const fetchIPCategories = async (
    startDateTime?: string,
    endDateTime?: string,
    useCache: boolean = true
): Promise<IPCategoriesResponse> => {
    try {
        const baseUrl = 'http://localhost:5000/ipCategories';
        const params = new URLSearchParams();

        if (startDateTime) params.append('start_datetime', startDateTime);
        if (endDateTime) params.append('end_datetime', endDateTime);
        params.append('use_cache', useCache.toString());

        const url = `${baseUrl}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch IP categories');
        }

        const data = await response.json();
        return data as IPCategoriesResponse;
    } catch (error) {
        console.error('Error fetching IP categories:', error);
        throw error;
    }
};


export {
    getDataTemplate,
    getFirewallDataByDateTimeRange,
    getMergedDataByDateTimeRange,
    getIDSDataByDateTimeRange,
    fetchFirewallData,
    fetchDataTemplate,
};

