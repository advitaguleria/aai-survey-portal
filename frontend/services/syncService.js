import { AppState, Platform } from 'react-native';
import offlineService from './offlineService';
import offlineDB from './offlineDB';

class SyncService {
    constructor() {
        this.syncInProgress = false;
        this.setupAppStateListener();
        this.setupPeriodicSync();
    }

    setupAppStateListener() {
        AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                this.triggerSync();
            }
        });
    }

    setupPeriodicSync() {
        // Sync every 5 minutes when app is in foreground
        setInterval(() => {
            this.triggerSync();
        }, 5 * 60 * 1000); // 5 minutes
    }

    async triggerSync() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        try {
            await offlineService.syncPendingData();
        } catch (error) {
            console.error('Sync trigger error:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    // Manual sync trigger
    async manualSync() {
        return await offlineService.syncPendingData();
    }

    // Check sync status
    async getSyncStatus() {
        const pendingCount = await offlineDB.getPendingCount();
        const isOnline = await this.checkNetworkStatus();
        
        return {
            pendingCount,
            isOnline,
            lastSync: await this.getLastSyncTime(),
            syncInProgress: this.syncInProgress
        };
    }

    async checkNetworkStatus() {
        // This would use NetInfo in a real implementation
        return navigator.onLine;
    }

    async getLastSyncTime() {
        const lastSync = await AsyncStorage.getItem('last_sync_time');
        return lastSync || 'Never';
    }

    // Force sync specific type
    async forceSync(type) {
        if (type === 'login') {
            await offlineService.syncPendingLogins();
        } else if (type === 'survey') {
            await offlineService.syncPendingSurveys();
        }
    }
}

export default new SyncService();