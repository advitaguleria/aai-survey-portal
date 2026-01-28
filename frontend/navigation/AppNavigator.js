import React from 'react';
import { View, ActivityIndicator } from 'react-native'; // Added missing imports
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import FeedbackFormScreen from '../screens/FeedbackFormScreen';
import PastSubmissionsScreen from '../screens/PastSubmissionsScreen';
import PastSubmissionDetailScreen from '../screens/PastSubmissionDetailScreen';

// Offline Components
import OfflineIndicator from '../components/common/OfflineIndicator';
import OfflineWarningBanner from '../components/common/OfflineWarningBanner';

// Hooks
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const MainDrawer = () => {
    return (
        <Drawer.Navigator 
            initialRouteName="Dashboard"
            screenOptions={{
                headerTitle: '',
                headerShown: false,
            }}
        >
            <Drawer.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{ 
                    title: 'Dashboard',
                    drawerLabel: 'Dashboard',
                    headerTitle: () => null,
                }}
            />
            <Drawer.Screen 
                name="PastSubmissions" 
                component={PastSubmissionsScreen} 
                options={{ 
                    title: 'Past Submissions',
                    drawerLabel: 'Past Submissions',
                    headerTitle: 'Past Submissions',
                }}
            />
        </Drawer.Navigator>
    );
};

const AppNavigator = () => {
    const { user, isFirstLogin, loading, isAuthenticated } = useAuth(); // Added isAuthenticated

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1e88e5" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {/* Offline UI Components - OUTSIDE Stack.Navigator */}
            <OfflineWarningBanner />
            <OfflineIndicator />
            
            <Stack.Navigator
                /* 🔥 THIS KEY IS THE MAGIC FIX */
                key={
                    !isAuthenticated()
                        ? 'logged-out'
                        : isFirstLogin
                        ? 'first-login'
                        : 'logged-in'
                }
                screenOptions={{ headerShown: false }}
            >
                {!isAuthenticated() ? ( // Changed from !user to !isAuthenticated()
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : isFirstLogin ? (
                    <Stack.Screen
                        name="ChangePassword"
                        component={ChangePasswordScreen}
                        initialParams={{ isFirstLogin: true }}
                        options={{
                            headerShown: true,
                            title: 'Set Password',
                            headerLeft: () => null,
                        }}
                    />
                ) : (
                    <>
                        <Stack.Screen name="Main" component={MainDrawer} />
                        <Stack.Screen 
                            name="FeedbackForm" 
                            component={FeedbackFormScreen}
                            options={{
                                headerShown: true,
                                title: 'Feedback Form',
                                headerBackTitle: 'Back',
                            }}
                        />
                        <Stack.Screen 
                            name="ChangePassword" 
                            component={ChangePasswordScreen}
                            options={{
                                headerShown: true,
                                title: 'Change Password',
                                headerBackTitle: 'Back',
                            }}
                        />
                        <Stack.Screen 
                            name="PastSubmissionDetail" 
                            component={PastSubmissionDetailScreen}
                            options={{ 
                                headerShown: true,
                                title: 'Submission Details',
                                headerBackTitle: 'Back',
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;