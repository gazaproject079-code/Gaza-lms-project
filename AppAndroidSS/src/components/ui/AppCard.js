import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const AppCard = ({
  children,
  style,
  onPress,
  elevated = false,
  glass = false,
  glow = false,
  padding = 16,  // Default padding: 16-20px as per Section 7.2
  noBorder = false,
  size = 'medium', // small, medium, large as per Section 7.1
  allowOverflow = false, // Set to true to allow content to overflow (for dropdowns)
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  // Card size configurations (Section 7.1)
  const sizeConfig = {
    small: { minWidth: 240, minHeight: 140 },
    medium: { minWidth: 320, minHeight: 200 },
    large: { minWidth: 420, minHeight: 260 },
  };

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: glass
        ? theme.colors.cardGlass
        : elevated
          ? theme.colors.cardElevated
          : theme.colors.card,
      padding,
      borderRadius: theme.borderRadius['2xl'], // 16px as per guide
      borderWidth: noBorder ? 0 : 1,
      borderColor: theme.colors.cardBorder,
    };

    // Fix glassmorphism to work in BOTH dark and light modes
    if (glass) {
      baseStyle.backgroundColor = isDark
        ? 'rgba(11,31,51,0.80)'
        : 'rgba(255,253,252,0.84)';
      baseStyle.borderColor = isDark
        ? 'rgba(45,212,191,0.14)'
        : 'rgba(15,118,110,0.10)';
      baseStyle.borderWidth = 1;
      if (isWeb) {
        baseStyle.backdropFilter = 'blur(16px)';
        baseStyle.WebkitBackdropFilter = 'blur(16px)';
      }
    }

    // Web transition and cursor
    if (isWeb) {
      baseStyle.transition = 'all 0.2s ease';
      if (onPress) {
        baseStyle.cursor = 'pointer';
      }
    }

    return baseStyle;
  };

  const getShadowStyle = () => {
    if (glow && isDark) {
      return theme.shadows.glow;
    }
    if (glow) {
      return {
        shadowColor: theme.colors.shadowPrimary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 8,
      };
    }
    if (elevated) {
      return theme.shadows.lg;
    }
    return theme.shadows.md;
  };

  // Web hover effects (Section 7.3)
  const getWebHoverStyles = () => {
    if (!isWeb) return {};
    return {
      cursor: onPress ? 'pointer' : 'default',
      transition: 'all 0.2s ease', // Transition: 200ms ease
    };
  };

  const cardStyles = [
    styles.card,
    getCardStyle(),
    getShadowStyle(),
    getWebHoverStyles(),
    allowOverflow && { overflow: 'visible' },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

export default AppCard;
