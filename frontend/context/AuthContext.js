import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import api from '../services/api'; // Make sure you import api

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');

        if (storedUser && token) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsFirstLogin(!!parsedUser.isFirstLogin);
        }
        setLoading(false);
    };

    // ✅ ADD THIS REGISTER FUNCTION
    const register = async (userData) => {
        try {
            console.log('🔧 [AuthContext] Register called with:', userData);
            
            let response;
            
            // Check if userData is FormData (has file) or regular object
            if (userData instanceof FormData) {
                console.log('📤 Sending as FormData (with file)');
                response = await api.post('/auth/register', userData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000,
                });
            } else {
                console.log('📤 Sending as JSON (no file)');
                response = await api.post('/auth/register', userData);
            }
            
            console.log('✅ Registration successful:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthContext] Register error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
            });
            
            // Format error message
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.response?.status === 400 && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Cannot connect to server. Please check your connection.';
            } else if (error.response?.status === 413) {
                errorMessage = 'Image file is too large. Please select a smaller image.';
            }
            
            throw new Error(errorMessage);
        }
    };

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        console.log('🔧 ADMIN DEBUG - Login response:', {
            role: data.user.role,
            fullUser: data.user
        });

        // Check if role exists, if not, add it from token
        const userWithRole = {
            ...data.user,
            role: data.user.role || 'user' // Default to 'user' if no role
        };

        setUser(userWithRole);
        setIsFirstLogin(!!data.user.isFirstLogin);

        // Also update AsyncStorage with the role
        await AsyncStorage.setItem('user', JSON.stringify(userWithRole));
        
        return data;
    };

    const logout = async () => {
        await AsyncStorage.clear();
        setUser(null);
        setIsFirstLogin(false);
    };

    const changePassword = async (currentPassword, newPassword) => {
        const response = await authService.changePassword(currentPassword, newPassword);
        
        const updatedUser = { 
            ...user, 
            isFirstLogin: false 
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsFirstLogin(false);

        return response;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isFirstLogin,
                loading,
                register, // ✅ ADD THIS TO THE PROVIDER
                login,
                logout,
                changePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
