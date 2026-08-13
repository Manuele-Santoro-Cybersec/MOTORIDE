import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@profile_data';

const defaultProfile = {
  name: 'Manuele',
  riderId: '8492',
  bike: 'Lexmoto LS-Z 125',
  cbt: 'Valid',
  theory: 'Passed',
  catA: 'In Progress',
  totalDist: 0,
  topSpeed: 0,
  totalRides: 0
};

export const getProfile = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return defaultProfile;
  } catch (e) {
    console.error('Error reading profile data', e);
    return defaultProfile;
  }
};

export const saveProfile = async (profileData) => {
  try {
    const jsonValue = JSON.stringify(profileData);
    await AsyncStorage.setItem(PROFILE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving profile data', e);
  }
};
