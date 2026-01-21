import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ChangePasswordScreen from './screens/auth/ChangePasswordScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

import DashboardScreen from './screens/DashboardScreen';
import FeedbackFormScreen from './screens/FeedbackFormScreen';
import PastSubmissionsScreen from './screens/PastSubmissionsScreen';
import PastSubmissionDetailScreen from './screens/PastSubmissionDetailScreen';

import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

/* ---------------- DRAWER ---------------- */
const MainDrawer = () => (
    <Drawer.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{
            headerTitle: '', // Empty title
            headerShown: false, // Or hide header completely
        }}
    >
        <Drawer.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{
                title: 'Dashboard', // This appears in drawer menu
                drawerLabel: 'Dashboard', // Label in drawer
                // Remove header title
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

/* ---------------- NAV ---------------- */
const AppNavigator = () => {
    const { user, isFirstLogin, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1e88e5" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                /* 🔥 THIS KEY IS THE MAGIC FIX */
                key={
                    !user
                        ? 'logged-out'
                        : isFirstLogin
                        ? 'first-login'
                        : 'logged-in'
                }
                screenOptions={{ headerShown: false }}
            >
                {!user ? (
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
                        <Stack.Screen name="FeedbackForm" component={FeedbackFormScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                        <Stack.Screen 
                            name="PastSubmissionDetail" 
                            component={PastSubmissionDetailScreen}
                            options={{ 
                                headerShown: false,
                                title: 'Submission Details'
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

/* ---------------- APP ---------------- */
export default function App() {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}
