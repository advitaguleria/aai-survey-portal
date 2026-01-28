import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InternetMonitor from '../services/internetMonitor';
import useOffline from '../hooks/useOffline';

const ConnectionStatusScreen = () => {
    const { isOnline, pendingCount } = useOffline();
    const [offlineDuration, setOfflineDuration] = useState(0);
    const [lastOnline, setLastOnline] = useState('Never');
    const [autoAlert, setAutoAlert] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            updateStatus();
        }, 10000); // Update every 10 seconds

        updateStatus();

        return () => clearInterval(interval);
    }, []);

    const updateStatus = async () => {
        const minutes = await InternetMonitor.getCurrentOfflineDuration();
        setOfflineDuration(minutes);
        
        // Calculate last online time
        const lastOnlineTime = await AsyncStorage.getItem('last_online_time');
        if (lastOnlineTime) {
            const time = new Date(parseInt(lastOnlineTime, 10));
            setLastOnline(time.toLocaleTimeString());
        }
    };

    const testConnection = async () => {
        const isConnected = await InternetMonitor.isInternetConnected();
        Alert.alert(
            'Connection Test',
            isConnected 
                ? '✅ Connected to Internet\n\nYou can use all features.'
                : '❌ No Internet Connection\n\nYou are in offline mode.'
        );
    };

    const simulateOffline = () => {
        Alert.alert(
            'Simulate Offline',
            'This will simulate being offline for testing purposes.',
            [
                {
                    text: 'Simulate 15 min offline',
                    onPress: () => {
                        // Set offline time to 16 minutes ago
                        const fakeTime = Date.now() - (16 * 60000);
                        InternetMonitor.offlineStartTime = fakeTime;
                        updateStatus();
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Connection Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#4CAF50' : '#FF6B6B' }]}>
                    <Text style={styles.statusText}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.row}>
                    <Icon name="wifi" size={24} color="#666" />
                    <Text style={styles.label}>Current Status:</Text>
                    <Text style={[styles.value, { color: isOnline ? '#4CAF50' : '#FF6B6B' }]}>
                        {isOnline ? 'Connected' : 'Disconnected'}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Icon name="timer" size={24} color="#666" />
                    <Text style={styles.label}>Offline Duration:</Text>
                    <Text style={styles.value}>
                        {offlineDuration > 0 ? `${offlineDuration} minutes` : 'Online'}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Icon name="history" size={24} color="#666" />
                    <Text style={styles.label}>Last Online:</Text>
                    <Text style={styles.value}>{lastOnline}</Text>
                </View>

                <View style={styles.row}>
                    <Icon name="sync" size={24} color="#666" />
                    <Text style={styles.label}>Pending Sync:</Text>
                    <Text style={styles.value}>{pendingCount} items</Text>
                </View>
            </View>

            {offlineDuration >= 15 && (
                <View style={styles.warningCard}>
                    <Icon name="warning" size={30} color="#FFA000" />
                    <Text style={styles.warningTitle}>Prolonged Offline</Text>
                    <Text style={styles.warningText}>
                        You've been offline for {offlineDuration} minutes.
                        Some features require internet connection.
                    </Text>
                    <TouchableOpacity 
                        style={styles.suggestionButton}
                        onPress={() => Alert.alert(
                            'Suggestions',
                            '1. Move to an area with better signal\n2. Connect to Wi-Fi\n3. Disable Airplane Mode\n4. Restart your device'
                        )}
                    >
                        <Text style={styles.suggestionText}>View Suggestions</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.controlsCard}>
                <Text style={styles.sectionTitle}>Connection Controls</Text>
                
                <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={testConnection}
                >
                    <Icon name="wifi-tethering" size={24} color="#1a237e" />
                    <Text style={styles.controlText}>Test Connection</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={InternetMonitor.retryConnection}
                >
                    <Icon name="refresh" size={24} color="#1a237e" />
                    <Text style={styles.controlText}>Retry Connection</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={simulateOffline}
                >
                    <Icon name="build" size={24} color="#1a237e" />
                    <Text style={styles.controlText}>Simulate Offline</Text>
                </TouchableOpacity>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Auto-offline alerts</Text>
                    <Switch
                        value={autoAlert}
                        onValueChange={setAutoAlert}
                    />
                </View>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Offline Mode Information</Text>
                <View style={styles.infoItem}>
                    <Icon name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.infoText}>✓ Login works offline</Text>
                </View>
                <View style={styles.infoItem}>
                    <Icon name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.infoText}>✓ Submit surveys offline</Text>
                </View>
                <View style={styles.infoItem}>
                    <Icon name="warning" size={20} color="#FFA000" />
                    <Text style={styles.infoText}>⚠ Some features limited</Text>
                </View>
                <View style={styles.infoItem}>
                    <Icon name="sync" size={20} color="#2196F3" />
                    <Text style={styles.infoText}>↻ Data syncs when back online</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    label: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#666',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    warningCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF8F00',
        marginVertical: 10,
    },
    warningText: {
        fontSize: 16,
        color: '#FF8F00',
        textAlign: 'center',
        marginBottom: 15,
    },
    suggestionButton: {
        backgroundColor: '#FFE082',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    suggestionText: {
        color: '#FF8F00',
        fontWeight: '600',
    },
    controlsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
    },
    controlText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#1a237e',
        fontWeight: '500',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    switchLabel: {
        fontSize: 16,
        color: '#666',
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    infoText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#666',
    },
});

export default ConnectionStatusScreen;