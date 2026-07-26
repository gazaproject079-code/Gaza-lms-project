import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, ActivityIndicator,
  TextInput, useWindowDimensions, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const LOGO  = require('../../assets/images/gazarise_logo.png');
const GREEN = '#007A3D';
const RED   = '#CE1126';

const getColors = (isDark) => ({
  bg:               isDark ? '#07120D'                                                                                             : '#EFF8F2',
  webBg:            isDark ? 'linear-gradient(140deg,#060F0A 0%,#0F1923 40%,#0F1923 60%,#17060A 100%)' : 'linear-gradient(140deg,#EBF7EF 0%,#F7FAF8 40%,#FAF7F8 60%,#FAEEF0 100%)',
  cardBg:           isDark ? 'rgba(255,255,255,0.06)'   : '#FFFFFF',
  cardBorder:       isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.08)',
  textPrimary:      isDark ? '#FFFFFF'                  : '#1A1A2E',
  textSecondary:    isDark ? 'rgba(255,255,255,0.55)'   : 'rgba(26,26,46,0.55)',
  otpBg:            isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(26,26,46,0.04)',
  otpBorder:        isDark ? 'rgba(255,255,255,0.15)'   : 'rgba(26,26,46,0.15)',
  otpText:          isDark ? '#FFFFFF'                  : '#1A1A2E',
  footerText:       isDark ? 'rgba(255,255,255,0.5)'    : 'rgba(26,26,46,0.5)',
  resendText:       isDark ? 'rgba(255,255,255,0.5)'    : 'rgba(26,26,46,0.5)',
  resendDisabled:   isDark ? 'rgba(255,255,255,0.3)'    : 'rgba(26,26,46,0.3)',
  errorBg:          isDark ? 'rgba(255,107,107,0.12)'   : 'rgba(239,68,68,0.08)',
  errorBorder:      isDark ? 'rgba(255,107,107,0.25)'   : 'rgba(239,68,68,0.2)',
  backBtn:          isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.1)',
  logoText:         isDark ? '#FFFFFF'                  : '#1A1A2E',
});

const SignupOTPScreen = ({ route, navigation }) => {
  const params     = route?.params || {};
  const email      = params.email      || '';
  const name       = params.name       || '';
  const role       = params.role       || 'student';
  const isWarZone  = params.isWarZone  || false;
  const { verifyOTP, resendOTP, isLoading } = useAuth();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const { width } = useWindowDimensions();

  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [error, setError]             = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [verifying, setVerifying]     = useState(false);
  const [sending, setSending]         = useState(false);
  const refs = useRef([]);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setInterval(() => setResendCooldown(p => p <= 1 ? 0 : p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendCooldown]);

  const handleChange = (val, i) => {
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (key, i) => {
    if (key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    const code = otp.join('');
    if (code.length !== 6) return setError('Please enter the complete 6-digit code');
    setVerifying(true);
    try {
      const result = await verifyOTP(email, code);
      setVerifying(false);
      if (result.success) {
        navigation.replace('SignupDetails', { email, name, role, isWarZone });
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (err) {
      setVerifying(false);
      setError(err.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(''); setSending(true);
    try {
      const result = await resendOTP(email);
      setSending(false);
      if (result.success) {
        setResendCooldown(60);
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err) {
      setSending(false);
      setError(err.message || 'Failed to resend code');
    }
  };

  const bg = isWeb ? { background: C.webBg } : { backgroundColor: C.bg };

  return (
    <View style={[s.container, bg]}>

      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: C.backBtn }]}>
          <Icon name="arrow-back" size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          <Text style={[s.logoText, { color: C.logoText }]}>GAZA<Text style={{ color: RED }}>RISE</Text></Text>
        </View>
        <ThemeToggle iconColor={C.textPrimary} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.brandHeader}>
            <View style={[s.iconCircle, { backgroundColor: GREEN + '20', borderColor: GREEN + '40' }]}>
              <Icon name="shield-checkmark-outline" size={32} color={GREEN} />
            </View>
            <Text style={[s.title, { color: C.textPrimary }]}>Verify Your Email</Text>
            <Text style={[s.subtitle, { color: C.textSecondary }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: GREEN, fontWeight: '700' }}>{email}</Text>
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder, maxWidth: 440, alignSelf: 'center', width: '100%' }]}>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={r => refs.current[i] = r}
                  style={[s.otpBox, {
                    color: C.otpText,
                    borderColor: digit ? GREEN : C.otpBorder,
                    backgroundColor: digit ? GREEN + '15' : C.otpBg,
                  }]}
                  value={digit}
                  onChangeText={v => handleChange(v.replace(/[^0-9]/g, ''), i)}
                  onKeyPress={({ nativeEvent }) => handleKey(nativeEvent.key, i)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} disabled={verifying || isLoading} activeOpacity={0.85}>
              {verifying || isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={s.primaryBtnText}>Verify Email</Text>}
            </TouchableOpacity>

            <View style={s.resendRow}>
              <Text style={[s.resendText, { color: C.resendText }]}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || sending}>
                <Text style={[s.resendLink, { color: resendCooldown > 0 ? C.resendDisabled : GREEN }]}>
                  {sending ? 'Sending...' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.changeRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={14} color={GREEN} />
              <Text style={{ color: GREEN, fontSize: 13, fontWeight: '600' }}>Change email address</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 16, paddingBottom: 12, zIndex: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 42, height: 42, borderRadius: 12 },
  logoText: { fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', paddingVertical: 36 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  otpBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 2, textAlign: 'center', fontSize: 24, fontWeight: '800' },
  primaryBtn: { height: 52, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#005C2E', justifyContent: 'center', alignItems: 'center', shadowColor: '#003D1F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.12 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
});

export default SignupOTPScreen;
