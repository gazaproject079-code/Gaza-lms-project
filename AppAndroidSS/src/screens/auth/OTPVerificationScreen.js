import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, ActivityIndicator,
  TextInput, useWindowDimensions, Modal, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { ZoomIn, FadeInUp, BounceIn, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { resendOTP } from '../../services/emailOTPService';

const LOGO   = require('../../assets/images/gazarise_logo.png');
const GREEN = '#007A3D';
const RED = '#CE1126';

const getColors = (isDark) => ({
  bg:               isDark ? '#0F0F1E'                                                          : '#EEF0FF',
  webBg:            isDark ? 'linear-gradient(135deg,#0F0F1E 0%,#1A1A2E 50%,#0F1628 100%)'    : 'linear-gradient(135deg,#EEF0FF 0%,#F0F2FF 50%,#E8EEFF 100%)',
  cardBg:           isDark ? 'rgba(255,255,255,0.06)'   : '#FFFFFF',
  cardBorder:       isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.08)',
  textPrimary:      isDark ? '#FFFFFF'                  : '#1A1A2E',
  textSecondary:    isDark ? 'rgba(255,255,255,0.55)'   : 'rgba(26,26,46,0.55)',
  inputBg:          isDark ? 'rgba(255,255,255,0.06)'   : 'rgba(26,26,46,0.04)',
  inputBorder:      isDark ? 'rgba(255,255,255,0.12)'   : 'rgba(26,26,46,0.1)',
  inputText:        isDark ? '#FFFFFF'                  : '#1A1A2E',
  inputPlaceholder: isDark ? 'rgba(255,255,255,0.3)'    : 'rgba(26,26,46,0.3)',
  inputIcon:        isDark ? 'rgba(255,255,255,0.4)'    : 'rgba(26,26,46,0.4)',
  otpBg:            isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(26,26,46,0.04)',
  otpBorder:        isDark ? 'rgba(255,255,255,0.15)'   : 'rgba(26,26,46,0.15)',
  otpText:          isDark ? '#FFFFFF'                  : '#1A1A2E',
  sectionLabel:     isDark ? 'rgba(255,255,255,0.6)'    : 'rgba(26,26,46,0.6)',
  resendText:       isDark ? 'rgba(255,255,255,0.5)'    : 'rgba(26,26,46,0.5)',
  resendDisabled:   isDark ? 'rgba(255,255,255,0.3)'    : 'rgba(26,26,46,0.3)',
  errorBg:          isDark ? 'rgba(255,107,107,0.12)'   : 'rgba(239,68,68,0.08)',
  errorBorder:      isDark ? 'rgba(255,107,107,0.25)'   : 'rgba(239,68,68,0.2)',
  modalBg:          isDark ? '#1E1E38'                  : '#FFFFFF',
  modalBorder:      isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.08)',
  modalTitle:       isDark ? '#FFFFFF'                  : '#1A1A2E',
  modalMsg:         isDark ? 'rgba(255,255,255,0.6)'    : 'rgba(26,26,46,0.6)',
  backBtn:          isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.1)',
  logoText:         isDark ? '#FFFFFF'                  : '#1A1A2E',
});

const AuthInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, C }) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={[inp.wrap, {
      backgroundColor: C.inputBg,
      borderColor: focused ? GREEN : C.inputBorder,
    }]}>
      <Icon name={icon} size={18} color={focused ? GREEN : C.inputIcon} />
      <TextInput
        style={[inp.field, { color: C.inputText }]}
        placeholder={placeholder}
        placeholderTextColor={C.inputPlaceholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !show}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShow(!show)}>
          <Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.inputIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};
const inp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  field: { flex: 1, fontSize: 14, outlineStyle: 'none' },
});

const OTPVerificationScreen = ({ route, navigation }) => {
  const { email, isPasswordReset, isSignup } = route.params || {};
  const { resetPassword, verifySignupOTP, isLoading } = useAuth();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const { width } = useWindowDimensions();

  const [otp, setOtp]                   = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showModal, setShowModal]       = useState(false);
  const [modalTitle, setModalTitle]     = useState('');
  const [modalMsg, setModalMsg]         = useState('');
  const [error, setError]               = useState('');
  const refs = useRef([]);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setInterval(() => setResendCooldown(p => p <= 1 ? 0 : p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendCooldown]);

  const handleChange = (val, i) => {
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (key, i) => {
    if (key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    const code = otp.join('');
    if (code.length !== 6) return setError('Please enter the complete 6-digit code');

    if (isPasswordReset) {
      if (!newPassword || !confirmPw) return setError('Please enter your new password');
      if (newPassword !== confirmPw)   return setError('Passwords do not match');
      if (newPassword.length < 6)      return setError('Password must be at least 6 characters');
      const result = await resetPassword(email, code, newPassword);
      if (result.success) {
        setModalTitle('Password Changed!');
        setModalMsg('Your password has been reset successfully. You can now log in with your new password.');
        setShowModal(true);
      } else {
        setError(result.error || 'Invalid code. Please try again.');
      }
    } else if (isSignup) {
      const result = await verifySignupOTP(email, code);
      if (result.success) {
        setModalTitle('Welcome to GazaRise!');
        setModalMsg("Your email has been verified and your account is ready. Let's start learning!");
        setShowModal(true);
      } else {
        setError(result.error || 'Invalid code. Please try again.');
      }
    } else {
      setModalTitle('Email Verified!');
      setModalMsg('Your email has been verified successfully.');
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (isPasswordReset) navigation.navigate('Login');
    else if (isSignup) navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    else navigation.goBack();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const result = await resendOTP(email);
    if (result.success) {
      setResendCooldown(60);
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
    } else {
      setError(result.error || 'Failed to resend code');
    }
  };

  const bg = isWeb ? { background: C.webBg } : { backgroundColor: C.bg };

  return (
    <View style={[s.container, bg]}>
      <View style={[s.glow1, { backgroundColor: GREEN + '0C' }]} />
      <View style={[s.glow2, { backgroundColor: '#007A3D' + (isDark ? '0A' : '08') }]} />

      {/* Success Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleModalClose}>
        <View style={s.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(350)} style={[s.modalCard, { backgroundColor: C.modalBg, borderColor: C.modalBorder }]}>
            <Animated.View entering={BounceIn.duration(500).delay(200)} style={s.modalIcon}>
              <Icon name="checkmark" size={44} color="#FFFFFF" />
            </Animated.View>
            <Animated.Text entering={FadeInUp.duration(400).delay(300)} style={[s.modalTitle, { color: C.modalTitle }]}>
              {modalTitle}
            </Animated.Text>
            <Animated.Text entering={FadeInUp.duration(400).delay(400)} style={[s.modalMsg, { color: C.modalMsg }]}>
              {modalMsg}
            </Animated.Text>
            <Animated.View entering={FadeIn.duration(400).delay(500)} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {[GREEN, '#007A3D', '#10B981'].map((c, i) => (
                <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
              ))}
            </Animated.View>
            <Animated.View entering={FadeInUp.duration(400).delay(600)} style={{ width: '100%', marginTop: 28 }}>
              <TouchableOpacity style={s.modalBtn} onPress={handleModalClose} activeOpacity={0.85}>
                <Text style={s.modalBtnText}>{isPasswordReset ? 'Go to Login' : 'Continue'}</Text>
                <Icon name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: C.backBtn }]}>
          <Icon name="arrow-back" size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          <Text style={[s.logoText, { color: C.logoText }]}>GAZA<Text style={{ color: GREEN }}>RISE</Text></Text>
        </View>
        <ThemeToggle iconColor={C.textPrimary} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.brandHeader}>
            <View style={[s.iconCircle, { backgroundColor: GREEN + '20', borderColor: GREEN + '40' }]}>
              <Icon name={isPasswordReset ? 'key-outline' : 'shield-checkmark-outline'} size={32} color={GREEN} />
            </View>
            <Text style={[s.title, { color: C.textPrimary }]}>{isPasswordReset ? 'Reset Password' : 'Verify Email'}</Text>
            <Text style={[s.subtitle, { color: C.textSecondary }]}>
              Enter the 6-digit code sent to{'\n'}
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

            {isPasswordReset && (
              <>
                <Text style={[s.sectionLabel, { color: C.sectionLabel }]}>New Password</Text>
                <AuthInput C={C} icon="lock-closed-outline" placeholder="Create new password (min 6 chars)"
                  value={newPassword} onChangeText={t => { setNewPassword(t); setError(''); }} secureTextEntry />
                <Text style={[s.sectionLabel, { color: C.sectionLabel }]}>Confirm Password</Text>
                <AuthInput C={C} icon="lock-closed-outline" placeholder="Confirm new password"
                  value={confirmPw} onChangeText={t => { setConfirmPw(t); setError(''); }} secureTextEntry />
              </>
            )}

            <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} disabled={isLoading} activeOpacity={0.85}>
              {isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={s.primaryBtnText}>{isPasswordReset ? 'Reset Password' : 'Verify Code'}</Text>}
            </TouchableOpacity>

            <View style={s.resendRow}>
              <Text style={[s.resendText, { color: C.resendText }]}>Didn't receive code? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0}>
                <Text style={[s.resendLink, { color: resendCooldown > 0 ? C.resendDisabled : GREEN }]}>
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
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
  glow1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -60, right: -50, zIndex: 0 },
  glow2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 60, left: -70, zIndex: 0 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 16, paddingBottom: 12, zIndex: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 28, height: 28, borderRadius: 7 },
  logoText: { fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', paddingVertical: 36 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  otpBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 2, textAlign: 'center', fontSize: 24, fontWeight: '800' },
  primaryBtn: { height: 52, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', justifyContent: 'center', alignItems: 'center', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.12 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { borderRadius: 28, borderWidth: 1, padding: 36, alignItems: 'center', width: '100%', maxWidth: 380 },
  modalIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 22, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  modalTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  modalMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 8 },
  modalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
  modalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.12 },
});

export default OTPVerificationScreen;
