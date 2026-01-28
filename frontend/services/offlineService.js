import offlineDB from './offlineDB';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineService {
    constructor() {
        this.isOnline = true;
        this.initializeNetworkListener();
        this.syncInterval = null;
    }

    initializeNetworkListener() {
        NetInfo.addEventListener(state => {
            this.isOnline = state.isConnected;
            if (this.isOnline) {
                this.syncPendingData();
            }
        });
    }

    // Offline Login
    async login(email, password) {
        const isOnline = this.isOnline;
        
        if (isOnline) {
            try {
                const response = await api.post('/auth/login', { email, password });
                
                if (response.data.token) {
                    await AsyncStorage.setItem('token', response.data.token);
                    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                    return {
                        success: true,
                        data: response.data,
                        online: true,
                        message: 'Login successful'
                    };
                }
            } catch (error) {
                console.log('Online login failed, trying offline:', error.message);
            }
        }

        return this.offlineLogin(email, password);
    }

    // Offline login (with token support)
    async offlineLogin(email, password) {
        try {
            const storedUsers = JSON.parse(await AsyncStorage.getItem('offline_users') || '[]');
            const user = storedUsers.find(u => u.email === email);
            
            if (user && user.password === password) {
                const offlineToken = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const offlineSession = {
                    user: {
                        _id: user._id || `offline_${Date.now()}`,
                        email: user.email,
                        name: user.name || 'Offline User',
                        role: user.role || 'user',
                        offlineMode: true
                    },
                    token: offlineToken,
                    offline: true
                };
                
                await AsyncStorage.setItem('token', offlineToken);
                await AsyncStorage.setItem('user', JSON.stringify(offlineSession.user));
                await offlineDB.storeUserSession(offlineSession.user);
                
                return {
                    success: true,
                    data: offlineSession,
                    online: false,
                    message: 'Logged in offline mode'
                };
            }

            const loginData = {
                email,
                password,
                timestamp: new Date().toISOString(),
                deviceId: await offlineDB.getDeviceId()
            };
            
            await offlineDB.storePendingLogin(loginData);
            
            const newUser = {
                _id: `pending_${Date.now()}`,
                email,
                password,
                name: email.split('@')[0],
                role: 'user',
                pendingSync: true
            };
            
            storedUsers.push(newUser);
            await AsyncStorage.setItem('offline_users', JSON.stringify(storedUsers));
            
            const tempToken = `pending_${Date.now()}`;
            const tempSession = {
                user: {
                    ...newUser,
                    offlineMode: true,
                    pendingSync: true
                },
                token: tempToken,
                offline: true
            };
            
            await AsyncStorage.setItem('token', tempToken);
            await AsyncStorage.setItem('user', JSON.stringify(tempSession.user));
            
            return {
                success: true,
                data: tempSession,
                online: false,
                message: 'Login stored for sync when online',
                pendingSync: true
            };

        } catch (error) {
            console.error('Offline login error:', error);
            return {
                success: false,
                error: error.message,
                online: false
            };
        }
    }

    // Offline Survey Submission
    async submitSurvey(surveyData) {
        if (this.isOnline) {
            try {
                const formattedData = this.formatSurveyData(surveyData);
                const response = await api.post('/survey/submit', formattedData);
                return {
                    success: true,
                    data: response.data,
                    online: true,
                    message: 'Survey submitted successfully'
                };
            } catch (error) {
                console.log('Online submission failed, saving offline:', error.message);
                return this.offlineSubmitSurvey(surveyData);
            }
        } else {
            return this.offlineSubmitSurvey(surveyData);
        }
    }

    async offlineSubmitSurvey(surveyData) {
        try {
            const formattedData = this.formatSurveyData(surveyData);
            const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
            
            const surveyWithMeta = {
                ...formattedData,
                userId: user._id || 'offline_user',
                deviceId: await offlineDB.getDeviceId(),
                offlineSubmission: true,
                localTimestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            await offlineDB.storePendingSurvey(surveyWithMeta);
            
            const localSubmissions = JSON.parse(
                await AsyncStorage.getItem('local_submissions') || '[]'
            );
            localSubmissions.push({
                ...surveyWithMeta,
                _id: `local_${Date.now()}`,
                createdAt: new Date().toISOString()
            });
            await AsyncStorage.setItem('local_submissions', JSON.stringify(localSubmissions));
            
            return {
                success: true,
                data: surveyWithMeta,
                online: false,
                message: 'Survey saved offline. Will sync when online.',
                localId: Date.now()
            };
            
        } catch (error) {
            console.error('Offline survey submission error:', error);
            return {
                success: false,
                error: error.message,
                online: false
            };
        }
    }

    async syncPendingData() {
        if (!this.isOnline) return;
        
        console.log('Starting sync of pending data...');
        
        try {
            await this.syncPendingLogins();
            await this.syncPendingSurveys();
            console.log('Sync completed');
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    /* ================== UPDATED SYNC LOGINS ================== */
    async syncPendingLogins() {
        const pendingLogins = await offlineDB.getPendingLogins();
        
        for (const login of pendingLogins) {
            try {
                console.log('🔧 [DEBUG] Syncing login for:', login.email);
                
                const response = await api.post('/auth/login', {
                    email: login.email,
                    password: login.password
                });
                
                if (response.data.token) {
                    await AsyncStorage.setItem('token', response.data.token);
                    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                    
                    await offlineDB.removePendingItem('login', login.id);
                    
                    const storedUsers = JSON.parse(await AsyncStorage.getItem('offline_users') || '[]');
                    const userIndex = storedUsers.findIndex(u => u.email === login.email);
                    
                    if (userIndex !== -1) {
                        storedUsers[userIndex] = {
                            ...response.data.user,
                            password: login.password
                        };
                    } else {
                        storedUsers.push({
                            ...response.data.user,
                            password: login.password
                        });
                    }
                    
                    await AsyncStorage.setItem('offline_users', JSON.stringify(storedUsers));
                    
                    console.log('✅ Successfully synced login for:', login.email);
                }
            } catch (error) {
                console.error('❌ Failed to sync login:', {
                    email: login.email,
                    error: error.message,
                    status: error.response?.status
                });
                
                if (error.response?.status === 401) {
                    console.log('🔄 Removing invalid login attempt for:', login.email);
                    await offlineDB.removePendingItem('login', login.id);
                    
                    const storedUsers = JSON.parse(await AsyncStorage.getItem('offline_users') || '[]');
                    const updatedUsers = storedUsers.filter(u => u.email !== login.email);
                    await AsyncStorage.setItem('offline_users', JSON.stringify(updatedUsers));
                }
            }
        }
    }

    /* ================== UPDATED SYNC SURVEYS ================== */
    async syncPendingSurveys() {
        const pendingSurveys = await offlineDB.getPendingSurveys();
        
        for (const survey of pendingSurveys) {
            try {
                console.log('🔧 [DEBUG] Syncing survey:', survey.id);
                
                const token = await AsyncStorage.getItem('token');
                if (!token || token.startsWith('offline_') || token.startsWith('pending_')) {
                    console.log('⚠️ No valid token for survey sync, skipping');
                    continue;
                }
                
                const { deviceId, offlineSubmission, localTimestamp, status, id, ...cleanSurvey } = survey;
                
                const response = await api.post('/survey/submit', cleanSurvey);
                
                if (response.data.success || response.data._id) {
                    await offlineDB.removePendingItem('survey', survey.id);
                    
                    const localSubmissions = JSON.parse(
                        await AsyncStorage.getItem('local_submissions') || '[]'
                    );
                    const updatedSubmissions = localSubmissions.filter(
                        s => s.localTimestamp !== survey.localTimestamp
                    );
                    await AsyncStorage.setItem('local_submissions', JSON.stringify(updatedSubmissions));
                    
                    console.log('✅ Successfully synced survey:', survey.id);
                }
            } catch (error) {
                console.error('❌ Failed to sync survey:', {
                    error: error.message,
                    status: error.response?.status
                });
                
                if (error.response?.status === 401) {
                    console.log('🔑 Invalid token, stopping survey sync');
                    break;
                }
            }
        }
    }

    async getLocalSubmissions() {
        try {
            const data = await AsyncStorage.getItem('local_submissions');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting local submissions:', error);
            return [];
        }
    }

    async canLoginOffline(email) {
        try {
            const storedUsers = JSON.parse(await AsyncStorage.getItem('offline_users') || '[]');
            return storedUsers.some(u => u.email === email);
        } catch (error) {
            console.error('Error checking offline login:', error);
            return false;
        }
    }

    formatSurveyData(surveyData) {
        const formatDateForBackend = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return dateString;
        };

        return {
            ...surveyData,
            travelDate: formatDateForBackend(surveyData.travelDate),
        };
    }

    async getPendingSyncCount() {
        return await offlineDB.getPendingCount();
    }

    async clearAllOfflineData() {
        await offlineDB.clearOfflineData();
        await AsyncStorage.removeItem('local_submissions');
        await AsyncStorage.removeItem('offline_users');
    }
}

export default new OfflineService();
