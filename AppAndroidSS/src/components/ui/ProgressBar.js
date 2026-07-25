import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const ProgressBar = ({
  progress,
  height = 8,
  showLabel = false,
  label,
  style,
  barStyle,
  labelStyle,
  color,
  variant = 'gradient', // gradient, solid, accent
}) => {
  const { theme, isDark } = useTheme();

  const progressValue = Math.min(Math.max(progress || 0, 0), 100);
  const isWeb = Platform.OS === 'web';

  // Gradient colors based on variant (Section 6 - Gradient System)
  const getGradientColors = () => {
    switch (variant) {
      case 'accent':
        return [theme.colors.secondary, theme.colors.accent];
      case 'success':
        return [theme.colors.success, theme.colors.successDark];
      case 'solid':
        return [color || theme.colors.primary, color || theme.colors.primary];
      case 'gradient':
      default:
        // Primary Gradient: From #4F46E5 To #22D3EE
        return [theme.colors.gradientStart, theme.colors.gradientEnd];
    }
  };

  const gradientColors = getGradientColors();

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.semiBold,
            },
            labelStyle
          ]}>
            {label || `${progressValue}%`}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: isDark
              ? theme.colors.backgroundTertiary
              : theme.colors.border,
            borderRadius: height / 2,
          },
        ]}
      >
        {isWeb ? (
          <View
            style={[
              styles.bar,
              {
                width: `${progressValue}%`,
                height,
                borderRadius: height / 2,
                background: `linear-gradient(90deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
                backgroundColor: gradientColors[0],
              },
              barStyle,
            ]}
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.bar,
              {
                width: `${progressValue}%`,
                height,
                borderRadius: height / 2,
              },
              barStyle,
            ]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12, // Body Text: 12pt
    fontWeight: '600',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    // Subtle shadow for progress indicator
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default ProgressBar;
