import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext'; // ADD THIS IMPORT
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { surveyService } from '../services/surveyService';
import {
    TRAVEL_REASONS,
    AIRCRAFT_SECTIONS,
    RETURN_TRIPS,
    SURVEY_QUESTIONS,
} from '../utils/constants';

const FeedbackFormScreen = ({ navigation }) => {
    // Get user data from AuthContext
    const { user } = useAuth(); // ADD THIS
    
    // Update AIRCRAFT_SECTIONS to remove "Tourist"
    const aircraftSections = ['First Class', 'Business/Upper Class', 'Economy'];
    
    const [formData, setFormData] = useState({
        airportName: user?.airportName || '', // Auto-populate from user
        airportCode: user?.airportCode || '', // Auto-populate from user
        flightNumber: '',
        travelDate: '',
        travelTime: '',
        destination: '',
        travelReason: '',
        aircraftSection: '',
        returnTrips: '',
        ratings: {
            parkingFacility: { rating: '', comments: '' },
            checkIn: { rating: '', comments: '' },
            washroomCleanliness: { rating: '', comments: '' },
            securityCheck: { rating: '', comments: '' },
            fnbRetail: { rating: '', comments: '' },
            boardingGate: { rating: '', comments: '' },
        },
        additionalComments: '',
        submissionDate: '', // Will be auto-filled on submission
        submissionTime: '', // Will be auto-filled on submission
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Function to get current date in DD-MM-YYYY format
    const getCurrentDate = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = now.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Function to get current time in HH:MM format
    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Function to format date as user types (DD-MM-YYYY)
    const formatDate = (text) => {
        // Remove all non-digit characters
        let cleaned = text.replace(/\D/g, '');
        
        // Limit to 8 digits (DDMMYYYY)
        if (cleaned.length > 8) {
            cleaned = cleaned.substring(0, 8);
        }
        
        // Add dashes automatically
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
        }
        if (cleaned.length > 4) {
            formatted = cleaned.substring(0, 2) + '-' + cleaned.substring(2, 4) + '-' + cleaned.substring(4);
        }
        
        return formatted;
    };

    // Function to format time as user types (HH:MM)
    const formatTime = (text) => {
        // Remove all non-digit characters
        let cleaned = text.replace(/\D/g, '');
        
        // Limit to 4 digits (HHMM)
        if (cleaned.length > 4) {
            cleaned = cleaned.substring(0, 4);
        }
        
        // Add colon automatically
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.substring(0, 2) + ':' + cleaned.substring(2);
        }
        
        return formatted;
    };

    // Convert DD-MM-YYYY to YYYY-MM-DD for API
    const convertDateForAPI = (dateStr) => {
        if (!dateStr || dateStr.length !== 10) return dateStr;
        
        // Split DD-MM-YYYY into parts
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        
        // Reformat to YYYY-MM-DD
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (text) => {
        const formatted = formatDate(text);
        setFormData({ ...formData, travelDate: formatted });
        // Clear error if user is typing
        if (errors.travelDate) {
            setErrors({ ...errors, travelDate: null });
        }
    };

    const handleTimeChange = (text) => {
        const formatted = formatTime(text);
        setFormData({ ...formData, travelTime: formatted });
    };

    const validate = () => {
        const newErrors = {};
        
        // Airport name and code are now auto-filled, but still validate they exist
        if (!formData.airportName.trim()) newErrors.airportName = 'Airport name is required';
        if (!formData.airportCode.trim()) newErrors.airportCode = 'Airport code is required';
        if (!formData.flightNumber.trim()) newErrors.flightNumber = 'Flight number is required';
        if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
        if (!formData.travelReason) newErrors.travelReason = 'Travel reason is required';
        if (!formData.aircraftSection) newErrors.aircraftSection = 'Aircraft section is required';
        if (!formData.returnTrips) newErrors.returnTrips = 'Return trips is required';
        
        // Date validation - must be exactly DD-MM-YYYY format
        if (!formData.travelDate.trim()) {
            newErrors.travelDate = 'Travel date is required';
        } else if (formData.travelDate.length !== 10) {
            newErrors.travelDate = 'Please enter complete date (DD-MM-YYYY)';
        } else if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.travelDate)) {
            newErrors.travelDate = 'Invalid date format (DD-MM-YYYY)';
        }
        
        return newErrors;
    };

    const handleRatingChange = (questionKey, rating) => {
        setFormData({
            ...formData,
            ratings: {
                ...formData.ratings,
                [questionKey]: {
                    ...formData.ratings[questionKey],
                    rating,
                },
            },
        });
    };

    const handleCommentsChange = (questionKey, comments) => {
        setFormData({
            ...formData,
            ratings: {
                ...formData.ratings,
                [questionKey]: {
                    ...formData.ratings[questionKey],
                    comments,
                },
            },
        });
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        console.log('🔧 [DEBUG] Validation errors:', validationErrors);
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            Alert.alert('Validation Error', 'Please fill all required fields correctly');
            return;
        }

        setLoading(true);
        try {
            // Get current date and time for submission timestamp
            const submissionDate = getCurrentDate();
            const submissionTime = getCurrentTime();
            
            // Prepare data for API
            const apiData = {
                ...formData,
                travelDate: convertDateForAPI(formData.travelDate),
                travelTime: formData.travelTime && formData.travelTime !== '--:--' ? formData.travelTime : '',
                submissionDate: convertDateForAPI(submissionDate), // Add submission date
                submissionTime: submissionTime, // Add submission time
                // Ensure all required rating fields are present
                ratings: Object.keys(formData.ratings).reduce((acc, key) => {
                    acc[key] = {
                        rating: formData.ratings[key].rating || '',
                        comments: formData.ratings[key].comments || ''
                    };
                    return acc;
                }, {}),
                additionalComments: formData.additionalComments || '',
                submittedBy: user?._id || user?.id, // Optional: track who submitted
                userEmail: user?.email // Optional: track user email
            };
            
            console.log('🔧 [DEBUG] Sending to API:', {
                ...apiData,
                submissionDate: apiData.submissionDate,
                submissionTime: apiData.submissionTime
            });
            
            await surveyService.submitFeedback(apiData);
            
            // Clear form after successful submission
            setFormData({
                airportName: user?.airportName || '',
                airportCode: user?.airportCode || '',
                flightNumber: '',
                travelDate: '',
                travelTime: '',
                destination: '',
                travelReason: '',
                aircraftSection: '',
                returnTrips: '',
                ratings: {
                    parkingFacility: { rating: '', comments: '' },
                    checkIn: { rating: '', comments: '' },
                    washroomCleanliness: { rating: '', comments: '' },
                    securityCheck: { rating: '', comments: '' },
                    fnbRetail: { rating: '', comments: '' },
                    boardingGate: { rating: '', comments: '' },
                },
                additionalComments: '',
                submissionDate: '',
                submissionTime: '',
            });
            
            Alert.alert(
                '✅ Success',
                'Feedback submitted successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.navigate('Dashboard', { 
                                refresh: true,
                                refreshTimestamp: Date.now() 
                            });
                        },
                    },
                ]
            );
        } catch (error) {
            console.log('🔧 [DEBUG] API Error details:', error.response?.data || error.message);
            Alert.alert('❌ Error', error.response?.data?.message || 'Submission failed. Please check all fields.');
        } finally {
            setLoading(false);
        }
    };

    const renderRadioGroup = (title, options, selected, onSelect, error) => {
        return (
            <View style={styles.radioGroup}>
                <Text style={styles.radioGroupTitle}>{title}</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <View style={styles.radioOptions}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.radioItem}
                            onPress={() => onSelect(option)}
                        >
                            <View style={styles.radioCircle}>
                                {selected === option && <View style={styles.radioSelected} />}
                            </View>
                            <Text style={styles.radioText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderRatingQuestion = (question, index) => {
        return (
            <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>{index + 1}.</Text>
                    <Text style={styles.questionText}>{question.question}</Text>
                </View>
                
                <View style={styles.ratingContainer}>
                    {/* Row 1: Excellent and Very Good */}
                    <View style={styles.ratingRow}>
                        <TouchableOpacity
                            style={[
                                styles.ratingOption,
                                styles.ratingOptionHalf,
                                formData.ratings[question.key].rating === 'Excellent' &&
                                styles.ratingOptionSelected,
                            ]}
                            onPress={() => handleRatingChange(question.key, 'Excellent')}
                        >
                            <Text style={[
                                styles.emojiText,
                                formData.ratings[question.key].rating === 'Excellent' && styles.emojiTextSelected
                            ]}>
                                😊
                            </Text>
                            <Text style={[
                                styles.ratingLabel,
                                formData.ratings[question.key].rating === 'Excellent' && styles.ratingLabelSelected,
                                styles.excellentText
                            ]}>
                                Excellent
                            </Text>
                        </TouchableOpacity>
                        
                        <View style={styles.ratingSpacer} />
                        
                        <TouchableOpacity
                            style={[
                                styles.ratingOption,
                                styles.ratingOptionHalf,
                                formData.ratings[question.key].rating === 'Very Good' &&
                                styles.ratingOptionSelected,
                            ]}
                            onPress={() => handleRatingChange(question.key, 'Very Good')}
                        >
                            <Text style={[
                                styles.emojiText,
                                formData.ratings[question.key].rating === 'Very Good' && styles.emojiTextSelected
                            ]}>
                                🙂
                            </Text>
                            <Text style={[
                                styles.ratingLabel,
                                formData.ratings[question.key].rating === 'Very Good' && styles.ratingLabelSelected,
                                styles.veryGoodText
                            ]}>
                                Very Good
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Row 2: Good and Fair */}
                    <View style={styles.ratingRow}>
                        <TouchableOpacity
                            style={[
                                styles.ratingOption,
                                styles.ratingOptionHalf,
                                formData.ratings[question.key].rating === 'Good' &&
                                styles.ratingOptionSelected,
                            ]}
                            onPress={() => handleRatingChange(question.key, 'Good')}
                        >
                            <Text style={[
                                styles.emojiText,
                                formData.ratings[question.key].rating === 'Good' && styles.emojiTextSelected
                            ]}>
                                😐
                            </Text>
                            <Text style={[
                                styles.ratingLabel,
                                formData.ratings[question.key].rating === 'Good' && styles.ratingLabelSelected,
                                styles.goodText
                            ]}>
                                Good
                            </Text>
                        </TouchableOpacity>
                        
                        <View style={styles.ratingSpacer} />
                        
                        <TouchableOpacity
                            style={[
                                styles.ratingOption,
                                styles.ratingOptionHalf,
                                formData.ratings[question.key].rating === 'Fair' &&
                                styles.ratingOptionSelected,
                            ]}
                            onPress={() => handleRatingChange(question.key, 'Fair')}
                        >
                            <Text style={[
                                styles.emojiText,
                                formData.ratings[question.key].rating === 'Fair' && styles.emojiTextSelected
                            ]}>
                                😕
                            </Text>
                            <Text style={[
                                styles.ratingLabel,
                                formData.ratings[question.key].rating === 'Fair' && styles.ratingLabelSelected,
                                styles.fairText
                            ]}>
                                Fair
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Row 3: Poor (centered) */}
                    <View style={[styles.ratingRow, styles.poorRow]}>
                        <TouchableOpacity
                            style={[
                                styles.ratingOption,
                                styles.ratingOptionPoor,
                                formData.ratings[question.key].rating === 'Poor' &&
                                styles.ratingOptionSelected,
                            ]}
                            onPress={() => handleRatingChange(question.key, 'Poor')}
                        >
                            <Text style={[
                                styles.emojiText,
                                formData.ratings[question.key].rating === 'Poor' && styles.emojiTextSelected
                            ]}>
                                😞
                            </Text>
                            <Text style={[
                                styles.ratingLabel,
                                formData.ratings[question.key].rating === 'Poor' && styles.ratingLabelSelected,
                                styles.poorText
                            ]}>
                                Poor
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <TextInput
                    style={styles.commentsInput}
                    placeholder="Additional comments (optional)"
                    value={formData.ratings[question.key].comments}
                    onChangeText={(text) => handleCommentsChange(question.key, text)}
                    multiline
                    numberOfLines={2}
                    placeholderTextColor="#9e9e9e"
                />
                
                {index < SURVEY_QUESTIONS.length - 1 && (
                    <View style={styles.divider} />
                )}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>✈️ AAI Survey Portal</Text>
                <Text style={styles.headerSubtitle}>Customer Satisfaction Survey</Text>
            </View>

            <View style={styles.form}>
                {/* Airport Details - NOW AUTO-POPULATED AND READ-ONLY */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Airport Name</Text>
                    <View style={styles.autoFieldContainer}>
                        <Text style={styles.autoFieldText}>
                            {formData.airportName || 'Not available'}
                        </Text>
                        {formData.airportName ? (
                            <Text style={styles.autoFieldNote}>
                                ✓ Auto-filled from your profile
                            </Text>
                        ) : (
                            <Text style={styles.autoFieldError}>
                                ⚠️ Please update your profile with airport details
                            </Text>
                        )}
                    </View>
                    
                    <Text style={styles.sectionLabel}>Airport Code</Text>
                    <View style={styles.autoFieldContainer}>
                        <Text style={styles.autoFieldText}>
                            {formData.airportCode || 'Not available'}
                        </Text>
                        {formData.airportCode ? (
                            <Text style={styles.autoFieldNote}>
                                ✓ Auto-filled from your profile
                            </Text>
                        ) : (
                            <Text style={styles.autoFieldError}>
                                ⚠️ Please update your profile with airport details
                            </Text>
                        )}
                    </View>
                </View>

                {/* Travel Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🛄 Travel Details</Text>
                    
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.inputLabel}>Flight Number</Text>
                            <Input
                                value={formData.flightNumber}
                                onChangeText={(text) => setFormData({ ...formData, flightNumber: text })}
                                placeholder="Flight Number"
                                error={errors.flightNumber}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.inputLabel}>Date of Travel</Text>
                            <Input
                                value={formData.travelDate}
                                onChangeText={handleDateChange}
                                placeholder="DD-MM-YYYY"
                                keyboardType="numeric"
                                maxLength={10}
                                error={errors.travelDate}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.inputLabel}>Time</Text>
                            <Input
                                value={formData.travelTime}
                                onChangeText={handleTimeChange}
                                placeholder="HH:MM"
                                keyboardType="numeric"
                                maxLength={5}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.inputLabel}>Destination</Text>
                            <Input
                                value={formData.destination}
                                onChangeText={(text) => setFormData({ ...formData, destination: text })}
                                placeholder="Destination"
                                error={errors.destination}
                            />
                        </View>
                    </View>
                </View>

                {/* Travel Reason */}
                {renderRadioGroup(
                    '📋 What is your MAIN reason for this air trip?',
                    TRAVEL_REASONS,
                    formData.travelReason,
                    (reason) => setFormData({ ...formData, travelReason: reason }),
                    errors.travelReason
                )}

                {/* Aircraft Section */}
                {renderRadioGroup(
                    '🛩️ Which section of the aircraft are you travelling in?',
                    aircraftSections, // Using updated array without Tourist
                    formData.aircraftSection,
                    (section) => setFormData({ ...formData, aircraftSection: section }),
                    errors.aircraftSection
                )}

                {/* Return Trips */}
                {renderRadioGroup(
                    '📊 Number of return trips made in last 12 months',
                    RETURN_TRIPS,
                    formData.returnTrips,
                    (trips) => setFormData({ ...formData, returnTrips: trips }),
                    errors.returnTrips
                )}

                {/* Satisfaction Questions */}
                <View style={styles.questionnaireSection}>
                    <Text style={styles.questionnaireTitle}>
                        📝 Airport Departure Customer Satisfaction Questionnaire
                    </Text>
                    {SURVEY_QUESTIONS.map((question, index) => renderRatingQuestion(question, index))}
                </View>

                {/* Additional Comments */}
                <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>💬 Any other comments (free text)</Text>
                    <TextInput
                        style={styles.commentsTextArea}
                        placeholder="Share any additional comments or suggestions..."
                        value={formData.additionalComments}
                        onChangeText={(text) => setFormData({ ...formData, additionalComments: text })}
                        multiline
                        numberOfLines={6}
                        placeholderTextColor="#9e9e9e"
                    />
                </View>

                {/* Submission Info - Show to user */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>ℹ️ Submission Information</Text>
                    <Text style={styles.infoText}>
                        • Airport details are auto-filled from your profile
                    </Text>
                    <Text style={styles.infoText}>
                        • Submission date & time will be recorded automatically
                    </Text>
                </View>

                {/* Submit Button */}
                <View style={styles.submitSection}>
                    <Button
                        title="✅ SUBMIT FEEDBACK"
                        onPress={handleSubmit}
                        loading={loading}
                        style={styles.submitButton}
                        textStyle={styles.submitButtonText}
                    />
                    <Text style={styles.helpText}>
                        ℹ️ Need help? Contact AAI Support or FAQ
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#1e3a8a',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1d4ed8',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#e0e7ff',
        textAlign: 'center',
    },
    form: {
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginTop: 12,
    },
    // New styles for auto-populated fields
    autoFieldContainer: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 14,
        backgroundColor: '#f8fafc',
        marginBottom: 16,
    },
    autoFieldText: {
        fontSize: 16,
        color: '#1e3a8a',
        fontWeight: '600',
    },
    autoFieldNote: {
        fontSize: 12,
        color: '#059669',
        marginTop: 4,
        fontStyle: 'italic',
    },
    autoFieldError: {
        fontSize: 12,
        color: '#dc2626',
        marginTop: 4,
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    halfInput: {
        flex: 1,
        marginHorizontal: 4,
    },
    inputLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 6,
        fontWeight: '500',
    },
    radioGroup: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    radioGroupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e3a8a',
        marginBottom: 20,
        lineHeight: 22,
    },
    radioOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 32,
        marginBottom: 16,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    radioSelected: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4f46e5',
    },
    radioText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    questionnaireSection: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    questionnaireTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 28,
        textAlign: 'center',
        lineHeight: 24,
    },
    questionCard: {
        marginBottom: 0,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4f46e5',
        marginRight: 8,
        minWidth: 22,
        lineHeight: 24,
    },
    questionText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
        flex: 1,
        fontWeight: '500',
    },
    ratingContainer: {
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    poorRow: {
        justifyContent: 'center',
    },
    ratingSpacer: {
        width: 16,
    },
    ratingOption: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        flex: 1,
        minHeight: 80,
    },
    ratingOptionHalf: {
        flex: 1,
    },
    ratingOptionPoor: {
        width: '48%',
        maxWidth: 180,
    },
    ratingOptionSelected: {
        borderColor: '#4f46e5',
        backgroundColor: '#eef2ff',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emojiText: {
        fontSize: 18,
        marginBottom: 6,
    },
    emojiTextSelected: {
        fontSize: 20,
    },
    ratingLabel: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 18,
    },
    ratingLabelSelected: {
        color: '#4f46e5',
        fontWeight: 'bold',
    },
    excellentText: {
        color: '#059669',
    },
    veryGoodText: {
        color: '#10b981',
    },
    goodText: {
        color: '#f59e0b',
    },
    fairText: {
        color: '#f97316',
    },
    poorText: {
        color: '#ef4444',
    },
    commentsInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        color: '#334155',
        backgroundColor: '#f8fafc',
        marginBottom: 24,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginBottom: 28,
    },
    commentsSection: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e3a8a',
        marginBottom: 16,
        textAlign: 'center',
    },
    commentsTextArea: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 16,
        fontSize: 15,
        color: '#334155',
        backgroundColor: '#f8fafc',
        minHeight: 120,
        textAlignVertical: 'top',
        lineHeight: 22,
    },
    // New info card
    infoCard: {
        backgroundColor: '#e8f4fd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#b3e0ff',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a73e8',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#5f6368',
        marginBottom: 4,
    },
    submitSection: {
        alignItems: 'center',
        marginBottom: 40,
        paddingTop: 20,
    },
    submitButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 16,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    helpText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        marginBottom: 8,
        marginTop: -8,
        fontWeight: '500',
    },
});

export default FeedbackFormScreen;