import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SponsorDashboard from '../screens/sponsor/SponsorDashboard';
import StudentPublicProfileScreen from '../screens/shared/StudentPublicProfileScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ForumScreen from '../screens/ForumScreen';
import StudentSettingsScreen from '../screens/student/StudentSettingsScreen';

const Stack = createStackNavigator();

const SponsorNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="SponsorDashboard" component={SponsorDashboard} />
      <Stack.Screen name="StudentPublicProfile" component={StudentPublicProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="Settings" component={StudentSettingsScreen} />
    </Stack.Navigator>
  );
};

export default SponsorNavigator;
