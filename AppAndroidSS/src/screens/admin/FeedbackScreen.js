import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppInput from '../../components/ui/AppInput';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { feedbackAPI } from '../../services/apiClient';

const GREEN = '#007A3D';
const RED = '#CE1126';

const FeedbackScreen = () => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch feedback data
  const fetchFeedback = useCallback(async () => {
    try {
      const response = await feedbackAPI.getAll();
      if (response.success && response.feedbacks) {
        setFeedbackList(response.feedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load feedback data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeedback();
  }, [fetchFeedback]);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  const isSuperAdmin = user?.role === 'superadmin';

  // Sidebar navigation items based on user role
  const sidebarItems = isSuperAdmin ? [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Manage Instructors', icon: 'person-outline', iconActive: 'person', route: 'ManageAdmins' },
    { label: 'All Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
    { label: 'All Students', icon: 'school-outline', iconActive: 'school', route: 'Students' },
    { label: 'Categories', icon: 'layers-outline', iconActive: 'layers', route: 'Categories' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
  ] : [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Skill Categories', icon: 'layers-outline', iconActive: 'layers', route: 'CategoryManagement' },
    { label: 'Manage Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
    { label: 'Students', icon: 'people-outline', iconActive: 'people', route: 'Students' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
    { label: 'Course Feedback', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Feedback' },
  ];

  const handleNavigate = (route) => {
    if (isSuperAdmin) {
      if (route === 'ManageAdmins') {
        navigation.navigate('ManageUsers', { userType: 'instructor' });
      } else if (route === 'ManageExperts') {
        navigation.navigate('ManageUsers', { userType: 'expert' });
      } else if (route === 'Categories') {
        navigation.navigate('CategoryManagement');
      } else {
        navigation.navigate(route);
      }
    } else {
      navigation.navigate(route);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalFeedback = feedbackList.length;
    const avgRating = feedbackList.length > 0
      ? feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length
      : 0;
    const highRated = feedbackList.filter(f => f.rating >= 4).length;
    return { totalFeedback, avgRating: avgRating.toFixed(1), highRated };
  }, [feedbackList]);

  const filteredFeedback = feedbackList.filter(feedback => {
    const matchesSearch = feedback.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.expertName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  const renderFeedbackCard = (feedback, index) => (
    <Animated.View
      key={feedback.id}
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={styles.feedbackCardWrapper}
    >
      <View
        style={[
          styles.feedbackCard,
          {
            backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
          },
        ]}
      >
        {/* Header Row: reviewer info + rating */}
        <View style={styles.feedbackHeader}>
          {/* Reviewer Avatar + Name */}
          <View style={styles.reviewerRow}>
            <View style={[styles.reviewerAvatar, { backgroundColor: GREEN + '20' }]}>
              <Text style={[styles.reviewerInitial, { color: GREEN }]}>
                {feedback.expertName ? feedback.expertName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.reviewerInfo}>
              <Text style={[styles.reviewerName, { color: theme.colors.textPrimary }]}>
                {feedback.expertName}
              </Text>
              <View style={styles.courseRow}>
                <Icon name="book-outline" size={12} color={theme.colors.textTertiary} />
                <Text style={[styles.courseName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {feedback.courseName}
                </Text>
              </View>
            </View>
          </View>

          {/* Star Rating */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name={star <= feedback.rating ? 'star' : 'star-outline'}
                size={16}
                style={styles.starIcon}
                color={star <= feedback.rating ? GREEN : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.18)')}
              />
            ))}
          </View>
        </View>

        {/* Comment Text */}
        {feedback.feedback ? (
          <Text style={[styles.feedbackComment, { color: theme.colors.textSecondary }]}>
            "{feedback.feedback}"
          </Text>
        ) : null}

        {/* Footer: date */}
        <View style={[styles.feedbackFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)' }]}>
          <View style={styles.dateRow}>
            <Icon name="calendar-outline" size={13} color={theme.colors.textTertiary} />
            <Text style={[styles.feedbackDate, { color: theme.colors.textTertiary }]}>
              {formatDate(feedback.createdAt)}
            </Text>
          </View>
          {/* Rating badge */}
          <View style={[styles.ratingBadge, { backgroundColor: GREEN + '15', borderColor: GREEN + '30' }]}>
            <Icon name="star" size={11} color={GREEN} />
            <Text style={[styles.ratingBadgeText, { color: GREEN }]}>{feedback.rating}/5</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="Feedback"
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: isSuperAdmin ? 'Admin' : 'Instructor', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading feedback...
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Feedback"
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: isSuperAdmin ? 'Admin' : 'Instructor', avatar: user?.avatar }}
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
        {/* Page Header Banner */}
        <View
          style={[
            styles.pageHeaderBanner,
            {
              backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
              borderColor: 'rgba(0,122,61,0.15)',
            },
          ]}
        >
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' },
              ]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name="chatbubbles" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Course Feedback
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Reviews and ratings from students
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {/* Total Feedback */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0,122,61,0.12)' }]}>
              <Icon name="chatbubbles" size={20} color={GREEN} />
            </View>
            <Text style={[styles.statValueNew, { color: GREEN }]}>{stats.totalFeedback}</Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Total Feedback
            </Text>
          </View>

          {/* Average Rating */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Icon name="star" size={20} color="#F59E0B" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.statValueNew, { color: '#F59E0B' }]}>{stats.avgRating}</Text>
              <Icon name="star" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Average Rating
            </Text>
          </View>

          {/* High Rated */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Icon name="thumbs-up" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValueNew, { color: '#10B981' }]}>{stats.highRated}</Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              High Rated (4+)
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
            },
          ]}
        >
          <Icon name="search" size={18} color={theme.colors.textTertiary} style={{ marginRight: 10 }} />
          <AppInput
            placeholder="Search by course or reviewer name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ flex: 1, marginBottom: 0 }}
          />
        </View>

        {/* Feedback List */}
        {filteredFeedback.length > 0 ? (
          <View style={styles.feedbackList}>
            {filteredFeedback.map((feedback, index) => renderFeedbackCard(feedback, index))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.05)' }]}>
              <Icon name="chatbubbles-outline" size={36} color={theme.colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No feedback found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Feedback will appear here once courses are reviewed
            </Text>
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isLargeScreen, isTablet, isMobile) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isMobile ? 16 : 24,
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
    },

    // Page Header Banner
    pageHeaderBanner: {
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isTablet ? 'center' : 'flex-start',
      padding: isMobile ? 16 : 20,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
    },
    bannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: isTablet ? 1 : undefined,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,122,61,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerTextGroup: {
      flex: 1,
    },
    pageTitle: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 2,
    },
    pageSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Stats Section
    statsSection: {
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 12 : 16,
      marginBottom: 24,
    },
    statCardNew: {
      flex: 1,
      minWidth: 120,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      gap: 4,
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.06)',
      }),
    },
    statIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    statValueNew: {
      fontSize: isMobile ? 28 : 32,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      lineHeight: isMobile ? 34 : 38,
    },
    statLabelNew: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'center',
    },

    // Search Bar
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: isMobile ? 4 : 6,
      marginBottom: isMobile ? 16 : 24,
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.05)',
      }),
    },

    // Feedback List
    feedbackList: {
      gap: 14,
    },
    feedbackCardWrapper: {
      width: '100%',
    },
    feedbackCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: isMobile ? 14 : 18,
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.06)',
      }),
    },
    feedbackHeader: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      marginBottom: 12,
      gap: 10,
    },
    reviewerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: isMobile ? undefined : 1,
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reviewerInitial: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
    },
    reviewerInfo: {
      flex: 1,
    },
    reviewerName: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: 2,
    },
    courseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    courseName: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      flex: 1,
    },
    starRow: {
      flexDirection: 'row',
      gap: 2,
    },
    starIcon: {
      marginTop: 1,
    },
    feedbackComment: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: theme.typography.fontFamily.regular,
      fontStyle: 'italic',
      marginBottom: 14,
    },
    feedbackFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    feedbackDate: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    ratingBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Empty State
    emptyCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 48,
      alignItems: 'center',
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.05)',
      }),
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'center',
      maxWidth: 280,
    },
  });

export default FeedbackScreen;
