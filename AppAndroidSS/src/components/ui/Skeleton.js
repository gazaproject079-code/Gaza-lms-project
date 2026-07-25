import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Section 21 - Loading States
// Section 21.1 - Skeleton Components: Placeholder shapes matching final UI

const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  variant = 'default', // default, circle, card, text, avatar
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation (Section 21.1: Subtle pulse or shimmer)
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Variant configurations
  const getVariantStyle = () => {
    switch (variant) {
      case 'circle':
        return {
          width: height,
          height: height,
          borderRadius: height / 2,
        };
      case 'avatar':
        return {
          width: 48,
          height: 48,
          borderRadius: 24,
        };
      case 'card':
        return {
          width: '100%',
          height: 200,
          borderRadius: 16,
        };
      case 'text':
        return {
          width: width,
          height: 14,
          borderRadius: 4,
        };
      default:
        return {
          width: width,
          height: height,
          borderRadius: borderRadius,
        };
    }
  };

  const baseColor = isDark
    ? theme.colors.backgroundTertiary
    : theme.colors.backgroundSecondary;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        getVariantStyle(),
        { backgroundColor: baseColor, opacity: pulseAnim },
        style,
      ]}
    />
  );
};

// Skeleton Text - Multiple lines of text placeholders
export const SkeletonText = ({ lines = 3, style }) => {
  const lineWidths = ['100%', '85%', '70%', '90%', '60%'];

  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={lineWidths[index % lineWidths.length]}
          style={styles.textLine}
        />
      ))}
    </View>
  );
};

// Skeleton Card - Card placeholder with image and text
export const SkeletonCard = ({ style, hasImage = true }) => {
  return (
    <View style={[styles.card, style]}>
      {hasImage && <Skeleton variant="card" height={160} style={styles.cardImage} />}
      <View style={styles.cardContent}>
        <Skeleton height={20} width="80%" style={styles.cardTitle} />
        <SkeletonText lines={2} />
        <View style={styles.cardFooter}>
          <Skeleton variant="avatar" width={32} height={32} />
          <Skeleton height={14} width={100} style={styles.cardMeta} />
        </View>
      </View>
    </View>
  );
};

// Skeleton List Item - List item placeholder
export const SkeletonListItem = ({ hasAvatar = true, hasSubtitle = true, style }) => {
  return (
    <View style={[styles.listItem, style]}>
      {hasAvatar && <Skeleton variant="avatar" />}
      <View style={styles.listItemContent}>
        <Skeleton height={16} width="70%" />
        {hasSubtitle && <Skeleton height={12} width="50%" style={styles.listItemSubtitle} />}
      </View>
      <Skeleton height={24} width={24} borderRadius={4} />
    </View>
  );
};

// Skeleton Dashboard - Dashboard stats placeholder
export const SkeletonDashboardStats = ({ count = 4, style }) => {
  return (
    <View style={[styles.statsContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.statCard}>
          <Skeleton variant="circle" height={48} />
          <Skeleton height={28} width="60%" style={styles.statValue} />
          <Skeleton height={14} width="80%" />
        </View>
      ))}
    </View>
  );
};

// Skeleton Course Card - Course card placeholder
export const SkeletonCourseCard = ({ style }) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[
      styles.courseCard,
      {
        backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
        borderColor: theme.colors.border,
      },
      style,
    ]}>
      <Skeleton height={140} borderRadius={12} style={styles.courseImage} />
      <View style={styles.courseContent}>
        <Skeleton height={12} width={80} style={styles.courseTag} />
        <Skeleton height={18} width="90%" style={styles.courseTitle} />
        <Skeleton height={14} width="70%" />
        <View style={styles.courseFooter}>
          <View style={styles.courseInstructor}>
            <Skeleton variant="avatar" width={24} height={24} />
            <Skeleton height={12} width={80} />
          </View>
          <Skeleton height={14} width={60} />
        </View>
      </View>
    </View>
  );
};

// Skeleton Table Row - Table row placeholder
export const SkeletonTableRow = ({ columns = 4, style }) => {
  return (
    <View style={[styles.tableRow, style]}>
      {Array.from({ length: columns }).map((_, index) => (
        <View key={index} style={styles.tableCell}>
          <Skeleton height={16} width={index === 0 ? '80%' : '60%'} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  textContainer: {
    gap: 8,
  },
  textLine: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  cardMeta: {
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
    gap: 6,
  },
  listItemSubtitle: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  statValue: {
    marginTop: 8,
  },
  courseCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  courseImage: {
    borderRadius: 0,
  },
  courseContent: {
    padding: 16,
    gap: 8,
  },
  courseTag: {
    borderRadius: 4,
  },
  courseTitle: {
    marginTop: 4,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  courseInstructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
});

export default Skeleton;
