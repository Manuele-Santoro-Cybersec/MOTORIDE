import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textMuted: '#a0a0a0',
  primary: '#ff6600',
  secondary: '#00d4ff',
  danger: '#ff4444',
  success: '#00C851',
  border: '#333333'
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  }
});
