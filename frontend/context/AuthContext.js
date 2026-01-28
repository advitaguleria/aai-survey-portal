import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineService from '../services/offlineService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            
            console.log('🔧 [DEBUG] Loading user from storage:', {
                hasUser: !!storedUser,
                hasToken: !!token,
                user: storedUser ? 'Present' : 'Missing',
                token: token ? 'Present' : 'Missing'
            });
            
            if (storedUser && token) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                
                // Check if user is in offline mode
                if (parsedUser.offlineMode || parsedUser.pendingSync) {
                    setIsOfflineMode(true);
                }
            } else {
                console.log('🔧 [DEBUG] No user or token found in storage - clearing and setting null');
                // FIXED: Clear everything and ensure user is null
                await AsyncStorage.multiRemove(['token', 'user']);
                setUser(null);
                setIsOfflineMode(false);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            // FIXED: On error, also clear and reset
            await AsyncStorage.multiRemove(['token', 'user']);
            setUser(null);
            setIsOfflineMode(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const result = await offlineService.login(email, password);
        
        if (result.success) {
            setUser(result.data.user);
            setIsOfflineMode(!result.online);
            return result;
        } else {
            throw new Error(result.error || 'Login failed');
        }
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['token', 'user']);
        await offlineService.clearAllOfflineData();
        setUser(null);
        setIsOfflineMode(false);
    };

    // FIXED: Add a function to check authentication status
    const isAuthenticated = () => {
        return !!user;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isOfflineMode,
        updateUser: setUser,
        isAuthenticated  // Add this helper
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};