import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get unique device ID
export const getDeviceId = async () => {
    try {
        let deviceId;
        
        if (Platform.OS === 'android') {
            // Get Android device ID
            deviceId = Application.androidId;
            console.log('Android Device ID:', deviceId);
        } else if (Platform.OS === 'ios') {
            // Get iOS vendor ID
            deviceId = await Application.getIosIdForVendorAsync();
            console.log('iOS Device ID:', deviceId);
        } else {
            // Fallback for other platforms
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(7);
            console.log('Fallback Device ID:', deviceId);
        }
        
        // If deviceId is null or undefined, generate a fallback
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(7);
            console.log('Generated fallback Device ID:', deviceId);
        }
        
        // Store in AsyncStorage for future use
        await AsyncStorage.setItem('deviceId', deviceId);
        
        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        // Generate a fallback ID
        const fallbackId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        await AsyncStorage.setItem('deviceId', fallbackId);
        return fallbackId;
    }
};

// Get stored device ID
export const getStoredDeviceId = async () => {
    try {
        return await AsyncStorage.getItem('deviceId');
    } catch (error) {
        console.error('Error getting stored device ID:', error);
        return null;
    }
};

// Check if device is already registered (optional helper)
export const isDeviceRegistered = async () => {
    const deviceId = await getStoredDeviceId();
    return !!deviceId; // Returns true if device ID exists in storage
};