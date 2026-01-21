import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { surveyService } from '../services/surveyService';

const PastSubmissionDetailScreen = ({ navigation, route }) => {
    const { submissionId } = route.params || {};
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (submissionId) {
            loadSubmissionDetail();
        } else {
            Alert.alert('Error', 'No submission ID provided');
            navigation.goBack();
        }
    }, [submissionId]);

    const loadSubmissionDetail = async () => {
        setLoading(true);
        setError(false);
        try {
            console.log('🔧 [DEBUG] Loading detail for ID:', submissionId);
            
            // Fetch all submissions
            const response = await surveyService.getPastSubmissions(1, 100);
            console.log('🔧 [DEBUG] Response type:', typeof response);
            console.log('🔧 [DEBUG] Response is array?', Array.isArray(response));
            
            let submissionsArray = [];
            
            // Handle different response formats
            if (Array.isArray(response)) {
                // Response is directly an array
                submissionsArray = response;
            } else if (response && Array.isArray(response.surveys)) {
                // Response has surveys property
                submissionsArray = response.surveys;
            } else {
                // Unexpected format
                console.log('🔧 [DEBUG] Unexpected response format:', response);
                setError(true);
                Alert.alert('Error', 'Invalid data format received');
                navigation.goBack();
                return;
            }
            
            console.log('🔧 [DEBUG] Looking in:', submissionsArray.length, 'submissions');
            console.log('🔧 [DEBUG] Submission IDs:', submissionsArray.map(s => s._id));
            
            // Find the submission
            const foundSubmission = submissionsArray.find(s => 
                s._id === submissionId || 
                s.id === submissionId
            );
            
            if (foundSubmission) {
                console.log('🔧 [DEBUG] Found submission!');
                setSubmission(foundSubmission);
            } else {
                console.log('🔧 [DEBUG] Submission not found. Looking for:', submissionId);
                setError(true);
                Alert.alert('Not Found', 'Submission not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('🔧 [DEBUG] Error loading detail:', error);
            setError(true);
            Alert.alert('Error', 'Failed to load submission details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const renderRating = (ratingData) => {
        if (!ratingData || !ratingData.rating) return 'N/A';
        return ratingData.rating === 'Did Not Notice/Use' ? 'Not Used' : ratingData.rating;
    };

    const renderRatingWithComments = (label, ratingData) => {
        return (
            <View style={styles.ratingItem}>
                <View style={styles.ratingHeader}>
                    <Text style={styles.ratingLabel}>{label}</Text>
                    <View style={[
                        styles.ratingBadge,
                        { backgroundColor: getRatingColor(ratingData?.rating) }
                    ]}>
                        <Text style={styles.ratingBadgeText}>
                            {renderRating(ratingData)}
                        </Text>
                    </View>
                </View>
                {ratingData?.comments && ratingData.comments.trim() && (
                    <Text style={styles.ratingComments}>
                        "{ratingData.comments}"
                    </Text>
                )}
            </View>
        );
    };

    const getRatingColor = (rating) => {
        switch(rating) {
            case 'Excellent': return '#4caf50';
            case 'Very Good': return '#8bc34a';
            case 'Good': return '#cddc39';
            case 'Fair': return '#ff9800';
            case 'Poor': return '#f44336';
            case 'Did Not Notice/Use': return '#9e9e9e';
            default: return '#9e9e9e';
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>Loading submission details...</Text>
            </View>
        );
    }

    if (error || !submission) {
        return (
            <View style={styles.centered}>
                <MaterialIcons name="error-outline" size={48} color="#f44336" />
                <Text style={styles.errorText}>Failed to load submission details</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadSubmissionDetail}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Submission Details</Text>
                </View>

                {/* Flight Information Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="flight" size={24} color="#1a237e" />
                        <Text style={styles.cardTitle}>Flight Information</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Flight Number:</Text>
                        <Text style={styles.infoValue}>{submission.flightNumber || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Travel Date:</Text>
                        <Text style={styles.infoValue}>{formatDate(submission.travelDate)}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Destination:</Text>
                        <Text style={styles.infoValue}>{submission.destination || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Travel Reason:</Text>
                        <Text style={styles.infoValue}>{submission.travelReason || 'N/A'}</Text>
                    </View>
                </View>

                {/* Travel Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="airline-seat-recline-normal" size={24} color="#1a237e" />
                        <Text style={styles.cardTitle}>Travel Details</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Aircraft Section:</Text>
                        <Text style={styles.infoValue}>{submission.aircraftSection || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Return Trips (12 months):</Text>
                        <Text style={styles.infoValue}>{submission.returnTrips || 'N/A'}</Text>
                    </View>
                    
                    {submission.airportCode && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Airport Code:</Text>
                            <Text style={styles.infoValue}>{submission.airportCode}</Text>
                        </View>
                    )}
                    
                    {submission.submissionDate && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Submitted On:</Text>
                            <Text style={styles.infoValue}>{formatDate(submission.submissionDate)}</Text>
                        </View>
                    )}
                </View>

                {/* Ratings Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="star" size={24} color="#1a237e" />
                        <Text style={styles.cardTitle}>Service Ratings</Text>
                    </View>
                    
                    {submission.ratings ? (
                        <>
                            {renderRatingWithComments('Parking Facility', submission.ratings.parkingFacility)}
                            {renderRatingWithComments('Check-in Counters', submission.ratings.checkIn)}
                            {renderRatingWithComments('Washroom Cleanliness', submission.ratings.washroomCleanliness)}
                            {renderRatingWithComments('Security Check', submission.ratings.securityCheck)}
                            {renderRatingWithComments('F&B & Retail', submission.ratings.fnbRetail)}
                            {renderRatingWithComments('Boarding Gate', submission.ratings.boardingGate)}
                        </>
                    ) : (
                        <Text style={styles.noRatingsText}>No ratings available</Text>
                    )}
                </View>

                {/* Additional Comments Card */}
                {submission.additionalComments && submission.additionalComments.trim() && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="comment" size={24} color="#1a237e" />
                            <Text style={styles.cardTitle}>Additional Comments</Text>
                        </View>
                        <Text style={styles.commentsText}>
                            {submission.additionalComments}
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Thank you for your feedback!
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
    errorText: {
        marginTop: 12,
        color: '#f44336',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#1a237e',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
        marginTop: 16,
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    backButton: {
        padding: 10,
        marginTop: 12,
    },
    backButtonText: {
        color: '#1a237e',
        fontSize: 14,
        fontWeight: '500',
    },
    header: {
        backgroundColor: '#1a237e',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 18,
        paddingTop: 28,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // Balance for back button
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginLeft: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    noRatingsText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    ratingItem: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    ratingLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    ratingBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 80,
        alignItems: 'center',
    },
    ratingBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    ratingComments: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
        paddingLeft: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#e0e0e0',
    },
    commentsText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});

export default PastSubmissionDetailScreen;