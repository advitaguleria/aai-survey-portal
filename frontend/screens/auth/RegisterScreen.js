import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        companyOrganization: '',
        airportCode: '',
        airportName: '',
    });
    const [employeeIdImage, setEmployeeIdImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isDetectingLocation, setIsDetectingLocation] = useState(true);
    const [locationStatus, setLocationStatus] = useState('Detecting your location...');
    
    // Airport database with coordinates
    const airports = [
        { 
            code: 'DEL', 
            name: 'Delhi - Indira Gandhi International Airport',
            city: 'New Delhi',
            state: 'Delhi',
            coordinates: { latitude: 28.5562, longitude: 77.1000 }
        },
        { 
            code: 'BOM', 
            name: 'Mumbai - Chhatrapati Shivaji Maharaj International Airport',
            city: 'Mumbai',
            state: 'Maharashtra',
            coordinates: { latitude: 19.0896, longitude: 72.8656 }
        },
        { 
            code: 'MAA', 
            name: 'Chennai - Chennai International Airport',
            city: 'Chennai',
            state: 'Tamil Nadu',
            coordinates: { latitude: 12.9941, longitude: 80.1709 }
        },
        { 
            code: 'CCU', 
            name: 'Kolkata - Netaji Subhash Chandra Bose International Airport',
            city: 'Kolkata',
            state: 'West Bengal',
            coordinates: { latitude: 22.6547, longitude: 88.4467 }
        },
        { 
            code: 'BLR', 
            name: 'Bengaluru - Kempegowda International Airport',
            city: 'Bengaluru',
            state: 'Karnataka',
            coordinates: { latitude: 13.1989, longitude: 77.7058 }
        },
        { 
            code: 'HYD', 
            name: 'Hyderabad - Rajiv Gandhi International Airport',
            city: 'Hyderabad',
            state: 'Telangana',
            coordinates: { latitude: 17.2403, longitude: 78.4294 }
        },
        { 
            code: 'GOI', 
            name: 'Goa - Dabolim Airport',
            city: 'Goa',
            state: 'Goa',
            coordinates: { latitude: 15.3808, longitude: 73.8333 }
        },
        { 
            code: 'AMD', 
            name: 'Ahmedabad - Sardar Vallabhbhai Patel International Airport',
            city: 'Ahmedabad',
            state: 'Gujarat',
            coordinates: { latitude: 23.0667, longitude: 72.6333 }
        },
        { 
            code: 'PNQ', 
            name: 'Pune - Pune Airport',
            city: 'Pune',
            state: 'Maharashtra',
            coordinates: { latitude: 18.5822, longitude: 73.9197 }
        },
        { 
            code: 'COK', 
            name: 'Kochi - Cochin International Airport',
            city: 'Kochi',
            state: 'Kerala',
            coordinates: { latitude: 10.1520, longitude: 76.4019 }
        },
    ];

    // Calculate distance between coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Find nearest airport
    const findNearestAirport = (userLat, userLon) => {
        let nearestAirport = null;
        let minDistance = Infinity;

        airports.forEach(airport => {
            const distance = calculateDistance(
                userLat, userLon,
                airport.coordinates.latitude, airport.coordinates.longitude
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestAirport = { ...airport, distance };
            }
        });

        return nearestAirport;
    };

    // Get user location and auto-select airport
    const detectLocationAndSetAirport = async () => {
        try {
            setIsDetectingLocation(true);
            setLocationStatus('Detecting your location...');
            
            // Request location permission
            let { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setLocationStatus('Location permission denied');
                Alert.alert(
                    'Location Access Required',
                    'This app needs location access to automatically select your nearest airport. Please enable location permissions in settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => {
                            // User can manually select airport if location fails
                            setLocationStatus('Please select airport manually');
                            setIsDetectingLocation(false);
                        }}
                    ]
                );
                return;
            }

            // Get current position
            setLocationStatus('Getting your precise location...');
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 20000
            });
            
            const { latitude, longitude } = location.coords;
            
            // Find nearest airport
            const nearestAirport = findNearestAirport(latitude, longitude);
            
            if (nearestAirport) {
                // Auto-fill the airport details
                setFormData(prev => ({
                    ...prev,
                    airportCode: nearestAirport.code,
                    airportName: nearestAirport.name
                }));
                
                setLocationStatus(`✓ Detected: ${nearestAirport.city} (${Math.round(nearestAirport.distance)}km from ${nearestAirport.code})`);
                
                // Show success message
                Alert.alert(
                    'Airport Auto-Selected',
                    `Based on your location, we've selected ${nearestAirport.name} (${nearestAirport.code}) as your airport.`,
                    [{ text: 'OK' }]
                );
            }
            
            setIsDetectingLocation(false);
            
        } catch (error) {
            console.error('Location error:', error);
            setLocationStatus('Location detection failed');
            setIsDetectingLocation(false);
            
            Alert.alert(
                'Location Error',
                'Unable to detect your location. Please ensure location services are enabled and try again.',
                [{ text: 'OK' }]
            );
        }
    };

    // Auto-detect location on component mount
    useEffect(() => {
        detectLocationAndSetAirport();
    }, []);

    // Rest of your existing functions remain the same
    const validate = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
        if (!formData.companyOrganization.trim()) newErrors.companyOrganization = 'Company/Organization is required';
        if (!formData.airportCode) newErrors.airportCode = 'Airport selection is required';
        if (!employeeIdImage) newErrors.employeeIdImage = 'Employee ID image is required';
        return newErrors;
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
                Alert.alert('Permission required', 'Please allow access to your photos to upload Employee ID');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setEmployeeIdImage(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleRegister = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            const selectedAirport = airports.find(a => a.code === formData.airportCode);
            
            // Build FormData for multipart request
            const formDataToSend = new FormData();
            
            // Append form fields
            formDataToSend.append('fullName', formData.fullName);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('mobileNumber', formData.mobileNumber);
            formDataToSend.append('companyOrganization', formData.companyOrganization);
            formDataToSend.append('airportCode', formData.airportCode);
            formDataToSend.append('airportName', selectedAirport.name);
            
            // Append employee ID image with proper MIME type
            if (employeeIdImage) {
                const filename = employeeIdImage.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                
                formDataToSend.append('employeeIdImage', {
                    uri: employeeIdImage.uri,
                    type: type,
                    name: filename || 'employee-id.jpg',
                });
            }
            
            await register(formDataToSend);

            Alert.alert(
                'Registration Successful',
                'Your account has been created. A temporary password has been sent to your email.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login'),
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                'Registration Failed',
                error.response?.data?.message || 'Something went wrong. Please try again.'
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
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header with Back Button */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialIcons name="arrow-back" size={24} color="#1a237e" />
                            <Text style={styles.backText}>Back to Login</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.title}>AAI Survey Portal</Text>
                    </View>

                    {/* Registration Form Card */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Create Account</Text>
                        <Text style={styles.formSubtitle}>Fill in your details to register</Text>

                        {/* Location Detection Section */}
                        <View style={styles.locationContainer}>
                            <View style={styles.locationHeader}>
                                <Text style={styles.locationLabel}>Airport Selection</Text>
                                {isDetectingLocation && (
                                    <ActivityIndicator size="small" color="#1a237e" />
                                )}
                            </View>
                            
                            <View style={styles.locationInfo}>
                                {isDetectingLocation ? (
                                    <>
                                        <MaterialIcons name="location-searching" size={20} color="#1a237e" />
                                        <Text style={styles.locationText}>{locationStatus}</Text>
                                    </>
                                ) : formData.airportCode ? (
                                    <>
                                        <MaterialIcons name="check-circle" size={20} color="#4caf50" />
                                        <View style={styles.selectedAirportInfo}>
                                            <Text style={styles.selectedAirportCode}>{formData.airportCode}</Text>
                                            <Text style={styles.selectedAirportName}>{formData.airportName}</Text>
                                            <Text style={styles.locationStatusText}>{locationStatus}</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.retryButton}
                                            onPress={detectLocationAndSetAirport}
                                        >
                                            <MaterialIcons name="refresh" size={18} color="#1a237e" />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <MaterialIcons name="error" size={20} color="#ff9800" />
                                        <Text style={styles.locationText}>{locationStatus}</Text>
                                        <TouchableOpacity 
                                            style={styles.retryButton}
                                            onPress={detectLocationAndSetAirport}
                                        >
                                            <Text style={styles.retryButtonText}>Retry</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>

                        <Input
                            label="Full Name"
                            value={formData.fullName}
                            onChangeText={(text) => setFormData({...formData, fullName: text})}
                            placeholder="Enter your full name"
                            autoCapitalize="words"
                            error={errors.fullName}
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="Email Address"
                            value={formData.email}
                            onChangeText={(text) => setFormData({...formData, email: text})}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="Mobile Number"
                            value={formData.mobileNumber}
                            onChangeText={(text) => setFormData({...formData, mobileNumber: text})}
                            placeholder="+91 XXXXXXXXXX"
                            keyboardType="phone-pad"
                            maxLength={10}
                            error={errors.mobileNumber}
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="Company / Organization"
                            value={formData.companyOrganization}
                            onChangeText={(text) => setFormData({...formData, companyOrganization: text})}
                            placeholder="Enter company name"
                            error={errors.companyOrganization}
                            containerStyle={styles.inputContainer}
                        />

                        {/* Airport Display (Read-only) */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Selected Airport</Text>
                            <View style={styles.airportDisplay}>
                                <View style={styles.airportCodeBadge}>
                                    <Text style={styles.airportCodeText}>
                                        {formData.airportCode || 'Not selected'}
                                    </Text>
                                </View>
                                <View style={styles.airportDetails}>
                                    <Text style={styles.airportNameText}>
                                        {formData.airportName || 'Airport will be auto-selected based on your location'}
                                    </Text>
                                    {formData.airportCode && (
                                        <Text style={styles.airportAutoText}>
                                            ✓ Automatically selected based on your location
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {errors.airportCode && (
                                <Text style={styles.errorText}>{errors.airportCode}</Text>
                            )}
                            {!formData.airportCode && !isDetectingLocation && (
                                <TouchableOpacity 
                                    style={styles.manualSelectButton}
                                    onPress={detectLocationAndSetAirport}
                                >
                                    <MaterialIcons name="my-location" size={18} color="#1a237e" />
                                    <Text style={styles.manualSelectText}>Detect Location Again</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Employee ID Upload */}
                        <View style={[styles.inputContainer, styles.uploadContainer]}>
                            <Text style={styles.label}>Employee ID</Text>
                            <TouchableOpacity 
                                style={[
                                    styles.uploadButton,
                                    employeeIdImage && styles.uploadButtonSuccess
                                ]}
                                onPress={pickImage}
                            >
                                <MaterialIcons 
                                    name={employeeIdImage ? "check-circle" : "cloud-upload"} 
                                    size={32} 
                                    color={employeeIdImage ? "#4caf50" : "#1a237e"} 
                                />
                                <Text style={styles.uploadButtonText}>
                                    {employeeIdImage ? 'ID Uploaded Successfully' : 'Upload Employee ID'}
                                </Text>
                                <Text style={styles.uploadSubtext}>
                                    (Image or PDF)
                                </Text>
                                {employeeIdImage && (
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {employeeIdImage.fileName || 'Selected file'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            {errors.employeeIdImage && (
                                <Text style={styles.errorText}>{errors.employeeIdImage}</Text>
                            )}
                        </View>

                        {/* Register Button */}
                        <Button
                            title="Register"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerButton}
                            disabled={!formData.airportCode}
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.copyright}>
                            © 2026 Airports Authority of India
                        </Text>
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
        paddingVertical: 20,
    },
    header: {
        marginBottom: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        color: '#1a237e',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a237e',
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
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 8,
        textAlign: 'center',
    },
    formSubtitle: {
        fontSize: 16,
        color: '#546e7a',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    uploadContainer: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#37474f',
        marginBottom: 8,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        marginTop: 4,
    },
    uploadButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButtonSuccess: {
        borderColor: '#4caf50',
        backgroundColor: '#e8f5e9',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a237e',
        marginTop: 12,
        marginBottom: 4,
        textAlign: 'center',
    },
    uploadSubtext: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
    },
    fileName: {
        fontSize: 12,
        color: '#4caf50',
        marginTop: 8,
        fontStyle: 'italic',
        textAlign: 'center',
        maxWidth: '100%',
    },
    registerButton: {
        backgroundColor: '#1a237e',
        borderRadius: 8,
        paddingVertical: 14,
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
    },
    
    // NEW STYLES FOR AUTO-LOCATION FEATURE
    locationContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f0f4ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d9ff',
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a237e',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        color: '#546e7a',
        marginLeft: 12,
        flex: 1,
    },
    selectedAirportInfo: {
        flex: 1,
        marginLeft: 12,
    },
    selectedAirportCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 4,
    },
    selectedAirportName: {
        fontSize: 14,
        color: '#37474f',
        marginBottom: 4,
    },
    locationStatusText: {
        fontSize: 12,
        color: '#4caf50',
        fontStyle: 'italic',
    },
    retryButton: {
        marginLeft: 12,
        padding: 8,
    },
    retryButtonText: {
        fontSize: 12,
        color: '#1a237e',
        fontWeight: '500',
    },
    
    // Airport Display Styles
    airportDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    airportCodeBadge: {
        backgroundColor: '#1a237e',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 16,
    },
    airportCodeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    airportDetails: {
        flex: 1,
    },
    airportNameText: {
        fontSize: 14,
        color: '#37474f',
        fontWeight: '500',
        marginBottom: 4,
    },
    airportAutoText: {
        fontSize: 12,
        color: '#4caf50',
        fontStyle: 'italic',
    },
    manualSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8eaf6',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    manualSelectText: {
        fontSize: 14,
        color: '#1a237e',
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default RegisterScreen;