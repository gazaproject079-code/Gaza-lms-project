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

const StudentSettingsScreen = () => {
  const { logout, user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width <= 480;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isWeb = Platform.OS === 'web';
  const maxWidth = isWeb && width > 1200 ? 1200 : '100%';

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

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all fields' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Password must be at least 6 characters' });
      return;
    }
    Toast.show({ type: 'success', text1: 'Success', text2: 'Password changed successfully' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email: user?.email, fromSettings: true });
  };

  const styles = getStyles(theme, isDark, isMobile);

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Settings"
      onNavigate={(route) => navigation.navigate(route)}
      userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => {}}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { maxWidth, alignSelf: 'center', width: '100%' }]}
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
              <Icon name="settings" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Settings</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>Manage your account preferences</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Change Password</Text>
        <AppCard style={styles.passwordSection}>
          <AppInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            placeholder="Enter current password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} activeOpacity={0.7}>
                <Icon name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            }
          />
          <AppInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            placeholder="Enter new password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} activeOpacity={0.7}>
                <Icon name={showNewPassword ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            }
          />
          <AppInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showNewPassword}
            placeholder="Confirm new password"
          />
          <AppButton
            title="Change Password"
            onPress={handleChangePassword}
            variant="primary"
            style={styles.changePasswordButton}
            icon={<Icon name="key" size={14} color="#ffffff" />}
            iconPosition="left"
          />
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isMobile) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
    fontSize: isMobile ? 18 : 20,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.regular,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  passwordSection: {
    marginBottom: 24,
  },
  changePasswordButton: {
    marginTop: 10,
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StudentSettingsScreen;
