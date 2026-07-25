import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

// Section 14 - Stats & Metrics
// Stats Cards: Icon + Value + Label, Consistent padding (20px)

const StatsCard = ({
  icon,
  iconColor,
  value,
  label,
  change,       // { value: '+12%', type: 'increase' | 'decrease' }
  style,
  variant = 'default', // default, gradient, outlined
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const getBackgroundStyle = () => {
    if (variant === 'outlined') {
      return {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,46,0.02)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.10)',
      };
    }
    if (variant === 'gradient') {
      return {
        backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)',
      };
    }
    // default
    return {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.90)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,26,46,0.08)',
      ...(isWeb ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
      ...(isWeb && !isDark ? { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } : {}),
    };
  };

  const iconBgColor = iconColor
    ? `${iconColor}20`
    : isDark
      ? theme.colors.backgroundTertiary
      : theme.colors.backgroundSecondary;

  const iconDisplayColor = iconColor || theme.colors.primary;

  const changeColor = change?.type === 'increase' ? theme.colors.success : theme.colors.error;

  return (
    <View
      style={[
        styles.container,
        getBackgroundStyle(),
        theme.shadows.sm,
        style,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Icon name={icon} size={24} color={iconDisplayColor} />
      </View>

      {/* Value */}
      <Text
        style={[
          styles.value,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.bold,
          },
        ]}
      >
        {value}
      </Text>

      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
          },
        ]}
      >
        {label}
      </Text>

      {/* Change indicator */}
      {change && (
        <View
          style={[
            styles.changeContainer,
            { backgroundColor: `${changeColor}18` },
          ]}
        >
          <Icon
            name={change.type === 'increase' ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={changeColor}
          />
          <Text
            style={[
              styles.changeText,
              {
                color: changeColor,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {change.value}
          </Text>
        </View>
      )}
    </View>
  );
};

// Stats Grid - Container for multiple stats cards
export const StatsGrid = ({ children, columns = 4, style }) => {
  return (
    <View style={[styles.grid, { gap: 16 }, style]}>
      {React.Children.map(children, (child) => (
        <View style={[styles.gridItem, { flexBasis: `${100 / columns}%` }]}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20, // Section 14: Consistent padding 20px
    borderRadius: 16, // Section 3.1: Cards 16px
    alignItems: 'center',
    minWidth: 140,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 28, // Section 5.2: H1 size for emphasis
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 13, // Section 5.2: Small Text 13px
    textAlign: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});

export default StatsCard;
