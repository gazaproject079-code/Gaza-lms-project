import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';

const GREEN = '#007A3D';
const RED = '#CE1126';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const EnrolledCoursesScreen = () => {
  const { enrollments, fetchMyEnrollments } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  // Student sidebar navigation items
  const sidebarItems = [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
    { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
    { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
    { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
    { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
    { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
  ];

  const statusOptions = [
    { label: 'All Courses', value: 'All' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
  ];

  const sortOptions = [
    { label: 'Recently Accessed', value: 'recent' },
    { label: 'Name A-Z', value: 'name-asc' },
    { label: 'Name Z-A', value: 'name-desc' },
    { label: 'Progress (High to Low)', value: 'progress-desc' },
    { label: 'Progress (Low to High)', value: 'progress-asc' },
  ];

  const handleNavigate = (route) => {
    navigation.navigate(route);
  };

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchMyEnrollments();
    } catch (error) {
      console.error('Error loading enrollments:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load your courses' });
    } finally {
      setLoading(false);
    }
  }, [fetchMyEnrollments]);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchMyEnrollments();
      }
    }, [loading])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyEnrollments();
    setRefreshing(false);
  };

  // Map enrollments to courses
  const enrolledCourses = useMemo(() => {
    return (enrollments || []).map((enrollment) => ({
      ...(enrollment?.course || {}),
      id: enrollment?.course?.id || enrollment?.courseId,
      name: enrollment?.course?.name || 'Untitled Course',
      progress: enrollment?.progress ?? 0,
      enrollmentStatus: enrollment?.status || 'active',
      enrollmentId: enrollment?.id,
      enrolledAt: enrollment?.createdAt,
      lastAccessed: enrollment?.updatedAt,
    })).filter(course => course.id);
  }, [enrollments]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = enrolledCourses.length;
    const inProgress = enrolledCourses.filter(c => c.progress < 100).length;
    const completed = enrolledCourses.filter(c => c.progress >= 100).length;
    const avgProgress = total > 0
      ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / total)
      : 0;

    return { total, inProgress, completed, avgProgress };
  }, [enrolledCourses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = enrolledCourses.filter(course => {
      // Search filter
      const matchesSearch = course.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'in-progress') {
        matchesStatus = course.progress < 100;
      } else if (statusFilter === 'completed') {
        matchesStatus = course.progress >= 100;
      }

      return matchesSearch && matchesStatus;
    });

    // Sort
    switch (sortOrder) {
      case 'name-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'progress-desc':
        filtered.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
      case 'progress-asc':
        filtered.sort((a, b) => (a.progress || 0) - (b.progress || 0));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
        break;
    }

    return filtered;
  }, [enrolledCourses, searchQuery, statusFilter, sortOrder]);

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  // Loading state
  if (loading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="EnrolledCourses"
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your courses...
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="EnrolledCourses"
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
        {/* Page Header Banner */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
          borderColor: 'rgba(0,122,61,0.15)',
        }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name="school" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>My Learning</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>Track your progress and continue learning</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="school" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.total}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Enrolled
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
              <Icon name="time" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.inProgress}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              In Progress
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
              <Icon name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {stats.completed}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Completed
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
              <Icon name="trending-up" size={24} color="#8B5CF6" />
            </View>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
              {stats.avgProgress}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Avg Progress
            </Text>
          </AppCard>
        </View>

        {/* Search & Filter Section */}
        <AppCard style={styles.filterCard} allowOverflow>
          <AppInput
            placeholder="Search your courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
            containerStyle={styles.searchInputContainer}
          />

          <View style={styles.filterRow}>
            {/* Status Filter */}
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}
                onPress={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowSortDropdown(false);
                }}
              >
                <Icon name="funnel-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {statusOptions.find(o => o.value === statusFilter)?.label || 'Status'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showStatusDropdown && (
                <View style={[styles.dropdown, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface, borderColor: theme.colors.border }]}>
                  {statusOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        statusFilter === option.value && { backgroundColor: theme.colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Sort Filter */}
            <View style={[styles.filterDropdownContainer, { zIndex: 90 }]}>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}
                onPress={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowStatusDropdown(false);
                }}
              >
                <Icon name="swap-vertical" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {sortOptions.find(o => o.value === sortOrder)?.label || 'Sort'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showSortDropdown && (
                <View style={[styles.dropdown, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface, borderColor: theme.colors.border }]}>
                  {sortOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        sortOrder === option.value && { backgroundColor: theme.colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setSortOrder(option.value);
                        setShowSortDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Results count */}
            <Text style={[styles.resultsCount, { color: theme.colors.textTertiary }]}>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </AppCard>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <View style={styles.coursesGrid}>
            {filteredCourses.map((course, index) => {
              const isCompleted = course.progress >= 100;
              return (
                <Animated.View
                  key={course.id || index}
                  entering={FadeInDown.duration(400).delay(index * 60)}
                  style={styles.courseCardWrapper}
                >
                  <TouchableOpacity
                    style={[
                      styles.courseCard,
                      { backgroundColor: isDark ? theme.colors.card : theme.colors.surface },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                  >
                    {/* Course Image */}
                    {course.thumbnailImage ? (
                      <Image
                        source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                        style={styles.courseImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.courseImagePlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Icon name="image-outline" size={40} color={theme.colors.primary} />
                      </View>
                    )}

                    {/* Progress Overlay */}
                    <View style={styles.progressOverlay}>
                      <View style={[styles.progressCircle, { borderColor: isCompleted ? '#10B981' : theme.colors.primary }]}>
                        <Text style={[styles.progressText, { color: isCompleted ? '#10B981' : theme.colors.primary }]}>
                          {course.progress}%
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#10B981' : '#F59E0B' }]}>
                      <Icon name={isCompleted ? 'checkmark-circle' : 'time'} size={12} color="#FFFFFF" />
                      <Text style={styles.statusBadgeText}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </Text>
                    </View>

                    {/* Course Content */}
                    <View style={styles.courseContent}>
                      {/* Category */}
                      <Text style={[styles.courseCategory, { color: theme.colors.primary }]}>
                        {course.category?.name || 'Course'}
                      </Text>

                      {/* Title */}
                      <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                        {course.name}
                      </Text>

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${course.progress}%`,
                                backgroundColor: isCompleted ? '#10B981' : theme.colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressLabel, { color: theme.colors.textTertiary }]}>
                          {course.progress}% complete
                        </Text>
                      </View>

                      {/* Meta Info */}
                      <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                          <Icon name="book-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                            {course.topics?.length || 0} topics
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Icon name="calendar-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                            {formatDate(course.enrolledAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity
                        style={[
                          styles.courseActionBtn,
                          { backgroundColor: isCompleted ? '#10B981' : theme.colors.primary }
                        ]}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                      >
                        <Text style={styles.courseActionText}>
                          {isCompleted ? 'Review Course' : 'Continue Learning'}
                        </Text>
                        <Icon name="arrow-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="school-outline"
              title={searchQuery || statusFilter !== 'All'
                ? 'No courses found'
                : 'No enrolled courses'}
              subtitle={searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters or search term'
                : 'Start your learning journey by enrolling in courses'}
            />
            {searchQuery || statusFilter !== 'All' ? (
              <AppButton
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                variant="outline"
                leftIcon="close-circle-outline"
                style={styles.emptyActionBtn}
              />
            ) : (
              <AppButton
                title="Browse Courses"
                onPress={() => navigation.navigate('Courses')}
                variant="primary"
                leftIcon="library-outline"
                style={styles.emptyActionBtn}
              />
            )}
          </AppCard>
        )}

        {/* Info Card */}
        {enrolledCourses.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <AppCard style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
              <Icon name="bulb" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoCardText, { color: theme.colors.primary }]}>
                Complete courses to earn certificates. Once you reach 100% progress, your certificate will be automatically generated and emailed to you.
              </Text>
            </AppCard>
          </Animated.View>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? 14 : 18,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
    },
    bannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
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

    // Section Title with left orange border accent
    sectionTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 10,
      marginBottom: 16,
    },

    // Stats Section
    statsSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 12 : 16,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: isMobile ? '47%' : isTablet ? 140 : 160,
      maxWidth: isLargeScreen ? 220 : undefined,
      padding: isMobile ? 14 : 18,
      alignItems: 'center',
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    statValue: {
      fontSize: isMobile ? 24 : 30,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'center',
    },

    // Filter Section
    filterCard: {
      padding: isMobile ? 12 : 16,
      marginBottom: isMobile ? 16 : 24,
      overflow: 'visible',
      zIndex: 20,
    },
    searchInputContainer: {
      marginBottom: 12,
    },
    filterRow: {
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: 12,
      zIndex: 15,
    },
    filterDropdownContainer: {
      position: 'relative',
      zIndex: 100,
      ...(isMobile && { width: '100%' }),
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      width: isMobile ? '100%' : 'auto',
    },
    filterBtnText: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: theme.typography.fontFamily.medium,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: isMobile ? 0 : undefined,
      minWidth: isMobile ? undefined : 180,
      width: isMobile ? '100%' : undefined,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 4,
      zIndex: 1000,
      overflow: 'hidden',
      ...theme.shadows.lg,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }),
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },
    resultsCount: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      marginLeft: isMobile ? 0 : 'auto',
    },

    // Courses Grid
    coursesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
    },
    courseCardWrapper: {
      width: isLargeScreen
        ? 'calc(33.333% - 11px)'
        : isTablet
          ? 'calc(50% - 8px)'
          : '100%',
      ...(Platform.OS !== 'web' && {
        width: isLargeScreen ? '31%' : isTablet ? '48%' : '100%',
      }),
    },
    courseCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
      overflow: 'hidden',
      borderTopWidth: 3,
      borderTopColor: theme.colors.primary,
      ...theme.shadows.sm,
    },
    courseImage: {
      width: '100%',
      height: 150,
    },
    courseImagePlaceholder: {
      width: '100%',
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressOverlay: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
    progressCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderWidth: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressText: {
      fontSize: 12,
      fontWeight: '700',
    },
    statusBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
      // green for completed, orange (primary) for in-progress — applied via inline in JSX
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    courseContent: {
      padding: 16,
    },
    courseCategory: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: 12,
      lineHeight: 22,
    },
    progressBarContainer: {
      marginBottom: 12,
    },
    progressBarBg: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    progressLabel: {
      fontSize: 12,
    },
    courseMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 14,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
    },
    courseActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    courseActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    // Empty State
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyActionBtn: {
      marginTop: 16,
    },

    // Info Card
    infoCard: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      alignItems: 'flex-start',
      gap: 12,
    },
    infoCardText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: theme.typography.fontFamily.regular,
    },
  });

export default EnrolledCoursesScreen;
