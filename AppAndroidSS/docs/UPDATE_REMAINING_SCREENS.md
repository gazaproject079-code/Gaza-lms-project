# Update Remaining Screens

This document lists all screens that need to be updated to use the theme system.

## Pattern to Follow

For each screen, make these changes:

1. **Add theme import:**
   ```javascript
   import { useTheme } from '../../context/ThemeContext';
   const { theme } = useTheme();
   ```

2. **Replace Expo imports:**
   - `expo-linear-gradient` → `GradientBackground` component
   - `@expo/vector-icons` → `react-native-vector-icons/Ionicons`
   - `expo-status-bar` → `react-native StatusBar`

3. **Update colors in styles:**
   - Use `theme.colors.*` instead of hard-coded colors
   - Apply theme colors to all StyleSheet objects

4. **Add Logo and ThemeToggle where appropriate:**
   - Add Logo to headers/dashboards
   - Add ThemeToggle to navigation headers

## Screens to Update

### Authentication Screens
- [x] LoginScreen ✅
- [x] SignupScreen ✅
- [ ] ForgotPasswordScreen
- [ ] OTPVerificationScreen

### Admin Screens
- [x] AdminDashboard ✅
- [ ] CourseListScreen
- [ ] CreateCourseScreen
- [ ] CourseDetailScreen
- [ ] AddTopicsScreen
- [ ] StudentListScreen
- [ ] StudentDetailScreen
- [ ] CategoryManagementScreen
- [ ] CertificateManagementScreen
- [ ] FeedbackScreen

### Expert Screens
- [ ] ExpertDashboard
- [ ] ExpertCourseListScreen
- [ ] ExpertCourseDetailScreen
- [ ] FeedbackFormScreen

### Student Screens
- [ ] StudentDashboard
- [ ] BrowseCoursesScreen
- [ ] CourseDetailScreen
- [ ] LearningScreen
- [ ] QuizScreen
- [ ] QuizResultScreen
- [ ] AIChatScreen
- [ ] CertificatesScreen
- [ ] NotificationsScreen
- [ ] TodoScreen
- [ ] PaymentScreen

## Quick Update Script Pattern

For each screen file:

1. Find and replace:
   - `from 'expo-linear-gradient'` → `from '../../components/GradientBackground'`
   - `from '@expo/vector-icons'` → `from 'react-native-vector-icons/Ionicons'`
   - `Ionicons` → `Icon` (component name)
   - `LinearGradient` → `GradientBackground`

2. Add theme hook at top of component:
   ```javascript
   const { theme } = useTheme();
   ```

3. Replace color values in StyleSheet with theme colors

4. Update component JSX to use theme colors:
   ```javascript
   style={[styles.container, { backgroundColor: theme.colors.background }]}
   ```

## Example Transformation

**Before:**
```javascript
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MyScreen = () => {
  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <Ionicons name="home" size={24} color="#ffffff" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
});
```

**After:**
```javascript
import GradientBackground from '../../components/GradientBackground';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const MyScreen = () => {
  const { theme } = useTheme();
  
  return (
    <GradientBackground style={styles.container}>
      <Icon name="home" size={24} color="#ffffff" />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor moved to inline style
  },
});
```

Then in JSX:
```javascript
<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
```

