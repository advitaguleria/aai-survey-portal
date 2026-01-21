import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        
        // Store token and user
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    },
    
    // ✅ Add register function here too
    register: async (userData) => {
        let response;
        
        if (userData instanceof FormData) {
            response = await api.post('/auth/register', userData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            response = await api.post('/auth/register', userData);
        }
        
        return response.data;
    },
    
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },
    
    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    
    resetPassword: async (token, newPassword) => {
        const response = await api.post('/auth/reset-password', {
            token,
            newPassword,
        });
        return response.data;
    },
    
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
    
    getCurrentUser: async () => {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('token');
        return !!token;
    },
    
    // Update user after password change
    updateUserProfile: async (userData) => {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    },
};

export const surveyService = {
    submitFeedback: async (surveyData) => {
        console.log('🔧 [DEBUG] Submitting feedback with:', {
            dataKeys: Object.keys(surveyData),
            ratingsKeys: Object.keys(surveyData.ratings || {}),
        });
        
        // Format date properly for backend
        const formattedData = {
            ...surveyData,
            travelDate: formatDateForBackend(surveyData.travelDate),
        };
        
        console.log('🔧 [DEBUG] Formatted data:', formattedData);
        
        try {
            const response = await api.post('/survey/submit', formattedData);
            console.log('🔧 [DEBUG] Submit success:', response.data);
            return response.data;
        } catch (error) {
            console.error('🔧 [DEBUG] Submit error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
            throw error;
        }
    },
    // ... other methods
};

// Helper function to format date
const formatDateForBackend = (dateString) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD
    if (!dateString) return null;
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
    return dateString;
};