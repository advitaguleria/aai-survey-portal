import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineService from './offlineService';
import { getDeviceId } from '../utils/device';

/* =========================
   AUTH SERVICE
========================= */

export const authService = {
    /* -------- LOGIN (ONLINE + OFFLINE) -------- */
    login: async (email, password) => {
        const result = await offlineService.login(email, password);
        
        if (result.success) {
            // ✅ Ensure token is stored
            if (result.data?.token) {
                await AsyncStorage.setItem('token', result.data.token);
            }
            return result;
        } else {
            throw new Error(result.error || 'Login failed');
        }
    },

    /* -------- REGISTER -------- */
    register: async (userData) => {
        let response;
        
        // Get device ID
        const deviceId = await getDeviceId();
        
        if (userData instanceof FormData) {
            // Append deviceId to FormData
            userData.append('deviceId', deviceId);
            
            response = await api.post('/auth/register', userData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            // Add deviceId to regular JSON data
            response = await api.post('/auth/register', {
                ...userData,
                deviceId: deviceId
            });
        }
        
        // Store user locally for offline login WITH PASSWORD
        if (response.data.user) {
            const storedUsers = JSON.parse(await AsyncStorage.getItem('offline_users') || '[]');
            storedUsers.push({
                ...response.data.user,
                password: userData.password // Store password for offline login
            });
            await AsyncStorage.setItem('offline_users', JSON.stringify(storedUsers));
        }
        
        return response.data;
    },

    /* -------- CHANGE PASSWORD -------- */
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    /* -------- FORGOT PASSWORD -------- */
    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    /* -------- RESET PASSWORD -------- */
    resetPassword: async (token, newPassword) => {
        const response = await api.post('/auth/reset-password', {
            token,
            newPassword,
        });
        return response.data;
    },

    /* -------- LOGOUT -------- */
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await offlineService.clearAllOfflineData();
    },

    /* -------- USER HELPERS -------- */
    getCurrentUser: async () => {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('token');
        return !!token;
    },

    updateUserProfile: async (userData) => {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    },
};

/* =========================
   SURVEY SERVICE
========================= */

export const surveyService = {
    /* -------- SUBMIT (ONLINE + OFFLINE) -------- */
    submitFeedback: async (surveyData) => {
        const formattedData = {
            ...surveyData,
            travelDate: formatDateForBackend(surveyData.travelDate),
        };

        return await offlineService.submitSurvey(formattedData);
    },

    /* -------- PAST SUBMISSIONS -------- */
    getPastSubmissions: async () => {
        try {
            const response = await api.get('/survey/past-submissions');
            return response.data;
        } catch (error) {
            const localSubmissions =
                await offlineService.getLocalSubmissions();

            return {
                success: true,
                submissions: localSubmissions,
                offline: true,
            };
        }
    },

    /* -------- DASHBOARD STATS -------- */
    getDashboardStats: async () => {
        try {
            const response = await api.get('/survey/dashboard-stats');
            return response.data;
        } catch (error) {
            const localSubmissions =
                await offlineService.getLocalSubmissions();

            return {
                totalSubmissions: localSubmissions.length,
                offline: true,
            };
        }
    },
};

/* =========================
   HELPERS
========================= */

const formatDateForBackend = (dateString) => {
    if (!dateString) return null;

    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
};