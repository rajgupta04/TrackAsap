import { Platform } from 'react-native';

/**
 * CENTRALIZED BACKEND BASE URL CONFIGURATION
 * 
 * When developing React Native (Expo) apps:
 * - 'localhost' or '127.0.0.1' points to the physical phone or emulator itself, NOT your PC!
 * - For Android Emulator: Use 'http://10.0.2.2:5000/api'
 * - For iOS Simulator: Use 'http://localhost:5000/api'
 * - For Physical Device via Expo Go: Replace '192.168.1.XX' with your computer's local Wi-Fi IP address.
 */

// Toggle this between 'emulator', 'lan', or 'production'
const ENV = 'production';

const LOCAL_LAN_IP = '192.168.1.100'; // Replace with your PC's IPv4 address on Wi-Fi/LAN
const PORT = '5000';

const getBaseUrl = () => {
  if (ENV === 'production') {
    return 'https://trackasap.onrender.com/api';
  }
  
  if (ENV === 'lan') {
    return `http://${LOCAL_LAN_IP}:${PORT}/api`;
  }

  // Emulator setup
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}/api`;
  }
  return `http://localhost:${PORT}/api`;
};

export const API_BASE_URL = getBaseUrl();

export const STORAGE_KEYS = {
  TOKEN: '@TrackAsap_auth_token',
  USER: '@TrackAsap_user_data',
  THEME: '@TrackAsap_theme_mode',
};

export default {
  API_BASE_URL,
  STORAGE_KEYS,
};
