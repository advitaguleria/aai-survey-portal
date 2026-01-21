import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// USE YOUR IP ADDRESS HERE
const API_BASE_URL = 'http://192.168.0.106:5000/api';  // MUST MATCH YOUR BACKEND

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            console.log('🔧 [DEBUG] Token for request:', token ? 'Present' : 'Missing');
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.log('API Error:', error.message);
        
        if (error.response?.status === 401) {
            // Token expired or invalid
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
            } catch (e) {
                console.error('Error clearing storage:', e);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;