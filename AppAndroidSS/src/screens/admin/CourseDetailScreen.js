import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Linking,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const GREEN = '#007A3D';
const RED = '#CE1126';

const TOPIC_COLORS = [
  '#3B82F6',
  '#10B981',
  '#007A3D',
  '#F97316',
  '#EC4899',
  '#06B6D4',
  '#EF4444',
  '#F59E0B',
];

const CourseDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params;
  const { courses, updateCourse, deleteCourse } = useData();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const course = courses.find(c => c.id === courseId);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  // Permission checks
  const isOwner = course?.user?.id === user?.id;
  const isSuperAdmin = user?.role === 'superadmin';
  const canManageAllCourses = user?.permissions?.canManageAllCourses === true;
  const canEdit = isOwner || isSuperAdmin || canManageAllCourses;

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

  const handleNavigate = (navRoute) => {
    if (isSuperAdmin) {
      if (navRoute === 'ManageAdmins') {
        navigation.navigate('ManageUsers', { userType: 'instructor' });
      } else if (navRoute === 'ManageExperts') {
        navigation.navigate('ManageUsers', { userType: 'expert' });
      } else if (navRoute === 'Categories') {
        navigation.navigate('CategoryManagement');
      } else {
        navigation.navigate(navRoute);
      }
    } else {
      navigation.navigate(navRoute);
    }
  };

  const handlePublish = () => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    const message = newStatus === 'published' ? 'Course published!' : 'Course unpublished!';
    updateCourse(courseId, { status: newStatus });
    Toast.show({ type: 'success', text1: 'Success', text2: message });
  };

  // Alias used by pageHeaderBanner onPress
  const handlePublishToggle = handlePublish;

  const handleDelete = () => {
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    setShowConfirmDialog(false);
    const result = await deleteCourse(courseId);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Success', text2: 'Course deleted!' });
      navigation.goBack();
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to delete' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  if (!course) {
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
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="alert-circle-outline"
            title="Course not found"
            subtitle="The course you're looking for doesn't exist"
          />
        </View>
      </MainLayout>
    );
  }

  const isPublished = course.status === 'published';

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
        {/* Page Header Banner — matches CourseListScreen design language */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
          borderColor: 'rgba(0,122,61,0.15)',
          borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24,
          flexDirection: isTablet ? 'row' : 'column',
          justifyContent: 'space-between', alignItems: isTablet ? 'center' : 'flex-start', gap: 12,
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)', borderRadius: 10, padding: 10 }}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ backgroundColor: GREEN + '20', borderRadius: 12, padding: 12 }}>
              <Icon name="book" size={22} color={GREEN} />
            </View>
            <View>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
                {course?.name || 'Course Details'}
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                {course?.topics?.length || 0} topics · {course?.status || 'draft'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => navigation.navigate('CreateCourse', { courseId: course.id })}
            >
              <Icon name="create-outline" size={16} color={theme.colors.textPrimary} />
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: course?.status === 'published' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={handlePublishToggle}
            >
              <Icon name={course?.status === 'published' ? 'eye-off-outline' : 'checkmark-circle-outline'} size={16} color={course?.status === 'published' ? '#EF4444' : '#10B981'} />
              <Text style={{ color: course?.status === 'published' ? '#EF4444' : '#10B981', fontWeight: '600', fontSize: 13 }}>
                {course?.status === 'published' ? 'Unpublish' : 'Publish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Grid */}
        <View style={styles.contentGrid}>
          {/* Main Column */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.mainColumn}>

            {/* Hero / Course Info Card */}
            <AppCard style={styles.heroCard}>
              {/* Thumbnail or colored placeholder */}
              {course.thumbnailImage ? (
                <View style={styles.heroThumbContainer}>
                  <Image
                    source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                    style={styles.heroThumbImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.heroThumbOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
                  <View style={[
                    styles.heroStatusOverlay,
                    { backgroundColor: isPublished ? '#10B981' : '#F59708' },
                  ]}>
                    <Icon name={isPublished ? 'checkmark-circle' : 'time'} size={12} color="#fff" />
                    <Text style={styles.heroStatusOverlayText}>
                      {isPublished ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
              ) : (
                /* Colored placeholder when no thumbnail */
                <View style={[styles.heroThumbContainer, styles.heroThumbPlaceholder, {
                  backgroundColor: isDark ? 'rgba(0,122,61,0.12)' : 'rgba(0,122,61,0.08)',
                }]}>
                  <View style={{ backgroundColor: GREEN + '25', borderRadius: 20, padding: 18 }}>
                    <Icon name="book" size={40} color={GREEN} />
                  </View>
                  <View style={[
                    styles.heroStatusOverlay,
                    { backgroundColor: isPublished ? '#10B981' : '#F59708' },
                  ]}>
                    <Icon name={isPublished ? 'checkmark-circle' : 'time'} size={12} color="#fff" />
                    <Text style={styles.heroStatusOverlayText}>
                      {isPublished ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.heroBody}>
                <View style={styles.heroHeader}>
                  <View style={styles.heroTitleSection}>
                    <Text style={[styles.courseName, { color: theme.colors.textPrimary }]}>
                      {course.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isPublished ? '#10B98120' : '#F5970820' },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isPublished ? '#10B981' : '#F59708' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: isPublished ? '#10B981' : '#F59708' },
                      ]}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>

                {/* Meta badges row */}
                <View style={styles.metaBadgesRow}>
                  {course.category?.name && (
                    <View style={[styles.metaBadge, { backgroundColor: '#007A3D' + '18', borderWidth: 1, borderColor: '#007A3D' + '30' }]}>
                      <Icon name="layers" size={13} color="#007A3D" />
                      <Text style={[styles.metaBadgeText, { color: '#007A3D' }]}>{course.category.name}</Text>
                    </View>
                  )}
                  {course.level && (
                    <View style={[styles.metaBadge, { backgroundColor: GREEN + '18', borderWidth: 1, borderColor: GREEN + '30' }]}>
                      <Icon name="bar-chart" size={13} color={GREEN} />
                      <Text style={[styles.metaBadgeText, { color: GREEN }]}>{course.level}</Text>
                    </View>
                  )}
                  {course.language && (
                    <View style={[styles.metaBadge, { backgroundColor: '#10B981' + '18', borderWidth: 1, borderColor: '#10B981' + '30' }]}>
                      <Icon name="language" size={13} color="#10B981" />
                      <Text style={[styles.metaBadgeText, { color: '#10B981' }]}>{course.language}</Text>
                    </View>
                  )}
                  {course.duration && (
                    <View style={[styles.metaBadge, { backgroundColor: '#007A3D' + '18', borderWidth: 1, borderColor: '#007A3D' + '30' }]}>
                      <Icon name="time" size={13} color="#007A3D" />
                      <Text style={[styles.metaBadgeText, { color: '#007A3D' }]}>{course.duration}</Text>
                    </View>
                  )}
                  {/* Enrollment count chip */}
                  <View style={[styles.metaBadge, { backgroundColor: '#EC4899' + '18', borderWidth: 1, borderColor: '#EC4899' + '30' }]}>
                    <Icon name="people" size={13} color="#EC4899" />
                    <Text style={[styles.metaBadgeText, { color: '#EC4899' }]}>
                      {course.enrollments?.length || 0} enrolled
                    </Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                  {course.description}
                </Text>

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Icon name="person-outline" size={15} color={theme.colors.textTertiary} />
                    <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                      {course.user?.name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="calendar-outline" size={15} color={theme.colors.textTertiary} />
                    <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                      Updated {formatDate(course.updatedAt)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="add-circle-outline" size={15} color={theme.colors.textTertiary} />
                    <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                      Created {formatDate(course.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Course Info Card */}
            <AppCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: GREEN + '18' }]}>
                  <Icon name="information-circle" size={18} color={GREEN} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Info</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: '#007A3D' + '18' }]}>
                    <Icon name="bar-chart-outline" size={18} color="#007A3D" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Level</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.level}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: '#10B981' + '18' }]}>
                    <Icon name="language-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Language</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.language}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: '#007A3D' + '18' }]}>
                    <Icon name="time-outline" size={18} color="#007A3D" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Duration</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{course.duration}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: GREEN + '18' }]}>
                    <Icon name="calendar-outline" size={18} color={GREEN} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Created</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{formatDate(course.createdAt)}</Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Topics Card */}
            <AppCard style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: '#007A3D' + '18' }]}>
                    <Icon name="list" size={18} color="#007A3D" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    Topics ({course.topics?.length || 0})
                  </Text>
                </View>
                <AppButton
                  title={canEdit ? 'Manage' : 'View'}
                  onPress={() => navigation.navigate('AddTopics', { courseId })}
                  variant="outline"
                  size="sm"
                  leftIcon={canEdit ? 'settings-outline' : 'eye-outline'}
                />
              </View>

              {course.topics && course.topics.length > 0 ? (
                <View style={styles.topicsList}>
                  {course.topics.map((topic, index) => {
                    const topicColor = TOPIC_COLORS[index % TOPIC_COLORS.length];
                    return (
                      <View
                        key={topic.id}
                        style={[
                          styles.topicItem,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.04)'
                              : theme.colors.background,
                            borderLeftColor: topicColor,
                            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.07)',
                          },
                        ]}
                      >
                        <View style={[styles.topicNumber, { backgroundColor: topicColor }]}>
                          <Text style={styles.topicNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.topicTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                          {topic.title}
                        </Text>
                        {/* Materials shown as chips */}
                        {topic.materials?.length > 0 && (
                          <View style={styles.topicChipsRow}>
                            {topic.materials.slice(0, 3).map((mat, mIdx) => {
                              const isPdf = mat.type === 'pdf';
                              const chipColor = isPdf ? '#EF4444' : '#06B6D4';
                              return (
                                <View
                                  key={mIdx}
                                  style={[styles.topicChip, { backgroundColor: chipColor + '18', borderColor: chipColor + '30', borderWidth: 1 }]}
                                >
                                  <Icon
                                    name={isPdf ? 'document-text-outline' : 'image-outline'}
                                    size={11}
                                    color={chipColor}
                                  />
                                  <Text style={[styles.topicChipText, { color: chipColor }]} numberOfLines={1}>
                                    {mat.title || mat.fileName || 'File'}
                                  </Text>
                                </View>
                              );
                            })}
                            {topic.materials.length > 3 && (
                              <View style={[styles.topicChip, { backgroundColor: topicColor + '18', borderColor: topicColor + '30', borderWidth: 1 }]}>
                                <Text style={[styles.topicChipText, { color: topicColor }]}>
                                  +{topic.materials.length - 3} more
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        <View style={[styles.topicMatCount, { backgroundColor: topicColor + '18' }]}>
                          <Text style={[styles.topicMatCountText, { color: topicColor }]}>
                            {topic.materials?.length || 0}
                          </Text>
                        </View>
                      </View>
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
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: '#06B6D4' + '18' }]}>
                    <Icon name="folder-open" size={18} color="#06B6D4" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    Materials ({course.materials.length})
                  </Text>
                </View>

                {/* Materials grid */}
                <View style={styles.materialsGrid}>
                  {course.materials.map((material, index) => {
                    const fileUrl = resolveFileUrl(material.uri);
                    const isPdf = material.type === 'pdf';
                    const matColor = isPdf ? '#EF4444' : '#06B6D4';

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.materialGridItem,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.04)'
                              : theme.colors.background,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
                            borderTopColor: matColor,
                          },
                        ]}
                        onPress={() => {
                          if (Platform.OS === 'web') {
                            window.open(fileUrl, '_blank');
                          } else {
                            Linking.openURL(fileUrl);
                          }
                        }}
                      >
                        <View style={[styles.materialGridIcon, { backgroundColor: matColor + '18' }]}>
                          <Icon
                            name={isPdf ? 'document-text-outline' : 'image-outline'}
                            size={24}
                            color={matColor}
                          />
                        </View>
                        <Text style={[styles.materialGridName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                          {material.title || material.fileName || 'Material'}
                        </Text>
                        <View style={[styles.materialGridType, { backgroundColor: matColor + '14' }]}>
                          <Text style={[styles.materialGridTypeText, { color: matColor }]}>
                            {material.type?.toUpperCase() || 'FILE'}
                          </Text>
                        </View>
                        <View style={[styles.materialDownloadBtn, { backgroundColor: matColor + '15' }]}>
                          <Icon name="download-outline" size={15} color={matColor} />
                          <Text style={[styles.materialDownloadText, { color: matColor }]}>Download</Text>
                        </View>
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
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: '#EC4899' + '18' }]}>
                  <Icon name="image" size={18} color="#EC4899" />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Course Thumbnail
                </Text>
              </View>

              {course.thumbnailImage ? (
                <View style={styles.thumbContainer}>
                  <Image
                    source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={[
                    styles.thumbStatusBadge,
                    { backgroundColor: isPublished ? '#10B981' : '#F59708' },
                  ]}>
                    <Icon name={isPublished ? 'checkmark-circle' : 'time'} size={12} color="#fff" />
                    <Text style={styles.thumbStatusText}>{isPublished ? 'Published' : 'Draft'}</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.thumbnailPlaceholder, {
                  backgroundColor: isDark ? 'rgba(0,122,61,0.08)' : 'rgba(0,122,61,0.06)',
                  borderColor: GREEN + '30',
                }]}>
                  <View style={{ backgroundColor: GREEN + '20', borderRadius: 16, padding: 14 }}>
                    <Icon name="image-outline" size={36} color={GREEN} />
                  </View>
                  <Text style={[styles.thumbnailPlaceholderText, { color: theme.colors.textSecondary }]}>
                    No thumbnail
                  </Text>
                </View>
              )}
            </AppCard>

            {/* Actions Card */}
            {canEdit ? (
              <AppCard style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: GREEN + '18' }]}>
                    <Icon name="flash" size={18} color={GREEN} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Actions</Text>
                </View>

                <View style={styles.actionsList}>
                  <TouchableOpacity
                    style={[
                      styles.actionCardBtn,
                      {
                        backgroundColor: isPublished ? '#F59708' + '12' : '#10B981' + '12',
                        borderColor: isPublished ? '#F59708' + '40' : '#10B981' + '40',
                      },
                    ]}
                    onPress={handlePublish}
                  >
                    <View style={[styles.actionBtnIcon, { backgroundColor: isPublished ? '#F59708' + '25' : '#10B981' + '25' }]}>
                      <Icon
                        name={isPublished ? 'eye-off-outline' : 'checkmark-circle-outline'}
                        size={20}
                        color={isPublished ? '#F59708' : '#10B981'}
                      />
                    </View>
                    <View style={styles.actionBtnText}>
                      <Text style={[styles.actionBtnTitle, { color: theme.colors.textPrimary }]}>
                        {isPublished ? 'Unpublish Course' : 'Publish Course'}
                      </Text>
                      <Text style={[styles.actionBtnDesc, { color: theme.colors.textSecondary }]}>
                        {isPublished ? 'Move back to draft' : 'Make visible to students'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionCardBtn, { backgroundColor: '#EF4444' + '10', borderColor: '#EF4444' + '30' }]}
                    onPress={handleDelete}
                  >
                    <View style={[styles.actionBtnIcon, { backgroundColor: '#EF4444' + '20' }]}>
                      <Icon name="trash-outline" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.actionBtnText}>
                      <Text style={[styles.actionBtnTitle, { color: theme.colors.textPrimary }]}>Delete Course</Text>
                      <Text style={[styles.actionBtnDesc, { color: theme.colors.textSecondary }]}>
                        Permanently remove this course
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </AppCard>
            ) : (
              <AppCard style={[styles.infoCard, { backgroundColor: theme.colors.infoLight || theme.colors.primary + '10' }]}>
                <Icon name="information-circle" size={20} color={theme.colors.info || theme.colors.primary} />
                <Text style={[styles.infoCardText, { color: theme.colors.info || theme.colors.primary }]}>
                  Only the course creator or admin can edit this course.
                </Text>
              </AppCard>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirmDialog}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDialog(false)}
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
      padding: isMobile ? 16 : 24,
      paddingBottom: 40,
    },
    emptyWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },

    // Page Header Banner (inline styles override via JSX, this is the base)
    pageHeaderBanner: {
      // Dimensions and flex direction applied inline from the JSX
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

    // Section headers shared style
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    sectionIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Hero Card
    heroCard: {
      padding: 0,
      overflow: 'hidden',
    },
    heroThumbContainer: {
      height: isMobile ? 160 : 200,
      position: 'relative',
    },
    heroThumbPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroThumbImage: {
      width: '100%',
      height: '100%',
    },
    heroThumbOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    heroStatusOverlay: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    heroStatusOverlayText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    heroBody: {
      padding: isMobile ? 16 : 20,
    },
    heroHeader: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: isMobile ? 8 : 12,
    },
    heroTitleSection: {
      flex: isMobile ? undefined : 1,
      width: isMobile ? '100%' : undefined,
    },
    courseName: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: '700',
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily.bold,
      lineHeight: isMobile ? 26 : 32,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 6,
      alignSelf: 'flex-start',
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    metaBadgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    metaBadgeText: {
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
      gap: 14,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Cards
    card: {
      padding: isMobile ? 16 : 20,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // Topics
    topicsList: {
      gap: 8,
    },
    topicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      gap: 10,
      borderLeftWidth: 3,
      borderWidth: 1,
      flexWrap: 'wrap',
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
      fontWeight: '500',
      fontFamily: theme.typography.fontFamily.regular,
    },
    topicChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      flex: isMobile ? undefined : 1,
      width: isMobile ? '100%' : undefined,
    },
    topicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    topicChipText: {
      fontSize: 11,
      fontWeight: '500',
      maxWidth: 80,
    },
    topicMatCount: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    topicMatCountText: {
      fontSize: 12,
      fontWeight: '700',
    },

    // Materials Grid
    materialsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    materialGridItem: {
      borderRadius: 12,
      borderWidth: 1,
      borderTopWidth: 3,
      padding: 14,
      gap: 8,
      alignItems: 'flex-start',
      ...(Platform.OS === 'web' ? {
        width: isMobile ? '100%' : 'calc(50% - 6px)',
      } : {
        width: isMobile ? '100%' : '48%',
      }),
    },
    materialGridIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    materialGridName: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    materialGridType: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    materialGridTypeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    materialDownloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    materialDownloadText: {
      fontSize: 12,
      fontWeight: '600',
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

    // Thumbnail Card (in sidebar)
    thumbnailCard: {
      padding: isMobile ? 16 : 20,
    },
    thumbContainer: {
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
    },
    thumbnailImage: {
      width: '100%',
      height: isMobile ? 200 : 180,
      borderRadius: 12,
    },
    thumbStatusBadge: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    thumbStatusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: isMobile ? 200 : 180,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    thumbnailPlaceholderText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Info List
    infoList: {
      gap: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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

    // Actions
    actionsList: {
      gap: 10,
    },
    actionCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    actionBtnIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionBtnText: {
      flex: 1,
    },
    actionBtnTitle: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: 2,
    },
    actionBtnDesc: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Info Card
    infoCard: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      gap: 12,
    },
    infoCardText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: theme.typography.fontFamily.regular,
    },
  });

export default CourseDetailScreen;
