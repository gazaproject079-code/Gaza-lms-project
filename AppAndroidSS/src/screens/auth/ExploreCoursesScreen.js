import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { useNavigation } from '@react-navigation/native';
import { categoryAPI, courseAPI } from '../../services/apiClient';
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
    <View style={[
      nb.container,
      { background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1E38 100%)' },
      stickyStyle,
    ]}>
      <View style={nb.content}>
        {/* Left: back + logo */}
        <View style={nb.left}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={nb.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Image source={LOGO} style={nb.logoImg} resizeMode="cover" />
          <Text style={nb.logoText}>
            GAZA<Text style={{ color: GREEN }}>RISE</Text>
          </Text>
        </View>

        {/* Right */}
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
  logoImg: { width: 32, height: 32, borderRadius: 8 },
  logoText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 1.2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signInBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  signInText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  getStartedBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
  getStartedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, isDark, theme, isMobile, isTablet, onDetails, onEnroll }) => {
  const catName  = course.category?.name || 'General';
  const catColor = CAT_COLORS[catName] || GREEN;
  const thumb    = course.thumbnailImage ? resolveFileUrl(course.thumbnailImage) : null;
  const cardBg   = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <View style={[cc.card, { backgroundColor: cardBg, borderColor: cardBorder }, isMobile && cc.cardMobile]}>
      {/* Thumbnail */}
      <View style={[cc.thumb, isMobile && cc.thumbMobile, { backgroundColor: catColor + '20' }]}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="book-outline" size={isMobile ? 32 : 44} color={catColor} />
        )}
      </View>

      <View style={[cc.body, isMobile && cc.bodyMobile]}>
        {/* Category badge */}
        <View style={[cc.catBadge, { backgroundColor: catColor + '20' }]}>
          <Text style={[cc.catText, { color: catColor }]}>{catName}</Text>
        </View>

        {/* Title */}
        <Text style={[cc.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {course.name}
        </Text>

        {/* Description */}
        {!isMobile && (
          <Text style={[cc.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {course.description}
          </Text>
        )}

        {/* Meta row */}
        <View style={cc.metaRow}>
          <View style={cc.metaItem}>
            <Icon name="bar-chart-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[cc.metaText, { color: theme.colors.textSecondary }]}>{course.level || 'All levels'}</Text>
          </View>
          <View style={cc.metaItem}>
            <Icon name="time-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[cc.metaText, { color: theme.colors.textSecondary }]}>{course.duration || 'Self-paced'}</Text>
          </View>
          {!isMobile && (
            <View style={cc.metaItem}>
              <Icon name="people-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={[cc.metaText, { color: theme.colors.textSecondary }]}>
                {(course.enrollmentCount || 0).toLocaleString()} enrolled
              </Text>
            </View>
          )}
        </View>

        {/* Instructor */}
        {course.user?.name && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: isMobile ? 8 : 12 }}>
            <Icon name="person-circle-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{course.user.name}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={[cc.btnRow, isMobile && { flexDirection: 'column', gap: 6 }]}>
          <TouchableOpacity style={[cc.detailBtn, { borderColor: GREEN }]} onPress={onDetails} activeOpacity={0.8}>
            <Icon name="eye-outline" size={14} color={GREEN} />
            <Text style={[cc.detailBtnText, { color: GREEN }]}>See Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cc.enrollBtn} onPress={onEnroll} activeOpacity={0.8}>
            <Icon name="person-add-outline" size={14} color="#FFFFFF" />
            <Text style={cc.enrollBtnText}>Sign Up to Enroll</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const cc = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  cardMobile: { flexDirection: 'row' },
  thumb: { height: 180, justifyContent: 'center', alignItems: 'center' },
  thumbMobile: { width: 120, height: 'auto', minHeight: 140, borderRadius: 0 },
  body: { padding: 16 },
  bodyMobile: { flex: 1, padding: 12 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  detailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  detailBtnText: { fontSize: 13, fontWeight: '700' },
  enrollBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  enrollBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const ExploreCoursesScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const isMobile  = width < 768;
  const isTablet  = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const maxW      = isDesktop ? 1200 : '100%';

  const [categories, setCategories]         = useState([]);
  const [courses, setCourses]               = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch]                 = useState('');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(false);

  useEffect(() => {
    Promise.all([categoryAPI.getAll(), courseAPI.getAll()])
      .then(([catRes, courseRes]) => {
        setCategories(catRes.categories || []);
        setCourses((courseRes.courses || []).filter(c => c.status === 'published'));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchCat = selectedCategory === 'all' || c.categoryId === selectedCategory;
    const matchSearch = !search.trim() ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const numCols = isDesktop ? 3 : isTablet ? 2 : 1;

  const bgMain = isDark ? NAVY  : '#F0F2FF';
  const bgCard = isDark ? NAVY2 : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: bgMain }}>
      <Navbar navigation={navigation} isDark={isDark} isMobile={isMobile} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: maxW, alignSelf: 'center', width: '100%' }}>

          {/* ── Hero ── */}
          <View style={[s.hero, { backgroundColor: isDark ? NAVY2 : '#FFFFFF' }]}>
            <View style={s.heroTag}>
              <Text style={{ color: GREEN, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>ALL COURSES</Text>
            </View>
            <Text style={[s.heroTitle, { color: isDark ? '#FFFFFF' : NAVY }]}>
              Explore Our <Text style={{ color: GREEN }}>Course Library</Text>
            </Text>
            <Text style={[s.heroSub, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.6)' }]}>
              Browse {courses.length} specialized courses. Create an account to enroll and earn certificates.
            </Text>

            {/* Search bar */}
            <View style={[s.searchWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0F2FF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)' }]}>
              <Icon name="search-outline" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search courses..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.35)'}
                style={[s.searchInput, { color: isDark ? '#FFFFFF' : NAVY }]}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close-circle" size={16} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Category chips ── */}
          <View style={[s.catSection, { backgroundColor: bgMain }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
              {[{ id: 'all', name: `All (${courses.length})` }, ...categories.map(c => ({
                ...c, name: `${c.name} (${courses.filter(x => x.categoryId === c.id).length})`
              }))].map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catChip, isActive && s.catChipActive, !isActive && { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,46,0.15)', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.catChipText, { color: isActive ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.7)' : NAVY }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Courses ── */}
          <View style={[s.coursesSection, { backgroundColor: bgMain, paddingHorizontal: isMobile ? 16 : 24 }]}>
            {/* Results header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : NAVY }}>
                {filtered.length} {filtered.length === 1 ? 'Course' : 'Courses'} Found
              </Text>
              {search.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: GREEN, fontSize: 13, fontWeight: '600' }}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color={GREEN} />
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', marginTop: 14, fontSize: 14 }}>
                  Loading courses...
                </Text>
              </View>
            )}

            {!loading && error && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Icon name="cloud-offline-outline" size={48} color={GREEN + '80'} />
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', marginTop: 14, fontSize: 14 }}>
                  Could not load courses. Check your connection.
                </Text>
              </View>
            )}

            {!loading && !error && filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Icon name="search-outline" size={48} color={GREEN + '80'} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : NAVY, marginTop: 16 }}>
                  No courses found
                </Text>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', marginTop: 8, fontSize: 14 }}>
                  Try a different search term or category
                </Text>
              </View>
            )}

            {!loading && !error && filtered.length > 0 && (() => {
              // Build rows for grid layout on desktop/tablet
              if (!isMobile && numCols > 1) {
                const rows = [];
                for (let i = 0; i < filtered.length; i += numCols) {
                  rows.push(filtered.slice(i, i + numCols));
                }
                return rows.map((row, ri) => (
                  <View key={ri} style={{ flexDirection: 'row', gap: 16, marginBottom: 0 }}>
                    {row.map(course => (
                      <View key={course.id} style={{ flex: 1 }}>
                        <CourseCard
                          course={course} isDark={isDark} theme={theme}
                          isMobile={false} isTablet={isTablet}
                          onDetails={() => navigation.navigate('ExploreCourseDetail', { courseId: course.id })}
                          onEnroll={() => navigation.navigate('Signup')}
                        />
                      </View>
                    ))}
                    {/* Fill empty cells */}
                    {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                      <View key={`empty-${i}`} style={{ flex: 1 }} />
                    ))}
                  </View>
                ));
              }
              // Mobile: single column
              return filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course} isDark={isDark} theme={theme}
                  isMobile={true} isTablet={false}
                  onDetails={() => navigation.navigate('ExploreCourseDetail', { courseId: course.id })}
                  onEnroll={() => navigation.navigate('Signup')}
                />
              ));
            })()}
          </View>

          {/* ── CTA Banner ── */}
          {!loading && (
            <View style={[s.ctaBanner, { backgroundColor: isDark ? NAVY2 : NAVY }]}>
              <View style={s.ctaInner}>
                <Icon name="school-outline" size={40} color={GREEN} style={{ marginBottom: 16 }} />
                <Text style={s.ctaTitle}>Ready to Start Learning?</Text>
                <Text style={s.ctaSub}>
                  Create an account to start your learning journey, access the AI assistant, and earn certificates.
                </Text>
                <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12, marginTop: 20 }}>
                  <TouchableOpacity style={s.ctaBtnPrimary} onPress={() => navigation.navigate('Signup')}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Create Account / Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.ctaBtnSecondary} onPress={() => navigation.navigate('Login')}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  hero: { paddingVertical: 52, paddingHorizontal: 24, alignItems: 'center' },
  heroTag: { backgroundColor: GREEN + '20', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 14 },
  heroTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 12 },
  heroSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 540, marginBottom: 28 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, width: '100%', maxWidth: 520 },
  searchInput: { flex: 1, fontSize: 14, outlineStyle: 'none' },
  catSection: { paddingVertical: 16, paddingHorizontal: 24 },
  catScroll: { gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  catChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  catChipText: { fontSize: 13, fontWeight: '600' },
  coursesSection: { paddingTop: 8, paddingBottom: 40 },
  ctaBanner: { marginHorizontal: 24, marginBottom: 0, borderRadius: 20, overflow: 'hidden' },
  ctaInner: { padding: 48, alignItems: 'center' },
  ctaTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  ctaSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, maxWidth: 480 },
  ctaBtnPrimary: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, backgroundColor: GREEN, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
  ctaBtnSecondary: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
});

export default ExploreCoursesScreen;
