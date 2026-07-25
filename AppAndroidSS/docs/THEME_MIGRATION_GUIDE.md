.\install-build-tools.ps1# Theme Migration Guide

This guide shows how to update remaining screens to use the new theme system.

## Quick Pattern

### 1. Import Theme Hook
```javascript
import { useTheme } from '../../context/ThemeContext';
```

### 2. Get Theme in Component
```javascript
const { theme } = useTheme();
```

### 3. Replace Hard-coded Colors

**Before:**
```javascript
backgroundColor: '#ffffff'
color: '#111827'
```

**After:**
```javascript
backgroundColor: theme.colors.background
color: theme.colors.text
```

### 4. Replace Expo Components

**LinearGradient:**
```javascript
// Before
import { LinearGradient } from 'expo-linear-gradient';

// After
import GradientBackground from '../../components/GradientBackground';
```

**Icons:**
```javascript
// Before
import { Ionicons } from '@expo/vector-icons';

// After
import Icon from 'react-native-vector-icons/Ionicons';
```

**StatusBar:**
```javascript
// Before
import { StatusBar } from 'expo-status-bar';
<StatusBar style="auto" />

// After
import { StatusBar } from 'react-native';
<StatusBar
  barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
  backgroundColor={theme.colors.background}
/>
```

## Common Replacements

### Colors
- `#ffffff` → `theme.colors.background` or `theme.colors.card`
- `#111827` → `theme.colors.text`
- `#6b7280` → `theme.colors.textSecondary`
- `#9ca3af` → `theme.colors.textTertiary`
- `#e5e7eb` → `theme.colors.border`
- `#6366f1` → `theme.colors.primary`
- `#8b5cf6` → `theme.colors.secondary`

### Gradients
- `['#6366f1', '#8b5cf6']` → `[theme.colors.gradientStart, theme.colors.gradientEnd]`
- Or use `<GradientBackground>` component

## Example: Updated Screen

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import GradientBackground from '../../components/GradientBackground';
import Logo from '../../components/Logo';
import ThemeToggle from '../../components/ThemeToggle';

const MyScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GradientBackground style={styles.header}>
        <Logo size={80} />
        <ThemeToggle />
      </GradientBackground>
      
      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          My Title
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MyScreen;
```

## Files to Update

All screens in these directories need theme updates:
- `src/screens/auth/*` (Partially done - Login, Signup)
- `src/screens/admin/*` (Partially done - Dashboard)
- `src/screens/expert/*`
- `src/screens/student/*`

## Priority Order

1. ✅ LoginScreen
2. ✅ SignupScreen
3. ✅ AdminDashboard
4. ⏳ All other Admin screens
5. ⏳ All Expert screens
6. ⏳ All Student screens

## Testing Theme

1. Toggle theme using the toggle button
2. Check all text is readable
3. Verify gradients work in both modes
4. Ensure contrast is sufficient
5. Test on both light and dark backgrounds

