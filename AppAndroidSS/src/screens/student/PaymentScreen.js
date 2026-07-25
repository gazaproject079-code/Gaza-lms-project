import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, useWindowDimensions,
} from 'react-native';

const GREEN = '#007A3D';
const RED = '#CE1126';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import MainLayout from '../../components/ui/MainLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { certificateAPI } from '../../services/apiClient';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard',      icon: 'grid-outline',    iconActive: 'grid',    route: 'Dashboard' },
  { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
  { label: 'My Learning',    icon: 'school-outline',  iconActive: 'school',  route: 'EnrolledCourses' },
  { label: 'AI Assistant',   icon: 'sparkles-outline',iconActive: 'sparkles',route: 'AITutor' },
  { label: 'Certificates',   icon: 'ribbon-outline',  iconActive: 'ribbon',  route: 'Certificates' },
    { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
];

const METHODS = [
  { id: 'easypaisa', label: 'EasyPaisa', icon: 'cash-multiple',    color: '#00a651', type: 'mobile' },
  { id: 'jazzcash',  label: 'JazzCash',  icon: 'lightning-bolt',   color: '#d91e2a', type: 'mobile' },
  { id: 'visa',      label: 'Visa',      icon: 'credit-card',      color: '#1a1f71', type: 'card'   },
  { id: 'mastercard',label: 'Mastercard',icon: 'credit-card-chip', color: '#eb001b', type: 'card'   },
];

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const { user, logout }  = useAuth();
  const { width } = useWindowDimensions();
  const { courseId, courseName, amount = 500 } = route.params || {};

  // War-zone learners get certificates free; everyone else makes a compulsory
  // donation that supports education infrastructure in affected countries.
  const isWarZone = user?.isWarZone === true;

  const [selected, setSelected]           = useState('easypaisa');
  const [phone, setPhone]                 = useState('');
  const [cardNumber, setCardNumber]       = useState('');
  const [expiry, setExpiry]               = useState('');
  const [cvv, setCvv]                     = useState('');
  const [cardName, setCardName]           = useState('');
  const [processing, setProcessing]       = useState(false);

  const method  = METHODS.find(m => m.id === selected);
  const isCard  = method?.type === 'card';
  const maxWidth = width > 680 ? 520 : '100%';

  const fmtCard   = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const validate = () => {
    if (isCard) {
      if (!cardName.trim())                         { Toast.show({ type: 'error', text1: 'Missing name' }); return false; }
      if (cardNumber.replace(/\s/g, '').length < 16){ Toast.show({ type: 'error', text1: 'Invalid card number' }); return false; }
      if (expiry.length < 5)                        { Toast.show({ type: 'error', text1: 'Invalid expiry date' }); return false; }
      if (cvv.length < 3)                           { Toast.show({ type: 'error', text1: 'Invalid CVV' }); return false; }
    } else {
      if (phone.replace(/\D/g, '').length < 11)     { Toast.show({ type: 'error', text1: 'Enter a valid 11-digit mobile number' }); return false; }
    }
    return true;
  };

  const issueCertificate = async (successText) => {
    try {
      const res = await certificateAPI.generate({ courseId, grade: 'Pass', sendEmail: true });
      if (res.success) {
        Toast.show({
          type: 'success',
          text1: successText,
          text2: 'Your certificate has been sent to your email',
        });
        setTimeout(() => {
          navigation.navigate('CertificatePreview', { courseId, courseName });
        }, 1500);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Something went wrong' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!validate()) return;
    setProcessing(true);

    // Simulate 2s donation processing (static/mock)
    await new Promise(r => setTimeout(r, 2000));
    await issueCertificate('Thank you for your donation!');
  };

  const handleClaimFree = async () => {
    setProcessing(true);
    await issueCertificate('Certificate issued — free for war-zone learners');
  };

  const surface = isDark ? theme.colors.surface : '#fff';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={SIDEBAR_ITEMS}
      activeRoute="Certificates"
      onNavigate={r => navigation.navigate(r)}
      userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
      onLogout={logout}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { maxWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Page Header Banner */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.05)',
          borderColor: 'rgba(16,185,129,0.15)',
        }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.bannerIconCircle, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Icon name="card" size={22} color="#10B981" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>{isWarZone ? 'Your Certificate' : 'Support Education'}</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
                {isWarZone ? 'Free for learners in war zones' : 'A contribution that sustains education infrastructure'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: surface, borderColor: theme.colors.border }]}>
          <View style={styles.summaryLeft}>
            <View style={[styles.summaryIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="ribbon" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textTertiary }]}>Certificate for</Text>
              <Text style={[styles.summaryCourseName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                {courseName}
              </Text>
            </View>
          </View>
          <View style={[styles.amountPill, { backgroundColor: isWarZone ? '#10B981' : theme.colors.primary }]}>
            <Text style={styles.amountPillText}>{isWarZone ? 'FREE' : `PKR ${amount}`}</Text>
          </View>
        </View>

        {isWarZone ? (
          <>
            {/* Free access for war-zone learners */}
            <View style={[styles.formCard, { backgroundColor: surface, borderColor: 'rgba(16,185,129,0.3)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon name="shield-checkmark" size={22} color="#10B981" />
                <Text style={[styles.formTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>Free Education Access</Text>
              </View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                Because you are learning from a war zone, your education and certificate are completely free.
                No donation is required. Learners elsewhere contribute to keep this possible.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: '#10B981', opacity: processing ? 0.8 : 1 }]}
              onPress={handleClaimFree}
              disabled={processing}
              activeOpacity={0.85}
            >
              {processing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.payBtnText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Icon name="ribbon" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Get My Certificate — Free</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.secureNote, { color: theme.colors.textTertiary }]}>
              🕊️  Education is free for everyone affected by conflict
            </Text>
          </>
        ) : (
        <>
        {/* Method Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Select Payment Method
        </Text>
        <View style={styles.methodsGrid}>
          {METHODS.map(m => {
            const active = selected === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.methodCard,
                  { backgroundColor: active ? m.color + '14' : surface, borderColor: active ? m.color : theme.colors.border },
                ]}
                onPress={() => setSelected(m.id)}
                activeOpacity={0.8}
              >
                {active && (
                  <View style={[styles.methodCheckmark, { backgroundColor: m.color }]}>
                    <Icon name="checkmark" size={9} color="#fff" />
                  </View>
                )}
                <MaterialIcon name={m.icon} size={28} color={active ? m.color : theme.colors.textSecondary} />
                <Text style={[styles.methodLabel, {
                  color: active ? m.color : theme.colors.textPrimary,
                  fontWeight: active ? '700' : '500',
                }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Form */}
        <View style={[styles.formCard, { backgroundColor: surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>
            {isCard ? 'Card Information' : `${method?.label} Account`}
          </Text>

          {!isCard ? (
            <FormInput
              label="Mobile Number"
              icon="phone-portrait-outline"
              placeholder="e.g. 03001234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={13}
              theme={theme}
              inputBg={inputBg}
            />
          ) : (
            <>
              <FormInput
                label="Cardholder Name"
                icon="person-outline"
                placeholder="Full name on card"
                value={cardName}
                onChangeText={setCardName}
                theme={theme}
                inputBg={inputBg}
              />
              <FormInput
                label="Card Number"
                icon="credit-card-outline"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChangeText={v => setCardNumber(fmtCard(v))}
                keyboardType="numeric"
                maxLength={19}
                letterSpacing={1}
                theme={theme}
                inputBg={inputBg}
                useMaterial
              />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Expiry Date"
                    icon="calendar-outline"
                    placeholder="MM/YY"
                    value={expiry}
                    onChangeText={v => setExpiry(fmtExpiry(v))}
                    keyboardType="numeric"
                    maxLength={5}
                    theme={theme}
                    inputBg={inputBg}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="CVV"
                    icon="lock-closed-outline"
                    placeholder="•••"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    theme={theme}
                    inputBg={inputBg}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: method?.color || theme.colors.primary, opacity: processing ? 0.8 : 1 }]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.payBtnText}>Processing...</Text>
            </>
          ) : (
            <>
              <Icon name="heart" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Donate PKR {amount}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.secureNote, { color: theme.colors.textTertiary }]}>
          🔒  Secure donation — supports education infrastructure (demo: no real charge)
        </Text>
        </>
        )}

      </ScrollView>
    </MainLayout>
  );
};

// ── Reusable input ──────────────────────────────────────────────────────────

const FormInput = ({
  label, icon, placeholder, value, onChangeText,
  keyboardType, maxLength, secureTextEntry, letterSpacing,
  theme, inputBg, useMaterial,
}) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: theme.colors.border }]}>
      {useMaterial
        ? <MaterialIcon name={icon} size={17} color={theme.colors.textTertiary} style={styles.inputIcon} />
        : <Icon name={icon} size={17} color={theme.colors.textTertiary} style={styles.inputIcon} />
      }
      <TextInput
        style={[styles.textInput, { color: theme.colors.textPrimary, letterSpacing: letterSpacing || 0 }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  </View>
);

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 48, gap: 16 },

  // Page Header Banner
  pageHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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

  // Summary
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 12,
    borderTopWidth: 3, borderTopColor: '#007A3D', overflow: 'hidden',
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  summaryIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, marginBottom: 2 },
  summaryCourseName: { fontSize: 14, fontWeight: '600' },
  amountPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  amountPillText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Section title
  sectionTitle: {
    fontSize: 14, fontWeight: '700', marginBottom: -4,
    borderLeftWidth: 3, borderLeftColor: '#007A3D', paddingLeft: 8,
  },

  // Methods grid (2×2)
  methodsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  methodCard: {
    width: '47.5%', borderRadius: 14, borderWidth: 1.5,
    paddingVertical: 18, alignItems: 'center', gap: 8,
    position: 'relative',
  },
  methodCheckmark: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  methodLabel: { fontSize: 13 },

  // Form card
  formCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 4,
    borderTopWidth: 3, borderTopColor: '#007A3D', overflow: 'hidden',
  },
  formTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },

  // Input
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 46,
  },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 14 },
  rowInputs: { flexDirection: 'row', gap: 10 },

  // Pay button
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  secureNote: { fontSize: 12, textAlign: 'center', marginTop: -4 },
});

export default PaymentScreen;
