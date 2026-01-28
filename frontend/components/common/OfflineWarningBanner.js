import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import InternetMonitor from '../../services/internetMonitor';

const OfflineWarningBanner = ({ navigation }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [offlineMinutes, setOfflineMinutes] = useState(0);
    const [countdown, setCountdown] = useState(null);
    const slideAnim = useState(new Animated.Value(-100))[0];

    useEffect(() => {
        // Set navigation for logout
        InternetMonitor.setNavigation(navigation);
        
        // Start monitoring
        InternetMonitor.startMonitoring();

        // Check every 10 seconds for updates
        const interval = setInterval(() => {
            checkOfflineStatus();
        }, 10000);

        // Initial check
        checkOfflineStatus();

        return () => {
            clearInterval(interval);
        };
    }, [navigation]);

    const checkOfflineStatus = async () => {
        try {
            const minutes = await InternetMonitor.getCurrentOfflineDuration();
            setOfflineMinutes(minutes);
            
            // Check for countdown
            const secondsLeft = await InternetMonitor.getLogoutCountdown();
            if (secondsLeft !== null) {
                setCountdown(secondsLeft);
                showBanner();
                
                // Format countdown
                const mins = Math.floor(secondsLeft / 60);
                const secs = secondsLeft % 60;
                
                // Auto-logout when countdown reaches 0
                if (secondsLeft <= 0) {
                    // Logout will be handled by InternetMonitor
                    hideBanner();
                }
            } else {
                setCountdown(null);
                if (minutes >= 15) {
                    showBanner();
                } else {
                    hideBanner();
                }
            }
        } catch (error) {
            console.error('Error checking offline status:', error);
        }
    };

    const showBanner = () => {
        if (!isVisible) {
            setIsVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const hideBanner = () => {
        if (isVisible) {
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsVisible(false));
        }
    };

    const handlePress = () => {
        if (countdown) {
            const minutes = Math.floor(countdown / 60);
            const seconds = countdown % 60;
            
            Alert.alert(
                '⚠️ Auto-Logout Countdown',
                `You will be logged out in ${minutes}:${seconds.toString().padStart(2, '0')}\n\nPlease move to an area with internet connection immediately.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {}
                    }
                ]
            );
        } else {
            Alert.alert(
                'Offline Mode',
                `You've been offline for ${offlineMinutes} minutes.\n\nFind internet within 2 minutes or you will be logged out.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {}
                    }
                ]
            );
        }
    };

    const getCountdownText = () => {
        if (!countdown) return `${offlineMinutes}m offline`;
        
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;
        return `Logout in ${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    return (
        <Animated.View 
            style={[
                styles.container,
                { 
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: countdown ? '#D32F2F' : '#FF9800'
                }
            ]}
        >
            <TouchableOpacity 
                style={styles.content}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <MaterialIcons 
                    name={countdown ? "timer" : "wifi-off"} 
                    size={24} 
                    color="#FFF" 
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {countdown ? '⚠️ AUTO-LOGOUT WARNING' : 'Limited Functionality'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {getCountdownText()}
                    </Text>
                </View>
                <MaterialIcons name="warning" size={20} color="#FFF" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#FFF',
        fontSize: 13,
        opacity: 0.9,
        marginTop: 2,
    },
});

export default OfflineWarningBanner;