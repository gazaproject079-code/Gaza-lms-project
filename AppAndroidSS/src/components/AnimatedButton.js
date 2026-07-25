import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedButton = ({ title, onPress, loading = false, variant = 'primary', style }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        style={[animatedStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.secondary, theme.colors.secondaryDark, theme.colors.secondaryLight]}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{title}</Text>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[
        animatedStyle,
        styles.secondaryButton,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
      activeOpacity={0.8}
    >
      <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{title}</Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(228, 118, 33, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minWidth: 140,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default AnimatedButton;
