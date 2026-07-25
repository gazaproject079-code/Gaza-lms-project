import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from './ui/AppButton';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicyModal = ({ visible, onAccept, onCancel }) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const getDialogStyle = () => {
    const baseStyle = {
      backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
    };

    if (isWeb && isDark) {
      return {
        ...baseStyle,
        backgroundColor: theme.glass.background,
        backdropFilter: `blur(${theme.glass.backdropBlur}px)`,
        WebkitBackdropFilter: `blur(${theme.glass.backdropBlur}px)`,
        borderColor: theme.glass.border,
        borderWidth: 1,
      };
    }

    return baseStyle;
  };

  const BulletPoint = ({ text }) => (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: theme.colors.primary }]} />
      <Text style={[styles.bulletText, { color: theme.colors.textSecondary }]}>{text}</Text>
    </View>
  );

  const SectionCard = ({ number, title, description, bullets, iconName, iconColor }) => (
    <View style={[styles.sectionCard, { backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.background, borderColor: theme.colors.border }]}>
      <View style={styles.sectionCardHeader}>
        <View style={[styles.numberBadge, { backgroundColor: iconColor + '20' }]}>
          <Text style={[styles.numberText, { color: iconColor }]}>{number}</Text>
        </View>
        <View style={styles.sectionCardTitleContainer}>
          <Text style={[styles.sectionCardTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        </View>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>
      {description && (
        typeof description === 'string' ? (
          <Text style={[styles.sectionCardDescription, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        ) : description
      )}
      {bullets && bullets.length > 0 && (
        <View style={styles.bulletsContainer}>
          {bullets.map((bullet, index) => (
            <BulletPoint key={index} text={bullet} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.dialog, getDialogStyle(), theme.shadows.xl]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="shield-checkmark" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.bold }]}>
              Terms of Use & Privacy Policy
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Please read and accept to continue using GazaRise
            </Text>
          </View>

          <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={true}
          >
            {/* Section 1: Rules and Regulations */}
            <View style={styles.mainSection}>
              <View style={[styles.mainSectionHeader, { backgroundColor: '#6366F1' + '15', borderColor: '#6366F1' + '30' }]}>
                <Icon name="book" size={22} color="#6366F1" />
                <Text style={[styles.mainSectionTitle, { color: '#6366F1' }]}>
                  TERMS OF USE FOR STUDENTS
                </Text>
              </View>

              <View style={styles.cardsContainer}>
                <SectionCard
                  number="1"
                  title="Academic Integrity"
                  iconName="school-outline"
                  iconColor="#6366F1"
                  description="Students must maintain the highest standards of academic integrity:"
                  bullets={[
                    "Do not share your account credentials with others",
                    "Complete all quizzes and assessments independently",
                    "Do not copy or plagiarize content from courses",
                    "Report any suspicious activities to administrators"
                  ]}
                />

                <SectionCard
                  number="2"
                  title="Course Participation"
                  iconName="library-outline"
                  iconColor="#6366F1"
                  bullets={[
                    "Actively engage with course materials and complete assignments",
                    "Respect course deadlines when applicable",
                    "Participate constructively in discussions and feedback",
                    "Maintain regular progress in enrolled courses"
                  ]}
                />

                <SectionCard
                  number="3"
                  title="Code of Conduct"
                  iconName="chatbubble-ellipses-outline"
                  iconColor="#6366F1"
                  bullets={[
                    "Use appropriate and professional language when using the AI Assistant",
                    "Do not attempt to misuse the AI Assistant for inappropriate content",
                    "Do not use offensive, abusive, or harmful language on the platform",
                    "Report any technical issues or bugs to the administrators"
                  ]}
                />

                <SectionCard
                  number="4"
                  title="Account Responsibilities"
                  iconName="person-circle-outline"
                  iconColor="#6366F1"
                  bullets={[
                    "Keep your account information accurate and up-to-date",
                    "Protect your login credentials and do not share them",
                    "Notify us immediately if you suspect unauthorized access",
                    "One account per student - multiple accounts are prohibited"
                  ]}
                />

                <SectionCard
                  number="5"
                  title="Certificate Authenticity"
                  iconName="ribbon-outline"
                  iconColor="#6366F1"
                  bullets={[
                    "Certificates are issued only upon genuine course completion",
                    "Do not attempt to forge or manipulate certificates",
                    "Certificates can be verified through our verification system",
                    "Misrepresentation of certificates may result in account termination"
                  ]}
                />
              </View>

              {/* Violation Warning */}
              <View style={[styles.warningBox, { backgroundColor: '#EF4444' + '15', borderColor: '#EF4444' + '40' }]}>
                <Icon name="warning" size={20} color="#EF4444" />
                <Text style={[styles.warningText, { color: '#EF4444' }]}>
                  Violation of any of the above terms may result in immediate account deactivation without prior notice.
                </Text>
              </View>
            </View>

            {/* Section 2: Privacy Policy */}
            <View style={styles.mainSection}>
              <View style={[styles.mainSectionHeader, { backgroundColor: '#10B981' + '15', borderColor: '#10B981' + '30' }]}>
                <Icon name="lock-closed" size={22} color="#10B981" />
                <Text style={[styles.mainSectionTitle, { color: '#10B981' }]}>
                  PRIVACY POLICY
                </Text>
              </View>

              <View style={styles.cardsContainer}>
                <SectionCard
                  number="1"
                  title="Information We Collect"
                  iconName="document-text-outline"
                  iconColor="#10B981"
                  description="We collect information you provide directly to us:"
                  bullets={[
                    "Name, email address, and phone number",
                    "Profile information and preferences",
                    "Course enrollment and learning progress data",
                    "Quiz scores, assessments, and certificates earned",
                    "Communication and feedback you provide"
                  ]}
                />

                <SectionCard
                  number="2"
                  title="How We Use Your Information"
                  iconName="analytics-outline"
                  iconColor="#10B981"
                  description="We use the collected information to:"
                  bullets={[
                    "Provide and improve our learning services",
                    "Track and display your learning progress",
                    "Send notifications about courses and updates",
                    "Generate and verify certificates",
                    "Respond to your inquiries and support requests"
                  ]}
                />

                <SectionCard
                  number="3"
                  title="Data Security"
                  iconName="shield-outline"
                  iconColor="#10B981"
                  description="We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted and stored securely on our servers."
                />

                <SectionCard
                  number="4"
                  title="Data Sharing"
                  iconName="share-social-outline"
                  iconColor="#10B981"
                  description="We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for analytical and improvement purposes only."
                />

                <SectionCard
                  number="5"
                  title="Your Rights"
                  iconName="hand-left-outline"
                  iconColor="#10B981"
                  description="You have the right to:"
                  bullets={[
                    "Access and view your personal data",
                    "Request correction of inaccurate data",
                    "Request deletion of your account",
                    "Opt-out of marketing communications"
                  ]}
                />

                <SectionCard
                  number="6"
                  title="Contact Us"
                  iconName="mail-outline"
                  iconColor="#10B981"
                  description={
                    <Text style={[styles.sectionCardDescription, { color: theme.colors.textSecondary }]}>
                      If you have any questions about this policy, please contact us at{' '}
                      <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>gazarisefyp@gmail.com</Text>
                    </Text>
                  }
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
              By clicking "Accept", you agree to our Terms of Use and Privacy Policy.
            </Text>
            <View style={styles.buttonContainer}>
              <AppButton
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                size="lg"
                style={styles.button}
                icon={<Icon name="close-circle" size={20} color={theme.colors.primary} />}
              />
              <AppButton
                title="Accept"
                onPress={onAccept}
                variant="primary"
                size="lg"
                style={styles.button}
                icon={<Icon name="checkmark-circle" size={20} color="#FFFFFF" />}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 650,
    maxHeight: '92%',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  contentScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  mainSection: {
    marginBottom: 20,
  },
  mainSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  mainSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 10,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    gap: 10,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCardTitleContainer: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionCardDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletsContainer: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});

export default PrivacyPolicyModal;
