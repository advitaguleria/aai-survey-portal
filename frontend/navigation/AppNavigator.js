import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import FeedbackFormScreen from '../screens/FeedbackFormScreen';
import PastSubmissionsScreen from '../screens/PastSubmissionsScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const MainDrawer = () => {
    return (
        <Drawer.Navigator initialRouteName="Dashboard">
            <Drawer.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{ title: 'Dashboard' }}
            />
            <Drawer.Screen 
                name="PastSubmissions" 
                component={PastSubmissionsScreen} 
                options={{ title: 'Past Submissions' }}
            />
        </Drawer.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
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
                    name="PastSubmissions" 
                    component={PastSubmissionsScreen}
                    options={{
                        headerShown: true,
                        title: 'Past Submissions',
                        headerBackTitle: 'Back',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;