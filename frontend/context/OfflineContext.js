import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import offlineService from '../services/offlineService';
import syncService from '../services/syncService';

const OfflineContext = createContext();

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};

export const OfflineProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSync, setLastSync] = useState(null);
    const [syncInProgress, setSyncInProgress] = useState(false);

    useEffect(() => {
        let netInfoUnsubscribe;

        // FIXED: Properly initialize NetInfo listener
        const initializeNetInfo = async () => {
            try {
                // Get initial state
                const state = await NetInfo.fetch();
                setIsOnline(state.isConnected);
                
                // Set up listener
                netInfoUnsubscribe = NetInfo.addEventListener(state => {
                    setIsOnline(state.isConnected);
                    if (state.isConnected) {
                        triggerSync();
                    }
                });
            } catch (error) {
                console.error('NetInfo initialization error:', error);
            }
        };

        // FIXED: Proper AppState listener
        const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // App came to foreground, check connection
                NetInfo.fetch().then(state => {
                    setIsOnline(state.isConnected);
                });
            }
        });

        // Initialize network info
        initializeNetInfo();

        // Load initial data
        loadOfflineData();

        // Setup periodic sync check (only when online)
        const interval = setInterval(() => {
            if (isOnline) {
                triggerSync();
            }
        }, 60000); // Check every minute

        return () => {
            // Cleanup
            if (netInfoUnsubscribe) {
                netInfoUnsubscribe();
            }
            appStateSubscription.remove();
            clearInterval(interval);
        };
    }, []);

    const loadOfflineData = async () => {
        try {
            const count = await offlineService.getPendingSyncCount();
            setPendingCount(count);
        } catch (error) {
            console.error('Error loading offline data:', error);
        }
    };

    const triggerSync = async () => {
        if (syncInProgress || !isOnline) return;
        
        setSyncInProgress(true);
        try {
            await syncService.manualSync();
            await loadOfflineData();
            setLastSync(new Date().toISOString());
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncInProgress(false);
        }
    };

    const value = {
        isOnline,
        pendingCount,
        lastSync,
        syncInProgress,
        triggerSync,
        getSyncStatus: syncService.getSyncStatus,
        clearOfflineData: offlineService.clearAllOfflineData
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
};