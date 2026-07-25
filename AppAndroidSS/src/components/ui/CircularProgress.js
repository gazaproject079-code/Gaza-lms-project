import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const CircularProgress = ({
  progress = 0,
  size = 100,
  strokeWidth = 8,
  showPercentage = true,
  color,
}) => {
  const { theme } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = Math.min(Math.max(progress || 0, 0), 100);
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

  const progressColor = color || theme.colors.primary;
  const backgroundColor = theme.colors.border;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showPercentage && (
        <View style={styles.textContainer}>
          <Text style={[styles.percentageText, { color: theme.colors.textPrimary }]}>
            {Math.round(progressValue)}
          </Text>
          <Text style={[styles.percentSign, { color: theme.colors.textSecondary }]}>%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
  },
  percentSign: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default CircularProgress;
