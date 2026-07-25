import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ExploreCoursesScreen from '../screens/auth/ExploreCoursesScreen';
import ExploreCourseDetailScreen from '../screens/auth/ExploreCourseDetailScreen';
import SignupOTPScreen from '../screens/auth/SignupOTPScreen';
import SignupDetailsScreen from '../screens/auth/SignupDetailsScreen';
import LoginOTPScreen from '../screens/auth/LoginOTPScreen';
import GazaEducationSupportScreen from '../screens/auth/GazaEducationSupportScreen';
import StaticPageScreen from '../screens/auth/StaticPageScreen';

// Debug: Verify imports
console.log('AuthNavigator - SignupOTPScreen:', typeof SignupOTPScreen, SignupOTPScreen ? 'loaded' : 'undefined');
console.log('AuthNavigator - SignupDetailsScreen:', typeof SignupDetailsScreen, SignupDetailsScreen ? 'loaded' : 'undefined');
console.log('AuthNavigator - LoginOTPScreen:', typeof LoginOTPScreen, LoginOTPScreen ? 'loaded' : 'undefined');

let BackendStatus;
if (__DEV__) {
  BackendStatus = require('../screens/dev/BackendStatus').default;
}

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Register" component={SignupScreen} />
      <Stack.Screen name="ExploreCourses" component={ExploreCoursesScreen} />
      <Stack.Screen name="ExploreCourseDetail" component={ExploreCourseDetailScreen} />
      <Stack.Screen name="GazaEducationSupport" component={GazaEducationSupportScreen} />
      <Stack.Screen name="StaticPage" component={StaticPageScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="SignupOTP" component={SignupOTPScreen} />
      <Stack.Screen name="SignupDetails" component={SignupDetailsScreen} />
      <Stack.Screen name="LoginOTP" component={LoginOTPScreen} />
      {__DEV__ && <Stack.Screen name="DevBackendStatus" component={BackendStatus} />}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
