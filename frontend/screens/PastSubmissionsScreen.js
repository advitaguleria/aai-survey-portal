import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { surveyService } from '../services/surveyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PastSubmissionsScreen = ({ navigation }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadSubmissions();
    }, [page]);

    const loadSubmissions = async () => {
        try {
            const response = await surveyService.getPastSubmissions(page, 10);
            if (response && Array.isArray(response.surveys)) {
                setSubmissions(response.surveys);
                setTotalPages(response.totalPages || 1);
            } else if (response && Array.isArray(response)) {
                setSubmissions(response);
                setTotalPages(1);
            } else {
                setSubmissions([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            setSubmissions([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadSubmissions();
    };

    const renderRating = (ratingData) => {
        if (!ratingData || !ratingData.rating) return 'N/A';
        const rating = ratingData.rating;
        if (rating === 'Did Not Notice/Use') return 'N/A';
        
        // Return only first letter for longer ratings to save space
        if (rating === 'Excellent') return 'Exc.';
        if (rating === 'Very Good') return 'V.Good';
        return rating.length > 8 ? rating.substring(0, 6) + '..' : rating;
    };

    const getRatingColor = (rating) => {
        if (!rating || rating === 'N/A') return '#9e9e9e';
        switch(rating) {
            case 'Excellent':
            case 'Exc.': return '#4caf50';
            case 'Very Good':
            case 'V.Good': return '#8bc34a';
            case 'Good': return '#cddc39';
            case 'Fair': return '#ff9800';
            case 'Poor': return '#f44336';
            case 'Did Not Notice/Use': return '#9e9e9e';
            default: return '#9e9e9e';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Date N/A';
        }
    };

    if (loading && page === 1) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>Loading your submissions...</Text>
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
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                        <Text style={styles.backText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.title}>Past Submissions</Text>
                    <Text style={styles.subtitle}>
                        Total: {submissions.length} survey{submissions.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {submissions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="inbox" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>No submissions yet</Text>
                        <Text style={styles.emptyText}>
                            Your feedback submissions will appear here
                        </Text>
                        <TouchableOpacity 
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('FeedbackForm')}
                        >
                            <Text style={styles.emptyButtonText}>Submit Your First Feedback</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {submissions.map((submission, index) => {
                            const ratingKeys = [
                                { label: 'Parking', key: 'parkingFacility' },
                                { label: 'Check-in', key: 'checkIn' },
                                { label: 'Washrooms', key: 'washroomCleanliness' },
                                { label: 'Security', key: 'securityCheck' },
                                { label: 'F&B/Retail', key: 'fnbRetail' },
                                { label: 'Boarding', key: 'boardingGate' },
                            ];

                            return (
                                <TouchableOpacity
                                    key={submission._id || index}
                                    onPress={() => navigation.navigate('PastSubmissionDetail', { 
                                        submissionId: submission._id || submission.id 
                                    })}
                                    style={styles.submissionTouchable}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.submissionCard}>
                                        {/* Flight Header */}
                                        <View style={styles.flightHeader}>
                                            <View style={styles.flightIconContainer}>
                                                <MaterialIcons name="flight" size={20} color="#fff" />
                                            </View>
                                            <View style={styles.flightInfo}>
                                                <Text style={styles.flightNumber} numberOfLines={1}>
                                                    {submission.flightNumber || 'N/A'} 
                                                    <Text style={styles.flightArrow}> → </Text>
                                                    {submission.destination || 'N/A'}
                                                </Text>
                                                <Text style={styles.flightDate}>
                                                    {formatDate(submission.travelDate)}
                                                </Text>
                                            </View>
                                            <View style={styles.statusContainer}>
                                                <View style={styles.statusDot} />
                                                <Text style={styles.statusText}>Submitted</Text>
                                            </View>
                                        </View>

                                        {/* Quick Info Row - 3 columns */}
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoColumn}>
                                                <View style={styles.infoItem}>
                                                    <MaterialIcons name="business" size={14} color="#546e7a" />
                                                    <Text style={styles.infoLabel}>Reason</Text>
                                                    <Text style={styles.infoValue} numberOfLines={1}>
                                                        {submission.travelReason || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            <View style={styles.verticalDivider} />
                                            
                                            <View style={styles.infoColumn}>
                                                <View style={styles.infoItem}>
                                                    <MaterialIcons name="airline-seat-recline-normal" size={14} color="#546e7a" />
                                                    <Text style={styles.infoLabel}>Class</Text>
                                                    <Text style={styles.infoValue} numberOfLines={1}>
                                                        {submission.aircraftSection || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            <View style={styles.verticalDivider} />
                                            
                                            <View style={styles.infoColumn}>
                                                <View style={styles.infoItem}>
                                                    <MaterialIcons name="repeat" size={14} color="#546e7a" />
                                                    <Text style={styles.infoLabel}>Return Trips</Text>
                                                    <Text style={styles.infoValue} numberOfLines={1}>
                                                        {submission.returnTrips || '0'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Ratings Grid - Fixed layout */}
                                        <View style={styles.ratingsContainer}>
                                            <Text style={styles.ratingsTitle}>Quick Ratings</Text>
                                            <View style={styles.ratingsGrid}>
                                                {ratingKeys.map((item, idx) => {
                                                    const rating = submission.ratings?.[item.key]?.rating;
                                                    const displayRating = renderRating(submission.ratings?.[item.key]);
                                                    return (
                                                        <View key={item.key} style={styles.ratingRow}>
                                                            <Text style={styles.ratingLabel} numberOfLines={1}>
                                                                {item.label}:
                                                            </Text>
                                                            <View style={[
                                                                styles.ratingBadge,
                                                                { backgroundColor: getRatingColor(rating) }
                                                            ]}>
                                                                <Text style={styles.ratingBadgeText} numberOfLines={1}>
                                                                    {displayRating}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>

                                        {/* View Details Footer */}
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.viewDetailsText}>Tap to view full details</Text>
                                            <MaterialIcons name="chevron-right" size={20} color="#1a237e" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                                    onPress={() => page > 1 && setPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    <MaterialIcons name="chevron-left" size={20} color={page === 1 ? "#999" : "#1a237e"} />
                                    <Text style={[styles.pageButtonText, page === 1 && styles.pageButtonTextDisabled]}>
                                        Previous
                                    </Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.pageInfo}>
                                    Page {page} of {totalPages}
                                </Text>
                                
                                <TouchableOpacity
                                    style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
                                    onPress={() => page < totalPages && setPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    <Text style={[styles.pageButtonText, page === totalPages && styles.pageButtonTextDisabled]}>
                                        Next
                                    </Text>
                                    <MaterialIcons name="chevron-right" size={20} color={page === totalPages ? "#999" : "#1a237e"} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Thank you for your valuable feedback
                    </Text>
                </View>
            </ScrollView>
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
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    header: {
        backgroundColor: '#1a237e',
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '500',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#e8eaf6',
        opacity: 0.9,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#546e7a',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#1a237e',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    submissionTouchable: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    submissionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        minHeight: 280,
    },
    flightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    flightIconContainer: {
        backgroundColor: '#1a237e',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    flightInfo: {
        flex: 1,
    },
    flightNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 4,
    },
    flightArrow: {
        color: '#546e7a',
        fontWeight: 'normal',
    },
    flightDate: {
        fontSize: 14,
        color: '#666',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4caf50',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        height: 80,
    },
    infoColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    infoItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    infoLabel: {
        fontSize: 11,
        color: '#546e7a',
        marginTop: 6,
        marginBottom: 4,
        textAlign: 'center',
    },
    infoValue: {
        fontSize: 12,
        color: '#1a237e',
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: '100%',
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 8,
    },
    ratingsContainer: {
        marginBottom: 16,
    },
    ratingsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#37474f',
        marginBottom: 12,
    },
    ratingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '48%',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    ratingLabel: {
        fontSize: 13,
        color: '#546e7a',
        flex: 1,
        marginRight: 8,
    },
    ratingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 60,
        maxWidth: 80,
    },
    ratingBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    viewDetailsText: {
        fontSize: 13,
        color: '#1a237e',
        fontWeight: '500',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginTop: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#f0f2f5',
    },
    pageButtonDisabled: {
        backgroundColor: '#f5f5f5',
    },
    pageButtonText: {
        color: '#1a237e',
        fontSize: 14,
        fontWeight: '500',
        marginHorizontal: 6,
    },
    pageButtonTextDisabled: {
        color: '#999',
    },
    pageInfo: {
        fontSize: 14,
        color: '#546e7a',
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});

export default PastSubmissionsScreen;