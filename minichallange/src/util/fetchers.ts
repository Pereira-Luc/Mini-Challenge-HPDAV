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




export { getDataTemplate };