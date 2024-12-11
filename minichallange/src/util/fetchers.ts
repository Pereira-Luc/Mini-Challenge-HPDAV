import axios from 'axios';
import { FirewallData } from './interface';



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




export { getDataTemplate, getFirewallDataByDateTimeRange };