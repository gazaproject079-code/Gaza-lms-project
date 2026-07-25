import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const GREEN = '#007A3D';
const RED = '#CE1126';

const StudentDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId } = route.params;
  const { students, toggleUserStatus } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const student = students.find(s => s.id === studentId);

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

  const handleBlockToggle = async () => {
    await toggleUserStatus(student.id);
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  if (!student) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="Students"
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: isSuperAdmin ? 'Admin' : 'Instructor', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="alert-circle-outline"
            title="Student not found"
            subtitle="The student you're looking for doesn't exist"
          />
        </View>
      </MainLayout>
    );
  }

  // Vibrant avatar color based on name
  const avatarPalette = ['#007A3D', '#22D3EE', '#10B981', GREEN, '#007A3D', '#EC4899', '#F59E0B', '#3B82F6'];
  const avatarColor = student.isActive
    ? avatarPalette[student.name.charCodeAt(0) % avatarPalette.length]
    : '#EF4444';

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Students"
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
              backgroundColor: isDark ? 'rgba(34,211,238,0.06)' : 'rgba(34,211,238,0.05)',
              borderColor: 'rgba(34,211,238,0.15)',
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
              <Icon name="school" size={22} color="#22D3EE" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Student Details
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                View and manage student information
              </Text>
            </View>
          </View>
        </View>

        {/* Content Grid */}
        <View style={styles.contentGrid}>
          {/* Main Column */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.mainColumn}>
            {/* Profile Hero Card */}
            <AppCard style={styles.heroCard}>
              <View style={styles.profileHeader}>
                {/* Large Avatar */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: avatarColor,
                      shadowColor: avatarColor,
                      ...(Platform.OS === 'web' && { boxShadow: `0 4px 20px ${avatarColor}55` }),
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={[styles.studentName, { color: theme.colors.textPrimary }]}>
                    {student.name}
                  </Text>
                  <Text style={[styles.studentEmail, { color: theme.colors.textSecondary }]}>
                    {student.email}
                  </Text>
                  {/* Prominent Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: student.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        borderWidth: 1,
                        borderColor: student.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: student.isActive ? '#10B981' : '#EF4444' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: student.isActive ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {student.isActive ? 'Active Account' : 'Inactive Account'}
                    </Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Student Info Card */}
            <AppCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Icon name="person" size={16} color="#007A3D" />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Student Information
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="mail-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Email</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{student.email}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="call-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Phone</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{student.phone || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Age</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{student.age ? `${student.age} years` : 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.infoGridItem}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="school-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Qualification</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{student.qualification || 'Not provided'}</Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Progress Card */}
            <AppCard style={styles.card}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Icon name="trending-up" size={16} color="#10B981" />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Overall Progress
                </Text>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                    Completion Rate
                  </Text>
                  <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
                    {student.progress || 0}%
                  </Text>
                </View>
                <ProgressBar
                  progress={student.progress || 0}
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                    {student.enrolledCourses || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>
                    Enrolled Courses
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#10B981' }]}>
                    {student.completedCourses || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>
                    Completed
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                    {student.certificates || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>
                    Certificates
                  </Text>
                </View>
              </View>
            </AppCard>
          </Animated.View>

          {/* Side Column */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.sideColumn}>
            {/* Account Info Card */}
            <AppCard style={[styles.card, styles.sideCard]}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(0,122,61,0.12)' }]}>
                  <Icon name="time" size={16} color={GREEN} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Account Info
                </Text>
              </View>

              <View style={styles.accountInfoList}>
                <View
                  style={[
                    styles.accountInfoItem,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,46,0.03)',
                      borderRadius: 10,
                      padding: 12,
                    },
                  ]}
                >
                  <View style={[styles.accountInfoIconCircle, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                    <Icon name="time-outline" size={16} color="#007A3D" />
                  </View>
                  <View style={styles.accountInfoContent}>
                    <Text style={[styles.accountInfoLabel, { color: theme.colors.textTertiary }]}>Member Since</Text>
                    <Text style={[styles.accountInfoValue, { color: theme.colors.textPrimary }]}>
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.accountInfoItem,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,46,0.03)',
                      borderRadius: 10,
                      padding: 12,
                    },
                  ]}
                >
                  <View style={[styles.accountInfoIconCircle, { backgroundColor: 'rgba(34,211,238,0.12)' }]}>
                    <Icon name="log-in-outline" size={16} color="#22D3EE" />
                  </View>
                  <View style={styles.accountInfoContent}>
                    <Text style={[styles.accountInfoLabel, { color: theme.colors.textTertiary }]}>Last Login</Text>
                    <Text style={[styles.accountInfoValue, { color: theme.colors.textPrimary }]}>
                      {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never'}
                    </Text>
                  </View>
                </View>
              </View>
            </AppCard>

            {/* Actions Card */}
            <AppCard style={[styles.card, styles.sideCard]}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: 'rgba(239,68,68,0.10)' }]}>
                  <Icon name="settings" size={16} color="#EF4444" />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Actions
                </Text>
              </View>

              <View style={styles.actionsList}>
                <AppButton
                  title={student.isActive ? 'Deactivate Account' : 'Activate Account'}
                  onPress={handleBlockToggle}
                  variant={student.isActive ? 'danger' : 'primary'}
                  leftIcon={student.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  style={styles.actionBtn}
                />
                <AppButton
                  title="Send Message"
                  onPress={() => {}}
                  variant="outline"
                  leftIcon="mail-outline"
                  style={styles.actionBtn}
                />
              </View>
            </AppCard>

            {/* Info Notice Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: student.isActive
                    ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.07)')
                    : (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.07)'),
                  borderColor: student.isActive
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(239,68,68,0.2)',
                },
              ]}
            >
              <Icon
                name="information-circle"
                size={20}
                color={student.isActive ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.infoCardText,
                  { color: student.isActive ? '#10B981' : '#EF4444' },
                ]}
              >
                {student.isActive
                  ? 'This student account is active and can access all enrolled courses.'
                  : 'This student account is deactivated and cannot access the platform.'}
              </Text>
            </View>
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
      backgroundColor: 'rgba(34,211,238,0.15)',
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
      padding: isMobile ? 16 : 24,
    },
    profileHeader: {
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'center' : 'flex-start',
      gap: 20,
    },
    avatar: {
      width: isMobile ? 90 : 100,
      height: isMobile ? 90 : 100,
      borderRadius: isMobile ? 45 : 50,
      justifyContent: 'center',
      alignItems: 'center',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    avatarText: {
      fontSize: isMobile ? 36 : 42,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: theme.typography.fontFamily.bold,
    },
    profileInfo: {
      flex: isMobile ? undefined : 1,
      alignItems: isMobile ? 'center' : 'flex-start',
    },
    studentName: {
      fontSize: isMobile ? 22 : 26,
      fontWeight: '700',
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily.bold,
      textAlign: isMobile ? 'center' : 'left',
    },
    studentEmail: {
      fontSize: 14,
      marginBottom: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Cards
    card: {
      padding: isMobile ? 16 : 20,
    },
    sideCard: {
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.06)',
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    cardTitleIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
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

    // Progress Section
    progressSection: {
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    progressLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },
    progressValue: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },

    // Stats Row
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: '700',
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily.bold,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      height: 40,
    },

    // Account Info
    accountInfoList: {
      gap: 10,
    },
    accountInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    accountInfoIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accountInfoContent: {
      flex: 1,
    },
    accountInfoLabel: {
      fontSize: 12,
      marginBottom: 2,
      fontFamily: theme.typography.fontFamily.regular,
    },
    accountInfoValue: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Actions
    actionsList: {
      gap: 10,
    },
    actionBtn: {
      width: '100%',
    },

    // Info Notice Card
    infoCard: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
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

export default StudentDetailScreen;
