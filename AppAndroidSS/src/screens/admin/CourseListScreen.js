import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const GREEN = '#007A3D';
const RED = '#CE1126';

const CourseListScreen = () => {
  const { courses, categories } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'published').length;
    const draftCourses = courses.filter(c => c.status === 'draft').length;
    return { totalCourses, publishedCourses, draftCourses };
  }, [courses]);

  const statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: null },
    ...categories.map(cat => ({ label: cat.name, value: cat.id }))
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || course.status === statusFilter;
    const matchesCategory = !categoryFilter || course.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  const renderCourseCard = (course, index) => (
    <Animated.View
      key={course.id}
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={styles.courseCardWrapper}
    >
      <TouchableOpacity
        style={[
          styles.courseCard,
          {
            backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)',
          },
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
      >
        {/* Thumbnail */}
        {course.thumbnailImage ? (
          <Image
            source={{ uri: resolveFileUrl(course.thumbnailImage) }}
            style={styles.courseThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)' }]}>
            <View style={styles.thumbnailIconCircle}>
              <Icon name="book" size={28} color="#007A3D" />
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.courseContent}>
          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: course.status === 'published'
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(245,151,8,0.12)',
                  borderWidth: 1,
                  borderColor: course.status === 'published'
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(245,151,8,0.25)',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: course.status === 'published' ? '#10B981' : '#F59708' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: course.status === 'published' ? '#10B981' : '#F59708' },
                ]}
              >
                {course.status === 'published' ? 'Published' : 'Draft'}
              </Text>
            </View>
          </View>

          {/* Title & Category */}
          <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {course.name}
          </Text>
          <Text style={[styles.courseCategory, { color: theme.colors.textSecondary }]}>
            {course.category?.name || 'No Category'}
          </Text>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="person-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                {course.user?.name || 'Unknown'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                {formatDate(course.updatedAt)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={() => navigation.navigate('CreateCourse', { courseId: course.id, courseData: course })}
            >
              <Icon name="create-outline" size={15} color={theme.colors.primary} />
              <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.viewBtn, { backgroundColor: GREEN, borderColor: GREEN }]}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            >
              <Icon name="eye-outline" size={15} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Courses"
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: isSuperAdmin ? 'Admin' : 'Instructor', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          {/* Left Side */}
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
              <Icon name="book" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Manage Courses
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Create, edit, and manage your course catalog
              </Text>
            </View>
          </View>

          {/* Right Side */}
          <TouchableOpacity
            style={styles.createCourseBtn}
            onPress={() => navigation.navigate('CreateCourse')}
            activeOpacity={0.85}
          >
            <Icon name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createCourseBtnText}>Create New Course</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {/* Total Courses */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
              <Icon name="book" size={20} color="#007A3D" />
            </View>
            <Text style={[styles.statValueNew, { color: '#007A3D' }]}>
              {stats.totalCourses}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Total Courses
            </Text>
          </View>

          {/* Published */}
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
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValueNew, { color: '#10B981' }]}>
              {stats.publishedCourses}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Published
            </Text>
          </View>

          {/* Drafts */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245,151,8,0.12)' }]}>
              <Icon name="time" size={20} color="#F59708" />
            </View>
            <Text style={[styles.statValueNew, { color: '#F59708' }]}>
              {stats.draftCourses}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Drafts
            </Text>
          </View>
        </View>

        {/* Search & Filter Section */}
        <AppCard style={styles.filterCard} allowOverflow>
          <AppInput
            placeholder="Search courses by title or category..."
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
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label : 'Filter by Status'}
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

            {/* Category Filter */}
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowStatusDropdown(false);
                }}
              >
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {categoryFilter ? categoryOptions.find(c => c.value === categoryFilter)?.label : 'Filter by Category'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View style={[styles.dropdown, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface, borderColor: theme.colors.border }]}>
                  {categoryOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        categoryFilter === option.value && { backgroundColor: theme.colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setCategoryFilter(option.value);
                        setShowCategoryDropdown(false);
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
          </View>
        </AppCard>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <View style={styles.coursesGrid}>
            {filteredCourses.map((course, index) => renderCourseCard(course, index))}
          </View>
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="book-outline"
              title="No courses found"
              subtitle="Create your first course to get started"
              actionLabel="Create Course"
              onAction={() => navigation.navigate('CreateCourse')}
            />
          </AppCard>
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

    // Page Header Banner
    pageHeaderBanner: {
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isTablet ? 'center' : 'flex-start',
      padding: isMobile ? 16 : 20,
      marginBottom: 20,
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
    createCourseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: GREEN,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      alignSelf: isTablet ? 'auto' : 'flex-start',
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 12px rgba(0,122,61,0.35)',
      }),
    },
    createCourseBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
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
      flexWrap: 'wrap',
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
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      width: isMobile ? '100%' : 'auto',
    },
    filterBtnText: {
      fontSize: 14,
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
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    courseThumbnail: {
      width: '100%',
      height: isMobile ? 160 : 140,
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: isMobile ? 160 : 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnailIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(99,102,241,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    courseContent: {
      padding: isMobile ? 12 : 16,
    },
    statusRow: {
      marginBottom: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    courseCategory: {
      fontSize: 13,
      marginBottom: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      gap: 4,
    },
    viewBtn: {
      borderWidth: 1,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Empty State
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

export default CourseListScreen;
