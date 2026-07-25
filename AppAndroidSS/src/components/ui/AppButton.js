import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  glow = false,
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  // Size configurations (Section 8.1)
  // Small: Height 32px, Medium: Height 40px, Large: Height 48px
  const sizeConfig = {
    sm: { height: 32, paddingHorizontal: 12, fontSize: 12, iconSize: 16 },
    md: { height: 40, paddingHorizontal: 16, fontSize: 14, iconSize: 18 },
    lg: { height: 48, paddingHorizontal: 24, fontSize: 16, iconSize: 20 },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const getButtonStyles = () => {
    const baseStyle = [
      styles.button,
      {
        height: currentSize.height,
        paddingHorizontal: currentSize.paddingHorizontal,
        borderRadius: theme.borderRadius.lg, // 12px for buttons
        borderWidth: 1,
        borderColor: 'transparent',
      },
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
    ];

    if (variant === 'outline') {
      return [
        ...baseStyle,
        {
          backgroundColor: isDark ? 'rgba(45,212,191,0.08)' : 'rgba(15,118,110,0.06)',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        },
      ];
    }

    if (variant === 'ghost') {
      return [
        ...baseStyle,
        {
          backgroundColor: isDark ? 'rgba(247,244,236,0.04)' : 'rgba(15,118,110,0.08)',
          borderColor: isDark ? 'rgba(247,244,236,0.08)' : 'rgba(15,118,110,0.12)',
        },
      ];
    }

    if (variant === 'secondary') {
      return [
        ...baseStyle,
        {
          backgroundColor: isDark ? theme.colors.backgroundTertiary : theme.colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ];
    }

    if (variant === 'glass') {
      return [
        ...baseStyle,
        {
          backgroundColor: isDark ? 'rgba(247,244,236,0.08)' : 'rgba(255,253,252,0.74)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(45,212,191,0.16)' : 'rgba(15,118,110,0.10)',
          ...(isWeb ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
        },
      ];
    }

    return baseStyle;
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return theme.colors.primary;
    }
    if (variant === 'secondary') {
      return theme.colors.textPrimary;
    }
    if (variant === 'danger') {
      return '#FFFFFF';
    }
    if (variant === 'glass') {
      return isDark ? theme.colors.textPrimary : theme.colors.textPrimary;
    }
    return theme.colors.textInverse;
  };

  const getGradientColors = () => {
    if (variant === 'primary') {
      return [theme.colors.buttonGradientStart, theme.colors.buttonGradientEnd];
    }
    if (variant === 'danger') {
      return [theme.colors.error, theme.colors.errorDark];
    }
    if (variant === 'success') {
      return [theme.colors.success, theme.colors.successDark];
    }
    return [theme.colors.buttonGradientStart, theme.colors.buttonGradientEnd];
  };

  const getGlowStyle = () => {
    if (!glow || disabled) return {};

    const gradientColors = getGradientColors();

    if (isWeb) {
      return {
        boxShadow: `0 10px 24px ${gradientColors[0]}33`,
      };
    }

    if (isDark) {
      return theme.shadows.glow;
    }
    return {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 6,
    };
  };

  // Hover effects for web (Section 8.3)
  const getWebHoverStyles = () => {
    if (!isWeb) return {};
    return {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      outline: 'none',
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' || variant === 'secondary'
            ? theme.colors.primary
            : theme.colors.textInverse}
          size="small"
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        <Text style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: currentSize.fontSize,
            fontFamily: theme.typography.fontFamily.semiBold,
          },
          textStyle
        ]}>
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </View>
    );
  };

  // For gradient buttons (primary, danger, success)
  if (variant === 'primary' || variant === 'danger' || variant === 'success') {
    const gradientColors = getGradientColors();

    // Web gradient style (Section 6.1 - Linear 135 deg)
    const webGradientStyle = {
      background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
      backgroundColor: gradientColors[0],
      ...(isWeb && glow && !disabled ? { boxShadow: `0 10px 24px ${gradientColors[0]}33` } : {}),
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[getButtonStyles(), !isWeb ? getGlowStyle() : {}, getWebHoverStyles(), style]}
      >
        {isWeb ? (
          <View style={[styles.gradient, webGradientStyle, { borderRadius: theme.borderRadius.lg }]}>
            {renderContent()}
          </View>
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { borderRadius: theme.borderRadius.lg }]}
          >
            {renderContent()}
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  }

  // For non-gradient buttons (outline, ghost, secondary, glass)
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[getButtonStyles(), getGlowStyle(), getWebHoverStyles(), style]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
});

export default AppButton;
