import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const GREEN = '#007A3D';
const RED = '#CE1126';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import ProgressBar from '../../components/ui/ProgressBar';
import CircularProgress from '../../components/ui/CircularProgress';
import EmptyState from '../../components/ui/EmptyState';
import Icon from 'react-native-vector-icons/Ionicons';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const ProgressDetailScreen = () => {
  const { theme, isDark } = useTheme();
  const { enrollments, fetchMyEnrollments } = useData();
  const navigation = useNavigation();
  const { logout } = useAuth();

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
  const handleNavigate = (route) => navigation.navigate(route);

  // Refresh enrollment data every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchMyEnrollments();
    }, [fetchMyEnrollments])
  );

  // Build courses with progress from enrollment data (real progressPercentage from backend)
  const coursesWithProgress = enrollments.map(enrollment => {
    const course = enrollment.course || {};
    const progress = enrollment.progress ?? 0; // normalized in DataContext
    const topics = course.topics || [];
    const completedTopics = topics.filter(t => t.completed).length;
    return {
      id: course.id || enrollment.courseId,
      name: course.name || 'Untitled Course',
      category: course.category,
      progress,
      completedTopics,
      totalTopics: topics.length,
      enrollmentStatus: enrollment.status,
    };
  });

  const overallProgress = coursesWithProgress.length > 0
    ? Math.round(coursesWithProgress.reduce((acc, c) => acc + c.progress, 0) / coursesWithProgress.length)
    : 0;

  const completedCourses = coursesWithProgress.filter(c => c.progress >= 100);
  const inProgressCourses = coursesWithProgress.filter(c => c.progress > 0 && c.progress < 100);
  const notStartedCourses = coursesWithProgress.filter(c => c.progress === 0);

  const styles = getStyles(theme, isDark);

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="EnrolledCourses"
      onNavigate={handleNavigate}
    >
      <ScrollView contentContainerStyle={styles.content}>

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
              <Icon name="trending-up" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>My Progress</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>Track your learning journey</Text>
            </View>
          </View>
        </View>

        {/* Overall Progress */}
        <AppCard style={styles.progressCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 20, marginTop: 0 }]}>Overall Progress</Text>
          <CircularProgress
            progress={overallProgress}
            size={140}
            strokeWidth={12}
          />
          <Text style={[styles.progressLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {overallProgress}% Complete
          </Text>
          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{completedCourses.length}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{inProgressCourses.length}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>In Progress</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.textTertiary }]}>{notStartedCourses.length}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Not Started</Text>
            </View>
          </View>
        </AppCard>

        {/* Completed Courses */}
        <Text style={styles.sectionTitle}>Completed Courses</Text>
        {completedCourses.length > 0 ? (
          completedCourses.map(course => (
            <AppCard
              key={course.id}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              style={styles.courseCard}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseCategory}>{course.category?.name || 'No Category'}</Text>
                {course.totalTopics > 0 && (
                  <Text style={[styles.topicCount, { color: theme.colors.success }]}>
                    {course.completedTopics}/{course.totalTopics} topics
                  </Text>
                )}
              </View>
              <Icon name="checkmark-circle" size={24} color={theme.colors.success} />
            </AppCard>
          ))
        ) : (
          <EmptyState
            icon="checkmark-done-circle-outline"
            title="No Completed Courses"
            subtitle="Keep learning to complete your first course!"
            style={styles.emptyListContainer}
          />
        )}

        {/* Courses in Progress */}
        <Text style={styles.sectionTitle}>Courses to Continue</Text>
        {inProgressCourses.length > 0 ? (
          inProgressCourses.map(course => (
            <AppCard
              key={course.id}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              style={styles.courseCard}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseCategory}>{course.category?.name || 'No Category'}</Text>
                {course.totalTopics > 0 && (
                  <Text style={[styles.topicCount, { color: theme.colors.textSecondary }]}>
                    {course.completedTopics}/{course.totalTopics} topics completed
                  </Text>
                )}
                <ProgressBar
                  progress={course.progress}
                  showLabel={true}
                  label={`${Math.round(course.progress)}%`}
                  style={styles.courseProgress}
                />
              </View>
              <Icon name="chevron-forward" size={24} color={theme.colors.textTertiary} />
            </AppCard>
          ))
        ) : (
          <EmptyState
            icon="book-outline"
            title="No In-Progress Courses"
            subtitle="Start a new course to see your progress here."
            style={styles.emptyListContainer}
          />
        )}

        {/* Not Started */}
        {notStartedCourses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Not Started Yet</Text>
            {notStartedCourses.map(course => (
              <AppCard
                key={course.id}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                style={styles.courseCard}
              >
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseCategory}>{course.category?.name || 'No Category'}</Text>
                </View>
                <Icon name="play-circle-outline" size={24} color={theme.colors.primary} />
              </AppCard>
            ))}
          </>
        )}

      </ScrollView>
    </MainLayout>
  );
};

const getStyles = (theme, isDark) => StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
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
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: 10,
  },
  progressCard: {
    marginBottom: 24,
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 3,
    borderTopColor: theme.colors.primary,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
    justifyContent: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  courseCard: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    overflow: 'hidden',
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  courseCategory: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  topicCount: {
    fontSize: 12,
    marginBottom: 6,
  },
  courseProgress: {
    marginTop: 4,
  },
  emptyListContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default ProgressDetailScreen;
