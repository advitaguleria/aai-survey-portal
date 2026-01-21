import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const ChangePasswordScreen = ({ navigation, route }) => {
    const { isFirstLogin = false } = route.params || {};
    const { changePassword, user, logout } = useAuth();  // Added logout
    
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        
        if (!isFirstLogin && !formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }
        
        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        return newErrors;
    };

    const handleChangePassword = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            console.log('🔧 [FRONTEND] Changing password:', { isFirstLogin });
            
            // Send empty string for currentPassword if it's first login
            await changePassword(
                isFirstLogin ? '' : formData.currentPassword, 
                formData.newPassword
            );
            
            // Success alert
            Alert.alert(
                'Success',
                isFirstLogin 
                    ? 'Password set successfully! You will be redirected to login.'
                    : 'Password changed successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // For first login: navigate to Login screen
                            if (isFirstLogin) {
                                // Clear auth state and go to login
                                logout();
                                navigation.replace('Login');
                            } else {
                                // For regular password change: go back
                                navigation.goBack();
                            }
                        },
                    },
                ]
            );
            
        } catch (error) {
            console.error('🔧 [FRONTEND] Password change error:', error);
            
            Alert.alert(
                'Error', 
                error.response?.data?.message || 
                error.message || 
                'Failed to change password'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        Alert.alert(
            'Go to Login',
            isFirstLogin 
                ? 'You must set a password before accessing the app. Are you sure you want to logout?'
                : 'Are you sure you want to go back to login?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Yes', 
                    onPress: async () => {
                        // Clear user session and go to login
                        await logout();
                        navigation.replace('Login');
                    }
                },
            ]
        );
    };

    const handleCancel = () => {
        if (isFirstLogin) {
            Alert.alert(
                'Cannot Cancel',
                'You must set a password to access the app.',
                [{ text: 'OK' }]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with back button */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={handleCancel}
                        >
                            <MaterialIcons 
                                name="arrow-back" 
                                size={24} 
                                color={isFirstLogin ? "#999" : "#1e88e5"} 
                            />
                            <Text style={[
                                styles.backText,
                                isFirstLogin && styles.disabledBackText
                            ]}>
                                {isFirstLogin ? 'Back to Login' : 'Back'}
                            </Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.title}>
                            {isFirstLogin ? 'Set Your Password' : 'Change Password'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isFirstLogin 
                                ? 'Please set a secure password for your account'
                                : 'Update your account password'}
                        </Text>
                    </View>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        {!isFirstLogin && (
                            <Input
                                label="Current Password"
                                value={formData.currentPassword}
                                onChangeText={(text) => {
                                    setFormData({...formData, currentPassword: text});
                                    if (errors.currentPassword) setErrors({...errors, currentPassword: ''});
                                }}
                                placeholder="Enter current password"
                                secureTextEntry
                                error={errors.currentPassword}
                                containerStyle={styles.inputContainer}
                            />
                        )}

                        {isFirstLogin && user?.email && (
                            <View style={styles.infoBox}>
                                <MaterialIcons name="info" size={18} color="#0d47a1" />
                                <Text style={styles.infoText}>
                                    Temporary password was sent to: {'\n'}
                                    <Text style={styles.emailText}>{user.email}</Text>
                                </Text>
                            </View>
                        )}

                        <Input
                            label="New Password"
                            value={formData.newPassword}
                            onChangeText={(text) => {
                                setFormData({...formData, newPassword: text});
                                if (errors.newPassword) setErrors({...errors, newPassword: ''});
                            }}
                            placeholder="Enter new password (min 6 characters)"
                            secureTextEntry
                            error={errors.newPassword}
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="Confirm New Password"
                            value={formData.confirmPassword}
                            onChangeText={(text) => {
                                setFormData({...formData, confirmPassword: text});
                                if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                            }}
                            placeholder="Re-enter new password"
                            secureTextEntry
                            error={errors.confirmPassword}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Password requirements */}
                        <View style={styles.requirements}>
                            <Text style={styles.requirementsTitle}>Password must:</Text>
                            <View style={styles.requirementItem}>
                                <MaterialIcons 
                                    name={formData.newPassword.length >= 6 ? "check-circle" : "circle"} 
                                    size={16} 
                                    color={formData.newPassword.length >= 6 ? "#4CAF50" : "#999"} 
                                />
                                <Text style={styles.requirementText}>Be at least 6 characters</Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <MaterialIcons 
                                    name={formData.newPassword === formData.confirmPassword && formData.newPassword ? "check-circle" : "circle"} 
                                    size={16} 
                                    color={formData.newPassword === formData.confirmPassword && formData.newPassword ? "#4CAF50" : "#999"} 
                                />
                                <Text style={styles.requirementText}>Match confirmation</Text>
                            </View>
                        </View>

                        {/* Main Action Button */}
                        <Button
                            title={isFirstLogin ? "Set Password & Login" : "Change Password"}
                            onPress={handleChangePassword}
                            loading={loading}
                            style={styles.submitButton}
                            disabled={loading}
                        />

                        {/* Cancel / Back to Login Button */}
                        <TouchableOpacity
                            style={[
                                styles.secondaryButton,
                                isFirstLogin && styles.secondaryButtonDisabled
                            ]}
                            onPress={isFirstLogin ? handleBackToLogin : handleCancel}
                            disabled={isFirstLogin && loading}
                        >
                            <Text style={[
                                styles.secondaryButtonText,
                                isFirstLogin && styles.secondaryButtonTextDisabled
                            ]}>
                                {isFirstLogin ? 'Logout & Back to Login' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Debug Section (Remove in production) */}
                    {__DEV__ && (
                        <View style={styles.debugContainer}>
                            <Text 
                                style={styles.debugLink}
                                onPress={async () => {
                                    await AsyncStorage.clear();
                                    Alert.alert('Debug', 'Storage cleared. Please restart app.');
                                }}
                            >
                                🔧 DEBUG: Clear Storage
                            </Text>
                            <Text style={styles.debugText}>
                                Status: {isFirstLogin ? 'First Login' : 'Regular Password Change'}
                            </Text>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5,
    },
    backText: {
        fontSize: 16,
        color: '#1e88e5',
        marginLeft: 8,
        fontWeight: '500',
    },
    disabledBackText: {
        color: '#999',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e237e',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#e3f2fd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 14,
        color: '#0d47a1',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    emailText: {
        fontWeight: '600',
        marginTop: 4,
    },
    requirements: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 25,
        marginTop: 10,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#37474f',
        marginBottom: 10,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 14,
        color: '#546e7a',
        marginLeft: 8,
    },
    submitButton: {
        backgroundColor: '#1a237e',
        borderRadius: 8,
        paddingVertical: 14,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 14,
        marginTop: 12,
        alignItems: 'center',
    },
    secondaryButtonDisabled: {
        borderColor: '#eee',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    secondaryButtonTextDisabled: {
        color: '#999',
    },
    debugContainer: {
        marginTop: 25,
        padding: 15,
        backgroundColor: '#fff3e0',
        borderRadius: 8,
        alignItems: 'center',
    },
    debugLink: {
        color: '#ff4444',
        fontSize: 12,
        textDecorationLine: 'underline',
        marginBottom: 5,
    },
    debugText: {
        fontSize: 12,
        color: '#5d4037',
    },
});

export default ChangePasswordScreen;