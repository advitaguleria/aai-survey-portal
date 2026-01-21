import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { surveyService } from '../services/surveyService';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

const DashboardScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ 
        totalSurveys: 0,  // This should update when you delete from MongoDB
        surveysThisMonth: 0 
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            console.log('🔧 [DEBUG] Dashboard focused, reloading data...');
            loadDashboardData();
        }, [])
    );

    const loadDashboardData = async () => {
        setError(false);
        try {
            let dashboardStats = { totalSurveys: 0, surveysThisMonth: 0 };
            try {
                dashboardStats = await surveyService.getDashboardStats();
                console.log('🔧 [DEBUG] Dashboard stats received:', dashboardStats);
                setStats({
                    totalSurveys: dashboardStats.totalSurveys || dashboardStats.surveysThisMonth || 0,
                    surveysThisMonth: dashboardStats.surveysThisMonth || 0
                });
            } catch (statsError) {
                console.log('Stats loading failed, using defaults:', statsError.message);
                setStats({
                    totalSurveys: 0,
                    surveysThisMonth: 0
                });
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section - UNCHANGED */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.portalTitle}>AAI Survey Portal</Text>
                            <Text style={styles.welcomeText}>
                                Welcome, {user?.fullName || 'User'}!
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <MaterialIcons name="logout" size={22} color="#1a237e" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Airport Name Section */}
                {user?.airportName && (
                    <View style={styles.airportSection}>
                        <MaterialIcons name="location-on" size={20} color="#1a237e" />
                        <Text style={styles.airportText}>
                            Airport: <Text style={styles.airportName}>{user.airportName}</Text>
                        </Text>
                    </View>
                )}

                {/* Share Your Experience Section */}
                <View style={styles.experienceCard}>
                    <Text style={styles.experienceTitle}>Share Your Experience</Text>
                    <Text style={styles.experienceDescription}>
                        Your feedback helps us improve our services and create a better airport experience for everyone.
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.feedbackButton}
                        onPress={() => navigation.navigate('FeedbackForm')}
                    >
                        <FontAwesome name="pencil-square-o" size={20} color="#fff" />
                        <Text style={styles.feedbackButtonText}>New Feedback Form</Text>
                    </TouchableOpacity>
                </View>

                {/* Total Surveys Completed Card - FIXED: Now using stats.totalSurveys */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsCard}>
                        <View style={styles.statsIconContainer}>
                            <MaterialIcons name="assessment" size={32} color="#1a237e" />
                        </View>
                        <Text style={styles.statsNumber}>
                            {stats.totalSurveys} {/* CHANGED from user?.surveysCompleted */}
                        </Text>
                        <Text style={styles.statsTitle}>Total Surveys Completed</Text>
                        <Text style={styles.statsSubtitle}>
                            Keep contributing to improve services
                        </Text>
                    </View>
                </View>

                {/* Your Feedback History Card */}
                <View style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                        <MaterialIcons name="history" size={24} color="#1a237e" />
                        <Text style={styles.historyTitle}>Your Feedback History</Text>
                    </View>
                    
                    <Text style={styles.historyDescription}>
                        View and manage all your past feedback submissions in one place
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.historyButton}
                        onPress={() => navigation.navigate('PastSubmissions')}
                    >
                        <MaterialIcons name="archive" size={20} color="#fff" />
                        <Text style={styles.historyButtonText}>View Past Submissions</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer Links */}
                <View style={styles.footerLinks}>
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.footerLinkText}>Contact Us</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerSeparator}>|</Text>
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.footerLinkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerSeparator}>|</Text>
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.footerLinkText}>Disclaimer</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerSeparator}>|</Text>
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.footerLinkText}>Terms and Conditions</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerSeparator}>|</Text>
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.footerLinkText}>FAQs</Text>
                    </TouchableOpacity>
                </View>

                {/* Copyright Footer */}
                <View style={styles.copyrightFooter}>
                    <Text style={styles.copyrightText}>
                        © 2026 AIRPORTS AUTHORITY OF INDIA All Rights Reserved.
                    </Text>
                </View>

                {/* Error Message (only shows if there was an error) */}
                {error && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
                        <Text style={styles.errorText}>
                            Unable to load some data. Pull down to refresh.
                        </Text>
                    </View>
                )}

                {/* Debug Button - You can remove this after testing */}
                <TouchableOpacity 
                    style={styles.debugButton}
                    onPress={() => {
                        console.log('🔧 [DEBUG] Current stats:', stats);
                        console.log('🔧 [DEBUG] User data:', user);
                        Alert.alert(
                            'Debug Info',
                            `Total Surveys in System: ${stats.totalSurveys}\nSurveys This Month: ${stats.surveysThisMonth}\nUser Surveys Completed: ${user?.surveysCompleted || 0}`,
                            [{ text: 'OK' }]
                        );
                    }}
                >
                    <Text style={styles.debugButtonText}>🔧 Show Debug Info</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles remain EXACTLY the same as your original
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    portalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 18,
        color: '#546e7a',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 10,
        marginTop: 4,
    },
    logoutText: {
        color: '#1a237e',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    airportSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    airportText: {
        fontSize: 16,
        color: '#546e7a',
        marginLeft: 10,
    },
    airportName: {
        fontWeight: '600',
        color: '#1a237e',
    },
    experienceCard: {
        backgroundColor: '#e8eaf6',
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 20,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    experienceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 12,
        textAlign: 'center',
    },
    experienceDescription: {
        fontSize: 14,
        color: '#37474f',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a237e',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    feedbackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    statsContainer: {
        marginHorizontal: 24,
        marginBottom: 20,
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statsIconContainer: {
        backgroundColor: '#e8eaf6',
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statsNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 8,
    },
    statsTitle: {
        fontSize: 16,
        color: '#546e7a',
        fontWeight: '600',
        marginBottom: 4,
    },
    statsSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    historyCard: {
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginBottom: 30,
        padding: 24,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginLeft: 12,
    },
    historyDescription: {
        fontSize: 14,
        color: '#546e7a',
        lineHeight: 20,
        marginBottom: 20,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a237e',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 8,
    },
    historyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    footerLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    footerLink: {
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    footerLinkText: {
        fontSize: 12,
        color: '#1a237e',
        fontWeight: '500',
    },
    footerSeparator: {
        fontSize: 12,
        color: '#999',
        marginHorizontal: 4,
    },
    copyrightFooter: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    copyrightText: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        marginHorizontal: 24,
        marginBottom: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        marginLeft: 8,
    },
    // Debug button styles
    debugButton: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    debugButtonText: {
        fontSize: 12,
        color: '#666',
    },
});

export default DashboardScreen;