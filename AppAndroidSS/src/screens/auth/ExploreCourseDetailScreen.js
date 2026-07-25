import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { useNavigation, useRoute } from '@react-navigation/native';
import { courseAPI } from '../../services/apiClient';
import { resolveFileUrl } from '../../utils/urlHelpers';

const LOGO   = require('../../assets/images/gazarise_logo.png');
const GREEN = '#007A3D';
const RED = '#CE1126';
const NAVY   = '#1A1A2E';
const NAVY2  = '#16213E';

const CAT_COLORS = {
  Medicine: '#EF4444', 'Islamic Education': '#10B981', General: GREEN,
};

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = ({ navigation, isDark, isMobile }) => {
  const isWeb = Platform.OS === 'web';
  const stickyStyle = isWeb ? { position: 'sticky', top: 0, zIndex: 999 } : {};

  return (
    <View style={[nb.container, { background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E38 100%)' }, stickyStyle]}>
      <View style={nb.content}>
        <View style={nb.left}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={nb.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Image source={LOGO} style={nb.logoImg} resizeMode="cover" />
          <Text style={nb.logoText}>
            GAZA<Text style={{ color: GREEN }}>RISE</Text>
          </Text>
        </View>
        <View style={nb.right}>
          <ThemeToggle iconColor="#FFFFFF" />
          {!isMobile && (
            <>
              <TouchableOpacity style={nb.signInBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={nb.signInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={nb.getStartedBtn} onPress={() => navigation.navigate('Signup')}>
                <Text style={nb.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const nb = StyleSheet.create({
  container: { height: 62, paddingHorizontal: 20, backgroundColor: NAVY, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 10 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 46, height: 46, borderRadius: 13 },
  logoText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 1.2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signInBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  signInText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  getStartedBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
  getStartedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

// ── Section Card ──────────────────────────────────────────────────────────────
const SCard = ({ children, isDark, style }) => (
  <View style={[{
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    borderRadius: 18, borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    padding: 22, marginBottom: 18,
  }, style]}>
    {children}
  </View>
);

const SectionLabel = ({ text }) => (
  <View style={{ backgroundColor: GREEN + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 }}>
    <Text style={{ color: GREEN, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{text.toUpperCase()}</Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const ExploreCourseDetailScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  const isMobile  = width < 768;
  const isDesktop = width >= 1024;
  const maxW      = isDesktop ? 900 : '100%';

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    const id = route.params?.courseId || route.params?.course?.id;
    if (!id) { setError(true); setLoading(false); return; }
    courseAPI.getById(id)
      .then(res => { if (res.course) setCourse(res.course); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const bgMain = isDark ? NAVY  : '#F0F2FF';
  const catName  = course?.category?.name || 'General';
  const catColor = CAT_COLORS[catName] || GREEN;
  const thumb    = course?.thumbnailImage ? resolveFileUrl(course.thumbnailImage) : null;

  const renderNav = () => <Navbar navigation={navigation} isDark={isDark} isMobile={isMobile} />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgMain }}>
        {renderNav()}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', fontSize: 14 }}>
            Loading course details...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={{ flex: 1, backgroundColor: bgMain }}>
        {renderNav()}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 }}>
          <Icon name="alert-circle-outline" size={56} color={GREEN + '80'} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#FFFFFF' : NAVY }}>Course Not Found</Text>
          <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', textAlign: 'center', fontSize: 14 }}>
            This course may have been removed or is no longer available.
          </Text>
          <TouchableOpacity style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const learns = [
    { icon: 'checkmark-circle', text: 'Comprehensive understanding of all course topics' },
    { icon: 'checkmark-circle', text: 'Hands-on practice with real-world examples' },
    { icon: 'checkmark-circle', text: 'Industry-recognised certificate upon completion' },
    { icon: 'checkmark-circle', text: 'Lifetime access to course materials and updates' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bgMain }}>
      {renderNav()}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: maxW, alignSelf: 'center', width: '100%', padding: isMobile ? 16 : 28 }}>

          {/* ── Thumbnail Hero ── */}
          <View style={[s.thumbWrap, { backgroundColor: catColor + '20', height: isMobile ? 220 : 340 }]}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Icon name="book-outline" size={80} color={catColor} />
            )}
            {/* Category badge over image */}
            <View style={[s.thumbBadge, { backgroundColor: catColor }]}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{catName}</Text>
            </View>
          </View>

          {/* ── Course Info Card ── */}
          <SCard isDark={isDark}>
            <Text style={{ fontSize: isMobile ? 22 : 28, fontWeight: '900', color: isDark ? '#FFFFFF' : NAVY, lineHeight: isMobile ? 30 : 36, marginBottom: 14 }}>
              {course.name}
            </Text>

            {/* Meta badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {[
                { icon: 'bar-chart-outline', label: course.level || 'All Levels',      color: '#007A3D' },
                { icon: 'time-outline',       label: course.duration || 'Self-paced',  color: '#10B981' },
                { icon: 'language-outline',   label: course.language || 'English',     color: '#3B82F6' },
              ].map(m => (
                <View key={m.label} style={[s.metaBadge, { backgroundColor: m.color + '18' }]}>
                  <Icon name={m.icon} size={15} color={m.color} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: m.color }}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Instructor + Enrollment */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {course.user?.name && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="person-circle-outline" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)'} />
                  <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.6)' }}>
                    {course.user.name}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="people-outline" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)'} />
                <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.6)' }}>
                  {(course.enrollmentCount || 0).toLocaleString()} students enrolled
                </Text>
              </View>
            </View>
          </SCard>

          {/* ── About ── */}
          <SCard isDark={isDark}>
            <SectionLabel text="About This Course" />
            <Text style={{ fontSize: 15, lineHeight: 26, color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(26,26,46,0.75)' }}>
              {course.description || 'No description available for this course.'}
            </Text>
          </SCard>

          {/* ── What You'll Learn ── */}
          <SCard isDark={isDark}>
            <SectionLabel text="What You'll Learn" />
            <Text style={{ fontSize: isMobile ? 18 : 22, fontWeight: '800', color: isDark ? '#FFFFFF' : NAVY, marginBottom: 16 }}>
              Skills you'll gain
            </Text>
            <View style={{ gap: 12 }}>
              {learns.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Icon name={item.icon} size={20} color={GREEN} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(26,26,46,0.75)' }}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </SCard>

          {/* ── Course Content ── */}
          {course.topics && course.topics.length > 0 && (
            <SCard isDark={isDark}>
              <SectionLabel text="Course Content" />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ fontSize: isMobile ? 18 : 22, fontWeight: '800', color: isDark ? '#FFFFFF' : NAVY }}>
                  {course.topics.length} {course.topics.length === 1 ? 'Topic' : 'Topics'}
                </Text>
                <View style={{ backgroundColor: GREEN + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: GREEN, fontSize: 11, fontWeight: '700' }}>
                    {course.topics.reduce((sum, t) => sum + (t.materials?.length || 0), 0)} materials
                  </Text>
                </View>
              </View>
              {course.topics.map((topic, i) => (
                <View
                  key={topic.id || i}
                  style={[s.topicRow, {
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)',
                    borderBottomWidth: i < course.topics.length - 1 ? 1 : 0,
                  }]}
                >
                  <View style={[s.topicNum, { backgroundColor: GREEN + '20' }]}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: GREEN }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : NAVY }} numberOfLines={2}>
                      {topic.title}
                    </Text>
                    {topic.materials && topic.materials.length > 0 && (
                      <Text style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)', marginTop: 3 }}>
                        {topic.materials.length} material{topic.materials.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  <Icon name="lock-closed-outline" size={16} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,46,0.25)'} />
                </View>
              ))}
            </SCard>
          )}

          {/* ── CTA ── */}
          <View style={[s.cta, { backgroundColor: isDark ? NAVY2 : NAVY }]}>
            <View style={s.ctaGlowDot} />
            <Icon name="school-outline" size={48} color={GREEN} style={{ marginBottom: 16 }} />
            <Text style={s.ctaTitle}>Ready to Start Learning?</Text>
            <Text style={s.ctaSub}>
              Create a free account to enroll in this course, track your progress, and earn a certificate.
            </Text>
            <TouchableOpacity
              style={s.ctaBtn}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.85}
            >
              <Icon name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Create Free Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Already have an account? <Text style={{ color: GREEN, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  thumbWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  thumbBadge: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  topicNum: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  cta: { borderRadius: 20, padding: 40, alignItems: 'center', overflow: 'hidden', marginBottom: 8 },
  ctaGlowDot: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: GREEN + '15', top: -60, right: -40 },
  ctaTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22, maxWidth: 400, marginBottom: 4 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
});

export default ExploreCourseDetailScreen;
