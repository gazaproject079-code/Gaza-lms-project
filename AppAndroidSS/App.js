import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { toastConfig } from './src/config/toastConfig';

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AuthProvider>
        <DataProvider>
          <NavigationContainer
            theme={{
              dark: theme.mode === 'dark',
              colors: {
                primary: theme.colors.primary,
                background: theme.colors.background,
                card: theme.colors.card,
                text: theme.colors.text,
                border: theme.colors.border,
                notification: theme.colors.primary,
              },
            }}
          >
            <AppNavigator />
          </NavigationContainer>
        </DataProvider>
      </AuthProvider>
      <Toast config={toastConfig(theme)} />
    </GestureHandlerRootView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      width: '100%',
      height: '100%',
      minHeight: '100vh',
    }),
  },
});
