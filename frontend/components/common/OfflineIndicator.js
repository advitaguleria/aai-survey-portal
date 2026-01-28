import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useOffline } from '../../context/OfflineContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OfflineIndicator = () => {
    const { isOnline, pendingCount, syncInProgress, triggerSync } = useOffline();
    
    if (isOnline && pendingCount === 0) return null;
    
    return (
        <Animated.View style={[
            styles.container,
            { backgroundColor: isOnline ? '#FFA000' : '#F44336' }
        ]}>
            <View style={styles.content}>
                <Icon 
                    name={isOnline ? "cloud-upload" : "cloud-off"} 
                    size={20} 
                    color="#FFF" 
                />
                <Text style={styles.text}>
                    {isOnline 
                        ? syncInProgress 
                            ? 'Syncing...' 
                            : `${pendingCount} pending items to sync`
                        : 'You are offline'
                    }
                </Text>
            </View>
            
            {isOnline && !syncInProgress && pendingCount > 0 && (
                <TouchableOpacity onPress={triggerSync} style={styles.syncButton}>
                    <Icon name="sync" size={18} color="#FFF" />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    text: {
        color: '#FFF',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    syncButton: {
        padding: 4,
    },
});

export default OfflineIndicator;