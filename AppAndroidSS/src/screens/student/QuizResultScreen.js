import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const GREEN = '#007A3D';
const RED = '#CE1126';

const QuizResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const { score, totalQuestions, correctCount, passed, courseId } = route.params;

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
  
  const isWeb = Platform.OS === 'web';
  const maxWidth = isWeb && width > 1200 ? 1200 : '100%';

  const getScoreColor = () => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const getScoreMessage = () => {
    if (score >= 80) return 'Excellent!';
    if (score >= 60) return 'Good job!';
    return 'Keep practicing!';
  };

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="EnrolledCourses"
      onNavigate={handleNavigate}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { maxWidth, alignSelf: 'center', width: '100%' }]}
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
              <Icon name="trophy" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Quiz Results</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>See how you performed</Text>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(600)}>
          <AppCard style={styles.resultCard}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor() }]}>
              <Text style={[styles.scoreText, { color: getScoreColor() }]}>{score}%</Text>
            </View>
            <Text style={[styles.scoreMessage, { color: theme.colors.textPrimary }]}>{getScoreMessage()}</Text>
            <Text style={[styles.scoreDetails, { color: theme.colors.textSecondary }]}>
              You answered {correctCount} out of {totalQuestions} questions correctly
            </Text>
          </AppCard>
        </Animated.View>

        <AppCard style={styles.feedbackCard}>
          <Icon name="bulb" size={32} color={theme.colors.warning} />
          <Text style={[styles.feedbackTitle, { color: theme.colors.textPrimary }]}>AI Feedback</Text>
          <Text style={[styles.feedbackText, { color: theme.colors.textSecondary }]}>
            {score >= 80
              ? 'Great work! You have a strong understanding of this topic. Consider moving to the next topic.'
              : score >= 60
              ? 'Good progress! Review the incorrect answers and consider revisiting the lecture material.'
              : 'Don\'t worry! Review the lecture material and try the quiz again to improve your understanding.'}
          </Text>
        </AppCard>

        <View style={styles.actions}>
          {passed && (
            <AppButton
              title="Get Certificate"
              onPress={() => navigation.navigate('CertificatePreview', { courseId })}
              variant="primary"
              fullWidth
              icon={<Icon name="ribbon" size={16} color="#ffffff" />}
              iconPosition="left"
              style={styles.actionButton}
            />
          )}

          <AppButton
            title="Review Lecture"
            onPress={() => navigation.navigate('Learning', route.params)}
            variant="outline"
            fullWidth
            icon={<Icon name="book" size={16} color={theme.colors.primary} />}
            iconPosition="left"
            style={styles.actionButton}
          />

          <AppButton
            title="Back to Course"
            onPress={() => navigation.navigate('CourseDetail', { courseId })}
            variant="secondary"
            fullWidth
            icon={<Icon name="arrow-back" size={16} color={theme.colors.textPrimary} />}
            iconPosition="left"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  resultCard: {
    alignItems: 'center',
    marginBottom: 20,
    borderTopWidth: 3,
    borderTopColor: '#007A3D',
    overflow: 'hidden',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    textAlign: 'center',
  },
  feedbackCard: {
    alignItems: 'center',
    marginBottom: 20,
    borderTopWidth: 3,
    borderTopColor: '#007A3D',
    overflow: 'hidden',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginTop: 0,
  },
  pageHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
  },
});

export default QuizResultScreen;

