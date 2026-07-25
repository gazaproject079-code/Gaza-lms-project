import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput,
  useWindowDimensions,
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
  label:            isDark ? 'rgba(255,255,255,0.7)'    : 'rgba(26,26,46,0.7)',
  inputBg:          isDark ? 'rgba(255,255,255,0.06)'   : 'rgba(26,26,46,0.04)',
  inputBorder:      isDark ? 'rgba(255,255,255,0.12)'   : 'rgba(26,26,46,0.1)',
  inputText:        isDark ? '#FFFFFF'                  : '#1A1A2E',
  inputPlaceholder: isDark ? 'rgba(255,255,255,0.3)'    : 'rgba(26,26,46,0.3)',
  inputIcon:        isDark ? 'rgba(255,255,255,0.4)'    : 'rgba(26,26,46,0.4)',
  footerText:       isDark ? 'rgba(255,255,255,0.5)'    : 'rgba(26,26,46,0.5)',
  errorBg:          isDark ? 'rgba(255,107,107,0.12)'   : 'rgba(239,68,68,0.08)',
  errorBorder:      isDark ? 'rgba(255,107,107,0.25)'   : 'rgba(239,68,68,0.2)',
  infoBg:           isDark ? 'rgba(255,255,255,0.04)'   : 'rgba(26,26,46,0.04)',
  infoText:         isDark ? 'rgba(255,255,255,0.45)'   : 'rgba(26,26,46,0.45)',
  infoIcon:         isDark ? 'rgba(255,255,255,0.5)'    : 'rgba(26,26,46,0.5)',
  backBtn:          isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.1)',
  logoText:         isDark ? '#FFFFFF'                  : '#1A1A2E',
});

const AuthInput = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', autoCapitalize = 'none', C }) => {
  const [focused, setFocused] = useState(false);
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
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};
const inp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  field: { flex: 1, fontSize: 14, outlineStyle: 'none' },
});

const ForgotPasswordScreen = ({ navigation, route }) => {
  const { forgotPassword, isLoading, user } = useAuth();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const { width } = useWindowDimensions();

  const isFromSettings = route?.params?.fromSettings || false;
  const userEmail = user?.email || route?.params?.email || '';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isFromSettings && userEmail) setEmail(userEmail);
  }, [isFromSettings, userEmail]);

  const handleSend = async () => {
    setError('');
    if (!email.trim()) return setError('Please enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address');
    const result = await forgotPassword(email.trim().toLowerCase());
    if (result.success) {
      navigation.navigate('OTPVerification', { email: email.trim().toLowerCase(), isPasswordReset: true });
    } else {
      setError(result.error || 'Failed to send reset code. Please try again.');
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
              <Icon name="lock-open-outline" size={32} color={GREEN} />
            </View>
            <Text style={[s.title, { color: C.textPrimary }]}>{isFromSettings ? 'Reset Password' : 'Forgot Password?'}</Text>
            <Text style={[s.subtitle, { color: C.textSecondary }]}>
              {isFromSettings
                ? 'Enter your email to receive a password reset code'
                : "Enter your email and we'll send you a reset code"}
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder, maxWidth: 440, alignSelf: 'center', width: '100%' }]}>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <Text style={[s.label, { color: C.label }]}>Email Address</Text>
            <AuthInput C={C} icon="mail-outline" placeholder="Enter your email" value={email}
              onChangeText={t => { setEmail(t); setError(''); }} keyboardType="email-address" />

            <TouchableOpacity style={s.primaryBtn} onPress={handleSend} disabled={isLoading} activeOpacity={0.85}>
              {isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="send-outline" size={16} color="#FFFFFF" />
                    <Text style={s.primaryBtnText}>Send Reset Code</Text>
                  </View>
                )}
            </TouchableOpacity>

            <View style={[s.infoBox, { backgroundColor: C.infoBg }]}>
              <Icon name="information-circle-outline" size={16} color={C.infoIcon} />
              <Text style={[s.infoText, { color: C.infoText }]}>
                A 6-digit verification code will be sent to your email. Check your spam folder if you don't see it.
              </Text>
            </View>

            <View style={s.footer}>
              <Text style={[s.footerText, { color: C.footerText }]}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
  logoImg: { width: 28, height: 28, borderRadius: 7 },
  logoText: { fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', paddingVertical: 36 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  primaryBtn: { height: 52, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#005C2E', justifyContent: 'center', alignItems: 'center', shadowColor: '#003D1F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.12 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, padding: 12, marginTop: 16 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { color: GREEN, fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },

});

export default ForgotPasswordScreen;
