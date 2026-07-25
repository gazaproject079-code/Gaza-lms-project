# ThemeContext.js — Full Source Code

**Path:** `AppAndroidSS/src/context/ThemeContext.js`

---

```js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// SkillSphere Modern Learning Platform Theme
// Based on Comprehensive UI Design Guide
// Clean, Modern, Accessible, Professional

// Typography configuration - System fonts for best readability
// iOS: San Francisco, Android: Roboto, Web: system-ui
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
    caption: 13,      // Caption: 13px (+3)
    xs: 15,           // Extra Small: 15px (+3)
    sm: 17,           // Small: 17px (+3)
    base: 15,         // Base: 15px (+3)
    lg: 21,           // Large: 21px (+3)
    xl: 23,           // Extra Large: 23px (+3)
    '2xl': 27,        // 2XL: 27px (+3)
    '3xl': 33,        // 3XL: 33px (+3)
    '4xl': 39,        // 4XL: 39px (+3)
    '5xl': 51,        // 5XL: 51px (+3)
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,      // Line Height: 1.5x as per guide
    relaxed: 1.75,
  },
};

// Spacing System - 4px based as per guide
const spacing = {
  micro: 4,   // 4px - Micro spacing (icon gaps)
  xs: 8,      // 8px - Small spacing (labels, inline elements)
  sm: 12,     // 12px - Compact padding
  md: 16,     // 16px - Default padding (cards, sections)
  lg: 24,     // 24px - Section spacing
  xl: 32,     // 32px - Page-level spacing
  '2xl': 48,  // 48px - Major section breaks
  '3xl': 64,
};

// Border Radius as per guide
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,      // Forms & Inputs: 12px
  xl: 14,      // Toast notifications: 14px
  '2xl': 16,   // Cards: 16px as per guide
  '3xl': 20,
  full: 9999,
};

// Light Theme - Clean & Premium as per guide
const lightTheme = {
  mode: 'light',
  colors: {
    // Primary Palette (Section 5.1)
    primary: '#4F46E5',        // Primary: #4F46E5
    primaryDark: '#4338CA',
    primaryLight: '#6366F1',   // Secondary: #6366F1
    primaryMuted: '#818CF8',

    // Secondary Colors
    secondary: '#6366F1',      // Secondary: #6366F1
    secondaryDark: '#4F46E5',
    secondaryLight: '#818CF8',
    secondaryMuted: '#A5B4FC',

    // Accent Colors
    accent: '#22D3EE',         // Accent: #22D3EE
    accentHover: '#06B6D4',

    // Gradient Colors (Section 6.1 - Primary Gradient)
    gradientStart: '#4F46E5',  // From: #4F46E5
    gradientMid: '#6366F1',
    gradientEnd: '#22D3EE',    // To: #22D3EE

    // Hero/Navbar Gradient
    heroGradientStart: '#4F46E5',
    heroGradientMid: '#6366F1',
    heroGradientEnd: '#22D3EE',

    // Button Gradients (Section 6.1)
    buttonGradientStart: '#4F46E5',
    buttonGradientEnd: '#22D3EE',

    // Background Colors (Section 5.2 - Light Theme)
    background: '#F9FAFB',        // Background: #F9FAFB
    backgroundSecondary: '#F3F4F6',
    backgroundTertiary: '#E5E7EB',
    surface: '#FFFFFF',           // Surface/Card: #FFFFFF

    // Card Colors
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBackground: '#FFFFFF',
    cardGlass: 'rgba(255, 255, 255, 0.65)',  // Glass Effect (Section 27.2)
    cardBorder: '#E5E7EB',        // Border: #E5E7EB
    cardBorderHover: '#4F46E5',

    // Text Colors (Section 5.2)
    text: '#111827',              // Text Primary: #111827
    textPrimary: '#111827',
    textSecondary: '#6B7280',     // Text Secondary: #6B7280
    textTertiary: '#9CA3AF',
    textMuted: '#D1D5DB',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    // Border Colors
    border: '#E5E7EB',            // Border: #E5E7EB
    borderLight: '#F3F4F6',
    borderFocus: '#4F46E5',
    divider: '#E5E7EB',

    // Interactive States
    link: '#4F46E5',
    linkHover: '#4338CA',
    placeholder: '#9CA3AF',
    disabled: '#D1D5DB',
    disabledText: '#9CA3AF',

    // Status Colors (consistent with guide)
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#059669',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoDark: '#2563EB',

    // Shadow Colors (Section 7.2)
    shadow: 'rgba(0,0,0,0.08)',   // Light: 0 8px 24px rgba(0,0,0,0.08)
    shadowMedium: 'rgba(0,0,0,0.12)',
    shadowStrong: 'rgba(0,0,0,0.18)',
    shadowPrimary: 'rgba(79, 70, 229, 0.25)',

    // Overlay
    overlay: 'rgba(17, 24, 39, 0.5)',
    overlayLight: 'rgba(17, 24, 39, 0.3)',

    // Tab Bar
    tabBarBackground: '#FFFFFF',
    tabBarActiveTint: '#4F46E5',
    tabBarInactiveTint: '#9CA3AF',
    tabBarBorder: '#E5E7EB',

    // Glow Effects
    primaryGlow: 'rgba(79, 70, 229, 0.15)',
    secondaryGlow: 'rgba(99, 102, 241, 0.15)',
    successGlow: 'rgba(16, 185, 129, 0.15)',
    errorGlow: 'rgba(239, 68, 68, 0.15)',

    // Input Colors
    inputBackground: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputBorderFocus: '#4F46E5',
    inputText: '#111827',
    inputPlaceholder: '#9CA3AF',

    // Navbar specific
    navbarBackground: 'linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)',
    navbarText: '#FFFFFF',
    navbarTextHover: 'rgba(255, 255, 255, 0.8)',

    // Sidebar Gradient (Section 4.4)
    sidebarGradientTop: '#F8FAFF',
    sidebarGradientBottom: '#E6ECFF',
  },

  // Glassmorphism config (Section 27.2 - Light Mode)
  glass: {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropBlur: 12,  // 12-16px
    border: 'rgba(255, 255, 255, 0.3)',
    borderHover: 'rgba(79, 70, 229, 0.3)',
  },

  // Shadows (Section 7.2)
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
      shadowOpacity: 0.08,   // Light: rgba(0,0,0,0.08)
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
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  borderRadius,
  spacing,
  typography,

  // Animation durations (Section 11)
  animation: {
    fast: 150,     // 150-250ms
    normal: 250,
    slow: 300,     // Smooth animated transition: 300ms
  },

  // Layout (Section 2 & 3)
  layout: {
    headerHeight: 64,        // Web: 64px
    headerHeightMobile: 56,  // Mobile App: 56px
    sidebarWidth: 260,       // Width: 260px
    sidebarTriggerZone: 12,  // Collapsed trigger zone: 12px
    maxContentWidth: 1440,   // Max width: 1440px
    gutter: 24,              // Gutter: 24px
    margin: 32,              // Margin: 32px
  },
};

// Dark Theme (Section 5.3)
const darkTheme = {
  mode: 'dark',
  colors: {
    // Primary Colors
    primary: '#818CF8',        // Lighter for dark mode visibility
    primaryDark: '#4F46E5',
    primaryLight: '#A5B4FC',
    primaryMuted: '#6366F1',

    // Secondary Colors
    secondary: '#38BDF8',
    secondaryDark: '#0EA5E9',
    secondaryLight: '#7DD3FC',
    secondaryMuted: '#0284C7',

    // Accent Colors
    accent: '#22D3EE',
    accentHover: '#67E8F9',

    // Gradient Colors
    gradientStart: '#4F46E5',
    gradientMid: '#6366F1',
    gradientEnd: '#22D3EE',

    // Hero/Navbar Gradient
    heroGradientStart: '#4F46E5',
    heroGradientMid: '#6366F1',
    heroGradientEnd: '#22D3EE',

    // Button Gradients
    buttonGradientStart: '#6366F1',
    buttonGradientEnd: '#22D3EE',

    // Background Colors (Section 5.3)
    background: '#020617',          // Background: #020617
    backgroundSecondary: '#0F172A', // Surface/Card: #0F172A
    backgroundTertiary: '#1E293B',  // Border: #1E293B
    surface: '#0F172A',

    // Card Colors
    card: '#0F172A',
    cardElevated: '#1E293B',
    cardBackground: '#0F172A',
    cardGlass: 'rgba(15, 23, 42, 0.65)',  // Glass Effect (Section 27.2)
    cardBorder: '#1E293B',
    cardBorderHover: '#818CF8',

    // Text Colors (Section 5.3)
    text: '#F8FAFC',                // Text Primary: #F8FAFC
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',       // Text Secondary: #94A3B8
    textTertiary: '#64748B',
    textMuted: '#475569',
    textInverse: '#020617',
    textOnPrimary: '#FFFFFF',

    // Border Colors
    border: '#1E293B',              // Border: #1E293B
    borderLight: '#0F172A',
    borderFocus: '#818CF8',
    divider: '#1E293B',

    // Interactive States
    link: '#818CF8',
    linkHover: '#A5B4FC',
    placeholder: '#64748B',
    disabled: '#374151',
    disabledText: '#6B7280',

    // Status Colors
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.15)',
    successDark: '#10B981',
    error: '#F87171',
    errorLight: 'rgba(248, 113, 113, 0.15)',
    errorDark: '#EF4444',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    warningDark: '#F59E0B',
    info: '#60A5FA',
    infoLight: 'rgba(96, 165, 250, 0.15)',
    infoDark: '#3B82F6',

    // Shadow Colors (Section 7.2)
    shadow: 'rgba(0,0,0,0.4)',      // Dark: rgba(0,0,0,0.4)
    shadowMedium: 'rgba(0,0,0,0.5)',
    shadowStrong: 'rgba(0,0,0,0.6)',
    shadowPrimary: 'rgba(129, 140, 248, 0.4)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',

    // Tab Bar
    tabBarBackground: '#0F172A',
    tabBarActiveTint: '#818CF8',
    tabBarInactiveTint: '#64748B',
    tabBarBorder: '#1E293B',

    // Glow Effects
    primaryGlow: 'rgba(129, 140, 248, 0.4)',
    secondaryGlow: 'rgba(56, 189, 248, 0.4)',
    successGlow: 'rgba(52, 211, 153, 0.4)',
    errorGlow: 'rgba(248, 113, 113, 0.4)',

    // Input Colors
    inputBackground: '#0F172A',
    inputBorder: '#1E293B',
    inputBorderFocus: '#818CF8',
    inputText: '#F8FAFC',
    inputPlaceholder: '#64748B',

    // Navbar specific
    navbarBackground: 'linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)',
    navbarText: '#FFFFFF',
    navbarTextHover: 'rgba(255, 255, 255, 0.8)',

    // Sidebar Gradient (Section 4.4)
    sidebarGradientTop: '#0F172A',
    sidebarGradientBottom: '#020617',
  },

  // Glassmorphism config (Section 27.2 - Dark Mode)
  glass: {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropBlur: 16,  // 12-20px
    border: 'rgba(255, 255, 255, 0.25)',
    borderHover: 'rgba(129, 140, 248, 0.5)',
  },

  // Shadows with dark mode adjustments
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
      shadowOpacity: 0.4,   // Dark: rgba(0,0,0,0.4)
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
      shadowColor: '#818CF8',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
    glowBlue: {
      shadowColor: '#22D3EE',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
  },

  borderRadius,
  spacing,
  typography,

  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 300,
  },

  // Layout
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

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    try {
      await AsyncStorage.setItem('themeMode', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme:', error);
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

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
```
