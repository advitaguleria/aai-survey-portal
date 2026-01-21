import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    Image,
    SafeAreaView,
} from 'react-native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';
        return newErrors;
    };

    const handleLogin = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            Alert.alert(
                'Login Failed',
                error.response?.data?.message || 'Invalid email or password'
            );
        } finally {
            setLoading(false);
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
                    {/* Header Section */}
                    <View style={styles.header}>
                        <Text style={styles.title}>AAI Survey Portal</Text>
                        <Text style={styles.subtitle}>Welcome</Text>
                        <Text style={styles.welcomeText}>Enter your credentials to continue</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formCard}>
                        <Input
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                            error={errors.password}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Forgot Password Link */}
                        <TouchableOpacity 
                            style={styles.forgotContainer}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotLink}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginButton}
                        />

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Help Text */}
                        <View style={styles.helpContainer}>
                            <Text style={styles.helpText}>Need help? </Text>
                            <Text style={styles.supportText}>Contact IT Support</Text>
                        </View>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>
                                Don't have an account?{' '}
                            </Text>
                            <Text
                                style={styles.registerLink}
                                onPress={() => navigation.navigate('Register')}
                            >
                                Register
                            </Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.copyright}>
                            © 2026 Airports Authority of India
                        </Text>
                        <View style={styles.footerLinks}>
                            <Text style={styles.footerLink}>Privacy Policy</Text>
                            <Text style={styles.footerSeparator}> - </Text>
                            <Text style={styles.footerLink}>Terms of Service</Text>
                        </View>
                    </View>
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
        paddingHorizontal: 24,
        paddingVertical: 40,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a237e', // Dark blue matching AAI colors
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#283593',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 16,
        color: '#546e7a',
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: '#ffffff',
        padding: 28,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotLink: {
        color: '#1565c0',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#1a237e',
        borderRadius: 8,
        paddingVertical: 14,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        paddingHorizontal: 16,
        color: '#757575',
        fontSize: 14,
    },
    helpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    helpText: {
        color: '#546e7a',
        fontSize: 14,
    },
    supportText: {
        color: '#1565c0',
        fontSize: 14,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    registerText: {
        color: '#546e7a',
        fontSize: 14,
    },
    registerLink: {
        color: '#1a237e',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    copyright: {
        color: '#546e7a',
        fontSize: 12,
        marginBottom: 8,
    },
    footerLinks: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLink: {
        color: '#1565c0',
        fontSize: 12,
    },
    footerSeparator: {
        color: '#b0bec5',
        fontSize: 12,
        marginHorizontal: 4,
    },
});

export default LoginScreen;