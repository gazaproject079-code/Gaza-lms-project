import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Animated, View, StyleSheet, Platform } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  sizes: {
    caption: 13,
    xs: 15,
    sm: 17,
    base: 15,
    lg: 21,
    xl: 23,
    '2xl': 27,
    '3xl': 33,
    '4xl': 39,
    '5xl': 51,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const spacing = {
  micro: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  full: 9999,
};

const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#007A3D',
    primaryDark: '#005C2E',
    primaryLight: '#00A550',
    primaryMuted: '#C8E6C9',

    secondary: '#CE1126',
    secondaryDark: '#9A1220',
    secondaryLight: '#E53545',
    secondaryMuted: '#FDDDE0',

    accent: '#CE1126',
    accentHover: '#9A1220',

    gradientStart: '#007A3D',
    gradientMid: '#005C2E',
    gradientEnd: '#F5A623',

    heroGradientStart: '#0F1923',
    heroGradientMid: '#162032',
    heroGradientEnd: '#007A3D',

    buttonGradientStart: '#007A3D',
    buttonGradientEnd: '#00A550',

    background: '#F8F9FA',
    backgroundSecondary: '#F0F4F1',
    backgroundTertiary: '#E8EEE9',
    surface: '#FFFFFF',

    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBackground: '#FFFFFF',
    cardGlass: 'rgba(255, 255, 255, 0.78)',
    cardBorder: '#D1D5DB',
    cardBorderHover: '#007A3D',

    text: '#111827',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    border: '#D1D5DB',
    borderLight: '#E5E7EB',
    borderFocus: '#007A3D',
    divider: '#E5E7EB',

    link: '#007A3D',
    linkHover: '#005C2E',
    placeholder: '#9CA3AF',
    disabled: '#D1D5DB',
    disabledText: '#9CA3AF',

    success: '#2F855A',
    successLight: '#D9F2E3',
    successDark: '#276749',
    error: '#CE1126',
    errorLight: '#FDDDE0',
    errorDark: '#9A1220',
    warning: '#CA8A04',
    warningLight: '#FEF3C7',
    warningDark: '#A16207',
    info: '#0E7490',
    infoLight: '#D7EEF5',
    infoDark: '#155E75',

    shadow: 'rgba(15, 25, 35, 0.10)',
    shadowMedium: 'rgba(15, 25, 35, 0.15)',
    shadowStrong: 'rgba(15, 25, 35, 0.22)',
    shadowPrimary: 'rgba(0, 122, 61, 0.24)',

    overlay: 'rgba(15, 25, 35, 0.52)',
    overlayLight: 'rgba(15, 25, 35, 0.28)',

    primaryGlow: 'rgba(0, 122, 61, 0.18)',
    secondaryGlow: 'rgba(206, 17, 38, 0.18)',
    successGlow: 'rgba(47, 133, 90, 0.16)',
    errorGlow: 'rgba(206, 17, 38, 0.16)',

    inputBackground: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputBorderFocus: '#007A3D',
    inputText: '#111827',
    inputPlaceholder: '#9CA3AF',

    navbarBackground: 'linear-gradient(135deg, #0F1923 0%, #007A3D 100%)',
    navbarText: '#FFFFFF',
    navbarTextHover: 'rgba(255, 255, 255, 0.84)',

    sidebarGradientTop: '#0F1923',
    sidebarGradientBottom: '#007A3D',

    tabBarBackground: '#FFFFFF',
    tabBarActiveTint: '#007A3D',
    tabBarInactiveTint: '#9CA3AF',
    tabBarBorder: '#E5E7EB',
  },

  glass: {
    background: 'rgba(255, 253, 252, 0.78)',
    backdropBlur: 12,
    border: 'rgba(215, 204, 184, 0.55)',
    borderHover: 'rgba(15, 118, 110, 0.24)',
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
      elevation: 8,
    },
    glow: {
      shadowColor: '#0F766E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  borderRadius,
  spacing,
  typography,

  animation: {
    fast: 150,
    normal: 250,
    slow: 300,
  },

  layout: {
    headerHeight: 64,
    headerHeightMobile: 56,
    sidebarWidth: 260,
    sidebarTriggerZone: 12,
    maxContentWidth: 1440,
    gutter: 24,
    margin: 32,
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#00C853',
    primaryDark: '#00A550',
    primaryLight: '#69F0AE',
    primaryMuted: '#007A3D',

    secondary: '#FF3347',
    secondaryDark: '#CE1126',
    secondaryLight: '#FF6B7A',
    secondaryMuted: '#4A0A12',

    accent: '#CE1126',
    accentHover: '#9A1220',

    gradientStart: '#162032',
    gradientMid: '#007A3D',
    gradientEnd: '#F5A623',

    heroGradientStart: '#071015',
    heroGradientMid: '#0F1923',
    heroGradientEnd: '#162032',

    buttonGradientStart: '#007A3D',
    buttonGradientEnd: '#00C853',

    background: '#071015',
    backgroundSecondary: '#0F1923',
    backgroundTertiary: '#162032',
    surface: '#0F1923',

    card: '#0F1923',
    cardElevated: '#162032',
    cardBackground: '#0F1923',
    cardGlass: 'rgba(15, 25, 35, 0.84)',
    cardBorder: 'rgba(0, 122, 61, 0.22)',
    cardBorderHover: '#00C853',

    text: '#F9FAFB',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#071015',
    textOnPrimary: '#FFFFFF',

    border: 'rgba(0, 122, 61, 0.24)',
    borderLight: 'rgba(255,255,255,0.06)',
    borderFocus: '#00C853',
    divider: 'rgba(0, 122, 61, 0.18)',

    link: '#69F0AE',
    linkHover: '#B9F6CA',
    placeholder: '#6B7280',
    disabled: '#374151',
    disabledText: '#6B7280',

    success: '#69F0AE',
    successLight: 'rgba(105, 240, 174, 0.16)',
    successDark: '#00C853',
    error: '#FF3347',
    errorLight: 'rgba(255, 51, 71, 0.16)',
    errorDark: '#CE1126',
    warning: '#FACC15',
    warningLight: 'rgba(250, 204, 21, 0.16)',
    warningDark: '#EAB308',
    info: '#67E8F9',
    infoLight: 'rgba(103, 232, 249, 0.16)',
    infoDark: '#22D3EE',

    shadow: 'rgba(0,0,0,0.5)',
    shadowMedium: 'rgba(0,0,0,0.6)',
    shadowStrong: 'rgba(0,0,0,0.7)',
    shadowPrimary: 'rgba(0, 200, 83, 0.32)',

    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',

    tabBarBackground: '#0F1923',
    tabBarActiveTint: '#00C853',
    tabBarInactiveTint: 'rgba(249,250,251,0.45)',
    tabBarBorder: 'rgba(0, 122, 61, 0.18)',

    primaryGlow: 'rgba(0, 200, 83, 0.28)',
    secondaryGlow: 'rgba(255, 51, 71, 0.24)',
    successGlow: 'rgba(105, 240, 174, 0.24)',
    errorGlow: 'rgba(255, 51, 71, 0.24)',

    inputBackground: '#162032',
    inputBorder: 'rgba(0, 122, 61, 0.24)',
    inputBorderFocus: '#00C853',
    inputText: '#F9FAFB',
    inputPlaceholder: '#6B7280',

    navbarBackground: 'linear-gradient(135deg, #071015 0%, #162032 100%)',
    navbarText: '#F9FAFB',
    navbarTextHover: 'rgba(249, 250, 251, 0.82)',

    sidebarGradientTop: '#071015',
    sidebarGradientBottom: '#162032',
  },

  glass: {
    background: 'rgba(11, 31, 51, 0.84)',
    backdropBlur: 16,
    border: 'rgba(167, 139, 95, 0.18)',
    borderHover: 'rgba(45, 212, 191, 0.34)',
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 30,
      elevation: 8,
    },
    glow: {
      shadowColor: '#2DD4BF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
    glowPurple: {
      shadowColor: '#A3BE5C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
  },

  borderRadius,
  spacing,
  typography,

  animation: {
    fast: 150,
    normal: 250,
    slow: 300,
  },

  layout: {
    headerHeight: 64,
    headerHeightMobile: 56,
    sidebarWidth: 260,
    sidebarTriggerZone: 12,
    maxContentWidth: 1440,
    gutter: 24,
    margin: 32,
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState('#F7F4EC');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      } else {
        setThemeMode(systemColorScheme || 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setThemeMode('light');
    } finally {
      setIsLoading(false);
    }
  };

  const animateThemeSwitch = (newMode) => {
    const bgColor = newMode === 'dark' ? '#071521' : '#F7F4EC';
    setOverlayColor(bgColor);
    setIsTransitioning(true);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setThemeMode(newMode);
      AsyncStorage.setItem('themeMode', newMode).catch(() => {});

      Animated.timing(transitionAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    animateThemeSwitch(newTheme);
  };

  const setTheme = (mode) => {
    if (mode !== themeMode) {
      animateThemeSwitch(mode);
    }
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const value = {
    theme,
    themeMode,
    toggleTheme,
    setTheme,
    isLoading,
    isDark: themeMode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      <View style={themeProviderStyles.root}>
        {children}
        {isTransitioning && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: overlayColor, opacity: transitionAnim },
              Platform.OS === 'web' && { pointerEvents: 'none' }
            ]}
          />
        )}
      </View>
    </ThemeContext.Provider>
  );
};

const themeProviderStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
