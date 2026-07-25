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
  Linking,
} from 'react-native';

const GREEN = '#007A3D';
const RED = '#CE1126';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const CourseDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params;
  const { courses, enrollments, enrollInCourse, unenrollFromCourse, checkEnrollment, fetchMyEnrollments } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  const course = courses.find(c => c.id === courseId);

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

  const handleNavigate = (routeName) => {
    navigation.navigate(routeName);
  };

  // Check enrollment status
  const checkEnrollmentStatus = useCallback(async () => {
    try {
      const result = await checkEnrollment(courseId);
      if (result.success) {
        setIsEnrolled(result.enrolled);
        if (result.enrolled && result.enrollment) {
          setEnrollmentData(result.enrollment);
        }
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  }, [courseId, checkEnrollment]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await checkEnrollmentStatus();
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  }, [checkEnrollmentStatus]);

  useEffect(() => {
    loadData();
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        checkEnrollmentStatus();
      }
    }, [loading, checkEnrollmentStatus])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get enrollment progress
  const progress = useMemo(() => {
    if (!isEnrolled) return 0;
    const enrollment = enrollments.find(e => e.courseId === courseId || e.course?.id === courseId);
    return enrollment?.progress || enrollmentData?.progress || 0;
  }, [isEnrolled, enrollments, courseId, enrollmentData]);

  // Calculate topic stats
  const topicStats = useMemo(() => {
    if (!course?.topics) return { total: 0, completed: 0, unlocked: 0 };
    const total = course.topics.length;
    const completed = course.topics.filter(t => t.completed).length;
    const unlocked = course.topics.filter(t => t.status === 'unlocked' || t.completed).length;
    return { total, completed, unlocked };
  }, [course?.topics]);

  // Handle enroll
  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const result = await enrollInCourse(courseId);
      if (result.success) {
        setIsEnrolled(true);
        await fetchMyEnrollments();
        await checkEnrollmentStatus();
        Toast.show({
          type: 'success',
          text1: 'Enrolled Successfully',
          text2: 'You can now access the course content',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Enrollment Failed',
          text2: result.error || 'Failed to enroll in the course',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Handle unenroll
  const handleUnenroll = async () => {
    setUnenrolling(true);
    try {
      const result = await unenrollFromCourse(courseId);
      if (result.success) {
        setIsEnrolled(false);
        setEnrollmentData(null);
        await fetchMyEnrollments();
        Toast.show({
          type: 'success',
          text1: 'Unenrolled Successfully',
          text2: 'You have been removed from this course',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Unenrollment Failed',
          text2: result.error || 'Failed to unenroll from the course',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setUnenrolling(false);
    }
  };

  // Get first unlocked/available topic
  const getNextTopic = () => {
    if (!course?.topics || !isEnrolled) return null;
    return course.topics.find(t => (t.status === 'unlocked' || !t.completed) && !t.completed) || course.topics[0];
  };

  // Handle start/continue learning
  const handleStartLearning = () => {
    const nextTopic = getNextTopic();
    if (nextTopic) {
      navigation.navigate('Learning', { courseId, topicId: nextTopic.id });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get level color
  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return theme.colors.primary;
    }
  };

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
            Loading course details...
          </Text>
        </View>
      </MainLayout>
    );
  }

  // Course not found
  if (!course) {
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
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="alert-circle-outline"
            title="Course Not Found"
            subtitle="The course you're looking for doesn't exist or has been removed"
          />
          <AppButton
            title="Browse Courses"
            onPress={() => navigation.navigate('Courses')}
            variant="primary"
            leftIcon="library-outline"
            style={{ marginTop: 20 }}
          />
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
              <Icon name="book" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Course Details</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>View course information and content</Text>
            </View>
          </View>
          {isEnrolled && (
            <AppButton
              title={progress > 0 ? 'Continue Learning' : 'Start Learning'}
              onPress={handleStartLearning}
              variant="primary"
              style={styles.headerButton}
              leftIcon="play-circle-outline"
            />
          )}
        </View>

        {/* Content Grid */}
        <View style={styles.contentGrid}>
          {/* Main Column */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.mainColumn}>
            {/* Hero Card - Course Name & Description */}
            <AppCard style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroTitleSection}>
                  <Text style={[styles.courseName, { color: theme.colors.textPrimary }]}>
                    {course.name}
                  </Text>
                  <Text style={[styles.courseCategory, { color: theme.colors.textSecondary }]}>
                    {course.category?.name || 'No Category'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isEnrolled ? '#10B98120' : theme.colors.primary + '20' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isEnrolled ? '#10B981' : theme.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isEnrolled ? '#10B981' : theme.colors.primary },
                    ]}
                  >
                    {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {course.description || 'No description available for this course.'}
              </Text>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Icon name="person-outline" size={16} color={theme.colors.textTertiary} />
                  <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                    {course.user?.name || 'Instructor'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="people-outline" size={16} color={theme.colors.textTertiary} />
                  <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                    {course.studentsCount || 0} students
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Progress Card (if enrolled) */}
            {isEnrolled && (
              <AppCard style={styles.card}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Your Progress
                </Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                      Course Completion
                    </Text>
                    <Text style={[styles.progressValue, { color: progress >= 100 ? '#10B981' : theme.colors.primary }]}>
                      {progress}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? '#10B981' : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressStats, { color: theme.colors.textTertiary }]}>
                    {topicStats.completed} of {topicStats.total} topics completed
                  </Text>
                </View>

                {progress >= 100 && (
                  <TouchableOpacity
                    style={[styles.certificateLink, { backgroundColor: '#10B98115' }]}
                    onPress={() => navigation.navigate('CertificatePreview', {
                      courseId: course.id,
                      courseName: course.name,
                    })}
                  >
                    <Icon name="ribbon" size={20} color="#10B981" />
                    <Text style={[styles.certificateLinkText, { color: '#10B981' }]}>
                      Get my certificate
                    </Text>
                    <Icon name="chevron-forward" size={18} color="#10B981" />
                  </TouchableOpacity>
                )}
              </AppCard>
            )}

            {/* Course Info Card */}
            <AppCard style={styles.card}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Course Info
              </Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: getLevelColor(course.level) + '15' }]}>
                    <Icon name="bar-chart-outline" size={18} color={getLevelColor(course.level)} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Level</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.level || 'All Levels'}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="language-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Language</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.language || 'English'}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: '#F59E0B15' }]}>
                    <Icon name="time-outline" size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Duration</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.duration || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: '#8B5CF615' }]}>
                    <Icon name="layers-outline" size={18} color="#8B5CF6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Topics</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.topics?.length || 0} topics</Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Topics Card */}
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
                  Course Content ({course.topics?.length || 0})
                </Text>
              </View>

              {course.topics && course.topics.length > 0 ? (
                <View style={styles.topicsList}>
                  {course.topics.map((topic, index) => {
                    const isLocked = !isEnrolled || topic.status === 'locked';
                    const isCompleted = topic.completed;

                    return (
                      <TouchableOpacity
                        key={topic.id}
                        style={[styles.topicItem, { backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.background }]}
                        onPress={() => {
                          if (!isLocked && isEnrolled) {
                            navigation.navigate('Learning', { courseId, topicId: topic.id });
                          } else if (!isEnrolled) {
                            Toast.show({
                              type: 'info',
                              text1: 'Enrollment Required',
                              text2: 'Please enroll to access this topic',
                            });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.topicNumber,
                            {
                              backgroundColor: isCompleted
                                ? '#10B981'
                                : isLocked
                                  ? theme.colors.textTertiary + '40'
                                  : theme.colors.primary,
                            },
                          ]}
                        >
                          {isCompleted ? (
                            <Icon name="checkmark" size={14} color="#FFFFFF" />
                          ) : isLocked ? (
                            <Icon name="lock-closed" size={12} color={theme.colors.textTertiary} />
                          ) : (
                            <Text style={styles.topicNumberText}>{index + 1}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                          <Text
                            style={[
                              styles.topicTitle,
                              { color: isLocked ? theme.colors.textTertiary : theme.colors.textPrimary, flex: 0 },
                            ]}
                            numberOfLines={1}
                          >
                            {topic.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Icon 
                              name={topic.topicType === 'live' ? 'videocam-outline' : 'play-circle-outline'} 
                              size={12} 
                              color={topic.topicType === 'live' ? '#E11D48' : '#10B981'} 
                            />
                            <Text style={{ 
                              fontSize: 11, 
                              fontWeight: '600', 
                              marginLeft: 4, 
                              color: topic.topicType === 'live' ? '#E11D48' : '#10B981' 
                            }}>
                              {topic.topicType === 'live' 
                                ? `Live Lecture${topic.liveLecture?.scheduledTime ? ` on ${new Date(topic.liveLecture.scheduledTime).toLocaleDateString()} ${new Date(topic.liveLecture.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}`
                                : 'Recorded'}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.topicStatusBadge,
                            {
                              backgroundColor: isCompleted
                                ? '#10B98115'
                                : isLocked
                                  ? theme.colors.textTertiary + '15'
                                  : theme.colors.primary + '15',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.topicStatusText,
                              {
                                color: isCompleted
                                  ? '#10B981'
                                  : isLocked
                                    ? theme.colors.textTertiary
                                    : theme.colors.primary,
                              },
                            ]}
                          >
                            {isCompleted ? 'Done' : isLocked ? 'Locked' : 'Start'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.emptySection, { borderColor: theme.colors.border }]}>
                  <Icon name="list-outline" size={28} color={theme.colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No topics added yet
                  </Text>
                </View>
              )}
            </AppCard>

            {/* Materials Card */}
            {course.materials && course.materials.length > 0 && (
              <AppCard style={styles.card}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Materials ({course.materials.length})
                </Text>

                <View style={styles.materialsList}>
                  {course.materials.map((material, index) => {
                    const fileUrl = resolveFileUrl(material.uri);
                    const canAccess = isEnrolled;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.materialItem,
                          {
                            backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.background,
                            borderColor: theme.colors.border,
                            opacity: canAccess ? 1 : 0.6,
                          },
                        ]}
                        onPress={() => {
                          if (!canAccess) {
                            Toast.show({
                              type: 'info',
                              text1: 'Enrollment Required',
                              text2: 'Please enroll to access materials',
                            });
                            return;
                          }
                          if (Platform.OS === 'web') {
                            window.open(fileUrl, '_blank');
                          } else {
                            Linking.openURL(fileUrl);
                          }
                        }}
                        disabled={!canAccess}
                      >
                        <Icon
                          name={material.type === 'pdf' ? 'document-text-outline' : 'image-outline'}
                          size={20}
                          color={canAccess ? theme.colors.primary : theme.colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.materialName,
                            { color: canAccess ? theme.colors.textPrimary : theme.colors.textTertiary },
                          ]}
                          numberOfLines={1}
                        >
                          {material.title || material.fileName || 'Material'}
                        </Text>
                        <Icon
                          name={canAccess ? 'download-outline' : 'lock-closed-outline'}
                          size={18}
                          color={canAccess ? theme.colors.primary : theme.colors.textTertiary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </AppCard>
            )}
          </Animated.View>

          {/* Side Column */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.sideColumn}>
            {/* Course Thumbnail Card */}
            <AppCard style={styles.thumbnailCard}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Course Preview
              </Text>

              {course.thumbnailImage ? (
                <Image
                  source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.border }]}>
                  <Icon name="image-outline" size={40} color={theme.colors.textTertiary} />
                  <Text style={[styles.thumbnailPlaceholderText, { color: theme.colors.textSecondary }]}>
                    No preview available
                  </Text>
                </View>
              )}
            </AppCard>

            {/* Actions Card */}
            <AppCard style={styles.card}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Actions
              </Text>

              <View style={styles.actionsList}>
                {!isEnrolled ? (
                  <AppButton
                    title={enrolling ? 'Enrolling...' : 'Enroll in Course'}
                    onPress={handleEnroll}
                    variant="primary"
                    leftIcon="add-circle-outline"
                    style={styles.actionBtn}
                    disabled={enrolling}
                    loading={enrolling}
                  />
                ) : (
                  <>
                    <AppButton
                      title={progress > 0 ? 'Continue Learning' : 'Start Learning'}
                      onPress={handleStartLearning}
                      variant="primary"
                      leftIcon="play-circle-outline"
                      style={styles.actionBtn}
                    />
                    <AppButton
                      title={unenrolling ? 'Unenrolling...' : 'Unenroll'}
                      onPress={handleUnenroll}
                      variant="danger"
                      leftIcon="exit-outline"
                      style={styles.actionBtn}
                      disabled={unenrolling}
                      loading={unenrolling}
                    />
                  </>
                )}
              </View>
            </AppCard>

            {/* Info Card */}
            {!isEnrolled && (
              <AppCard style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
                <Icon name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.infoCardText, { color: theme.colors.primary }]}>
                  Enroll in this course to access all topics, track your progress, and earn a certificate upon completion.
                </Text>
              </AppCard>
            )}

            {/* Instructor Card */}
            {course.user && (
              <AppCard style={styles.card}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Instructor
                </Text>
                <View style={styles.instructorInfo}>
                  <View style={[styles.instructorAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Icon name="person" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.instructorDetails}>
                    <Text style={[styles.instructorName, { color: theme.colors.textPrimary }]}>
                      {course.user.name || 'Instructor'}
                    </Text>
                    <Text style={[styles.instructorRole, { color: theme.colors.textSecondary }]}>
                      Course Creator
                    </Text>
                  </View>
                </View>
              </AppCard>
            )}
          </Animated.View>
        </View>
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
    emptyWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },

    // Page Header Banner
    pageHeaderBanner: {
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isTablet ? 'center' : 'flex-start',
      padding: isMobile ? 14 : 18,
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
    headerButton: {
      minWidth: isMobile ? '100%' : 180,
    },

    // Content Grid
    contentGrid: {
      flexDirection: isTablet ? 'row' : 'column',
      gap: 20,
    },
    mainColumn: {
      flex: isTablet ? 2 : undefined,
      width: isTablet ? undefined : '100%',
      gap: 20,
    },
    sideColumn: {
      flex: isTablet ? 1 : undefined,
      width: isTablet ? undefined : '100%',
      gap: 20,
    },

    // Hero Card
    heroCard: {
      padding: isMobile ? 16 : 20,
      borderTopWidth: 3,
      borderTopColor: theme.colors.primary,
      overflow: 'hidden',
    },
    heroHeader: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'flex-start',
      marginBottom: 12,
      gap: isMobile ? 8 : 12,
    },
    heroTitleSection: {
      flex: isMobile ? undefined : 1,
      width: isMobile ? '100%' : undefined,
    },
    courseName: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: '700',
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily.bold,
    },
    courseCategory: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
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
    description: {
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
      fontFamily: theme.typography.fontFamily.regular,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Cards
    card: {
      padding: isMobile ? 16 : 20,
      borderTopWidth: 3,
      borderTopColor: theme.colors.primary,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      fontFamily: theme.typography.fontFamily.semiBold,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 10,
    },

    // Progress
    progressContainer: {
      marginBottom: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    progressValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    progressBarBg: {
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    progressStats: {
      fontSize: 13,
    },
    certificateLink: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      gap: 10,
    },
    certificateLinkText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },

    // Info Grid
    infoGrid: {
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 12 : 16,
    },
    infoGridItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      ...(Platform.OS === 'web' ? {
        width: isMobile ? '100%' : 'calc(50% - 8px)',
      } : {
        width: isMobile ? '100%' : '48%',
      }),
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      marginBottom: 2,
      fontFamily: theme.typography.fontFamily.regular,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Topics
    topicsList: {
      gap: 8,
    },
    topicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      gap: 12,
    },
    topicNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topicNumberText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    topicTitle: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },
    topicStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    topicStatusText: {
      fontSize: 11,
      fontWeight: '600',
    },

    // Materials
    materialsList: {
      gap: 8,
    },
    materialItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      gap: 10,
    },
    materialName: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Empty Section
    emptySection: {
      padding: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Thumbnail Card
    thumbnailCard: {
      padding: isMobile ? 16 : 20,
    },
    thumbnailImage: {
      width: '100%',
      height: isMobile ? 200 : 180,
      borderRadius: 12,
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: isMobile ? 200 : 180,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    thumbnailPlaceholderText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Actions
    actionsList: {
      gap: 10,
    },
    actionBtn: {
      width: '100%',
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

    // Instructor
    instructorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    instructorAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    instructorDetails: {
      flex: 1,
    },
    instructorName: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    instructorRole: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },
  });

export default CourseDetailScreen;
