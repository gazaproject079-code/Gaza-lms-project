import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const BrowseCoursesScreen = () => {
  const { courses, categories, enrollments, fetchCourses, fetchCategories } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
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

  const levelOptions = [
    { label: 'All Levels', value: 'All' },
    { label: 'Beginner', value: 'Beginner' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Name A-Z', value: 'name-asc' },
    { label: 'Name Z-A', value: 'name-desc' },
    { label: 'Most Popular', value: 'popular' },
  ];

  const handleNavigate = (routeName) => {
    navigation.navigate(routeName);
  };

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchCategories()]);
    } catch (error) {
      console.error('Error loading courses:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  }, [fetchCourses, fetchCategories]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get enrolled course IDs
  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments.map(e => e.courseId || e.course?.id));
  }, [enrollments]);

  // Stats calculation
  const stats = useMemo(() => {
    const publishedCourses = courses.filter(c => c.status === 'published');
    const totalCourses = publishedCourses.length;
    const totalCategories = categories.length;
    const beginnerCourses = publishedCourses.filter(c => c.level === 'Beginner').length;
    const advancedCourses = publishedCourses.filter(c => c.level === 'Advanced').length;

    return { totalCourses, totalCategories, beginnerCourses, advancedCourses };
  }, [courses, categories]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      // Only show published courses
      if (course.status !== 'published') return false;

      // Search filter
      const matchesSearch =
        course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === 'All' || course.category?.name === selectedCategory;

      // Level filter
      const matchesLevel =
        selectedLevel === 'All' || course.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort
    switch (sortOrder) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
  }, [courses, searchQuery, selectedCategory, selectedLevel, sortOrder]);

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  // Loading state
  if (loading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="Courses"
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading courses...
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Courses"
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
              <Icon name="library" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Browse Courses</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>Discover your next learning adventure</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="library" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.totalCourses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Courses
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
              <Icon name="layers" size={24} color="#8B5CF6" />
            </View>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
              {stats.totalCategories}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Categories
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
              <Icon name="leaf" size={24} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {stats.beginnerCourses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Beginner
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
              <Icon name="rocket" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.advancedCourses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Advanced
            </Text>
          </AppCard>
        </View>

        {/* Search & Filter Section */}
        <AppCard style={styles.filterCard} allowOverflow>
          <AppInput
            placeholder="Search courses by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
            containerStyle={styles.searchInputContainer}
          />

          {/* Category Filter - Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === 'All' ? theme.colors.primary : 'transparent',
                  borderColor: selectedCategory === 'All' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedCategory('All')}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === 'All' ? '#ffffff' : theme.colors.textSecondary },
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === category.name ? theme.colors.primary : 'transparent',
                    borderColor: selectedCategory === category.name ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === category.name ? '#ffffff' : theme.colors.textSecondary },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Additional Filters Row */}
          <View style={styles.filterRow}>
            {/* Level Filter */}
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}
                onPress={() => {
                  setShowLevelDropdown(!showLevelDropdown);
                  setShowSortDropdown(false);
                }}
              >
                <Icon name="speedometer-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {levelOptions.find(o => o.value === selectedLevel)?.label || 'Level'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showLevelDropdown && (
                <View style={[styles.dropdown, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface, borderColor: theme.colors.border }]}>
                  {levelOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        selectedLevel === option.value && { backgroundColor: theme.colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setSelectedLevel(option.value);
                        setShowLevelDropdown(false);
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
                  setShowLevelDropdown(false);
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
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        </AppCard>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <View style={styles.coursesGrid}>
            {filteredCourses.map((course, index) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              return (
                <Animated.View
                  key={course.id}
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

                    {/* Enrolled Badge */}
                    {isEnrolled && (
                      <View style={[styles.enrolledBadge, { backgroundColor: '#10B981' }]}>
                        <Icon name="checkmark-circle" size={12} color="#FFFFFF" />
                        <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                      </View>
                    )}

                    {/* Level Badge */}
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: getLevelColor(course.level) }]}>
                        {course.level || 'All Levels'}
                      </Text>
                    </View>

                    {/* Course Content */}
                    <View style={styles.courseContent}>
                      {/* Category */}
                      <Text style={[styles.courseCategory, { color: theme.colors.primary }]}>
                        {course.category?.name || 'Uncategorized'}
                      </Text>

                      {/* Title */}
                      <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                        {course.name}
                      </Text>

                      {/* Description */}
                      <Text style={[styles.courseDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {course.description || 'No description available'}
                      </Text>

                      {/* Meta Info */}
                      <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                          <Icon name="book-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                            {course.topics?.length || 0} topics
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Icon name="time-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                            {course.duration || 'N/A'}
                          </Text>
                        </View>
                        {course.studentsCount > 0 && (
                          <View style={styles.metaItem}>
                            <Icon name="people-outline" size={14} color={theme.colors.textTertiary} />
                            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                              {course.studentsCount}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity
                        style={[
                          styles.courseActionBtn,
                          { backgroundColor: isEnrolled ? '#10B981' : theme.colors.primary }
                        ]}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                      >
                        <Text style={styles.courseActionText}>
                          {isEnrolled ? 'Continue Learning' : 'View Course'}
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
              icon="library-outline"
              title={searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All'
                ? 'No courses found'
                : 'No courses available'}
              subtitle={searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All'
                ? 'Try adjusting your filters or search term'
                : 'Check back later for new courses'}
            />
            {(searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All') && (
              <AppButton
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                }}
                variant="outline"
                leftIcon="close-circle-outline"
                style={styles.clearFiltersBtn}
              />
            )}
          </AppCard>
        )}
      </ScrollView>
    </MainLayout>
  );
};

// Helper function to get level color
const getLevelColor = (level) => {
  switch (level) {
    case 'Beginner':
      return '#10B981';
    case 'Intermediate':
      return '#F59E0B';
    case 'Advanced':
      return '#EF4444';
    default:
      return '#007A3D';
  }
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

    // Header Section
    pageHeader: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.primary + '30',
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
    categoryScroll: {
      marginBottom: 12,
    },
    categoryScrollContent: {
      gap: 8,
      paddingVertical: 4,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
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
      minWidth: isMobile ? undefined : 160,
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
      height: 160,
    },
    courseImagePlaceholder: {
      width: '100%',
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
    },
    enrolledBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    enrolledBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    levelBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    levelBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
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
      marginBottom: 8,
      lineHeight: 22,
    },
    courseDescription: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    courseMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
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
    clearFiltersBtn: {
      marginTop: 16,
    },
  });

export default BrowseCoursesScreen;
