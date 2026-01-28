import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineDB {
    constructor() {
        this.PENDING_LOGINS_KEY = 'pending_logins';
        this.PENDING_SURVEYS_KEY = 'pending_surveys';
        this.USER_SESSION_KEY = 'user_session';
        this.DEVICE_ID_KEY = 'device_id';
        this.SYNC_QUEUE_KEY = 'sync_queue';
    }

    // Store pending login
    async storePendingLogin(credentials) {
        try {
            const pendingLogins = await this.getPendingLogins();
            const loginEntry = {
                id: Date.now().toString(),
                ...credentials,
                timestamp: new Date().toISOString(),
                synced: false,
                type: 'login'
            };
            
            pendingLogins.push(loginEntry);
            await AsyncStorage.setItem(this.PENDING_LOGINS_KEY, JSON.stringify(pendingLogins));
            return loginEntry;
        } catch (error) {
            console.error('Error storing pending login:', error);
            throw error;
        }
    }

    // Store pending survey
    async storePendingSurvey(surveyData) {
        try {
            const pendingSurveys = await this.getPendingSurveys();
            const surveyEntry = {
                id: Date.now().toString(),
                ...surveyData,
                timestamp: new Date().toISOString(),
                synced: false,
                type: 'survey'
            };
            
            pendingSurveys.push(surveyEntry);
            await AsyncStorage.setItem(this.PENDING_SURVEYS_KEY, JSON.stringify(pendingSurveys));
            return surveyEntry;
        } catch (error) {
            console.error('Error storing pending survey:', error);
            throw error;
        }
    }

    // Store user session for offline login
    async storeUserSession(userData) {
        try {
            const session = {
                ...userData,
                offlineMode: true,
                timestamp: new Date().toISOString(),
                token: `offline_${Date.now()}`
            };
            
            await AsyncStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(session));
            return session;
        } catch (error) {
            console.error('Error storing user session:', error);
            throw error;
        }
    }

    // Get pending logins
    async getPendingLogins() {
        try {
            const data = await AsyncStorage.getItem(this.PENDING_LOGINS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting pending logins:', error);
            return [];
        }
    }

    // Get pending surveys
    async getPendingSurveys() {
        try {
            const data = await AsyncStorage.getItem(this.PENDING_SURVEYS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting pending surveys:', error);
            return [];
        }
    }

    // Get user session
    async getUserSession() {
        try {
            const data = await AsyncStorage.getItem(this.USER_SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user session:', error);
            return null;
        }
    }

    // Remove pending item
    async removePendingItem(type, id) {
        try {
            if (type === 'login') {
                const pendingLogins = await this.getPendingLogins();
                const filtered = pendingLogins.filter(item => item.id !== id);
                await AsyncStorage.setItem(this.PENDING_LOGINS_KEY, JSON.stringify(filtered));
            } else if (type === 'survey') {
                const pendingSurveys = await this.getPendingSurveys();
                const filtered = pendingSurveys.filter(item => item.id !== id);
                await AsyncStorage.setItem(this.PENDING_SURVEYS_KEY, JSON.stringify(filtered));
            }
        } catch (error) {
            console.error('Error removing pending item:', error);
        }
    }

    // Get device ID
    async getDeviceId() {
        try {
            let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);
            if (!deviceId) {
                deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
            }
            return deviceId;
        } catch (error) {
            console.error('Error getting device ID:', error);
            return `device_${Date.now()}`;
        }
    }

    // Clear all offline data
    async clearOfflineData() {
        try {
            await AsyncStorage.removeItem(this.PENDING_LOGINS_KEY);
            await AsyncStorage.removeItem(this.PENDING_SURVEYS_KEY);
            await AsyncStorage.removeItem(this.USER_SESSION_KEY);
        } catch (error) {
            console.error('Error clearing offline data:', error);
        }
    }

    // Get all pending items count
    async getPendingCount() {
        const logins = await this.getPendingLogins();
        const surveys = await this.getPendingSurveys();
        return logins.length + surveys.length;
    }
}

export default new OfflineDB();