import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const GREEN = '#007A3D';
const RED = '#CE1126';

const SettingsScreen = () => {
  const { logout, user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;
  const maxWidth = isWeb && width > 1200 ? 1200 : '100%';

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

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'New passwords do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Password changed successfully',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', {
      email: user?.email,
      fromSettings: true
    });
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getRoleLabel = () => {
    if (user?.role === 'superadmin') return 'Admin';
    if (user?.role === 'instructor') return 'Instructor';
    if (user?.role === 'sponsor') return 'Sponsor';
    return 'Student';
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Settings"
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: isSuperAdmin ? 'Admin' : 'Instructor', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => {}}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { maxWidth, alignSelf: 'center', width: '100%' }]}
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
              <Icon name="settings" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Account Settings
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Manage your profile and security
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
            },
          ]}
        >
          {/* Avatar */}
          <View style={[styles.avatarCircle, { backgroundColor: GREEN + '20', borderColor: GREEN + '40' }]}>
            <Text style={[styles.avatarInitials, { color: GREEN }]}>
              {getUserInitials(user?.name)}
            </Text>
          </View>

          {/* Name & Role */}
          <View style={styles.profileTextBlock}>
            <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
              {user?.name || 'User'}
            </Text>
            {user?.email ? (
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
                {user.email}
              </Text>
            ) : null}
          </View>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: GREEN + '18', borderColor: GREEN + '35' }]}>
            <Text style={[styles.roleBadgeText, { color: GREEN }]}>
              {getRoleLabel()}
            </Text>
          </View>
        </View>

        {/* Password Change Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
            },
          ]}
        >
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.05)' }]}>
              <Icon name="lock-closed" size={18} color={theme.colors.textSecondary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Change Password
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                Keep your account secure with a strong password
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.07)' }]} />

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Icon name="lock-closed-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Current Password
              </Text>
            </View>
            <AppInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              placeholder="Enter current password"
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Icon name="key-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                New Password
              </Text>
            </View>
            <AppInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Icon name="checkmark-circle-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Confirm New Password
              </Text>
            </View>
            <AppInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Confirm new password"
            />
          </View>

          {/* Change Password Button */}
          <AppButton
            title="Update Password"
            onPress={handleChangePassword}
            variant="primary"
            style={styles.changePasswordButton}
            icon={<Icon name="key" size={14} color="#ffffff" />}
            iconPosition="left"
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordLink}
          >
            <Text style={[styles.forgotPasswordText, { color: GREEN }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
              borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
            },
          ]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Icon name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
      paddingBottom: 48,
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

    // Profile Card
    profileCard: {
      flexDirection: isTablet ? 'row' : 'column',
      alignItems: isTablet ? 'center' : 'center',
      gap: 16,
      padding: isMobile ? 20 : 24,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.06)',
      }),
    },
    avatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitials: {
      fontSize: 26,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
    },
    profileTextBlock: {
      flex: isTablet ? 1 : undefined,
      alignItems: isTablet ? 'flex-start' : 'center',
    },
    profileName: {
      fontSize: isMobile ? 18 : 20,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },
    roleBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    roleBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Section Card (Password)
    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: isMobile ? 18 : 24,
      marginBottom: 20,
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.06)',
      }),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    sectionIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
    },
    divider: {
      height: 1,
      marginBottom: 20,
    },

    // Input Groups
    inputGroup: {
      marginBottom: 4,
    },
    inputLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: theme.typography.fontFamily.medium,
    },

    // Buttons
    changePasswordButton: {
      marginTop: 8,
      marginBottom: 4,
    },
    forgotPasswordLink: {
      alignSelf: 'center',
      marginTop: 14,
      paddingVertical: 4,
    },
    forgotPasswordText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },

    // Logout Button
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    logoutButtonText: {
      color: '#EF4444',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
  });

export default SettingsScreen;
