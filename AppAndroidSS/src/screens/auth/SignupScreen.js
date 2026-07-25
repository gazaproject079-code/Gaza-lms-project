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
  backBtn: isDark ? 'rgba(247,244,236,0.08)' : 'rgba(15,118,110,0.08)',
  logoText: theme.colors.textPrimary,
  heroGlowA: `${theme.colors.primary}18`,
  heroGlowB: `${theme.colors.accent}16`,
  accent: theme.colors.primary,
  highlight: theme.colors.accent,
});

const AuthInput = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', autoCapitalize = 'none', right, C }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[inp.wrap, {
      backgroundColor: C.inputBg,
      borderColor: focused ? C.accent : C.inputBorder,
    }]}>
      <Icon name={icon} size={18} color={focused ? C.accent : C.inputIcon} />
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
      {right}
    </View>
  );
};
const inp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  field: { flex: 1, fontSize: 14, outlineStyle: 'none' },
});

const SignupScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { sendOTP, googleSignIn, isLoading } = useAuth();
  const { theme, isDark } = useTheme();
  const C = getColors(theme, isDark);

  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [role, setRole]             = useState('student');
  const [error, setError]           = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isWeb = Platform.OS === 'web';

  useEffect(() => { configureGoogleSignIn(); }, []);

  const handleSendOTP = async () => {
    setError('');
    if (!name.trim())  return setError('Please enter your full name');
    if (!email.trim()) return setError('Please enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address');
    setSendingOTP(true);
    try {
      const result = await sendOTP(email.trim().toLowerCase(), name.trim());
      setSendingOTP(false);
      if (result.success) {
        navigation.navigate('SignupOTP', { email: email.trim().toLowerCase(), name: name.trim(), role });
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setSendingOTP(false);
      setError(err.message || 'Failed to send verification code');
    }
  };

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try {
      const gr = await signInWithGoogle();
      if (!gr.success) { setGoogleLoading(false); if (gr.error !== 'Sign in was cancelled') setError(gr.error); return; }
      const result = await googleSignIn(gr.idToken, role);
      setGoogleLoading(false);
      if (!result.success) setError(result.error || 'Google sign in failed');
    } catch (err) { setGoogleLoading(false); setError('Google sign in failed. Please try again.'); }
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
          <Text style={[s.logoText, { color: C.logoText }]}>GAZA<Text style={{ color: C.highlight }}>RISE</Text></Text>
        </View>
        <ThemeToggle iconColor={C.textPrimary} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.brandHeader}>
            <View style={[s.iconCircle, { backgroundColor: `${C.accent}18`, borderColor: `${C.accent}35` }]}>
              <Icon name="person-add" size={30} color={C.accent} />
            </View>
            <Text style={[s.title, { color: C.textPrimary }]}>Create Account</Text>
            <Text style={[s.subtitle, { color: C.textSecondary }]}>Join a learning platform built to strengthen knowledge and opportunity.</Text>
          </View>

          <View style={[s.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder, maxWidth: 440, alignSelf: 'center', width: '100%' }]}>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Role Selection — shown upfront so users know they can sign up as sponsor */}
            <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>I am a…</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              <TouchableOpacity
                style={[s.roleBtn, { borderColor: role === 'student' ? '#007A3D' : 'rgba(150,150,150,0.2)', backgroundColor: role === 'student' ? '#007A3D10' : 'transparent' }]}
                onPress={() => setRole('student')}
                activeOpacity={0.8}
              >
                <Icon name="school-outline" size={18} color={role === 'student' ? '#007A3D' : C.textSecondary} />
                <View>
                  <Text style={{ color: role === 'student' ? '#007A3D' : C.textPrimary, fontSize: 14, fontWeight: '700' }}>Student</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 11 }}>Learn & grow</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.roleBtn, { borderColor: role === 'sponsor' ? '#007A3D' : 'rgba(150,150,150,0.2)', backgroundColor: role === 'sponsor' ? '#007A3D10' : 'transparent' }]}
                onPress={() => setRole('sponsor')}
                activeOpacity={0.8}
              >
                <Icon name="heart-outline" size={18} color={role === 'sponsor' ? '#007A3D' : C.textSecondary} />
                <View>
                  <Text style={{ color: role === 'sponsor' ? '#007A3D' : C.textPrimary, fontSize: 14, fontWeight: '700' }}>Sponsor</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 11 }}>Support a student</Text>
                </View>
              </TouchableOpacity>
            </View>

            <AuthInput C={C} icon="person-outline" placeholder="Full name" value={name}
              onChangeText={t => { setName(t); setError(''); }} autoCapitalize="words" />
            <AuthInput C={C} icon="mail-outline" placeholder="Email address" value={email}
              onChangeText={t => { setEmail(t); setError(''); }} keyboardType="email-address" />

            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.accent, borderColor: C.highlight, shadowColor: C.accent }]} onPress={handleSendOTP} disabled={sendingOTP} activeOpacity={0.85}>
              {sendingOTP ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.primaryBtnText}>Continue</Text>}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={[s.divLine, { backgroundColor: C.divider }]} />
              <Text style={[s.divText, { color: C.dividerText }]}>or continue with</Text>
              <View style={[s.divLine, { backgroundColor: C.divider }]} />
            </View>

            <TouchableOpacity style={[s.googleBtn, { backgroundColor: C.googleBg, borderColor: C.googleBorder }]} onPress={handleGoogle} disabled={googleLoading || isLoading} activeOpacity={0.8}>
              {googleLoading ? <ActivityIndicator color={C.googleText} /> : (
                <>
                  <Icon name="logo-google" size={18} color="#DB4437" />
                <Text style={[s.googleText, { color: C.googleText }]}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={[s.footerText, { color: C.footerText }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[s.footerLink, { color: C.accent }]}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.terms, { color: C.terms }]}>
              By creating an account, you agree to our{' '}
              <Text style={{ color: C.accent }}>Terms of Service</Text> and{' '}
              <Text style={{ color: C.accent }}>Privacy Policy</Text>
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
  logoImg: { width: 42, height: 42, borderRadius: 12 },
  logoText: { fontWeight: '800', fontSize: 16, letterSpacing: 0.9 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', paddingVertical: 32 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
  card: { borderRadius: 28, borderWidth: 1, padding: 24, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.12, shadowRadius: 32, elevation: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  primaryBtn: { height: 52, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 6 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, borderRadius: 12, borderWidth: 1 },
  googleText: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  terms: { fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: 16 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },
});

export default SignupScreen;
