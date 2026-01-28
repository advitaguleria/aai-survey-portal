import NetInfo from '@react-native-community/netinfo';

class NetworkService {
    constructor() {
        this.isConnected = true;
        this.listeners = new Set();
        this.initialize();
    }

    initialize() {
        NetInfo.addEventListener(state => {
            const wasConnected = this.isConnected;
            this.isConnected = state.isConnected;
            
            // Notify listeners if status changed
            if (wasConnected !== this.isConnected) {
                this.notifyListeners();
            }
        });
    }

    addListener(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.isConnected));
    }

    async checkConnection() {
        const state = await NetInfo.fetch();
        this.isConnected = state.isConnected;
        return this.isConnected;
    }

    isOnline() {
        return this.isConnected;
    }
}

export default new NetworkService();