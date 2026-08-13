import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@profile_data';
const GARAGE_KEY = '@garage_log';
const DIARY_KEY = '@ride_diary';

const defaultProfile = {
  name: 'Manuele',
  riderId: '8492',
  bike: 'Lexmoto LS-Z 125',
  cbt: 'Valid',
  theory: 'Passed',
  catA: 'In Progress',
  totalDist: 0,
  topSpeed: 0,
  totalRides: 0,
  avatarUri: null,
  motExpiry: '',
  taxExpiry: '',
  insExpiry: '',
  currentOdometer: '0'
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

export const getGarageLog = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(GARAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (e) {
    console.error('Error reading garage log', e);
    return [];
  }
};

export const saveGarageLog = async (logArray) => {
  try {
    const jsonValue = JSON.stringify(logArray);
    await AsyncStorage.setItem(GARAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving garage log', e);
  }
};

export const getRideDiary = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(DIARY_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (e) {
    console.error('Error reading ride diary', e);
    return [];
  }
};

export const saveRideDiary = async (diaryArray) => {
  try {
    const jsonValue = JSON.stringify(diaryArray);
    await AsyncStorage.setItem(DIARY_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving ride diary', e);
  }
};
