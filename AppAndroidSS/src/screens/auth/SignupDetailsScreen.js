import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

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
  successBg:        isDark ? 'rgba(16,185,129,0.12)'    : 'rgba(16,185,129,0.08)',
  successBorder:    isDark ? 'rgba(16,185,129,0.25)'    : 'rgba(16,185,129,0.2)',
  errorBg:          isDark ? 'rgba(255,107,107,0.12)'   : 'rgba(239,68,68,0.08)',
  errorBorder:      isDark ? 'rgba(255,107,107,0.25)'   : 'rgba(239,68,68,0.2)',
  terms:            isDark ? 'rgba(255,255,255,0.35)'   : 'rgba(26,26,46,0.35)',
  backBtn:          isDark ? 'rgba(255,255,255,0.1)'    : 'rgba(26,26,46,0.1)',
  logoText:         isDark ? '#FFFFFF'                  : '#1A1A2E',
});

const AuthInput = ({ icon, placeholder, value, onChangeText, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'none', right, C }) => {
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
const inp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  field: { flex: 1, fontSize: 14, outlineStyle: 'none' },
});

const SignupDetailsScreen = ({ route, navigation }) => {
  const params = route?.params || {};
  const email  = params.email || '';
  const name   = params.name  || '';
  const presetRole = params.role || 'student';
  const { completeRegistration, isLoading } = useAuth();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const { width } = useWindowDimensions();

  const [password, setPassword]         = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [phone, setPhone]               = useState('');
  const [location, setLocation]         = useState('');
  const [isWarZone, setIsWarZone]       = useState(false);
  const [role, setRole]                 = useState(presetRole);
  const [showPw, setShowPw]             = useState(false);
  const [error, setError]               = useState('');

  const isWeb = Platform.OS === 'web';

  const handleComplete = async () => {
    setError('');
    if (!password)             return setError('Please enter a password');
    if (password.length < 6)   return setError('Password must be at least 6 characters');
    if (password !== confirmPw) return setError('Passwords do not match');
    if (!location)             return setError('Please enter your country/location');
    try {
      const result = await completeRegistration(email, password, name, phone || null, location, isWarZone, role);
      if (!result.success) setError(result.error || 'Registration failed');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  const bg = isWeb ? { background: C.webBg } : { backgroundColor: C.bg };

  return (
    <View style={[s.container, bg]}>
      <View style={[s.glow1, { backgroundColor: GREEN + '0C' }]} />
      <View style={[s.glow2, { backgroundColor: '#10B981' + (isDark ? '0A' : '08') }]} />

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
            <View style={[s.iconCircle, { backgroundColor: '#10B981' + '20', borderColor: '#10B981' + '50' }]}>
              <Icon name="checkmark-circle" size={36} color="#10B981" />
            </View>
            <Text style={[s.title, { color: C.textPrimary }]}>Almost Done!</Text>
            <Text style={[s.subtitle, { color: C.textSecondary }]}>
              Email verified for{' '}
              <Text style={{ color: GREEN, fontWeight: '700' }}>{name}</Text>
              {'\n'}Set a password to complete your account
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder, maxWidth: 440, alignSelf: 'center', width: '100%' }]}>

            {/* Success banner */}
            <View style={[s.successBanner, { backgroundColor: C.successBg, borderColor: C.successBorder }]}>
              <Icon name="checkmark-circle" size={18} color="#10B981" />
              <Text style={s.successText}>Email verified successfully!</Text>
            </View>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: C.errorBg, borderColor: C.errorBorder }]}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <AuthInput C={C} icon="call-outline" placeholder="Phone number (optional)" value={phone}
              onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />

            <AuthInput C={C} icon="location-outline" placeholder="Country / Location" value={location}
              onChangeText={setLocation} autoCapitalize="words" />

            {/* Role Selection */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                style={[s.roleBtn, role === 'student' && { borderColor: GREEN, backgroundColor: GREEN + '10' }]}
                onPress={() => setRole('student')}
              >
                <Icon name="school-outline" size={16} color={role === 'student' ? GREEN : C.textSecondary} />
                <Text style={{ color: role === 'student' ? GREEN : C.textSecondary, fontSize: 13, fontWeight: '600' }}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.roleBtn, role === 'sponsor' && { borderColor: GREEN, backgroundColor: GREEN + '10' }]}
                onPress={() => setRole('sponsor')}
              >
                <Icon name="heart-outline" size={16} color={role === 'sponsor' ? GREEN : C.textSecondary} />
                <Text style={{ color: role === 'sponsor' ? GREEN : C.textSecondary, fontSize: 13, fontWeight: '600' }}>Sponsor</Text>
              </TouchableOpacity>
            </View>

            {/* War Zone Checkbox (Only for students) */}
            {role === 'student' && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, paddingHorizontal: 4 }}
                onPress={() => setIsWarZone(!isWarZone)}
                activeOpacity={0.8}
              >
                <View style={[s.checkbox, isWarZone && { backgroundColor: GREEN, borderColor: GREEN }]}>
                  {isWarZone && <Icon name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={{ color: C.textSecondary, fontSize: 13, flex: 1 }}>I am currently located in a war zone (Access free education)</Text>
              </TouchableOpacity>
            )}

            <AuthInput C={C} icon="lock-closed-outline" placeholder="Create password (min 6 characters)" value={password}
              onChangeText={t => { setPassword(t); setError(''); }} secureTextEntry={!showPw}
              right={
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.inputIcon} />
                </TouchableOpacity>
              } />

            <AuthInput C={C} icon="lock-closed-outline" placeholder="Confirm password" value={confirmPw}
              onChangeText={t => { setConfirmPw(t); setError(''); }} secureTextEntry={!showPw} />

            <TouchableOpacity style={s.primaryBtn} onPress={handleComplete} disabled={isLoading} activeOpacity={0.85}>
              {isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="rocket-outline" size={16} color="#FFFFFF" />
                    <Text style={s.primaryBtnText}>Create Account</Text>
                  </View>
                )}
            </TouchableOpacity>

            <Text style={[s.terms, { color: C.terms }]}>
              By creating an account, you agree to our{' '}
              <Text style={{ color: GREEN }}>Terms of Service</Text> and{' '}
              <Text style={{ color: GREEN }}>Privacy Policy</Text>
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
  glow1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -60, right: -50, zIndex: 0 },
  glow2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 60, left: -70, zIndex: 0 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 16, paddingBottom: 12, zIndex: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 28, height: 28, borderRadius: 7 },
  logoText: { fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', paddingVertical: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24 },
  successBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 20 },
  successText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  primaryBtn: { height: 52, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', justifyContent: 'center', alignItems: 'center', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.12 },
  terms: { fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: 18 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(150,150,150,0.4)', justifyContent: 'center', alignItems: 'center' },
});

export default SignupDetailsScreen;
