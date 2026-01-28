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
import { useOffline } from '../context/OfflineContext';
import { surveyService } from '../services/surveyService';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import offlineService from '../services/offlineService';

const DashboardScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { isOnline, pendingCount, triggerSync } = useOffline();
    const [stats, setStats] = useState({ 
        totalSurveys: 0,
        surveysThisMonth: 0,
        pendingSync: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);

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
            } catch (statsError) {
                console.log('Stats loading failed, using offline data:', statsError.message);
                // Fallback to offline data
                const localSubmissions = await offlineService.getLocalSubmissions();
                dashboardStats = {
                    totalSurveys: localSubmissions.length,
                    surveysThisMonth: localSubmissions.filter(s => isThisMonth(new Date(s.localTimestamp))).length,
                    offline: true
                };
            }

            // Load recent activity
            const activity = await loadRecentActivity();
            setRecentActivity(activity.slice(0, 3)); // Show only 3 most recent
            
            setStats({
                totalSurveys: dashboardStats.totalSurveys || 0,
                surveysThisMonth: dashboardStats.surveysThisMonth || 0,
                pendingSync: pendingCount,
                offline: dashboardStats.offline || false
            });
            
        } catch (error) {
            console.error('Dashboard load error:', error);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadRecentActivity = async () => {
        try {
            // Combine online and offline submissions
            let onlineSubmissions = [];
            try {
                const response = await surveyService.getPastSubmissions();
                onlineSubmissions = response.submissions || [];
            } catch (error) {
                console.log('Could not load online submissions:', error.message);
            }
            
            const offlineSubmissions = await offlineService.getLocalSubmissions();
            
            // Format offline submissions for display
            const formattedOfflineSubmissions = offlineSubmissions.map(sub => ({
                _id: sub.id || `local_${Date.now()}`,
                flightNumber: sub.flightNumber || 'N/A',
                terminal: sub.terminal || 'N/A',
                createdAt: sub.localTimestamp || new Date().toISOString(),
                offline: true,
                status: 'pending'
            }));
            
            // Combine and sort by date
            const allSubmissions = [...onlineSubmissions, ...formattedOfflineSubmissions]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            return allSubmissions;
        } catch (error) {
            console.error('Error loading recent activity:', error);
            return [];
        }
    };

    const isThisMonth = (date) => {
        const today = new Date();
        return date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
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
                    onPress: async () => {
                        await logout();
                        // Clear offline data on logout
                        await offlineService.clearAllOfflineData();
                    },
                },
            ]
        );
    };

    const handleManualSync = async () => {
        if (!isOnline) {
            Alert.alert('Offline', 'You need to be online to sync data.');
            return;
        }
        
        Alert.alert(
            'Sync Data',
            `Sync ${pendingCount} pending items?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sync Now',
                    onPress: async () => {
                        try {
                            await triggerSync();
                            await loadDashboardData(); // Refresh after sync
                            Alert.alert('Success', 'Data synced successfully!');
                        } catch (error) {
                            Alert.alert('Sync Failed', 'Could not sync data. Please try again.');
                        }
                    }
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
                {/* ===== NETWORK STATUS BANNER ===== */}
                {!isOnline && (
                    <View style={styles.offlineBanner}>
                        <MaterialIcons name="wifi-off" size={20} color="#FFF" />
                        <Text style={styles.offlineText}>
                            Offline Mode • {pendingCount} pending sync
                        </Text>
                        <TouchableOpacity 
                            style={styles.syncNowButton}
                            onPress={handleManualSync}
                        >
                            <Text style={styles.syncNowText}>Sync Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ===== HEADER SECTION ===== */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.portalTitle}>AAI Survey Portal</Text>
                            <Text style={styles.welcomeText}>
                                Welcome, {user?.fullName || user?.name || 'User'}!
                            </Text>
                            {user?.offlineMode && (
                                <View style={styles.offlineBadge}>
                                    <MaterialIcons name="cloud-off" size={14} color="#FF9800" />
                                    <Text style={styles.offlineBadgeText}>Offline Account</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity 
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <MaterialIcons name="logout" size={22} color="#1a237e" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Connection Status Indicator */}
                    <View style={styles.connectionStatus}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' }]} />
                        <Text style={styles.statusText}>
                            {isOnline ? 'Online' : 'Offline'} • 
                            Last sync: {stats.offline ? 'Pending' : 'Today'}
                        </Text>
                    </View>
                </View>

                {/* ===== AIRPORT NAME SECTION ===== */}
                {user?.airportName && (
                    <View style={styles.airportSection}>
                        <MaterialIcons name="location-on" size={20} color="#1a237e" />
                        <Text style={styles.airportText}>
                            Airport: <Text style={styles.airportName}>{user.airportName}</Text>
                        </Text>
                    </View>
                )}

                {/* ===== QUICK STATS CARDS ===== */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8EAF6' }]}>
                            <MaterialIcons name="assessment" size={24} color="#1a237e" />
                        </View>
                        <Text style={styles.statNumber}>{stats.totalSurveys}</Text>
                        <Text style={styles.statLabel}>Total Surveys</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
                            <MaterialIcons name="today" size={24} color="#2E7D32" />
                        </View>
                        <Text style={styles.statNumber}>{stats.surveysThisMonth}</Text>
                        <Text style={styles.statLabel}>This Month</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                            <MaterialIcons name="sync" size={24} color="#D32F2F" />
                        </View>
                        <Text style={styles.statNumber}>{stats.pendingSync}</Text>
                        <Text style={styles.statLabel}>Pending Sync</Text>
                    </View>
                </View>

                {/* ===== SHARE YOUR EXPERIENCE SECTION ===== */}
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

                {/* ===== RECENT ACTIVITY ===== */}
                {recentActivity.length > 0 && (
                    <View style={styles.activityCard}>
                        <View style={styles.activityHeader}>
                            <MaterialIcons name="history" size={24} color="#1a237e" />
                            <Text style={styles.activityTitle}>Recent Activity</Text>
                        </View>
                        
                        {recentActivity.map((activity, index) => (
                            <View key={index} style={styles.activityItem}>
                                <View style={styles.activityLeft}>
                                    <MaterialIcons 
                                        name={activity.offline ? "cloud-upload" : "check-circle"} 
                                        size={20} 
                                        color={activity.offline ? "#FF9800" : "#4CAF50"} 
                                    />
                                    <View style={styles.activityDetails}>
                                        <Text style={styles.activityFlight}>
                                            Flight {activity.flightNumber} • Terminal {activity.terminal}
                                        </Text>
                                        <Text style={styles.activityTime}>
                                            {new Date(activity.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                {activity.offline && (
                                    <View style={styles.offlineIndicator}>
                                        <Text style={styles.offlineIndicatorText}>Offline</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('PastSubmissions')}
                        >
                            <Text style={styles.viewAllText}>View All Submissions</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#1a237e" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ===== YOUR FEEDBACK HISTORY CARD (RESTORED) ===== */}
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

                {/* ===== SYSTEM STATUS ===== */}
                <View style={styles.systemCard}>
                    <Text style={styles.systemTitle}>System Status</Text>
                    <View style={styles.systemItem}>
                        <MaterialIcons 
                            name="wifi" 
                            size={20} 
                            color={isOnline ? "#4CAF50" : "#FF9800"} 
                        />
                        <Text style={styles.systemText}>
                            Connection: {isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                    <View style={styles.systemItem}>
                        <MaterialIcons 
                            name="cloud" 
                            size={20} 
                            color={pendingCount > 0 ? "#FF9800" : "#4CAF50"} 
                        />
                        <Text style={styles.systemText}>
                            Sync: {pendingCount > 0 ? `${pendingCount} pending` : 'Up to date'}
                        </Text>
                    </View>
                    <View style={styles.systemItem}>
                        <MaterialIcons 
                            name="account-circle" 
                            size={20} 
                            color={user?.offlineMode ? "#FF9800" : "#4CAF50"} 
                        />
                        <Text style={styles.systemText}>
                            Account: {user?.offlineMode ? 'Offline Mode' : 'Online Mode'}
                        </Text>
                    </View>
                </View>

                {/* ===== FOOTER LINKS ===== */}
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

                {/* ===== COPYRIGHT FOOTER ===== */}
                <View style={styles.copyrightFooter}>
                    <Text style={styles.copyrightText}>
                        © 2026 AIRPORTS AUTHORITY OF INDIA All Rights Reserved.
                    </Text>
                </View>

                {/* ===== ERROR MESSAGE ===== */}
                {error && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
                        <Text style={styles.errorText}>
                            Unable to load some data. Pull down to refresh.
                        </Text>
                    </View>
                )}

                {/* ===== DEBUG BUTTON ===== */}
                <TouchableOpacity 
                    style={styles.debugButton}
                    onPress={() => {
                        console.log('🔧 [DEBUG] Current stats:', stats);
                        console.log('🔧 [DEBUG] User data:', user);
                        console.log('🔧 [DEBUG] Online status:', isOnline);
                        console.log('🔧 [DEBUG] Pending count:', pendingCount);
                        Alert.alert(
                            'Debug Info',
                            `Status: ${isOnline ? 'Online' : 'Offline'}\nPending Sync: ${pendingCount}\nTotal Surveys: ${stats.totalSurveys}\nOffline Mode: ${user?.offlineMode ? 'Yes' : 'No'}`,
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

// Updated Styles with restored history card
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
    // Offline Banner
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9800',
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    offlineText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        marginLeft: 10,
    },
    syncNowButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    syncNowText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    // Header
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    headerLeft: {
        flex: 1,
    },
    portalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 6,
    },
    welcomeText: {
        fontSize: 18,
        color: '#546e7a',
        fontWeight: '500',
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    offlineBadgeText: {
        color: '#FF9800',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 13,
        color: '#666',
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
    // Airport Section
    airportSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 16,
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
    // Stats Grid (3 cards now)
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    statCard: {
        backgroundColor: '#fff',
        width: '31%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    // Experience Card
    experienceCard: {
        backgroundColor: '#e8eaf6',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    experienceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 10,
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
    },
    feedbackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    // Activity Card
    activityCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginLeft: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activityDetails: {
        marginLeft: 12,
    },
    activityFlight: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    activityTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    offlineIndicator: {
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    offlineIndicatorText: {
        color: '#FF9800',
        fontSize: 11,
        fontWeight: '600',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        paddingBottom: 4,
    },
    viewAllText: {
        color: '#1a237e',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    // History Card (Restored)
    historyCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
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
    // System Card
    systemCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
    },
    systemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 16,
    },
    systemItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    systemText: {
        fontSize: 15,
        color: '#555',
        marginLeft: 12,
    },
    // Footer Links
    footerLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
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
    // Copyright Footer
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
    // Error Container
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        marginHorizontal: 20,
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
    // Debug Button
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