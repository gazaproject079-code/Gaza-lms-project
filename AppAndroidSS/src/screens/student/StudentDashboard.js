import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  RefreshControl,
  Image,
  TextInput,
  Animated as RNAnimated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { certificateAPI, authAPI, streakAPI } from '../../services/apiClient';
import { resolveFileUrl } from '../../utils/urlHelpers';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';

// UI Components
import MainLayout from '../../components/ui/MainLayout';

import AppCard from '../../components/ui/AppCard';
import Skeleton, { SkeletonDashboardStats, SkeletonTableRow } from '../../components/ui/Skeleton';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getMonthName = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[new Date(date).getMonth()];
};

const getLast6Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: getMonthName(date),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
    });
  }
  return months;
};

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
};

// ============================================
// CHART COMPONENTS
// ============================================

// Bar Chart — EduView style: pill-shaped tracks, dark bars, active bar warm orange, value labels
const BarChart = ({ data, theme, isDark, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const maxIndex = data.reduce(
    (best, d, i, arr) => (d.value >= arr[best].value ? i : best),
    0
  );

  return (
    <View style={barChartStyles.container}>
      <View style={[barChartStyles.barsContainer, { height }]}>
        {data.map((item, index) => {
          const barHeightPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const isActive = index === maxIndex;
          return (
            <View key={index} style={barChartStyles.barWrapper}>
              {/* Full-height background track */}
              <View style={barChartStyles.barTrack} />
              {/* Actual bar */}
              <View
                style={[
                  barChartStyles.bar,
                  {
                    height: `${Math.max(barHeightPct, 3)}%`,
                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  },
                ]}
              >
                {item.value > 0 && (
                  <Text style={barChartStyles.barValue}>{item.value}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={barChartStyles.xAxis}>
        {data.map((item, index) => (
          <Text key={index} style={barChartStyles.xLabel}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const barChartStyles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
    paddingHorizontal: 3,
  },
  barTrack: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
  },
  bar: {
    width: 28,
    borderRadius: 14,
    minHeight: 4,
    alignItems: 'center',
    paddingTop: 5,
    justifyContent: 'flex-start',
  },
  barValue: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  xLabel: {
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
  },
});

// Line Chart Component
const LineChart = ({ data, theme, isDark, height = 200, lineColor = '#7C6FCD' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={lineChartStyles.container}>
      <View style={[lineChartStyles.yAxis, { height }]}>
        {[100, 75, 50, 25, 0].map((val, i) => {
          const value = Math.round((maxValue * val) / 100);
          return (
            <Text key={i} style={[lineChartStyles.yLabel, { color: theme.colors.textTertiary }]}>
              {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            </Text>
          );
        })}
      </View>
      <View style={lineChartStyles.chartArea}>
        <View style={[lineChartStyles.chartContainer, { height, borderColor: isDark ? 'rgba(124,111,205,0.25)' : 'rgba(124,111,205,0.18)' }]}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((_, i) => (
            <View
              key={i}
              style={[
                lineChartStyles.gridLine,
                { top: (i * height) / 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
              ]}
            />
          ))}

          {/* Line segments */}
          {data.map((item, index) => {
            if (index === 0) return null;
            const prevItem = data[index - 1];
            const x1 = ((index - 1) / (data.length - 1)) * 100;
            const x2 = (index / (data.length - 1)) * 100;
            const y1 = maxValue > 0 ? ((maxValue - prevItem.value) / maxValue) * 100 : 100;
            const y2 = maxValue > 0 ? ((maxValue - item.value) / maxValue) * 100 : 100;

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            return (
              <View
                key={`line-${index}`}
                style={[
                  lineChartStyles.lineSegment,
                  {
                    left: `${x1}%`,
                    top: `${y1}%`,
                    width: `${length}%`,
                    transform: [{ rotate: `${angle}deg` }],
                    backgroundColor: lineColor,
                  },
                ]}
              />
            );
          })}

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = maxValue > 0 ? ((maxValue - item.value) / maxValue) * 100 : 100;

            return (
              <View
                key={index}
                style={[
                  lineChartStyles.dot,
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: lineColor,
                    shadowColor: lineColor,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={lineChartStyles.xAxis}>
          {data.map((item, index) => (
            <Text key={index} style={[lineChartStyles.xLabel, { color: theme.colors.textTertiary }]}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const lineChartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  yAxis: {
    width: 45,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 11,
  },
  chartArea: {
    flex: 1,
  },
  chartContainer: {
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  xLabel: {
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
  },
});

// Stats Card — EduView style: colored top accent border, icon+label row, huge bold number
const DashboardStatCard = ({ icon, iconColor, value, label, change, theme, isDark, style }) => {
  const isPositive = change && change.startsWith('+');

  return (
    <View
      style={[
        dashboardStatStyles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
          borderTopColor: iconColor,
        },
        style,
      ]}
    >
      <View style={dashboardStatStyles.header}>
        <View style={[dashboardStatStyles.iconContainer, { backgroundColor: iconColor + '18' }]}>
          <Icon name={icon} size={17} color={iconColor} />
        </View>
        <Text style={[dashboardStatStyles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[dashboardStatStyles.value, { color: theme.colors.textPrimary }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      {!!change && (
        <View style={dashboardStatStyles.changeRow}>
          <View style={[dashboardStatStyles.changeDot, { backgroundColor: isPositive ? '#10B981' : '#EF4444' }]} />
          <Text style={[dashboardStatStyles.change, { color: isPositive ? '#10B981' : '#EF4444' }]}>
            {change} from last month
          </Text>
        </View>
      )}
    </View>
  );
};

const dashboardStatStyles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderTopWidth: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  changeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// ============================================
// STREAK FIRE ICON — animated when active
// ============================================

const StreakFireIcon = ({ active, size = 28 }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Icon
        name={active ? 'flame' : 'flame-outline'}
        size={size}
        color={active ? '#F97316' : 'rgba(150,150,150,0.4)'}
      />
    </Animated.View>
  );
};

// ============================================
// ANIMATED CROSS OVERLAY — missed days
// ============================================

const AnimatedCross = ({ size }) => {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withTiming(0.95, { duration: 150 }),
      withTiming(1.0, { duration: 100 }),
    );
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 600 }),
          withTiming(0.95, { duration: 600 })
        ),
        -1,
        true
      );
    }, 450);
    return () => clearTimeout(timeout);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={animStyle}>
      <Icon name="close-outline" size={size} color="#EF4444" />
    </Animated.View>
  );
};

// ============================================
// ANIMATED STREAK BADGE COMPONENT
// ============================================

// Bronze=1d, Silver=7d (week1), Gold=14d (week2), Platinum=30d, Titanium=60d
const BADGE_AREA = 114;
const SPARK_R    = 49;

const BADGE_TIERS = [
  { min: 60, name: 'Titanium', color: '#38BDF8', shimmer: '#7DD3FC', emblem: 'ribbon',       sparks: 6, rings: 3 },
  { min: 30, name: 'Platinum', color: '#A78BFA', shimmer: '#C4B5FD', emblem: 'star',         sparks: 5, rings: 2 },
  { min: 14, name: 'Gold',     color: '#FBBF24', shimmer: '#FDE68A', emblem: 'trophy',       sparks: 4, rings: 2 },
  { min: 7,  name: 'Silver',   color: '#94A3B8', shimmer: '#E2E8F0', emblem: 'star-outline', sparks: 3, rings: 1 },
  { min: 1,  name: 'Bronze',   color: '#CD7F32', shimmer: '#F4A460', emblem: 'flame',        sparks: 2, rings: 1 },
  { min: 0,  name: 'None',     color: '#6B7280', shimmer: '#9CA3AF', emblem: null,           sparks: 0, rings: 0 },
];

const AnimatedStreakBadge = ({ currentStreak, isStreakAlive, theme, isDark }) => {
  const s        = isStreakAlive ? currentStreak : 0;
  const tier     = BADGE_TIERS.find(t => s >= t.min) || BADGE_TIERS[BADGE_TIERS.length - 1];

  const scaleAnim   = useRef(new RNAnimated.Value(1)).current;
  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;
  const glowAnim    = useRef(new RNAnimated.Value(0.18)).current;
  const scaleRef    = useRef(null);
  const shimmerRef  = useRef(null);
  const glowRef     = useRef(null);

  useEffect(() => {
    scaleAnim.setValue(1);
    shimmerAnim.setValue(0);
    glowAnim.setValue(0.18);

    scaleRef.current = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scaleAnim, { toValue: 1.07, duration: 1500, useNativeDriver: true }),
        RNAnimated.timing(scaleAnim, { toValue: 1.0,  duration: 1500, useNativeDriver: true }),
      ])
    );
    scaleRef.current.start();

    glowRef.current = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, { toValue: 0.55, duration: 1400, useNativeDriver: true }),
        RNAnimated.timing(glowAnim, { toValue: 0.1,  duration: 1400, useNativeDriver: true }),
      ])
    );
    glowRef.current.start();

    shimmerRef.current = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(3000),
        RNAnimated.timing(shimmerAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        RNAnimated.timing(shimmerAnim, { toValue: 0, duration: 580, useNativeDriver: true }),
      ])
    );
    shimmerRef.current.start();

    return () => {
      scaleRef.current?.stop();
      shimmerRef.current?.stop();
      glowRef.current?.stop();
    };
  }, [tier.name]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.62, 0],
  });

  const sparkleDots = Array.from({ length: tier.sparks }, (_, i) => {
    const angle = (2 * Math.PI * i) / tier.sparks - Math.PI / 2;
    return {
      left: BADGE_AREA / 2 + Math.cos(angle) * SPARK_R - 5,
      top:  BADGE_AREA / 2 + Math.sin(angle) * SPARK_R - 5,
    };
  });

  return (
    <View style={[badgeCompStyles.card, {
      backgroundColor: isDark ? tier.color + '14' : tier.color + '0A',
      borderColor: tier.color + '55',
    }]}>
      <View style={badgeCompStyles.badgeArea}>
        <RNAnimated.View style={[badgeCompStyles.glow, { backgroundColor: tier.color, opacity: glowAnim }]} />
        {tier.rings >= 1 && <View style={[badgeCompStyles.ring1, { borderColor: tier.color + 'BB' }]} />}
        {tier.rings >= 2 && <View style={[badgeCompStyles.ring2, { borderColor: tier.shimmer + '99' }]} />}
        {tier.rings >= 3 && <View style={[badgeCompStyles.ring3, { borderColor: tier.color + '55' }]} />}
        {sparkleDots.map((pos, i) => (
          <View key={i} style={[badgeCompStyles.spark, {
            left: pos.left, top: pos.top,
            backgroundColor: i % 2 === 0 ? tier.color : tier.shimmer,
            width: i === 0 ? 10 : 7, height: i === 0 ? 10 : 7,
            borderRadius: i === 0 ? 5 : 3.5,
          }]} />
        ))}
        <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={badgeCompStyles.shieldStack}>
            <Icon name="shield" size={68} color={tier.color + '55'} style={badgeCompStyles.shieldShadow} />
            <Icon name="shield" size={68} color={tier.color} />
            <View style={[badgeCompStyles.gloss, { backgroundColor: 'rgba(255,255,255,0.30)' }]} />
            {tier.emblem && <Icon name={tier.emblem} size={17} color="rgba(255,255,255,0.92)" style={badgeCompStyles.emblem} />}
            {s > 0 && <Text style={badgeCompStyles.shieldNum}>{s}</Text>}
            <RNAnimated.View style={[badgeCompStyles.shimmer, { opacity: shimmerOpacity }]} pointerEvents="none">
              <Icon name="shield" size={68} color={tier.shimmer} />
            </RNAnimated.View>
          </View>
        </RNAnimated.View>
      </View>
      <View style={[badgeCompStyles.tierPill, { backgroundColor: tier.color + '28', borderColor: tier.color + '66' }]}>
        <Text style={[badgeCompStyles.tierName, { color: tier.color }]}>{tier.name.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const badgeCompStyles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 4,
    gap: 3,
  },
  badgeArea: { width: BADGE_AREA, height: BADGE_AREA, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 76, height: 76, borderRadius: 38 },
  ring1: { position: 'absolute', width: 86,  height: 86,  borderRadius: 43, borderWidth: 2   },
  ring2: { position: 'absolute', width: 98,  height: 98,  borderRadius: 49, borderWidth: 1.5 },
  ring3: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1   },
  spark: { position: 'absolute' },
  shieldStack: {
    width: 68, height: 76, alignItems: 'center', justifyContent: 'center',
    transform: [{ scaleY: 1.18 }],
  },
  shieldShadow: { position: 'absolute', top: 6 },
  gloss: { position: 'absolute', top: 12, width: 20, height: 9, borderRadius: 5 },
  emblem: { position: 'absolute', top: 16 },
  shieldNum: {
    position: 'absolute', top: 37,
    color: 'rgba(255,255,255,0.96)', fontSize: 20, fontWeight: '900', letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  shimmer: { position: 'absolute', top: 0 },
  tierPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 2 },
  tierName: { fontSize: 12, fontWeight: '900', letterSpacing: 2.5 },
});

// ============================================
// STREAK CARD COMPONENT
// ============================================

const StreakCard = ({ streakData, theme, isDark, isMobile }) => {
  const { currentStreak, longestStreak, last7Days, isActiveToday, totalActiveDays } = streakData;
  const isStreakAlive = currentStreak > 0;
  const GREEN = '#10B981';
  const RED = '#EF4444';
  const activeColor = isStreakAlive ? GREEN : RED;

  // Animated streak counter
  const countAnim = useRef(new RNAnimated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    countAnim.setValue(0);
    RNAnimated.timing(countAnim, { toValue: currentStreak, duration: 1200, useNativeDriver: false }).start();
    const listener = countAnim.addListener(({ value }) => setDisplayCount(Math.round(value)));
    return () => countAnim.removeListener(listener);
  }, [currentStreak]);

  // Gamification computed values
  const perfectWeek     = (last7Days || []).length === 7 && (last7Days || []).every(d => d.active);
  const weekActiveCount = (last7Days || []).filter(d => d.active).length;
  const multiplier      = currentStreak >= 60 ? 10 : currentStreak >= 30 ? 5 : currentStreak >= 14 ? 3 : currentStreak >= 7 ? 2 : currentStreak >= 3 ? 1.5 : 1;

  const nextMilestone   = [7, 14, 30, 60, 100].find(m => m > currentStreak) || currentStreak + 10;
  const daysToMilestone = nextMilestone - currentStreak;
  const milestoneProgress = Math.min(currentStreak / nextMilestone, 1);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(200)}>
      <View style={[streakCardStyles.card, {
        backgroundColor: isDark ? `${activeColor}12` : `${activeColor}08`,
        borderColor: `${activeColor}30`,
        shadowColor: activeColor,
      }]}>

        {/* ── Header ── */}
        <View style={streakCardStyles.header}>
          <View style={streakCardStyles.headerLeft}>
            <Icon name={isStreakAlive ? 'flame' : 'flame-outline'} size={17} color={activeColor} />
            <Text style={[streakCardStyles.title, { color: theme.colors.textPrimary }]}>Learning Streak</Text>
            <Text style={[streakCardStyles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {isStreakAlive ? (isActiveToday ? '· on fire today!' : '· keep it alive!') : '· start learning'}
            </Text>
          </View>
          <View style={[streakCardStyles.statusPill, {
            backgroundColor: isStreakAlive
              ? isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)'
              : isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)',
          }]}>
            <View style={[streakCardStyles.statusDot, { backgroundColor: activeColor }]} />
            <Text style={[streakCardStyles.statusText, { color: activeColor }]}>
              {isStreakAlive ? 'Active' : 'Broken'}
            </Text>
          </View>
        </View>

        {/* ── Hero row: badge LEFT, content RIGHT ── */}
        <View style={streakCardStyles.heroRow}>

          {/* Left: shield badge */}
          <View style={streakCardStyles.badgeCol}>
            <AnimatedStreakBadge
              currentStreak={currentStreak}
              isStreakAlive={isStreakAlive}
              theme={theme}
              isDark={isDark}
            />
          </View>

          {/* Right: count + pills + stats + milestone */}
          <View style={streakCardStyles.contentCol}>

            {/* Streak count */}
            <View style={streakCardStyles.countRow}>
              <Text style={[streakCardStyles.countNum, { color: theme.colors.textPrimary }]}>{displayCount}</Text>
              <Text style={[streakCardStyles.countUnit, { color: activeColor }]}>
                {currentStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>

            {/* Multiplier + perfect week */}
            <View style={streakCardStyles.pillsRow}>
              <View style={[streakCardStyles.multiplierPill, { backgroundColor: activeColor + '22', borderColor: activeColor + '55' }]}>
                <Icon name="flash" size={11} color={activeColor} />
                <Text style={[streakCardStyles.multiplierText, { color: activeColor }]}>{multiplier}x Power</Text>
              </View>
              {perfectWeek && (
                <View style={[streakCardStyles.bonusPill, { backgroundColor: '#F59E0B22', borderColor: '#F59E0B66' }]}>
                  <Text style={streakCardStyles.bonusText}>🌟 Perfect</Text>
                </View>
              )}
            </View>

            {/* 2 stat chips */}
            <View style={streakCardStyles.statRow}>
              {[
                { icon: 'trophy-outline',   val: `${longestStreak}d`, label: 'Best'   },
                { icon: 'calendar-outline', val: `${totalActiveDays}`, label: 'Logged' },
              ].map((chip, i) => (
                <View key={i} style={[streakCardStyles.statChip, {
                  borderColor: `${activeColor}28`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }]}>
                  <Icon name={chip.icon} size={12} color={activeColor} />
                  <Text style={[streakCardStyles.statVal, { color: theme.colors.textPrimary }]}>{chip.val}</Text>
                  <Text style={[streakCardStyles.statLabel, { color: theme.colors.textTertiary }]}>{chip.label}</Text>
                </View>
              ))}
            </View>

            {/* Milestone */}
            <View style={[streakCardStyles.milestoneBox, {
              borderColor: `${activeColor}22`,
              backgroundColor: isDark ? `${activeColor}0A` : `${activeColor}07`,
            }]}>
              <View style={streakCardStyles.milestoneTop}>
                <Text style={[streakCardStyles.milestoneLabel, { color: theme.colors.textSecondary }]}>Goal</Text>
                <Text style={[streakCardStyles.milestoneCount, { color: activeColor }]}>{currentStreak}/{nextMilestone}d</Text>
              </View>
              <View style={[streakCardStyles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <View style={[streakCardStyles.progressFill, { width: `${milestoneProgress * 100}%`, backgroundColor: activeColor }]} />
              </View>
              <Text style={[streakCardStyles.milestoneHint, { color: theme.colors.textTertiary }]}>
                {daysToMilestone > 0 ? `${daysToMilestone}d to ${nextMilestone}-day goal` : '🎉 Reached!'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={[streakCardStyles.divider, { backgroundColor: `${activeColor}20` }]} />

        {/* ── Week header ── */}
        <View style={streakCardStyles.weekHeaderRow}>
          <Text style={[streakCardStyles.weekLabel, { color: theme.colors.textSecondary }]}>This Week</Text>
          {weekActiveCount === 7 && (
            <Text style={[streakCardStyles.weekBonus, { color: '#F59E0B' }]}>🌟 Flawless</Text>
          )}
        </View>

        {/* ── 7-day fire icons ── */}
        <View style={streakCardStyles.daysRow}>
          {(last7Days || []).map((day, i) => (
            <View key={i} style={streakCardStyles.dayCell}>
              <View style={streakCardStyles.fireWrap}>
                <StreakFireIcon active={day.active} size={isMobile ? 28 : 32} />
                {!day.active && totalActiveDays > 1 && (
                  <View style={streakCardStyles.crossOverlay}>
                    <AnimatedCross size={isMobile ? 30 : 34} />
                  </View>
                )}
              </View>
              <Text style={[streakCardStyles.dayLabel, { color: day.active ? activeColor : theme.colors.textTertiary }]}>
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const streakCardStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    overflow: 'hidden',
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 12, flex: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // ── Hero row ──
  heroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'stretch',
  },
  badgeCol: { width: 122 },
  contentCol: { flex: 1, gap: 6, justifyContent: 'center' },

  // ── Streak count ──
  countRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  countNum: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5, lineHeight: 38 },
  countUnit: {
    fontSize: 13, fontWeight: '700', paddingBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // ── Pills row ──
  pillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  multiplierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  multiplierText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  bonusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  bonusText: { fontSize: 10, fontWeight: '700', color: '#F59E0B' },

  // ── 2 stat chips ──
  statRow: { flexDirection: 'row', gap: 6 },
  statChip: {
    flex: 1, alignItems: 'center', gap: 1,
    paddingVertical: 6, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1,
  },
  statVal: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: {
    fontSize: 9, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.3, textAlign: 'center',
  },

  // ── Milestone box ──
  milestoneBox: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6, gap: 4 },
  milestoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  milestoneCount: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  milestoneHint: { fontSize: 11, lineHeight: 15, fontWeight: '900' },

  // ── Divider ──
  divider: { height: 1, marginBottom: 8 },

  // ── Week fires ──
  weekHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  weekLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  weekBonus: { fontSize: 11, fontWeight: '700' },
  daysRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 2,
  },
  dayCell: { alignItems: 'center', gap: 3, flex: 1 },
  fireWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  crossOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  dayLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const {
    courses,
    enrollments,
    notifications,
    todos,
    fetchCourses,
    fetchMyEnrollments,
    fetchMyNotifications,
    getLearningStats,
    fetchTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useData();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [todoInput, setTodoInput] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    last7Days: [],
    isActiveToday: false,
    lastActive: null,
    totalActiveDays: 0,
  });

  // Privacy Policy Storage Key (includes user id to track per user)
  const PRIVACY_POLICY_KEY = `@gazarise:privacy_accepted_${user?.id || 'unknown'}`;

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  // Student sidebar navigation items
  const sidebarItems = [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
    { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
    { label: 'My Profile', icon: 'person-outline', iconActive: 'person', route: 'Profile' },
    { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
    { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
    { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
    { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
  ];

  // Check if privacy policy has been accepted
  useEffect(() => {
    checkPrivacyPolicyStatus();
  }, [user?.id]);

  const checkPrivacyPolicyStatus = async () => {
    try {
      // First check local storage for quick response
      const localAccepted = await AsyncStorage.getItem(PRIVACY_POLICY_KEY);
      if (localAccepted === 'true') {
        setShowPrivacyPolicy(false);
        return;
      }

      // Then verify with backend (for cross-device sync)
      try {
        const response = await authAPI.getPrivacyPolicyStatus();
        if (response.success && response.privacyPolicyAccepted) {
          // Sync local storage with backend
          await AsyncStorage.setItem(PRIVACY_POLICY_KEY, 'true');
          setShowPrivacyPolicy(false);
        } else {
          setShowPrivacyPolicy(true);
        }
      } catch (apiError) {
        console.log('Could not check backend privacy status:', apiError);
        // If backend check fails, show the modal to be safe
        setShowPrivacyPolicy(true);
      }
    } catch (error) {
      console.error('Error checking privacy policy status:', error);
      // Show the modal if we can't determine status
      setShowPrivacyPolicy(true);
    }
  };

  const handleAcceptPrivacyPolicy = async () => {
    try {
      // Save to backend first
      await authAPI.acceptPrivacyPolicy();
      // Then save to local storage
      await AsyncStorage.setItem(PRIVACY_POLICY_KEY, 'true');
      setShowPrivacyPolicy(false);
    } catch (error) {
      console.error('Error saving privacy policy acceptance:', error);
      // Try to save locally even if backend fails
      try {
        await AsyncStorage.setItem(PRIVACY_POLICY_KEY, 'true');
      } catch (localError) {
        console.error('Error saving locally:', localError);
      }
      setShowPrivacyPolicy(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoading) {
        reloadData();
      }
    }, [initialLoading])
  );

  const loadData = async () => {
    try {
      await Promise.all([
        fetchCourses(),
        fetchMyEnrollments(),
        fetchMyNotifications(),
        fetchTodos(),
      ]);
      const statsResponse = await getLearningStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
      try {
        const certResponse = await certificateAPI.getMyCertificates();
        if (certResponse.success) {
          setCertificates(certResponse.certificates || []);
        }
      } catch (e) {
        console.log('Could not fetch certificates:', e);
      }
      // Record daily activity & fetch streak (opening dashboard = active day)
      try {
        const sRes = await streakAPI.recordActivity();
        if (sRes.success) {
          setStreakData({
            currentStreak: sRes.currentStreak,
            longestStreak: sRes.longestStreak,
            last7Days: sRes.last7Days || [],
            isActiveToday: sRes.isActiveToday,
            lastActive: sRes.lastActive,
            totalActiveDays: sRes.totalActiveDays,
          });
        }
      } catch (e) {
        console.log('Could not fetch streak:', e);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const reloadData = async () => {
    try {
      await Promise.all([
        fetchCourses(),
        fetchMyEnrollments(),
        fetchMyNotifications(),
      ]);
      const statsResponse = await getLearningStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
      try {
        const certResponse = await certificateAPI.getMyCertificates();
        if (certResponse.success) {
          setCertificates(certResponse.certificates || []);
        }
      } catch (e) {
        console.log('Could not fetch certificates:', e);
      }
      try {
        const sRes = await streakAPI.getStreak();
        if (sRes.success) {
          setStreakData({
            currentStreak: sRes.currentStreak,
            longestStreak: sRes.longestStreak,
            last7Days: sRes.last7Days || [],
            isActiveToday: sRes.isActiveToday,
            lastActive: sRes.lastActive,
            totalActiveDays: sRes.totalActiveDays,
          });
        }
      } catch (e) {
        console.log('Could not reload streak:', e);
      }
    } catch (error) {
      console.error('Error reloading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleNavigate = (route) => {
    navigation.navigate(route);
  };

  // ============================================
  // DYNAMIC DATA CALCULATIONS
  // ============================================

  // Process enrolled courses
  const enrolledCourses = useMemo(() => {
    return enrollments.map((enrollment) => ({
      ...enrollment.course,
      progress: enrollment.progress,
      enrollmentStatus: enrollment.status,
      enrolledAt: enrollment.createdAt,
      lastAccessed: enrollment.updatedAt,
    }));
  }, [enrollments]);

  // Get courses in progress
  const coursesInProgress = useMemo(() => {
    return enrolledCourses
      .filter(c => c.progress < 100)
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
  }, [enrolledCourses]);

  // Get completed courses
  const completedCourses = useMemo(() => {
    return enrolledCourses.filter(c => c.progress >= 100);
  }, [enrolledCourses]);

  // Calculate statistics with percentage changes
  const dashboardStats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    const inProgress = coursesInProgress.length;
    const completed = completedCourses.length;
    const totalCertificates = certificates.length;

    // Calculate last month's data for percentage change
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const enrolledLastMonth = enrollments.filter(e => {
      const created = new Date(e.createdAt);
      return created < thisMonth;
    }).length;

    const completedLastMonth = enrollments.filter(e => {
      const created = new Date(e.createdAt);
      return e.progress >= 100 && created < thisMonth;
    }).length;

    return {
      totalEnrolled,
      inProgress,
      completed,
      totalCertificates,
      enrolledChange: calculatePercentageChange(totalEnrolled, enrolledLastMonth),
      completedChange: calculatePercentageChange(completed, completedLastMonth),
    };
  }, [enrollments, coursesInProgress, completedCourses, certificates]);

  // Build enrollment growth chart data
  const enrollmentGrowthData = useMemo(() => {
    const last6Months = getLast6Months();
    const colors = ['#007A3D', '#CE1126', '#00A550', '#9A1220', '#005C2E', '#EFF8F2'];

    return last6Months.map((monthData, index) => {
      const enrollmentsUpToMonth = enrollments.filter(enrollment => {
        const createdDate = new Date(enrollment.createdAt);
        return (
          createdDate.getFullYear() < monthData.year ||
          (createdDate.getFullYear() === monthData.year && createdDate.getMonth() <= monthData.monthIndex)
        );
      }).length;

      return {
        label: monthData.month,
        value: enrollmentsUpToMonth,
        color: colors[index],
      };
    });
  }, [enrollments]);

  // Get recent/active courses for table
  const recentCoursesData = useMemo(() => {
    return enrolledCourses
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
      .slice(0, 4);
  }, [enrolledCourses]);

  // Get recommended courses (not enrolled)
  const recommendedCourses = useMemo(() => {
    return courses
      .filter((c) => c.status === 'published' && !enrolledCourses.find(e => e.id === c.id))
      .slice(0, 6);
  }, [courses, enrolledCourses]);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  // Loading skeleton
  if (initialLoading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="Dashboard"
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Page Banner */}
          <View style={styles.pageBanner}>
            <View style={styles.pageBannerLeft}>
              <View style={[styles.pageBannerIconCircle, { backgroundColor: `${theme.colors.primary}18` }]}>
                <Icon name="grid" size={24} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.pageBannerTitle, { color: theme.colors.textPrimary }]}>My Dashboard</Text>
                <Text style={[styles.pageBannerSubtitle, { color: theme.colors.textSecondary }]}>
                  Welcome back! Here's your learning overview.
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <SkeletonDashboardStats count={4} />
          </View>
          <View style={styles.section}>
            <View style={styles.chartsSection}>
              <AppCard style={styles.chartCardInner}>
                <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={200} />
              </AppCard>
            </View>
          </View>
        </ScrollView>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Dashboard"
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Page Banner */}
        <View style={styles.pageBanner}>
          <View style={styles.pageBannerLeft}>
            <View style={[styles.pageBannerIconCircle, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Icon name="grid" size={24} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.pageBannerTitle, { color: theme.colors.textPrimary }]}>My Dashboard</Text>
              <Text style={[styles.pageBannerSubtitle, { color: theme.colors.textSecondary }]}>
                {`Welcome back, ${user?.name || 'Student'}! Here's your learning overview.`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.browseCourseBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Courses')}
          >
            <Icon name="library-outline" size={16} color="#FFFFFF" />
            <Text style={styles.browseCourseBtnText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>

        {/* ── WELCOME BANNER — EduView trophy card style ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.bannerSection}>
          <View style={styles.bannerCard}>
            {/* Decorative circles */}
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            {/* Trophy icon top-right */}
            <View style={styles.bannerTrophyWrapper}>
              <Icon name="trophy" size={isMobile ? 44 : 56} color="rgba(255,255,255,0.3)" />
            </View>
            {/* Content */}
            <Text style={styles.bannerEyebrow}>GAZARISE LEARNING</Text>
            <Text style={styles.bannerTitle}>
              {dashboardStats.inProgress > 0 ? `Learn Today,\nRise Tomorrow!` : `Start\nToday!`}
            </Text>
            <Text style={styles.bannerBody}>
              {dashboardStats.inProgress > 0
                ? `${dashboardStats.inProgress} course${dashboardStats.inProgress > 1 ? 's' : ''} in progress. Keep the momentum!`
                : 'Explore courses and start your learning journey.'}
            </Text>
            <TouchableOpacity
              style={styles.bannerBtn}
              onPress={() => navigation.navigate('EnrolledCourses')}
            >
              <Icon name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── STATS SECTION ── */}
        <View style={styles.statsSection}>
          <DashboardStatCard
            icon="school-outline"
            iconColor={theme.colors.primary}
            value={dashboardStats.totalEnrolled}
            label="Enrolled Courses"
            change={dashboardStats.enrolledChange}
            theme={theme}
            isDark={isDark}
            style={styles.statCard}
          />
          <DashboardStatCard
            icon="time-outline"
            iconColor={theme.colors.accent}
            value={dashboardStats.inProgress}
            label="In Progress"
            theme={theme}
            isDark={isDark}
            style={styles.statCard}
          />
          <DashboardStatCard
            icon="checkmark-circle-outline"
            iconColor={theme.colors.success}
            value={dashboardStats.completed}
            label="Completed"
            change={dashboardStats.completedChange}
            theme={theme}
            isDark={isDark}
            style={styles.statCard}
          />
          <DashboardStatCard
            icon="ribbon-outline"
            iconColor={theme.colors.secondary}
            value={dashboardStats.totalCertificates}
            label="Certificates"
            theme={theme}
            isDark={isDark}
            style={styles.statCard}
          />
        </View>

        {/* ── CHARTS SECTION ── */}
        <View style={styles.chartsSection}>

          {/* Enrollment Growth — warm orange card (EduView Progress style) */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={[styles.chartCard, isLargeScreen && { alignSelf: 'stretch' }]}
          >
            <AppCard style={styles.enrollmentChartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.enrollmentChartTitle}>
                    Enrollment Growth
                  </Text>
                  <Text style={styles.enrollmentChartSubtitle}>
                    Your course enrollments over time
                  </Text>
                </View>
                <View style={styles.enrollmentIconBox}>
                  <Icon name="trending-up" size={17} color="#FFFFFF" />
                </View>
              </View>
              <BarChart
                data={enrollmentGrowthData}
                theme={theme}
                isDark={isDark}
                height={isMobile ? 160 : 200}
              />
            </AppCard>
          </Animated.View>

          {/* Learning Streak Card */}
          <View style={styles.chartCard}>
            <StreakCard
              streakData={streakData}
              theme={theme}
              isDark={isDark}
              isMobile={isMobile}
            />
          </View>
        </View>

        {/* ── MY COURSES TABLE ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                My Courses
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                Your enrolled courses and progress
              </Text>
            </View>
            {enrolledCourses.length > 0 && (
              <TouchableOpacity
                style={[styles.viewAllButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('EnrolledCourses')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          <AppCard style={styles.tableCard}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1A1A2E' : '#F5F5F8', borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.tableHeaderCell, styles.imageColumn, { color: theme.colors.textSecondary }]}>
                Image
              </Text>
              <Text style={[styles.tableHeaderCell, styles.courseNameColumn, { color: theme.colors.textSecondary }]}>
                Course Title
              </Text>
              {!isMobile && (
                <Text style={[styles.tableHeaderCell, styles.categoryColumn, { color: theme.colors.textSecondary }]}>
                  Category
                </Text>
              )}
              {(isLargeScreen || isTablet) && (
                <Text style={[styles.tableHeaderCell, styles.progressColumn, { color: theme.colors.textSecondary }]}>
                  Progress
                </Text>
              )}
              <Text style={[styles.tableHeaderCell, styles.statusColumn, { color: theme.colors.textSecondary }]}>
                Status
              </Text>
              <Text style={[styles.tableHeaderCell, styles.actionColumn, { color: theme.colors.textSecondary }]}>
                Action
              </Text>
            </View>

            {/* Table Rows */}
            {recentCoursesData.length > 0 ? (
              <View style={styles.tableRowsWrapper}>
                {recentCoursesData.map((course, index) => (
                  <View
                    key={course.id || index}
                    style={[
                      styles.tableRow,
                      {
                        backgroundColor: isDark ? theme.colors.backgroundSecondary : '#F9F9FB',
                        borderColor: isDark ? theme.colors.border : '#EEEEEE',
                      },
                    ]}
                  >
                    {/* Course Image */}
                    <View style={[styles.tableCell, styles.imageColumn]}>
                      {course.thumbnailImage ? (
                        <Image
                          source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                          style={styles.courseImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.courseImagePlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                          <Icon name="image-outline" size={20} color={theme.colors.primary} />
                        </View>
                      )}
                    </View>

                    {/* Course Title */}
                    <Text
                      style={[styles.tableCell, styles.courseNameColumn, styles.courseName, { color: theme.colors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {course.name || 'Untitled Course'}
                    </Text>

                    {/* Category */}
                    {!isMobile && (
                      <Text
                        style={[styles.tableCell, styles.categoryColumn, { color: theme.colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {course.category?.name || 'Uncategorized'}
                      </Text>
                    )}

                    {/* Progress Bar */}
                    {(isLargeScreen || isTablet) && (
                      <View style={[styles.tableCell, styles.progressColumn]}>
                        <View style={styles.progressContainer}>
                          <View style={[styles.progressBarBg, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${course.progress || 0}%`,
                                  backgroundColor: course.progress >= 100 ? '#10B981' : '#7C6FCD',
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                            {course.progress || 0}%
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Status */}
                    <View style={[styles.tableCell, styles.statusColumn]}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: course.progress >= 100 ? '#10B98118' : '#F59E0B18',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: course.progress >= 100 ? '#10B981' : '#F59E0B',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: course.progress >= 100 ? '#10B981' : '#F59E0B',
                            },
                          ]}
                        >
                          {course.progress >= 100 ? 'Completed' : 'In Progress'}
                        </Text>
                      </View>
                    </View>

                    {/* Action */}
                    <View style={[styles.tableCell, styles.actionColumn]}>
                      <TouchableOpacity
                        style={[styles.viewDetailsButton, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '12' }]}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                      >
                        <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>
                          {course.progress >= 100 ? 'Review' : 'Continue'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconBox, { backgroundColor: isDark ? theme.colors.backgroundSecondary : '#F5F5F8' }]}>
                  <Icon name="school-outline" size={36} color={theme.colors.textTertiary} />
                </View>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No courses yet. Start your learning journey!
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('Courses')}
                >
                  <Text style={styles.emptyButtonText}>Browse Courses</Text>
                </TouchableOpacity>
              </View>
            )}
          </AppCard>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 16 }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
              onPress={() => navigation.navigate('Courses')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="library" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.textPrimary }]}>
                Browse
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
              onPress={() => navigation.navigate('EnrolledCourses')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' + '15' }]}>
                <Icon name="school" size={22} color="#10B981" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.textPrimary }]}>
                My Learning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
              onPress={() => navigation.navigate('AITutor')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Icon name="sparkles" size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.textPrimary }]}>
                AI Assistant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
              onPress={() => navigation.navigate('Certificates')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
                <Icon name="ribbon" size={22} color="#F59E0B" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.textPrimary }]}>
                Certificates
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EF4444' + '15' }]}>
                <Icon name="notifications" size={22} color="#EF4444" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.textPrimary }]}>
                Alerts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#007A3D' + '15' }]}>
                <Icon name="person" size={22} color="#007A3D" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.textPrimary }]}>
                My Profile
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── FEATURED COURSE — EduView dark card style ── */}
        {coursesInProgress.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
            <View style={[styles.featuredCard, { backgroundColor: isDark ? '#FFFFFF' : '#1A1A2E' }]}>
              {/* Subtle arc decoration */}
              <View style={styles.featuredArc} />
              <View style={styles.featuredTop}>
                <View style={[styles.featuredIconBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' }]}>
                  <Icon name="play-circle" size={18} color={isDark ? '#1A1A2E' : '#FFFFFF'} />
                </View>
                <TouchableOpacity
                  style={[styles.featuredArrowBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }]}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: coursesInProgress[0]?.id })}
                >
                  <Icon name="arrow-forward" size={15} color={isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'} />
                </TouchableOpacity>
              </View>
              <View style={styles.featuredMid}>
                <Text style={styles.featuredBadgeLabel}>CONTINUE LEARNING</Text>
                <Text style={[styles.featuredCourseTitle, { color: isDark ? '#1A1A2E' : '#FFFFFF' }]} numberOfLines={2}>
                  {coursesInProgress[0]?.name || 'Your Current Course'}
                </Text>
              </View>
              <View style={styles.featuredFoot}>
                <View style={styles.featuredProgressRow}>
                  <View style={[styles.featuredProgressBg, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)' }]}>
                    <View style={[styles.featuredProgressFill, { width: `${coursesInProgress[0]?.progress || 0}%` }]} />
                  </View>
                  <Text style={[styles.featuredProgressPct, { color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.78)' }]}>{coursesInProgress[0]?.progress || 0}%</Text>
                </View>
                <TouchableOpacity
                  style={[styles.featuredContinueBtn, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: coursesInProgress[0]?.id })}
                >
                  <Icon name="arrow-forward" size={16} color={isDark ? '#FFFFFF' : '#1A1A2E'} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── RECOMMENDED COURSES ── */}
        {recommendedCourses.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Recommended For You
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                  Courses you might like
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.viewAllButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {recommendedCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.recommendedCard, { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderColor: isDark ? theme.colors.border : '#EEEEEE' }]}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                >
                  {course.thumbnailImage ? (
                    <Image
                      source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                      style={styles.recommendedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.recommendedImagePlaceholder, { backgroundColor: isDark ? theme.colors.backgroundSecondary : '#F5F5F8' }]}>
                      <Icon name="image-outline" size={32} color={theme.colors.primary} />
                    </View>
                  )}
                  <View style={styles.recommendedContent}>
                    <View style={[styles.recommendedCategoryPill, { backgroundColor: theme.colors.primary + '18' }]}>
                      <Text style={[styles.recommendedCategory, { color: theme.colors.primary }]}>
                        {course.category?.name || 'Course'}
                      </Text>
                    </View>
                    <Text style={[styles.recommendedTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                      {course.name}
                    </Text>
                    <View style={styles.recommendedMeta}>
                      <View style={styles.recommendedMetaItem}>
                        <Icon name="layers-outline" size={13} color={theme.colors.textTertiary} />
                        <Text style={[styles.recommendedMetaText, { color: theme.colors.textTertiary }]}>
                          {course.topics?.length || 0} topics
                        </Text>
                      </View>
                      <View style={styles.recommendedMetaItem}>
                        <Icon name="speedometer-outline" size={13} color={theme.colors.textTertiary} />
                        <Text style={[styles.recommendedMetaText, { color: theme.colors.textTertiary }]}>
                          {course.level || 'All Levels'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── REMINDERS / TODO WIDGET ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Reminders</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                Your pending learning tasks
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.viewAllButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Todo')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <AppCard style={[styles.todoWidget, { borderColor: theme.colors.border }]}>
            {/* Quick add row */}
            <View style={[styles.todoAddRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
              <TextInput
                style={[styles.todoAddInput, { color: theme.colors.textPrimary }]}
                placeholder="Add a quick reminder..."
                placeholderTextColor={theme.colors.textTertiary}
                value={todoInput}
                onChangeText={setTodoInput}
                onSubmitEditing={async () => {
                  if (!todoInput.trim()) return;
                  await addTodo({ text: todoInput.trim(), type: 'general' });
                  setTodoInput('');
                }}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.todoAddBtn, { backgroundColor: theme.colors.primary, opacity: todoInput.trim() ? 1 : 0.45 }]}
                onPress={async () => {
                  if (!todoInput.trim()) return;
                  await addTodo({ text: todoInput.trim(), type: 'general' });
                  setTodoInput('');
                }}
              >
                <Icon name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Pending todos list — show top 4 */}
            {todos.filter(t => !t.completed).slice(0, 4).length > 0 ? (
              todos.filter(t => !t.completed).slice(0, 4).map((todo, i) => (
                <View
                  key={todo.id}
                  style={[
                    styles.todoRow,
                    i < Math.min(todos.filter(t => !t.completed).length, 4) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.todoCheck, { borderColor: theme.colors.primary }]}
                    onPress={() => toggleTodo(todo.id)}
                  >
                    <Icon name="ellipse-outline" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.todoRowText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {todo.text}
                  </Text>
                  <TouchableOpacity onPress={() => deleteTodo(todo.id)} style={styles.todoDeleteBtn}>
                    <Icon name="close" size={14} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.todoEmptyRow}>
                <Icon name="checkmark-circle-outline" size={20} color="#10B981" />
                <Text style={[styles.todoEmptyText, { color: theme.colors.textSecondary }]}>
                  {todos.filter(t => t.completed).length > 0
                    ? 'All caught up! Great work.'
                    : 'No reminders yet — add one above.'}
                </Text>
              </View>
            )}

            {/* Completed count footer */}
            {todos.length > 0 && (
              <View style={[styles.todoFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                <Icon name="checkmark-done-outline" size={13} color="#10B981" />
                <Text style={[styles.todoFooterText, { color: theme.colors.textSecondary }]}>
                  {todos.filter(t => t.completed).length} of {todos.length} completed
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Todo')}>
                  <Text style={[styles.todoFooterLink, { color: theme.colors.primary }]}>Manage →</Text>
                </TouchableOpacity>
              </View>
            )}
          </AppCard>
        </Animated.View>

      </ScrollView>

      {/* Privacy Policy Modal - Shows until user accepts */}
      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onAccept={handleAcceptPrivacyPolicy}
        onCancel={logout}
      />
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isLargeScreen, isTablet, isMobile) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    section: {
      paddingHorizontal: isMobile ? 16 : 24,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '800',
      fontFamily: theme.typography.fontFamily.semiBold,
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      fontSize: 13,
      marginTop: 3,
      fontWeight: '500',
    },
    viewAllButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    viewAllText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },

    // ── Stats ──
    statsSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: isMobile ? 16 : 24,
      gap: isMobile ? 10 : 14,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: isMobile ? '47%' : isLargeScreen ? 200 : isTablet ? 170 : 150,
      maxWidth: isLargeScreen ? 280 : undefined,
    },

    // ── Charts ──
    chartsSection: {
      flexDirection: isLargeScreen ? 'row' : 'column',
      alignItems: isLargeScreen ? 'stretch' : undefined,
      paddingHorizontal: isMobile ? 16 : 24,
      gap: 16,
      marginBottom: 24,
    },
    chartCard: {
      flex: 1,
      minWidth: isLargeScreen ? 400 : undefined,
    },
    // Enrollment chart — warm orange EduView style
    enrollmentChartCard: {
      padding: isMobile ? 16 : 20,
      backgroundColor: '#6366F1',
      flex: isLargeScreen ? 1 : undefined,
    },
    enrollmentChartTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    enrollmentChartSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.82)',
      marginTop: 3,
      fontWeight: '500',
    },
    enrollmentIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: '#1A1A2E',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Completion chart — theme-aware
    chartCardInner: {
      padding: isMobile ? 16 : 20,
    },
    completionIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    chartSubtitle: {
      fontSize: 12,
      marginTop: 3,
      fontWeight: '500',
    },

    // ── Table ──
    tableCard: {
      padding: 0,
      overflow: 'hidden',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 11,
      paddingHorizontal: isMobile ? 12 : 16,
      borderBottomWidth: 1,
    },
    tableHeaderCell: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    tableRowsWrapper: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 6,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: isMobile ? 10 : 14,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
    },
    tableCell: {
      fontSize: 14,
    },
    imageColumn: {
      width: isMobile ? 50 : 60,
      paddingRight: 12,
    },
    courseImage: {
      width: isMobile ? 38 : 46,
      height: isMobile ? 38 : 46,
      borderRadius: 10,
    },
    courseImagePlaceholder: {
      width: isMobile ? 38 : 46,
      height: isMobile ? 38 : 46,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    courseNameColumn: {
      flex: 2,
      paddingRight: 12,
    },
    categoryColumn: {
      flex: 1,
      paddingRight: 12,
    },
    progressColumn: {
      width: 120,
      paddingRight: 12,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    progressBarBg: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600',
      width: 35,
      textAlign: 'right',
    },
    statusColumn: {
      flex: 1,
      paddingRight: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
      gap: 5,
      alignSelf: 'flex-start',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    actionColumn: {
      width: isMobile ? 80 : 100,
      alignItems: 'flex-end',
    },
    courseName: {
      fontWeight: '700',
      fontSize: 13,
    },
    viewDetailsButton: {
      paddingHorizontal: isMobile ? 8 : 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1.5,
    },
    viewDetailsText: {
      fontSize: 12,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyText: {
      marginBottom: 16,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 20,
    },
    emptyButton: {
      paddingHorizontal: 24,
      paddingVertical: 11,
      borderRadius: 20,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    // ── Quick Actions ──
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    quickAction: {
      flex: 1,
      minWidth: isMobile ? '30%' : 110,
      maxWidth: isMobile ? '32%' : 150,
      paddingVertical: 18,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1.5,
      ...theme.shadows.sm,
    },
    quickActionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      position: 'relative',
    },
    quickActionText: {
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },
    notificationBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: '#EF4444',
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },

    // ── Recommended Courses ──
    horizontalScrollContent: {
      paddingRight: 24,
      gap: 14,
    },
    recommendedCard: {
      width: 268,
      borderRadius: 16,
      borderWidth: 1.5,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    recommendedImage: {
      width: '100%',
      height: 140,
    },
    recommendedImagePlaceholder: {
      width: '100%',
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recommendedContent: {
      padding: 14,
    },
    recommendedCategoryPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 8,
    },
    recommendedCategory: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    recommendedTitle: {
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 10,
      lineHeight: 19,
    },
    recommendedMeta: {
      flexDirection: 'row',
      gap: 14,
    },
    recommendedMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    recommendedMetaText: {
      fontSize: 11,
      fontWeight: '500',
    },

    // ── Todo Widget ──
    todoWidget: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    todoAddRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    todoAddInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      paddingVertical: 4,
    },
    todoAddBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    todoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    todoCheck: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    todoRowText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    todoDeleteBtn: {
      padding: 4,
    },
    todoEmptyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    todoEmptyText: {
      fontSize: 13,
    },
    todoFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
    },
    todoFooterText: {
      flex: 1,
      fontSize: 12,
    },
    todoFooterLink: {
      fontSize: 12,
      fontWeight: '700',
    },

    // ── Page Banner ──
    pageBanner: {
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isTablet ? 'center' : 'flex-start',
      paddingHorizontal: isMobile ? 16 : 24,
      paddingVertical: 20,
      marginBottom: 8,
      gap: 12,
    },
    pageBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: isTablet ? 1 : undefined,
    },
    pageBannerIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pageBannerTitle: {
      fontSize: isMobile ? 20 : 26,
      fontWeight: '800',
    },
    pageBannerSubtitle: {
      fontSize: 13,
      marginTop: 2,
    },
    browseCourseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
    },
    browseCourseBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    // ── Welcome Banner ──
    bannerSection: {
      paddingHorizontal: isMobile ? 16 : 24,
      marginBottom: 24,
    },
    bannerCard: {
      backgroundColor: theme.colors.heroGradientMid,
      borderRadius: 22,
      padding: isMobile ? 20 : 24,
      overflow: 'hidden',
      position: 'relative',
      minHeight: isMobile ? 148 : 160,
    },
    bannerCircle1: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255,255,255,0.07)',
    },
    bannerCircle2: {
      position: 'absolute',
      bottom: -35,
      right: 50,
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    bannerTrophyWrapper: {
      position: 'absolute',
      top: 12,
      right: 18,
    },
    bannerEyebrow: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    bannerTitle: {
      color: '#FFFFFF',
      fontSize: isMobile ? 22 : 27,
      fontWeight: '900',
      lineHeight: isMobile ? 27 : 33,
      marginBottom: 10,
      maxWidth: '62%',
    },
    bannerBody: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      lineHeight: 18,
      maxWidth: '68%',
      fontWeight: '500',
      marginBottom: 18,
    },
    bannerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ── Featured Course Card ──
    featuredCard: {
      borderRadius: 20,
      padding: isMobile ? 18 : 22,
      overflow: 'hidden',
      position: 'relative',
    },
    featuredArc: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.08,
      backgroundColor: 'transparent',
    },
    featuredTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    featuredIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featuredArrowBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featuredMid: {
      marginBottom: 18,
    },
    featuredBadgeLabel: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 7,
    },
    featuredCourseTitle: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: isMobile ? 14 : 16,
      lineHeight: isMobile ? 19 : 22,
    },
    featuredFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    featuredProgressRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    featuredProgressBg: {
      flex: 1,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.18)',
      overflow: 'hidden',
    },
    featuredProgressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    featuredProgressPct: {
      color: 'rgba(255,255,255,0.78)',
      fontSize: 12,
      fontWeight: '700',
      minWidth: 32,
    },
    featuredContinueBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default StudentDashboard;
