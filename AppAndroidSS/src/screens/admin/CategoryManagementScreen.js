import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ScrollView,
  Modal,
  TextInput,
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
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const GREEN = '#007A3D';
const RED = '#CE1126';

// Color palette for category cards
const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#F97316', // Orange
  '#EF4444', // Red
  '#10B981', // Green
  '#007A3D', // Purple
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
];

const CategoryManagementScreen = () => {
  const { categories, courses, addCategory, deleteCategory } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [newCategory, setNewCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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

  // Calculate stats
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalCourses = courses.length;
    const avgCoursesPerCategory = totalCategories > 0
      ? Math.round(totalCourses / totalCategories)
      : 0;
    return { totalCategories, totalCourses, avgCoursesPerCategory };
  }, [categories, courses]);

  // Get course count for each category
  const getCourseCount = (categoryId) => {
    return courses.filter(course => course.category?.id === categoryId).length;
  };

  // Get color for category based on index
  const getCategoryColor = (index) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a category name',
      });
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Category already exists',
      });
      return;
    }

    const result = await addCategory(newCategory.trim());
    if (result.success) {
      setNewCategory('');
      setShowAddModal(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category added successfully!',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Failed to add category',
      });
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    setShowConfirmDialog(false);
    if (categoryToDelete) {
      const result = await deleteCategory(categoryToDelete.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Category deleted successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to delete category',
        });
      }
      setCategoryToDelete(null);
    }
  };

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  const renderCategoryCard = (category, index) => {
    const courseCount = getCourseCount(category.id);
    const color = getCategoryColor(index);

    return (
      <Animated.View
        key={category.id}
        entering={FadeInDown.duration(400).delay(index * 80)}
        style={styles.categoryCardWrapper}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            {
              backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              borderLeftColor: color,
            },
          ]}
          activeOpacity={0.7}
          onLongPress={() => handleDeleteClick(category)}
        >
          {/* Course Count Badge */}
          <View style={[styles.courseCountBadge, { backgroundColor: color + '18', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }]}>
            <Text style={[styles.courseCountNumber, { color: color }]}>
              {courseCount}
            </Text>
            <Text style={[styles.courseCountLabel, { color: color + 'CC' }]}>
              courses
            </Text>
          </View>

          {/* Category Icon - Using first letter with colored background */}
          <View style={[styles.categoryIconContainer, { backgroundColor: color + '20' }]}>
            <Text style={[styles.categoryIconText, { color: color }]}>
              {category.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Category Name */}
          <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {category.name}
          </Text>

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)' },
            ]}
            onPress={() => handleDeleteClick(category)}
          >
            <Icon name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="CategoryManagement"
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
              <Icon name="layers" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                Skill Categories
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Organize your course catalog
              </Text>
            </View>
          </View>

          {/* Right Side */}
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addCategoryBtnText}>Add Category</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {/* Total Categories */}
          <View
            style={[
              styles.statCardNew,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
              },
            ]}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0,122,61,0.12)' }]}>
              <Icon name="layers" size={20} color={GREEN} />
            </View>
            <Text style={[styles.statValueNew, { color: GREEN }]}>{stats.totalCategories}</Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Total Categories
            </Text>
          </View>

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
            <Text style={[styles.statValueNew, { color: '#007A3D' }]}>{stats.totalCourses}</Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Total Courses
            </Text>
          </View>

          {/* Avg Per Category */}
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
              <Icon name="bar-chart" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValueNew, { color: '#10B981' }]}>
              {stats.avgCoursesPerCategory}
            </Text>
            <Text style={[styles.statLabelNew, { color: theme.colors.textSecondary }]}>
              Avg Per Category
            </Text>
          </View>
        </View>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => renderCategoryCard(category, index))}
          </View>
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="layers-outline"
              title="No categories yet"
              subtitle="Add your first category to organize your courses"
              actionLabel="Add Category"
              onAction={() => setShowAddModal(true)}
            />
          </AppCard>
        )}
      </ScrollView>

      {/* Glassmorphic Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: isDark ? 'rgba(15,15,30,0.92)' : 'rgba(255,255,255,0.95)',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)',
              padding: 28,
              ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: GREEN + '20' }]}>
                  <Icon name="layers" size={22} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    Add New Category
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: isDark ? 'rgba(255,255,255,0.55)' : theme.colors.textSecondary }]}>
                    Create a skill category for your courses
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' },
                ]}
                onPress={() => {
                  setNewCategory('');
                  setShowAddModal(false);
                }}
              >
                <Icon name="close" size={20} color={isDark ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
                marginBottom: 24,
              }}
            />

            {/* Input */}
            <View style={{ marginBottom: 28 }}>
              <AppInput
                label="Category Name"
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="e.g., Medicine or Islamic Education"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalFooter}>
              <AppButton
                title="Cancel"
                onPress={() => {
                  setNewCategory('');
                  setShowAddModal(false);
                }}
                variant="outline"
                style={styles.modalCancelButton}
              />
              <AppButton
                title="Add Category"
                onPress={handleAddCategory}
                variant="primary"
                style={styles.modalCreateButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showConfirmDialog}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}" category? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmDialog(false);
          setCategoryToDelete(null);
        }}
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
    addCategoryBtn: {
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
    addCategoryBtnText: {
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

    // Categories Grid
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    categoryCardWrapper: {
      width: isLargeScreen
        ? 'calc(33.333% - 11px)'
        : isTablet
          ? 'calc(50% - 8px)'
          : '100%',
      ...(Platform.OS !== 'web' && {
        width: isLargeScreen ? '31%' : isTablet ? '48%' : '100%',
      }),
    },
    categoryCard: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderLeftWidth: 4,
      minHeight: 160,
      position: 'relative',
      ...theme.shadows.sm,
    },
    courseCountBadge: {
      position: 'absolute',
      top: 14,
      right: 14,
      alignItems: 'flex-end',
    },
    courseCountNumber: {
      fontSize: 22,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      textAlign: 'right',
    },
    courseCountLabel: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'right',
    },
    categoryIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    categoryIconText: {
      fontSize: 24,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: 8,
    },
    deleteButton: {
      position: 'absolute',
      bottom: 14,
      right: 14,
      padding: 8,
      borderRadius: 8,
    },

    // Empty State
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },

    // Modal
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    modalIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 2,
    },
    modalSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalCancelButton: {
      minWidth: 100,
    },
    modalCreateButton: {
      minWidth: 140,
    },
  });

export default CategoryManagementScreen;
