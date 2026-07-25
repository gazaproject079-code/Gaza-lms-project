import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import Icon from 'react-native-vector-icons/Ionicons';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const GREEN = '#007A3D';
const RED = '#CE1126';

const CategoriesScreen = () => {
  const { categories } = useData();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();

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

  const getStyles = (theme, isDark) => StyleSheet.create({
    listContent: {
      padding: 16,
      paddingTop: 0,
    },
    pageHeaderBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      margin: 16,
      marginBottom: 12,
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
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    bannerSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    categoryCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      borderRadius: 12,
      overflow: 'hidden',
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIcon: {
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      backgroundColor: theme.colors.primary + '20',
    },
    categoryName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      letterSpacing: 0.1,
    },
  });

  const styles = getStyles(theme, isDark);

  const renderCategory = ({ item, index }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
      <TouchableOpacity onPress={() => navigation.navigate('Courses', { category: item.name })}>
        <AppCard style={styles.categoryCard}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="grid" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
          </View>
          <Icon name="chevron-forward" size={24} color={theme.colors.textTertiary} />
        </AppCard>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
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
          <Icon name="layers" size={22} color={GREEN} />
        </View>
        <View style={styles.bannerTextGroup}>
          <Text style={styles.bannerTitle}>Categories</Text>
          <Text style={styles.bannerSubtitle}>Browse courses by category</Text>
        </View>
      </View>
    </View>
  );

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Courses"
      onNavigate={handleNavigate}
    >
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />
    </MainLayout>
  );
};

export default CategoriesScreen;