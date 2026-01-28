// utils/surveyCooldown.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const COOLDOWN_KEY = '@survey_last_submission';
const COOLDOWN_MINUTES = 5;

export const checkSurveyCooldown = async () => {
  try {
    const lastSubmissionTime = await AsyncStorage.getItem(COOLDOWN_KEY);
    
    if (!lastSubmissionTime) {
      return { canSubmit: true, remainingTime: 0 };
    }

    const lastTime = new Date(lastSubmissionTime).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - lastTime;
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;

    if (timeDifference >= cooldownMs) {
      return { canSubmit: true, remainingTime: 0 };
    } else {
      const remainingMs = cooldownMs - timeDifference;
      return { 
        canSubmit: false, 
        remainingTime: remainingMs,
        minutes: Math.floor(remainingMs / 60000),
        seconds: Math.floor((remainingMs % 60000) / 1000)
      };
    }
  } catch (error) {
    console.error('Error checking cooldown:', error);
    return { canSubmit: true, remainingTime: 0 };
  }
};

export const startSurveyCooldown = async () => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(COOLDOWN_KEY, now);
  } catch (error) {
    console.error('Error setting cooldown:', error);
  }
};

export const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};