import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, ActivityIndicator,
  useWindowDimensions, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { signInWithGoogle, configureGoogleSignIn } from '../../services/googleAuthService';

const LOGO   = require('../../assets/images/gazarise_logo.png');
const getColors = (theme, isDark) => ({
  bg: isDark ? '#07120D' : '#EFF8F2',
  webBg: isDark
    ? 'linear-gradient(140deg, #060F0A 0%, #0F1923 40%, #0F1923 60%, #17060A 100%)'
    : 'linear-gradient(140deg, #EBF7EF 0%, #F7FAF8 40%, #FAF7F8 60%, #FAEEF0 100%)',
  cardBg: isDark ? 'rgba(11,31,51,0.72)' : 'rgba(255,255,255,0.92)',
  cardBorder: isDark ? 'rgba(45,212,191,0.16)' : 'rgba(15,118,110,0.10)',
  textPrimary: theme.colors.textPrimary,
  textSecondary: theme.colors.textSecondary,
  inputBg: theme.colors.inputBackground,
  inputBorder: theme.colors.inputBorder,
  inputText: theme.colors.inputText,
  inputPlaceholder: theme.colors.inputPlaceholder,
  inputIcon: theme.colors.textTertiary,
  divider: theme.colors.border,
  dividerText: theme.colors.textTertiary,
  googleBg: isDark ? 'rgba(247,244,236,0.05)' : 'rgba(15,118,110,0.05)',
  googleBorder: isDark ? 'rgba(45,212,191,0.14)' : 'rgba(15,118,110,0.10)',
  googleText: theme.colors.textPrimary,
  footerText: theme.colors.textSecondary,
  terms: theme.colors.textTertiary,
  errorBg: theme.colors.errorLight,
  errorBorder: isDark ? 'rgba(251,146,60,0.20)' : 'rgba(194,65,12,0.18)',
  tabsBg: isDark ? 'rgba(247,244,236,0.06)' : 'rgba(15,118,110,0.06)',
  tabInactive: theme.colors.textSecondary,
  otpHint: theme.colors.textSecondary,
  backBtn: isDark ? 'rgba(247,244,236,0.08)' : 'rgba(15,118,110,0.08)',
  logoText: theme.colors.textPrimary,
  heroGlowA: `${theme.colors.primary}18`,
  heroGlowB: `${theme.colors.accent}16`,
  accent: theme.colors.primary,
  highlight: theme.colors.accent,
});

const AuthInput = ({ icon, placeholder, value, onChangeText, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'none', right, C }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.inputWrap, {
      backgroundColor: C.inputBg,
      borderColor: focused ? C.accent : C.inputBorder,
    }]}>
      <Icon name={icon} size={18} color={focused ? C.accent : C.inputIcon} />
      <TextInput
        style={[s.inputField, { color: C.inputText }]}
        placeholder={placeholder}
        placeholderTextColor={C.inputPlaceholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {right}
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const C = getColors(theme, isDark);
  const { width } = useWindowDimensions();
  const { login, sendLoginOTP, googleSignIn, isLoading } = useAuth();

  const [mode, setMode]             = useState('password');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isWeb = Platform.OS === 'web';

  useEffect(() => { configureGoogleSignIn(); }, []);

  const handlePasswordLogin = async () => {
    setError('');
    if (!email.trim()) return setError('Please enter your email address');
    if (!password)     return setError('Please enter your password');
    const result = await login(email.trim().toLowerCase(), password);
    if (!result.success) setError(result.error || 'Login failed. Please check your credentials.');
  };

  const handleSendOTP = async () => {
    setError('');
    if (!email.trim()) return setError('Please enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address');
    setSendingOTP(true);
    try {
      const result = await sendLoginOTP(email.trim().toLowerCase());
      setSendingOTP(false);
      if (result.success) {
        navigation.navigate('LoginOTP', { email: email.trim().toLowerCase() });
      } else {
        setError(result.error?.includes('not found')
          ? 'No account found with this email. Please sign up first.'
          : result.error || 'Failed to send verification code');
      }
    } catch (err) { setSendingOTP(false); setError(err.message || 'Failed to send verification code'); }
  };

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try {
      const gr = await signInWithGoogle();
      if (!gr.success) { setGoogleLoading(false); if (gr.error !== 'Sign in was cancelled') setError(gr.error); return; }
      const result = await googleSignIn(gr.idToken);
      setGoogleLoading(false);
      if (!result.success) setError(result.error || 'Google sign in failed');
    } catch (err) { setGoogleLoading(false); setError('Google sign in failed. Please try again.'); }
  };

  return (
    <View style={[s.container, isWeb ? { background: C.webBg } : { backgroundColor: C.bg }]}>

      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: C.backBtn }]}>
          <Icon name="arrow-back" size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          <Text style={[s.logoText, { color: C.logoText }]}>GAZA<Text style={{ color: C.highlight }}>RISE</Text></Text>
        </View>
        <ThemeToggle iconColor={C.textPrimary} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.brandHeader}>
            <View style={[s.iconCircle, { backgroundColor: `${C.accent}18`, borderColor: `${C.accent}35` }]}>
              <Icon name="school" size={32} color={C.accent} />
            </View>
            <Text style={[s.title, { color: C.textPrimary }]}>Welcome Back</Text>
            <Text style={[s.subtitle, { color: C.textSecondary }]}>Continue learning, teaching, and rebuilding through education.</Text>
          </View>

          <View style={[s.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder, maxWidth: 440, alignSelf: 'center', width: '100%' }]}>

            {/* Mode tabs */}
            <View style={[s.tabs, { backgroundColor: C.tabsBg }]}>
              {[{ id: 'password', label: 'Password', icon: 'lock-closed-outline' },
                { id: 'otp',      label: 'Email Code', icon: 'mail-outline' }].map(t => (
                <TouchableOpacity key={t.id}
                  style={[s.tab, mode === t.id && { backgroundColor: C.accent }]}
                  onPress={() => { setMode(t.id); setError(''); }} activeOpacity={0.8}>
                  <Icon name={t.icon} size={15} color={mode === t.id ? '#FFFFFF' : C.tabInactive} />
                  <Text style={[s.tabText, { color: mode === t.id ? '#FFFFFF' : C.tabInactive }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {mode === 'password' && (
              <>
                <AuthInput C={C} icon="mail-outline" placeholder="Email address" value={email}
                  onChangeText={t => { setEmail(t); setError(''); }} keyboardType="email-address" />
                <AuthInput C={C} icon="lock-closed-outline" placeholder="Password" value={password}
                  onChangeText={t => { setPassword(t); setError(''); }} secureTextEntry={!showPw}
                  right={<TouchableOpacity onPress={() => setShowPw(!showPw)}>
                    <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.inputIcon} />
                  </TouchableOpacity>} />
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 18 }}>
                  <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.accent, borderColor: C.highlight, shadowColor: C.accent }]} onPress={handlePasswordLogin} disabled={isLoading} activeOpacity={0.85}>
                  {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.primaryBtnText}>Sign In</Text>}
                </TouchableOpacity>
              </>
            )}

            {mode === 'otp' && (
              <>
                <AuthInput C={C} icon="mail-outline" placeholder="Email address" value={email}
                  onChangeText={t => { setEmail(t); setError(''); }} keyboardType="email-address" />
                <Text style={[s.otpHint, { color: C.otpHint }]}>We'll send a 6-digit code to your email</Text>
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.accent, borderColor: C.highlight, shadowColor: C.accent }]} onPress={handleSendOTP} disabled={sendingOTP} activeOpacity={0.85}>
                  {sendingOTP ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.primaryBtnText}>Send Verification Code</Text>}
                </TouchableOpacity>
              </>
            )}

            {mode === 'password' && (
              <>
                <View style={s.divider}>
                  <View style={[s.divLine, { backgroundColor: C.divider }]} />
                  <Text style={[s.divText, { color: C.dividerText }]}>or continue with</Text>
                  <View style={[s.divLine, { backgroundColor: C.divider }]} />
                </View>
                <TouchableOpacity style={[s.googleBtn, { backgroundColor: C.googleBg, borderColor: C.googleBorder }]}
                  onPress={handleGoogle} disabled={googleLoading || isLoading} activeOpacity={0.8}>
                  {googleLoading ? <ActivityIndicator color={C.googleText} /> : (
                    <>
                      <Icon name="logo-google" size={18} color="#DB4437" />
                      <Text style={[s.googleText, { color: C.googleText }]}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={s.footer}>
              <Text style={[s.footerText, { color: C.footerText }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[s.footerLink, { color: C.accent }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.terms, { color: C.terms }]}>
              By signing in, you agree to our <Text style={{ color: C.accent }}>Terms of Service</Text> and <Text style={{ color: C.accent }}>Privacy Policy</Text>
            </Text>
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
  logoImg: { width: 32, height: 32, borderRadius: 9 },
  logoText: { fontWeight: '800', fontSize: 14, letterSpacing: 0.9 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 4 : 10, paddingBottom: Platform.OS === 'web' ? 20 : 40 },
  brandHeader: { alignItems: 'center', paddingVertical: Platform.OS === 'web' ? 12 : 32 },
  iconCircle: { width: Platform.OS === 'web' ? 54 : 72, height: Platform.OS === 'web' ? 54 : 72, borderRadius: Platform.OS === 'web' ? 27 : 36, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: Platform.OS === 'web' ? 10 : 18 },
  title: { fontSize: Platform.OS === 'web' ? 24 : 28, fontWeight: '900', marginBottom: Platform.OS === 'web' ? 4 : 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
  card: { borderRadius: 28, borderWidth: 1, padding: Platform.OS === 'web' ? 20 : 24, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.12, shadowRadius: 32, elevation: 12 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 5, marginBottom: Platform.OS === 'web' ? 14 : 22, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Platform.OS === 'web' ? 9 : 11, borderRadius: 10 },
  tabText: { fontSize: 13, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 10 : 13, marginBottom: Platform.OS === 'web' ? 10 : 14 },
  inputField: { flex: 1, fontSize: 14, outlineStyle: 'none' },
  otpHint: { fontSize: 13, textAlign: 'center', marginTop: -4, marginBottom: 16, lineHeight: 20 },
  primaryBtn: {
    height: Platform.OS === 'web' ? 46 : 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: Platform.OS === 'web' ? 14 : 22 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: Platform.OS === 'web' ? 44 : 50, borderRadius: 12, borderWidth: 1 },
  googleText: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Platform.OS === 'web' ? 14 : 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
  terms: { fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: Platform.OS === 'web' ? 10 : 16 },
});

export default LoginScreen;
