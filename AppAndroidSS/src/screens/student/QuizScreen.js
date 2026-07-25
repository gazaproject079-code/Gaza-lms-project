import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import ProgressBar from '../../components/ui/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { quizAPI } from '../../services/apiClient';
import { useData } from '../../context/DataContext';

const QuizScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, topicId, topics } = route.params;
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { fetchCourses } = useData();
  const { logout } = useAuth();

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

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const isWeb = Platform.OS === 'web';
  const maxWidth = isWeb && width > 1200 ? 1200 : '100%';

  useEffect(() => {
    fetchQuiz();
  }, [topicId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getByTopic(topicId);
      setQuiz(data.quiz);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to load quiz' });
    } finally {
      setLoading(false);
    }
  };

  const question = quiz?.questions?.[currentQuestion];
  const totalQuestions = quiz?.questions?.length || 0;

  const handleSelectAnswer = (optionIndex) => {
    if (!question) return;
    setSelectedAnswers(prev => ({ ...prev, [question.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await quizAPI.submit({
        quizId: quiz.id,
        answers: selectedAnswers,
      });
      const result = data.result;

      if (result.passed) {
        Toast.show({
          type: 'success',
          text1: '🎉 Quiz Passed!',
          text2: `Score: ${result.score}% — Moving to next topic...`,
        });

        // Refresh DataContext so completion state is current
        await fetchCourses();

        // Use nextTopicId from backend response (most reliable)
        const targetTopicId = result.nextTopicId;

        setTimeout(() => {
          if (targetTopicId) {
            navigation.replace('Learning', { courseId, topicId: targetTopicId });
          } else {
            // Course complete
            navigation.navigate('QuizResult', {
              courseId,
              topicId,
              score: result.score,
              totalQuestions: result.totalQuestions,
              correctCount: result.correctAnswers,
              passed: result.passed,
            });
          }
        }, 2000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Quiz Not Passed',
          text2: `Score: ${result.score}% — Need ${quiz.passingScore || 70}% to pass`,
        });
        setTimeout(() => {
          navigation.navigate('QuizResult', {
            courseId,
            topicId,
            score: result.score,
            totalQuestions: result.totalQuestions,
            correctCount: result.correctAnswers,
            passed: result.passed,
          });
        }, 1500);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to submit quiz' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="EnrolledCourses"
        onNavigate={handleNavigate}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading quiz...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="EnrolledCourses"
        onNavigate={handleNavigate}
      >
        <View style={styles.centered}>
          <Icon name="help-circle-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.noQuizText, { color: theme.colors.textSecondary }]}>
            No quiz available for this topic yet.
          </Text>
          <AppButton title="Go Back" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: 16 }} />
        </View>
      </MainLayout>
    );
  }

  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const hasAnswered = question && selectedAnswers[question.id] !== undefined;

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="EnrolledCourses"
      onNavigate={handleNavigate}
    >
      <ProgressBar
        progress={((currentQuestion + 1) / totalQuestions) * 100}
        variant="solid"
        style={styles.progressBar}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { maxWidth, alignSelf: 'center', width: '100%' }]}
      >
        <AppCard style={styles.questionContainer}>
          <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>
            Question {currentQuestion + 1} of {totalQuestions}
          </Text>
          <Text style={[styles.questionText, { color: theme.colors.textPrimary }]}>
            {question.question}
          </Text>
        </AppCard>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[question.id] === index;
            return (
              <Animated.View key={index} entering={FadeIn.duration(300).delay(index * 80)}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected ? theme.colors.primary + '18' : theme.colors.card,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleSelectAnswer(index)}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionLetter, { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface }]}>
                      <Text style={[styles.optionLetterText, { color: isSelected ? '#fff' : theme.colors.textSecondary }]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.textPrimary }]}>{option}</Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Passing score info */}
        <Text style={[styles.passingInfo, { color: theme.colors.textTertiary }]}>
          Passing score: {quiz.passingScore || 70}%
        </Text>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <AppButton
          title="Previous"
          onPress={handlePrevious}
          variant="outline"
          disabled={currentQuestion === 0 || submitting}
          leftIcon="chevron-back"
          style={styles.footerButton}
        />
        <AppButton
          title={submitting ? 'Submitting...' : isLastQuestion ? 'Submit' : 'Next'}
          onPress={handleNext}
          variant="primary"
          disabled={!hasAnswered || submitting}
          leftIcon={isLastQuestion ? 'checkmark' : 'chevron-forward'}
          style={styles.footerButton}
        />
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  noQuizText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressBar: {
    marginBottom: 0,
    backgroundColor: '#007A3D',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  questionContainer: {
    marginBottom: 24,
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: '#007A3D',
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
    // Active state border is handled inline via isSelected ? theme.colors.primary : theme.colors.border
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  passingInfo: {
    marginTop: 24,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});

export default QuizScreen;
