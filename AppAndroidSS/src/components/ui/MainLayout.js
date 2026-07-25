import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AppHeader from './AppHeader';

const MainLayout = ({
  children,
  showHeader = true,
  showSidebar = true,
  sidebarItems = [],
  activeRoute,
  onNavigate,
  userInfo,
  onLogout,
  onSettings,
  rightActions,
  showBack = false,
  headerStyle,
  contentStyle,
  showMenuButton = true,
  customSidebar = null,
  customSidebarVisible = false,
  onCustomSidebarToggle = null,
  customMenuIcon = null,
  hideHeaderToggle = false,
}) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const hasCustomSidebar = !!customSidebar;

  const role = user?.role || userInfo?.role || 'student';
  
  let finalSidebarItems = [];
  if (role === 'sponsor') {
    finalSidebarItems = [
      { label: 'Dashboard', icon: 'grid-outline',       iconActive: 'grid',       route: 'SponsorDashboard' },
      { label: 'Messages',  icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Chat' },
      { label: 'Forum',     icon: 'megaphone-outline',   iconActive: 'megaphone',   route: 'Forum' },
    ];
  } else if (role === 'superadmin') {
    finalSidebarItems = [
      { label: 'Dashboard',           icon: 'grid-outline',              iconActive: 'grid',              route: 'Dashboard' },
      { label: 'Manage Instructors',  icon: 'people-outline',            iconActive: 'people',            route: 'ManageAdmins' },
      { label: 'Skill Categories',    icon: 'layers-outline',            iconActive: 'layers',            route: 'CategoryManagement' },
      { label: 'Manage Courses',      icon: 'book-outline',              iconActive: 'book',              route: 'Courses' },
      { label: 'Students',            icon: 'school-outline',            iconActive: 'school',            route: 'Students' },
      { label: 'Manage Sponsors',     icon: 'heart-outline',             iconActive: 'heart',             route: 'ManageSponsors' },
      { label: 'Chat',                  icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses', route: 'Chat' },
      { label: 'Certificates',        icon: 'ribbon-outline',            iconActive: 'ribbon',            route: 'CertificateManagement' },
      { label: 'Library',             icon: 'book-outline',              iconActive: 'book',              route: 'Library' },
      { label: 'Forum',               icon: 'chatbubbles-outline',       iconActive: 'chatbubbles',       route: 'Forum' },
    ];
  } else if (role === 'instructor') {
    finalSidebarItems = [
      { label: 'Dashboard',       icon: 'grid-outline',              iconActive: 'grid',              route: 'Dashboard' },
      { label: 'Skill Categories',icon: 'layers-outline',            iconActive: 'layers',            route: 'CategoryManagement' },
      { label: 'Manage Courses',  icon: 'book-outline',              iconActive: 'book',              route: 'Courses' },
      { label: 'Students',        icon: 'people-outline',            iconActive: 'people',            route: 'Students' },
      { label: 'Chat',            icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses', route: 'Chat' },
      { label: 'Certificates',    icon: 'ribbon-outline',            iconActive: 'ribbon',            route: 'CertificateManagement' },
      { label: 'Course Feedback', icon: 'chatbubbles-outline',       iconActive: 'chatbubbles',       route: 'Feedback' },
      { label: 'Library',         icon: 'book-outline',              iconActive: 'book',              route: 'Library' },
      { label: 'Forum',           icon: 'chatbubbles-outline',       iconActive: 'chatbubbles',       route: 'Forum' },
    ];
  } else {
    // Default to student
    finalSidebarItems = [
      { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
      { label: 'My Profile', icon: 'person-outline', iconActive: 'person', route: 'Profile' },
      { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
      { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
      { label: 'Chat',         icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses', route: 'Chat' },
      { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
      { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
      { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
      { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
      { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
    ];
  }

  // Responsive sidebar width — narrow enough to leave content usable on any screen
  const sidebarWidth = isLargeScreen ? 280 : isTablet ? 250 : 220;

  const styles = getStyles(theme, isDark, isWeb, isTablet);

  const toggleCustomSidebar = () => {
    if (hasCustomSidebar && onCustomSidebarToggle) {
      onCustomSidebarToggle(!customSidebarVisible);
    }
  };

  // Toggle button shown in header left section on ALL screen sizes when there's a custom sidebar
  const HeaderLeftComponent = hasCustomSidebar && !hideHeaderToggle ? (
    <TouchableOpacity
      style={[
        styles.menuButton,
        customSidebarVisible && styles.menuButtonActive,
      ]}
      onPress={toggleCustomSidebar}
      activeOpacity={0.7}
    >
      <Icon
        name={customSidebarVisible ? 'close' : (customMenuIcon || 'menu')}
        size={20}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  ) : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#1A1A2E' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      <View style={styles.container}>

        {/* Header — always full width across top */}
        {showHeader && (
          <AppHeader
            showBack={showBack}
            rightActions={rightActions}
            leftComponent={HeaderLeftComponent}
            style={headerStyle}
            navItems={showSidebar ? finalSidebarItems : []}
            activeRoute={activeRoute}
            onNavigate={onNavigate}
          />
        )}

        {/* Body row: sidebar panel + content side-by-side */}
        <View style={styles.bodyRow}>

          {/* Custom sidebar panel — slides in from left, no overlay */}
          {hasCustomSidebar && customSidebarVisible && (
            <View style={[styles.sidebarPanel, { width: sidebarWidth }]}>
              {customSidebar}
            </View>
          )}

          {/* Main content — takes remaining space */}
          <View style={[styles.content, contentStyle]}>
            {children}
          </View>

        </View>

      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDark, isWeb, isTablet) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      minHeight: 0,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      minHeight: 0,
    },
    bodyRow: {
      flex: 1,
      flexDirection: 'row',
      minHeight: 0,
    },

    // Sidebar panel — fixed width, sits to the left of content
    sidebarPanel: {
      backgroundColor: theme.colors.surface,
      borderRightWidth: 1,
      borderRightColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },

    // Main content area
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
      minHeight: 0,
    },

    // Sidebar toggle button in header
    menuButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      marginRight: 6,
    },
    menuButtonActive: {
      backgroundColor: 'rgba(0,122,61,0.3)',
      borderColor: 'rgba(0,122,61,0.6)',
    },
  });

export default MainLayout;
