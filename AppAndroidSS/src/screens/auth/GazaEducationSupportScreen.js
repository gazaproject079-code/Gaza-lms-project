import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import Navbar from '../../components/ui/Navbar';

const SUPPORT_TIERS = [
  {
    id: 'kit',
    amount: 35,
    title: 'Learning Kit',
    impact: 'Supplies exercise books, stationery, and printed learning packs for one learner.',
    icon: 'book-outline',
  },
  {
    id: 'student',
    amount: 120,
    title: 'Sponsor a Learner',
    impact: 'Helps one student access guided digital learning and mentorship for a month.',
    icon: 'school-outline',
  },
  {
    id: 'device',
    amount: 450,
    title: 'Device Access Fund',
    impact: 'Contributes tablets, charging solutions, and connectivity support for a study group.',
    icon: 'tablet-portrait-outline',
  },
  {
    id: 'classroom',
    amount: 1500,
    title: 'Support a Classroom',
    impact: 'Strengthens a full learning cohort with teacher support, materials, and safe study access.',
    icon: 'people-outline',
  },
];

const FOCUS_AREAS = [
  {
    title: 'Student Scholarships',
    description: 'Keeps learners connected to structured courses, mentorship, and assessment support.',
    icon: 'ribbon-outline',
  },
  {
    title: 'Learning Devices',
    description: 'Funds tablets, chargers, and connectivity so education can continue beyond disruptions.',
    icon: 'hardware-chip-outline',
  },
  {
    title: 'Teacher Support',
    description: 'Helps educators and mentors deliver consistent, high-quality learning experiences.',
    icon: 'people-circle-outline',
  },
  {
    title: 'Safe Study Access',
    description: 'Supports flexible study hubs, printable resources, and continuity for displaced learners.',
    icon: 'shield-checkmark-outline',
  },
];

const TRANSPARENCY = [
  { label: 'Direct learning access', value: '45%' },
  { label: 'Devices and connectivity', value: '25%' },
  { label: 'Teacher and mentor support', value: '20%' },
  { label: 'Operations and safeguarding', value: '10%' },
];

const InputField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', theme }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.inputPlaceholder}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        styles.input,
        {
          color: theme.colors.inputText,
          backgroundColor: theme.colors.inputBackground,
          borderColor: theme.colors.inputBorder,
          minHeight: multiline ? 110 : 52,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
  </View>
);

const GazaEducationSupportScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

  const [selectedTier, setSelectedTier] = useState(SUPPORT_TIERS[1]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [customAmount, setCustomAmount] = useState(String(SUPPORT_TIERS[1].amount));
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const progress = useMemo(() => {
    const raised = 148600;
    const goal = 250000;
    return {
      raised,
      goal,
      percent: Math.round((raised / goal) * 100),
    };
  }, []);

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    setCustomAmount(String(tier.amount));
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      return;
    }
    setSubmitted(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Navbar navigation={navigation} isDark={isDark} isMobile={isMobile} isDesktop={!isMobile} showBack={true} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <View style={[styles.heroGlow, { backgroundColor: `${theme.colors.accent}22` }]} />
          <View style={[styles.heroGlowSecondary, { backgroundColor: `${theme.colors.primaryLight}18` }]} />

          <View style={[styles.heroContent, isMobile && { paddingHorizontal: 20 }]}>
            <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Icon name="heart-outline" size={14} color={theme.colors.accent} />
              <Text style={[styles.heroBadgeText, { color: theme.colors.textPrimary }]}>Gaza Education Support Portal</Text>
            </View>

            <Text style={[styles.heroTitle, isMobile && { fontSize: 34, lineHeight: 42 }, { color: theme.colors.textPrimary }]}>
              Fund the future of learning in Gaza
            </Text>
            <Text style={[styles.heroSubtitle, isMobile && { fontSize: 15, lineHeight: 24 }, { color: theme.colors.textSecondary }]}>
              Help students, teachers, and learning communities stay connected to education through scholarships,
              devices, teacher support, and safe study access.
            </Text>

            <View style={[styles.progressCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }, isMobile && { padding: 18 }]}>
              <View style={[styles.progressHeader, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                <View>
                  <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Campaign Goal</Text>
                  <Text style={[styles.progressRaised, { color: theme.colors.textPrimary }]}>${progress.raised.toLocaleString()}</Text>
                  <Text style={[styles.progressGoal, { color: theme.colors.textSecondary }]}>raised of ${progress.goal.toLocaleString()}</Text>
                </View>
                <View style={[styles.progressPill, { backgroundColor: `${theme.colors.accent}15` }]}>
                  <Text style={[styles.progressPillText, { color: theme.colors.accent }]}>{progress.percent}% funded</Text>
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.progressFill, { width: `${progress.percent}%`, backgroundColor: theme.colors.accent }]} />
              </View>
              <View style={[styles.metricsRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>1,240</Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>learners supported</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>320</Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>device access kits</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>58</Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>teacher support grants</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTag, { color: theme.colors.accent, backgroundColor: `${theme.colors.accent}18` }]}>Where Support Goes</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Focused, transparent, education-first support</Text>
          <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>
            Every contribution is aligned to education continuity for Gaza’s learners. The portal is designed for
            individuals, community groups, and institutional partners who want visible impact.
          </Text>

          <View style={[styles.focusGrid, isMobile && { flexDirection: 'column' }]}>
            {FOCUS_AREAS.map((item) => (
              <View
                key={item.title}
                style={[
                  styles.focusCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                    width: isMobile ? '100%' : '48%',
                  },
                ]}
              >
                <View style={[styles.focusIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Icon name={item.icon} size={22} color={theme.colors.primary} />
                </View>
                <Text style={[styles.focusTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.focusDesc, { color: theme.colors.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTag, { color: theme.colors.primary, backgroundColor: `${theme.colors.primary}14` }]}>Support Levels</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Choose the impact you want to unlock</Text>

          <View style={[styles.tierGrid, isMobile && { flexDirection: 'column' }]}>
            {SUPPORT_TIERS.map((tier) => {
              const active = selectedTier.id === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  activeOpacity={0.9}
                  onPress={() => handleSelectTier(tier)}
                  style={[
                    styles.tierCard,
                    {
                      width: isMobile ? '100%' : '24%',
                      backgroundColor: active ? theme.colors.heroGradientStart : theme.colors.card,
                      borderColor: active ? theme.colors.accent : theme.colors.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.tierIcon, { backgroundColor: active ? 'rgba(255,255,255,0.12)' : `${theme.colors.accent}14` }]}>
                    <Icon name={tier.icon} size={22} color={active ? '#FFFFFF' : theme.colors.accent} />
                  </View>
                  <Text style={[styles.tierAmount, { color: active ? '#FFFFFF' : theme.colors.textPrimary }]}>${tier.amount}</Text>
                  <Text style={[styles.tierTitle, { color: active ? '#FFFFFF' : theme.colors.textPrimary }]}>{tier.title}</Text>
                  <Text style={[styles.tierImpact, { color: active ? 'rgba(255,255,255,0.78)' : theme.colors.textSecondary }]}>{tier.impact}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.formLayout, isMobile && { flexDirection: 'column' }]}>
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.cardBorder,
                  width: isMobile ? '100%' : '58%',
                },
              ]}
            >
              <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>Commit support</Text>
              <Text style={[styles.formSub, { color: theme.colors.textSecondary }]}>
                Select a giving tier or enter a custom amount. Our team can follow up to complete the contribution securely.
              </Text>

              <InputField theme={theme} label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
              <InputField theme={theme} label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
              <InputField theme={theme} label="Organization (optional)" value={organization} onChangeText={setOrganization} placeholder="School, NGO, company, or community group" />
              <InputField theme={theme} label="Contribution amount (USD)" value={customAmount} onChangeText={setCustomAmount} placeholder="120" keyboardType="numeric" />
              <InputField theme={theme} label="Message (optional)" value={note} onChangeText={setNote} placeholder="Tell us what kind of educational support matters most to you." multiline />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark }]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitBtnText}>Commit Support</Text>
                <Icon name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {submitted && (
                <View style={[styles.successBox, { backgroundColor: theme.colors.successLight, borderColor: `${theme.colors.success}35` }]}>
                  <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.successTitle, { color: theme.colors.successDark }]}>Support request recorded</Text>
                    <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
                      Thank you, {name || 'supporter'}. We’ll prepare the next step for your ${customAmount || selectedTier.amount} education contribution.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View
              style={[
                styles.sideCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.cardBorder,
                  width: isMobile ? '100%' : '38%',
                },
              ]}
            >
              <Text style={[styles.sideTag, { color: theme.colors.textTertiary }]}>Transparency</Text>
              <Text style={[styles.sideTitle, { color: theme.colors.textPrimary }]}>How funds are allocated</Text>
              <Text style={[styles.sideSub, { color: theme.colors.textSecondary }]}>
                We prioritize direct educational continuity first, then the infrastructure that keeps learning possible.
              </Text>

              {TRANSPARENCY.map((row) => (
                <View key={row.label} style={[styles.allocationRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.allocationLabel, { color: theme.colors.textSecondary }]}>{row.label}</Text>
                  <Text style={[styles.allocationValue, { color: theme.colors.textPrimary }]}>{row.value}</Text>
                </View>
              ))}

              <View style={[styles.sideDivider, { backgroundColor: theme.colors.border }]} />

              <Text style={[styles.sideMiniTitle, { color: theme.colors.textPrimary }]}>Partnership options</Text>
              <View style={styles.partnerBullet}>
                <Icon name="checkmark" size={16} color={theme.colors.accent} />
                <Text style={[styles.partnerBulletText, { color: theme.colors.textSecondary }]}>Monthly sponsorship circles</Text>
              </View>
              <View style={styles.partnerBullet}>
                <Icon name="checkmark" size={16} color={theme.colors.accent} />
                <Text style={[styles.partnerBulletText, { color: theme.colors.textSecondary }]}>Corporate education giving</Text>
              </View>
              <View style={styles.partnerBullet}>
                <Icon name="checkmark" size={16} color={theme.colors.accent} />
                <Text style={[styles.partnerBulletText, { color: theme.colors.textSecondary }]}>Institutional and foundation partnerships</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  heroWrap: {
    overflow: 'hidden',
    paddingBottom: 34,
  },
  heroGlow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -90,
    right: -70,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -60,
    left: -70,
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 56 : 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  heroContent: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 28,
    paddingHorizontal: 32,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 20,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 58,
    maxWidth: 720,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 760,
    marginBottom: 28,
  },
  progressCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  progressRaised: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  progressGoal: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    marginTop: 4,
  },
  progressPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  progressPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 64,
    alignItems: 'center',
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 760,
  },
  sectionSub: {
    fontSize: 15,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 760,
    marginBottom: 32,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    maxWidth: 1120,
    width: '100%',
    justifyContent: 'center',
  },
  focusCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
  },
  focusIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  focusDesc: {
    fontSize: 14,
    lineHeight: 24,
  },
  tierGrid: {
    flexDirection: 'row',
    gap: 14,
    maxWidth: 1180,
    width: '100%',
    justifyContent: 'center',
  },
  tierCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  tierIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierAmount: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  tierTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  tierImpact: {
    fontSize: 13,
    lineHeight: 22,
  },
  formLayout: {
    flexDirection: 'row',
    gap: 18,
    maxWidth: 1120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  sideCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  formSub: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  submitBtn: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  successBox: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    lineHeight: 22,
  },
  sideTag: {
    color: '#FFFFFF',
    opacity: 0.74,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sideTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
  },
  sideSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 20,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  allocationLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    flex: 1,
    paddingRight: 12,
  },
  allocationValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  sideDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 20,
  },
  sideMiniTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  partnerBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  partnerBulletText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 13,
  },
});

export default GazaEducationSupportScreen;
