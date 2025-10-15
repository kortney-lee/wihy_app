import axios from 'axios';

const API_BASE_URL = 'https://api.example.com';

export const fetchUserData = async (userId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching user data: ' + (error as Error).message);
    }
};

export const fetchHealthMetrics = async (userId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}/health-metrics`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching health metrics: ' + (error as Error).message);
    }
};

// Add the missing export
export const fetchHealthData = async (userId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}/health-data`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching health data: ' + (error as Error).message);
    }
};