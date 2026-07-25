import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StudentDashboard from '../screens/student/StudentDashboard';
import BrowseCoursesScreen from '../screens/student/BrowseCoursesScreen';
import CourseDetailScreen from '../screens/student/CourseDetailScreen';
import LearningScreen from '../screens/student/LearningScreen';
import QuizScreen from '../screens/student/QuizScreen';
import QuizResultScreen from '../screens/student/QuizResultScreen';
import AIChatScreen from '../screens/student/AIChatScreen';
import CertificatesScreen from '../screens/student/CertificatesScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import TodoScreen from '../screens/student/TodoScreen';
import PaymentScreen from '../screens/student/PaymentScreen';
import CertificatePreviewScreen from '../screens/student/CertificatePreviewScreen';
import ProgressDetailScreen from '../screens/student/ProgressDetailScreen';
import CategoriesScreen from '../screens/student/CategoriesScreen';
import EnrolledCoursesScreen from '../screens/student/EnrolledCoursesScreen';
import StudentSettingsScreen from '../screens/student/StudentSettingsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ForumScreen from '../screens/ForumScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import LiveLecturesScreen from '../screens/LiveLecturesScreen';
import RecordingsScreen from '../screens/RecordingsScreen';

const Stack = createStackNavigator();

const StudentNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Dashboard" component={StudentDashboard} />
      <Stack.Screen name="Courses" component={BrowseCoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Learning" component={LearningScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Todo" component={TodoScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="ProgressDetail" component={ProgressDetailScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="EnrolledCourses" component={EnrolledCoursesScreen} />
      <Stack.Screen name="AITutor" component={AIChatScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="CertificatePreview" component={CertificatePreviewScreen} />
      <Stack.Screen name="Settings" component={StudentSettingsScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="Profile" component={StudentProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="LiveLectures" component={LiveLecturesScreen} />
      <Stack.Screen name="Recordings" component={RecordingsScreen} />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
