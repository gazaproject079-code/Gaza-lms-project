import React from 'react';
import { Platform, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Section 6.1 - Primary Gradient: Linear 135deg

const GradientBackground = ({ children, style, colors, ...props }) => {
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';

  // Default to primary gradient colors from theme
  const gradientColors = colors || [theme.colors.gradientStart, theme.colors.gradientEnd];

  if (isWeb) {
    // Web: Use CSS gradient
    return (
      <View
        style={[
          style,
          {
            background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
            backgroundColor: gradientColors[0],
          }
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  // Native: Use LinearGradient
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}   // Top-left
      end={{ x: 1, y: 1 }}     // Bottom-right (135 degrees)
      style={style}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

export default GradientBackground;
