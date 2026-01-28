import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class InternetMonitor {
    constructor() {
        this.OFFLINE_TIMEOUT = 1 * 60 * 1000; // 15 minutes for warning
        this.LOGOUT_TIMEOUT = 1 * 60 * 1000;   // 2 minutes after warning for logout
        this.lastOnlineTime = Date.now();
        this.offlineStartTime = null;
        this.alertShown = false;
        this.logoutTimer = null;
        this.isMonitoring = false;
        this.appState = 'active';
        this.navigation = null; // Store navigation reference
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        console.log('🔧 [DEBUG] Starting internet monitor...');
        this.isMonitoring = true;

        try {
            // Track app state
            AppState.addEventListener('change', this.handleAppStateChange);

            // Track network state
            NetInfo.addEventListener(this.handleNetworkChange);

            // Start periodic check
            this.checkInterval = setInterval(() => {
                this.checkOfflineDuration();
            }, 60000); // Check every minute

            // Initial check
            this.initialize();
        } catch (error) {
            console.error('Error starting monitoring:', error);
        }
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
        }
        this.isMonitoring = false;
    }

    handleAppStateChange = (nextAppState) => {
        this.appState = nextAppState;
        if (nextAppState === 'active') {
            // App came to foreground, check connection
            NetInfo.fetch().then(state => {
                this.handleNetworkChange(state);
            });
        }
    }

    handleNetworkChange = (state) => {
        const isConnected = state.isConnected;
        
        if (isConnected) {
            // Came back online - reset everything
            this.lastOnlineTime = Date.now();
            this.offlineStartTime = null;
            this.alertShown = false;
            
            // Clear logout timer
            if (this.logoutTimer) {
                clearTimeout(this.logoutTimer);
                this.logoutTimer = null;
            }
            
            // Store last online time
            AsyncStorage.setItem('last_online_time', this.lastOnlineTime.toString());
            
            console.log('✅ Back online - all timers reset');
            
        } else {
            // Went offline
            if (!this.offlineStartTime) {
                this.offlineStartTime = Date.now();
                console.log('❌ Went offline at:', new Date().toLocaleTimeString());
            }
        }
    }

    checkOfflineDuration = async () => {
        // Don't show alerts if app is in background
        if (this.appState !== 'active') return;

        const isConnected = await this.isInternetConnected();
        
        if (!isConnected && !this.alertShown) {
            const currentTime = Date.now();
            const offlineDuration = currentTime - (this.offlineStartTime || currentTime);
            
            // Check if offline for more than 15 minutes
            if (offlineDuration >= this.OFFLINE_TIMEOUT) {
                this.showOfflineAlert();
                this.alertShown = true;
                
                // Start 2-minute logout timer
                this.startLogoutTimer();
            }
        }
    }

    showOfflineAlert = () => {
        Alert.alert(
            '⚠️ Internet Connection Lost',
            'You have been offline for 15 minutes.\n\nPlease move to an internet-enabled area within 2 minutes.\n\nYou will be automatically logged out if no internet is detected.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        console.log('User acknowledged offline warning');
                    }
                }
            ],
            { cancelable: false }
        );
    }

    startLogoutTimer = () => {
        console.log('⏰ Starting 2-minute logout timer...');
        
        // Clear any existing timer
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
        }
        
        // Set new timer for 2 minutes
        this.logoutTimer = setTimeout(async () => {
            // Check if still offline after 2 minutes
            const isConnected = await this.isInternetConnected();
            
            if (!isConnected) {
                console.log('⏰ 2 minutes passed - forcing logout');
                this.forceLogout();
            } else {
                console.log('✅ Internet restored before logout');
            }
        }, this.LOGOUT_TIMEOUT);
    }

    forceLogout = async () => {
        try {
            // Clear all user data
            await AsyncStorage.multiRemove(['token', 'user', 'offline_users', 'pending_logins', 'pending_surveys']);
            
            // Show logout alert
            Alert.alert(
                'Session Ended',
                'You have been offline for too long. Please login again when you have internet connection.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigate to login screen
                            this.navigateToLogin();
                        }
                    }
                ],
                { cancelable: false }
            );
            
        } catch (error) {
            console.error('Error during forced logout:', error);
        }
    }

    // This method needs to be set from your app
    setNavigation(navigation) {
        this.navigation = navigation;
    }

    navigateToLogin = () => {
        if (this.navigation) {
            this.navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        }
    }

    async isInternetConnected() {
        try {
            const state = await NetInfo.fetch();
            return state.isConnected;
        } catch (error) {
            return false;
        }
    }

    async initialize() {
        try {
            // Load last online time from storage
            const storedTime = await AsyncStorage.getItem('last_online_time');
            if (storedTime) {
                this.lastOnlineTime = parseInt(storedTime, 10);
            }
            
            // Check initial connection
            const state = await NetInfo.fetch();
            this.handleNetworkChange(state);
        } catch (error) {
            console.error('InternetMonitor initialization error:', error);
        }
    }

    // Get minutes remaining before auto-logout
    async getLogoutCountdown() {
        if (!this.alertShown || !this.offlineStartTime) return null;
        
        const isConnected = await this.isInternetConnected();
        if (isConnected) return null;
        
        const currentTime = Date.now();
        const totalOfflineTime = currentTime - this.offlineStartTime;
        const timeSinceWarning = totalOfflineTime - this.OFFLINE_TIMEOUT;
        
        if (timeSinceWarning < 0) return null;
        
        const timeLeft = this.LOGOUT_TIMEOUT - timeSinceWarning;
        
        if (timeLeft <= 0) return 0;
        
        return Math.ceil(timeLeft / 1000); // Return seconds
    }

    // Get current offline duration in minutes
    async getCurrentOfflineDuration() {
        if (!this.offlineStartTime) return 0;
        const currentTime = Date.now();
        const offlineDuration = currentTime - this.offlineStartTime;
        return Math.floor(offlineDuration / 60000); // Convert to minutes
    }

    // For testing: manually trigger logout
    retryConnection() {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                Alert.alert('✅ Connected', 'Internet connection restored!');
            } else {
                Alert.alert('❌ Still Offline', 'No internet connection detected.');
            }
        });
    }
}

export default new InternetMonitor();