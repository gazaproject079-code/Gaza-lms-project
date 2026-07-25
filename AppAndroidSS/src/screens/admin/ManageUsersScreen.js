import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { adminAPI } from '../../services/apiClient';

const GREEN = '#007A3D';
const RED = '#CE1126';

const ManageUsersScreen = () => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { userType } = route.params || { userType: 'instructor' };
  const { width } = useWindowDimensions();

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  const isSuperAdmin = user?.role === 'superadmin';
  const userTypeLabel = 'Instructor';
  const userTypeLabelPlural = 'Instructors';

  // Sidebar navigation items
  const sidebarItems = [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Manage Instructors', icon: 'person-outline', iconActive: 'person', route: 'ManageAdmins' },
    { label: 'All Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
    { label: 'All Students', icon: 'school-outline', iconActive: 'school', route: 'Students' },
    { label: 'Categories', icon: 'layers-outline', iconActive: 'layers', route: 'Categories' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
  ];

  const handleNavigate = (route) => {
    if (route === 'ManageAdmins') {
      navigation.navigate('ManageUsers', { userType: 'instructor' });
    } else if (route === 'ManageExperts') {
      navigation.navigate('ManageUsers', { userType: 'expert' });
    } else if (route === 'Categories') {
      navigation.navigate('CategoryManagement');
    } else {
      navigation.navigate(route);
    }
  };

  const activeRoute = 'ManageAdmins';

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [userType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAll();
      if (response.success && response.users) {
        const filtered = response.users.filter(u => u.role === userType);
        setAllUsers(filtered);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch users',
      });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: `All ${userTypeLabelPlural}`, value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  // Stats calculation
  const stats = useMemo(() => {
    const total = allUsers.length;
    const active = allUsers.filter(u => u.isActive !== false).length;
    const inactive = allUsers.filter(u => u.isActive === false).length;
    return { total, active, inactive };
  }, [allUsers]);

  const filteredUsers = allUsers.filter(userItem => {
    const matchesSearch = userItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || (userItem.isActive !== false) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAccount = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await adminAPI.create({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: userType,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Account Created',
          text2: `${userTypeLabel} account created successfully!`,
        });
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserName('');
        setShowCreateModal(false);
        fetchUsers();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to create account',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create account',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = (userItem) => {
    setUserToToggle(userItem);
    setShowConfirmDialog(true);
  };

  const confirmToggleStatus = async () => {
    setShowConfirmDialog(false);
    if (userToToggle) {
      try {
        const result = await adminAPI.toggleStatus(userToToggle.id);
        if (result.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: result.message || `Account status updated!`,
          });
          fetchUsers();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result.error || 'Failed to update status',
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to update status',
        });
      }
      setUserToToggle(null);
    }
  };

  const handleManagePermissions = (userItem) => {
    const defaultPermissions = {
      canManageAllCourses: false,
      canManageCategories: false,
      canManageStudents: false,
      canManageCertificates: false,
      canViewFeedback: false
    };

    setSelectedUserPermissions({
      id: userItem.id,
      name: userItem.name,
      permissions: {
        ...defaultPermissions,
        ...(userItem.permissions || {})
      }
    });
    setShowPermissionsModal(true);
  };

  const handleTogglePermission = (permissionKey) => {
    setSelectedUserPermissions(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: !prev.permissions[permissionKey]
      }
    }));
  };

  const handleSavePermissions = async () => {
    try {
      const result = await adminAPI.updatePermissions(
        selectedUserPermissions.id,
        selectedUserPermissions.permissions
      );
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Permissions updated successfully!',
        });
        setShowPermissionsModal(false);
        setSelectedUserPermissions(null);
        fetchUsers();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to update permissions',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update permissions',
      });
    }
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  const renderUserCard = (userItem, index) => (
    <Animated.View
      key={userItem.id}
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={styles.userCardWrapper}
    >
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
            borderRadius: 16,
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: GREEN }]} />

        {/* Avatar & Info */}
        <View style={styles.userHeader}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: userItem.isActive === false
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(0,122,61,0.15)',
                borderWidth: 2,
                borderColor: userItem.isActive === false
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(0,122,61,0.3)',
              },
            ]}
          >
            <Text style={[
              styles.avatarText,
              { color: userItem.isActive === false ? '#EF4444' : GREEN },
            ]}>
              {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {userItem.name || 'Unknown'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {userItem.email || '-'}
            </Text>
          </View>
          {/* Status Badge inline with header */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: userItem.isActive !== false
                  ? 'rgba(16,185,129,0.12)'
                  : 'rgba(239,68,68,0.12)',
                borderWidth: 1,
                borderColor: userItem.isActive !== false
                  ? 'rgba(16,185,129,0.25)'
                  : 'rgba(239,68,68,0.25)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: userItem.isActive !== false ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: userItem.isActive !== false ? '#10B981' : '#EF4444' },
              ]}
            >
              {userItem.isActive !== false ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <Icon name="time-outline" size={13} color={GREEN} />
            </View>
            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
              {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <Icon
                name={userType === 'instructor' ? 'shield-checkmark-outline' : 'star-outline'}
                size={13}
                color={GREEN}
              />
            </View>
            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
              {userTypeLabel}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)' }]} />

        {/* Actions */}
        <View style={styles.actionRow}>
          {userType === 'instructor' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: 'rgba(0,122,61,0.35)',
                  borderWidth: 1.5,
                  backgroundColor: isDark ? 'rgba(0,122,61,0.08)' : 'rgba(0,122,61,0.06)',
                },
              ]}
              onPress={() => handleManagePermissions(userItem)}
            >
              <Icon name="settings-outline" size={15} color={GREEN} />
              <Text style={[styles.actionBtnText, { color: GREEN }]}>Permissions</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.toggleBtn,
              {
                backgroundColor: userItem.isActive !== false
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(16,185,129,0.12)',
                borderWidth: 1.5,
                borderColor: userItem.isActive !== false
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(16,185,129,0.3)',
              },
            ]}
            onPress={() => handleToggleStatus(userItem)}
          >
            <Icon
              name={userItem.isActive !== false ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={15}
              color={userItem.isActive !== false ? '#EF4444' : '#10B981'}
            />
            <Text style={[
              styles.actionBtnText,
              { color: userItem.isActive !== false ? '#EF4444' : '#10B981' },
            ]}>
              {userItem.isActive !== false ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: 'Admin', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 10 }}>
            Loading {userTypeLabelPlural.toLowerCase()}...
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute={activeRoute}
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: 'Admin', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header Banner — orange theme matching CourseListScreen */}
        <View
          style={[
            styles.pageHeaderBanner,
            {
              backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
              borderColor: 'rgba(0,122,61,0.15)',
            },
          ]}
        >
          {/* Left side */}
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
              <Icon name="person" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Manage Instructors
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Instructor accounts and permissions
              </Text>
            </View>
          </View>

          {/* Right side */}
          <TouchableOpacity
            style={styles.addUserBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="person-add" size={18} color="#FFFFFF" />
            <Text style={styles.addUserBtnText}>
              New Instructor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {/* Total */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0,122,61,0.12)' }]}>
              <Icon name="people" size={20} color={GREEN} />
            </View>
            <Text style={[styles.statValue, { color: GREEN }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total {userTypeLabelPlural}
            </Text>
          </View>

          {/* Active */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active</Text>
          </View>

          {/* Inactive */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Icon name="close-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.inactive}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Inactive</Text>
          </View>
        </View>

        {/* Search & Filter Section */}
        <AppCard style={styles.filterCard} allowOverflow>
          <AppInput
            placeholder={`Search ${userTypeLabelPlural.toLowerCase()} by name or email...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
            containerStyle={styles.searchInputContainer}
          />
          <View style={styles.filterRow}>
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  {
                    borderColor: statusFilter !== null ? 'rgba(0,122,61,0.4)' : theme.colors.border,
                    backgroundColor: isDark ? theme.colors.card : theme.colors.background,
                  },
                ]}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Icon
                  name="filter"
                  size={15}
                  color={statusFilter !== null ? GREEN : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.filterBtnText,
                  { color: statusFilter !== null ? GREEN : theme.colors.textPrimary },
                ]}>
                  {statusFilter === null ? 'Filter by Status' : statusFilter ? 'Active' : 'Inactive'}
                </Text>
                <Icon name="chevron-down" size={15} color={statusFilter !== null ? GREEN : theme.colors.textSecondary} />
              </TouchableOpacity>
              {showStatusDropdown && (
                <View
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {statusOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        statusFilter === option.value && {
                          backgroundColor: 'rgba(0,122,61,0.1)',
                        },
                      ]}
                      onPress={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {statusFilter === option.value && (
                        <Icon name="checkmark" size={14} color={GREEN} style={{ marginRight: 4 }} />
                      )}
                      <Text style={[
                        styles.dropdownItemText,
                        {
                          color: statusFilter === option.value ? GREEN : theme.colors.textPrimary,
                          fontWeight: statusFilter === option.value ? '600' : '400',
                        },
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </AppCard>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <View style={styles.usersGrid}>
            {filteredUsers.map((userItem, index) => renderUserCard(userItem, index))}
          </View>
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="people-outline"
              title={`No ${userTypeLabelPlural.toLowerCase()} found`}
              subtitle={`There are no ${userTypeLabelPlural.toLowerCase()} matching your search`}
            />
          </AppCard>
        )}
      </ScrollView>

      {/* ─── Create User Modal — Glassmorphic ─── */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            ...(Platform.OS === 'web'
              ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
              : {}),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: isDark ? 'rgba(15,15,30,0.92)' : 'rgba(255,255,255,0.97)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)',
              padding: 28,
              ...(Platform.OS === 'web'
                ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
                : {}),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: GREEN + '20', borderRadius: 10, padding: 10 }}>
                  <Icon name="person-add" size={20} color={GREEN} />
                </View>
                <View>
                  <Text style={{ color: isDark ? '#FFFFFF' : '#1A1A2E', fontSize: 18, fontWeight: '800' }}>
                    Create New {userTypeLabel}
                  </Text>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', fontSize: 12, marginTop: 2 }}>
                    Fill in the details below
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={{
                  padding: 6,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.06)',
                  borderRadius: 8,
                }}
              >
                <Icon name="close" size={20} color={isDark ? '#FFFFFF' : '#1A1A2E'} />
              </TouchableOpacity>
            </View>

            {/* Form Inputs */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                Full Name
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.12)',
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.03)',
                paddingHorizontal: 14,
                paddingVertical: 2,
                gap: 10,
              }}>
                <Icon name="person-outline" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
                <AppInput
                  value={newUserName}
                  onChangeText={setNewUserName}
                  placeholder={`Enter ${userType} name`}
                  containerStyle={{ flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                Email Address
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.12)',
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.03)',
                paddingHorizontal: 14,
                paddingVertical: 2,
                gap: 10,
              }}>
                <Icon name="mail-outline" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
                <AppInput
                  value={newUserEmail}
                  onChangeText={setNewUserEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={`Enter ${userType} email`}
                  containerStyle={{ flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.12)',
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.03)',
                paddingHorizontal: 14,
                paddingVertical: 2,
                gap: 10,
              }}>
                <Icon name="lock-closed-outline" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
                <AppInput
                  value={newUserPassword}
                  onChangeText={setNewUserPassword}
                  secureTextEntry={!showPassword}
                  placeholder={`Enter ${userType} password`}
                  containerStyle={{ flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,46,0.15)',
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontWeight: '600', fontSize: 14 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  backgroundColor: GREEN,
                  padding: 14,
                  alignItems: 'center',
                  opacity: isCreating ? 0.7 : 1,
                  ...(Platform.OS === 'web' && { boxShadow: '0 4px 16px rgba(0,122,61,0.4)' }),
                }}
                onPress={handleCreateAccount}
                disabled={isCreating}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  {isCreating ? 'Creating...' : `Create ${userTypeLabel}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Permissions Modal — Glassmorphic ─── */}
      <Modal
        visible={showPermissionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            ...(Platform.OS === 'web'
              ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
              : {}),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: isDark ? 'rgba(15,15,30,0.92)' : 'rgba(255,255,255,0.97)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)',
              padding: 28,
              ...(Platform.OS === 'web'
                ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
                : {}),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: GREEN + '20', borderRadius: 10, padding: 10 }}>
                  <Icon name="shield-checkmark" size={20} color={GREEN} />
                </View>
                <View>
                  <Text style={{ color: isDark ? '#FFFFFF' : '#1A1A2E', fontSize: 18, fontWeight: '800' }}>
                    Manage Permissions
                  </Text>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', fontSize: 12, marginTop: 2 }}>
                    {selectedUserPermissions?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPermissionsModal(false)}
                style={{
                  padding: 6,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.06)',
                  borderRadius: 8,
                }}
              >
                <Icon name="close" size={20} color={isDark ? '#FFFFFF' : '#1A1A2E'} />
              </TouchableOpacity>
            </View>

            {/* Permissions List */}
            {selectedUserPermissions && (
              <View style={{ marginBottom: 8 }}>
                {[
                  { key: 'canManageAllCourses', icon: 'school-outline', title: 'Manage All Courses', desc: 'Can edit any course' },
                  { key: 'canManageCategories', icon: 'grid-outline', title: 'Manage Categories', desc: 'Create and edit categories' },
                  { key: 'canManageStudents', icon: 'people-outline', title: 'Manage Students', desc: 'View and manage students' },
                  { key: 'canManageCertificates', icon: 'ribbon-outline', title: 'Manage Certificates', desc: 'Issue certificates' },
                  { key: 'canViewFeedback', icon: 'chatbubbles-outline', title: 'View Feedback', desc: 'See student feedback' },
                ].map((perm, idx, arr) => {
                  const isEnabled = selectedUserPermissions.permissions[perm.key];
                  return (
                    <TouchableOpacity
                      key={perm.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 13,
                        borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.07)',
                      }}
                      onPress={() => handleTogglePermission(perm.key)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isEnabled ? GREEN + '18' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.05)'),
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Icon
                            name={perm.icon}
                            size={18}
                            color={isEnabled ? GREEN : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)')}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            color: isDark ? '#FFFFFF' : '#1A1A2E',
                            fontSize: 14,
                            fontWeight: '600',
                            marginBottom: 2,
                          }}>
                            {perm.title}
                          </Text>
                          <Text style={{
                            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.5)',
                            fontSize: 12,
                          }}>
                            {perm.desc}
                          </Text>
                        </View>
                      </View>
                      {/* Toggle indicator */}
                      <View style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isEnabled ? GREEN : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)'),
                        justifyContent: 'center',
                        paddingHorizontal: 3,
                        alignItems: isEnabled ? 'flex-end' : 'flex-start',
                      }}>
                        <View style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 2,
                        }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,46,0.15)',
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={() => setShowPermissionsModal(false)}
              >
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontWeight: '600', fontSize: 14 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  backgroundColor: GREEN,
                  padding: 14,
                  alignItems: 'center',
                  ...(Platform.OS === 'web' && { boxShadow: '0 4px 16px rgba(0,122,61,0.4)' }),
                }}
                onPress={handleSavePermissions}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={showConfirmDialog}
        title={userToToggle?.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
        message={`Are you sure you want to ${userToToggle?.isActive !== false ? 'deactivate' : 'activate'} this ${userType} account?`}
        confirmText={userToToggle?.isActive !== false ? 'Deactivate' : 'Activate'}
        onConfirm={confirmToggleStatus}
        onCancel={() => {
          setShowConfirmDialog(false);
          setUserToToggle(null);
        }}
      />
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isLargeScreen, isTablet, isMobile) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isMobile ? 16 : 24,
      paddingBottom: 40,
    },

    // ── Page Header Banner (orange theme) ──
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
      fontFamily: theme.typography?.fontFamily?.bold,
      marginBottom: 2,
    },
    pageSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography?.fontFamily?.regular,
    },
    addUserBtn: {
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
    addUserBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: theme.typography?.fontFamily?.semiBold,
    },

    // ── Stats ──
    statsSection: {
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 12 : 16,
      marginBottom: 24,
    },
    statCard: {
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
    statValue: {
      fontSize: isMobile ? 28 : 32,
      fontWeight: '700',
      fontFamily: theme.typography?.fontFamily?.bold,
      lineHeight: isMobile ? 34 : 38,
    },
    statLabel: {
      fontSize: 13,
      fontFamily: theme.typography?.fontFamily?.regular,
      textAlign: 'center',
    },

    // ── Filter ──
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
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      gap: 7,
      width: isMobile ? '100%' : 'auto',
    },
    filterBtnText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: theme.typography?.fontFamily?.medium,
      flex: isMobile ? 1 : undefined,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: isMobile ? 0 : undefined,
      minWidth: isMobile ? undefined : 190,
      width: isMobile ? '100%' : undefined,
      borderRadius: 10,
      borderWidth: 1,
      marginTop: 4,
      zIndex: 1000,
      overflow: 'hidden',
      ...theme.shadows?.lg,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }),
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: theme.typography?.fontFamily?.regular,
    },

    // ── Users Grid ──
    usersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    userCardWrapper: {
      width: isLargeScreen
        ? 'calc(33.333% - 11px)'
        : isTablet
          ? 'calc(50% - 8px)'
          : '100%',
      ...(Platform.OS !== 'web' && {
        width: isLargeScreen ? '31%' : isTablet ? '48%' : '100%',
      }),
    },
    userCard: {
      padding: isMobile ? 14 : 16,
      overflow: 'hidden',
      position: 'relative',
      ...(Platform.OS === 'web' && {
        boxShadow: isDark ? 'none' : '0 2px 12px rgba(26,26,46,0.07)',
      }),
    },
    cardAccentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 3,
      height: '100%',
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '800',
      fontFamily: theme.typography?.fontFamily?.bold,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 2,
      fontFamily: theme.typography?.fontFamily?.semiBold,
    },
    userEmail: {
      fontSize: 12,
      fontFamily: theme.typography?.fontFamily?.regular,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 5,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: theme.typography?.fontFamily?.semiBold,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 14,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaIconWrap: {
      width: 20,
      height: 20,
      borderRadius: 6,
      backgroundColor: 'rgba(0,122,61,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 12,
      fontFamily: theme.typography?.fontFamily?.regular,
    },
    cardDivider: {
      height: 1,
      marginBottom: 12,
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
      paddingVertical: 9,
      borderRadius: 10,
      gap: 5,
    },
    toggleBtn: {},
    actionBtnText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography?.fontFamily?.semiBold,
    },

    // ── Empty State ──
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

export default ManageUsersScreen;
