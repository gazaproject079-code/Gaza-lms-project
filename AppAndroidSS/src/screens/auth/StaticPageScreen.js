import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/ui/Navbar';

const pagesData = {
  about: {
    title: 'About Us',
    content: `GazaRise is a platform dedicated to empowering learners worldwide — especially those in conflict-affected regions — with quality knowledge, AI assistance, and recognised certifications. Our mission is to bridge the gap between quality education and accessibility, ensuring everyone has the opportunity to learn and grow regardless of their background.\n\nWe provide specialized courses focused on our two core areas of study: Medicine and Islamic Education, taught by qualified instructors and scholars. Learning is free for students in war zones, and supported by a contribution from learners elsewhere so we can sustain education infrastructure where it is needed most. Join us on our journey to make learning accessible to all.`
  },
  privacy: {
    title: 'Privacy Policy',
    content: `At GazaRise, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.\n\n1. Information Collection: We collect information you provide when creating an account, such as your name, email, and password.\n\n2. Use of Information: We use your data to provide and improve our services, communicate with you, and personalize your learning experience.\n\n3. Data Security: We implement industry-standard security measures to protect your information from unauthorized access.\n\nBy using GazaRise, you consent to our data practices as described in this policy.`
  },
  terms: {
    title: 'Terms of Service',
    content: `Welcome to GazaRise. By accessing or using our platform, you agree to be bound by these Terms of Service.\n\n1. User Conduct: You agree to use the platform for lawful purposes and not to engage in any activity that disrupts or interferes with our services.\n\n2. Intellectual Property: All content on GazaRise, including courses, videos, and text, is protected by copyright and other intellectual property laws.\n\n3. Termination: We reserve the right to suspend or terminate your account if you violate these terms.\n\nPlease read these terms carefully before using our platform.`
  }
};

const StaticPageScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const pageId = route.params?.pageId || 'about';
  const pageData = pagesData[pageId] || pagesData.about;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <Navbar
        navigation={navigation} isDark={isDark}
        isMobile={isMobile} isDesktop={isDesktop}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          <Text style={[styles.backText, { color: theme.colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>
        
        <View style={[styles.contentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{pageData.title}</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{pageData.content}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60, alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 20, maxWidth: 800, width: '100%' },
  backText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  contentCard: { width: '100%', maxWidth: 800, borderRadius: 16, borderWidth: 1, padding: 32, marginTop: 10 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  body: { fontSize: 16, lineHeight: 28, letterSpacing: 0.2 }
});

export default StaticPageScreen;
