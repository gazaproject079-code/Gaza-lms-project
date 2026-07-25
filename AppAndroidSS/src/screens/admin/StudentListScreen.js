import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ScrollView,
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

const GREEN = '#007A3D';
const RED = '#CE1126';

const StudentListScreen = () => {
  const { students, fetchStudents, toggleUserStatus } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Fetch students on mount
  React.useEffect(() => {
    fetchStudents();
  }, []);

  const statusOptions = [
    { label: 'All Students', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  // Stats calculation
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.isActive).length;
    const inactiveStudents = students.filter(s => !s.isActive).length;
    return { totalStudents, activeStudents, inactiveStudents };
  }, [students]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || student.isActive === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = async (student) => {
    setLoading(true);
    await toggleUserStatus(student.id);
    setLoading(false);
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  // Vibrant avatar color palette keyed by first character
  const getAvatarColor = (name, isActive) => {
    if (!isActive) return '#EF4444';
    const palette = ['#007A3D', '#22D3EE', '#10B981', GREEN, '#007A3D', '#EC4899', '#F59E0B', '#3B82F6'];
    const idx = name.charCodeAt(0) % palette.length;
    return palette[idx];
  };

  const renderStudentCard = (student, index) => {
    const avatarColor = getAvatarColor(student.name, student.isActive);
    return (
      <Animated.View
        key={student.id}
        entering={FadeInDown.duration(400).delay(index * 80)}
        style={styles.studentCardWrapper}
      >
        <TouchableOpacity
          style={[
            styles.studentCard,
            {
              backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)',
            },
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('StudentDetail', { studentId: student.id })}
        >
          {/* Avatar & Info */}
          <View style={styles.studentHeader}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={[styles.studentName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {student.name}
              </Text>
              <Text style={[styles.studentEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {student.email}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: student.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  borderWidth: 1,
                  borderColor: student.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
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
                {student.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="call-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                {student.phone || 'No phone'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="school-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                {student.qualification || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: GREEN,
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={() => navigation.navigate('StudentDetail', { studentId: student.id })}
            >
              <Icon name="eye-outline" size={15} color={GREEN} />
              <Text style={[styles.actionBtnText, { color: GREEN }]}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.toggleBtn,
                { backgroundColor: student.isActive ? '#EF4444' : '#10B981', borderColor: student.isActive ? '#EF4444' : '#10B981' },
              ]}
              onPress={() => handleStatusToggle(student)}
              disabled={loading}
            >
              <Icon name={student.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'} size={15} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                {student.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
              <Icon name="people" size={22} color="#22D3EE" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Students
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Manage student accounts and track their progress
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {/* Total Students */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(34,211,238,0.12)' }]}>
              <Icon name="people" size={20} color="#22D3EE" />
            </View>
            <Text style={[styles.statValueNew, { color: '#22D3EE' }]}>
              {stats.totalStudents}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Total Students
            </Text>
          </View>

          {/* Active */}
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
              {stats.activeStudents}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Active
            </Text>
          </View>

          {/* Inactive */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Icon name="close-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.statValueNew, { color: '#EF4444' }]}>
              {stats.inactiveStudents}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Inactive
            </Text>
          </View>
        </View>

        {/* Search & Filter Section */}
        <AppCard style={styles.filterCard} allowOverflow>
          <AppInput
            placeholder="Search students by name or email..."
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
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {statusFilter === null ? 'Filter by Status' : statusFilter ? 'Active' : 'Inactive'}
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
          </View>
        </AppCard>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <View style={styles.studentsGrid}>
            {filteredStudents.map((student, index) => renderStudentCard(student, index))}
          </View>
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="people-outline"
              title="No students found"
              subtitle="There are no students matching your search"
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

    // Students Grid
    studentsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    studentCardWrapper: {
      width: isLargeScreen
        ? 'calc(33.333% - 11px)'
        : isTablet
          ? 'calc(50% - 8px)'
          : '100%',
      ...(Platform.OS !== 'web' && {
        width: isLargeScreen ? '31%' : isTablet ? '48%' : '100%',
      }),
    },
    studentCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: isMobile ? 14 : 16,
      ...theme.shadows.sm,
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: theme.typography.fontFamily.bold,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    studentEmail: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },
    statusRow: {
      marginBottom: 12,
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
    toggleBtn: {
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

export default StudentListScreen;
