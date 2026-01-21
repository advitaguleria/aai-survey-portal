import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setSent(true);
            Alert.alert(
                'Email Sent',
                'Password reset instructions have been sent to your email.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email to receive reset instructions
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your registered email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!sent}
                    />

                    {sent ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✅ Reset email sent! Check your inbox.
                            </Text>
                            <Button
                                title="Back to Login"
                                onPress={() => navigation.navigate('Login')}
                            />
                        </View>
                    ) : (
                        <>
                            <Button
                                title="Send Reset Instructions"
                                onPress={handleResetPassword}
                                loading={loading}
                            />
                            <Button
                                title="Back to Login"
                                onPress={() => navigation.navigate('Login')}
                                style={styles.secondaryButton}
                                textStyle={styles.secondaryButtonText}
                            />
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e88e5',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
    },
    successBox: {
        alignItems: 'center',
    },
    successText: {
        fontSize: 16,
        color: '#4CAF50',
        textAlign: 'center',
        marginBottom: 20,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ddd',
        marginTop: 10,
    },
    secondaryButtonText: {
        color: '#666',
    },
});

export default ForgotPasswordScreen;