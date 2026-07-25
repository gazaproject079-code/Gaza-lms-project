import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const StatusBadge = ({ status, style, textStyle, size = 'md' }) => {
  const { theme, isDark } = useTheme();

  // Size configurations
  const sizeConfig = {
    sm: { paddingH: 8, paddingV: 2, fontSize: 10, borderRadius: 8 },
    md: { paddingH: 10, paddingV: 4, fontSize: 12, borderRadius: 12 },
    lg: { paddingH: 12, paddingV: 6, fontSize: 14, borderRadius: 14 },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const getStatusConfig = () => {
    const statusLower = status?.toLowerCase() || '';

    switch (statusLower) {
      case 'published':
      case 'active':
      case 'unlocked':
      case 'completed':
      case 'success':
        return {
          backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)',
          color: '#10B981',
          borderColor: isDark ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.25)',
        };
      case 'draft':
      case 'pending':
      case 'in progress':
      case 'running':
        return {
          backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.10)',
          color: '#F59E0B',
          borderColor: isDark ? 'rgba(245,158,11,0.30)' : 'rgba(245,158,11,0.25)',
        };
      case 'hidden':
      case 'locked':
      case 'blocked':
      case 'failed':
      case 'error':
        return {
          backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.10)',
          color: '#EF4444',
          borderColor: isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.25)',
        };
      case 'queued':
      case 'info':
      default:
        return {
          backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)',
          color: '#6366F1',
          borderColor: isDark ? 'rgba(99,102,241,0.30)' : 'rgba(99,102,241,0.25)',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: currentSize.paddingH,
          paddingVertical: currentSize.paddingV,
          borderRadius: currentSize.borderRadius,
          borderWidth: 1,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      {/* Dot indicator */}
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: config.color, marginRight: 5 }} />
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: currentSize.fontSize,
            fontFamily: theme.typography.fontFamily.semiBold,
          },
          textStyle,
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
});

export default StatusBadge;
