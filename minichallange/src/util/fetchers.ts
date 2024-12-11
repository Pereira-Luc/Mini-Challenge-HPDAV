import axios from 'axios';

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
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}




export { getDataTemplate, getFirewallDataByDateTimeRange };