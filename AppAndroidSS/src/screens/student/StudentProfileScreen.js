import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  useWindowDimensions, ActivityIndicator, Linking, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/ui/MainLayout';
import apiClient, { uploadAPI } from '../../services/apiClient';
import { resolveFileUrl } from '../../utils/urlHelpers';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard',      icon: 'grid-outline',    iconActive: 'grid',    route: 'Dashboard' },
  { label: 'Browse Courses', icon: 'library-outline',  iconActive: 'library', route: 'Courses' },
  { label: 'My Learning',    icon: 'school-outline',   iconActive: 'school',  route: 'EnrolledCourses' },
  { label: 'My Profile',     icon: 'person-outline',   iconActive: 'person',  route: 'Profile' },
  { label: 'AI Assistant',   icon: 'sparkles-outline', iconActive: 'sparkles',route: 'AITutor' },
  { label: 'Certificates',   icon: 'ribbon-outline',   iconActive: 'ribbon',  route: 'Certificates' },
  { label: 'Library',        icon: 'book-outline',     iconActive: 'book',    route: 'Library' },
  { label: 'Forum',          icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
];

const StudentProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [profRes, upRes] = await Promise.all([
        apiClient.get(`/sponsorships/student-profile/${user.id}`),
        apiClient.get('/student-uploads/my'),
      ]);
      setProfile(profRes || null);
      setUploads(Array.isArray(upRes) ? upRes : []);
      setQuizResults(Array.isArray(profRes?.quizResults) ? profRes.quizResults : []);
      setAttendance(Array.isArray(profRes?.attendance) ? profRes.attendance : []);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddUpload = () => {
    if (Platform.OS !== 'web') {
      Toast.show({ type: 'info', text1: 'Uploads', text2: 'Please use the web app to add documents.' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/jpeg,image/png,image/jpg';
    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadAPI.uploadFile(formData);
        const fileUrl = res?.file?.url;
        if (!fileUrl) throw new Error('Upload failed');
        const type = file.type?.startsWith('image/') ? 'image' : 'document';
        await apiClient.post('/student-uploads', { title: file.name, fileUrl, type });
        Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Document added to your profile' });
        await loadData();
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Upload failed' });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDeleteUpload = async (id) => {
    try {
      await apiClient.del(`/student-uploads/${id}`);
      setUploads(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Delete failed' });
    }
  };

  const stats = profile?.stats || {};
  const enrollments = profile?.enrollments || [];
  const certificates = profile?.certificates || [];

  const statCards = [
    { icon: 'calendar-clear', label: 'Attendance', value: `${stats.attendanceDays || 0} days`, color: '#10B981' },
    { icon: 'school', label: 'Courses', value: stats.coursesEnrolled || 0, color: '#007A3D' },
    { icon: 'analytics', label: 'Avg Score', value: `${stats.averageScore || 0}%`, color: '#F59E0B' },
    { icon: 'ribbon', label: 'Certificates', value: stats.certificatesEarned || 0, color: '#CE1126' },
  ];

  return (
    <MainLayout
      showSidebar
      sidebarItems={SIDEBAR_ITEMS}
      activeRoute="Profile"
      onNavigate={(r) => navigation.navigate(r)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* Header / identity */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.profileHeader, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
                <View style={styles.avatarWrap}>
                  {user?.profilePicture ? (
                    <Image source={{ uri: resolveFileUrl(user.profilePicture) }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.avatarInitial}>{(user?.name || 'S').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.profileInfo, isMobile && { alignItems: 'center', marginTop: 16 }]}>
                  <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{user?.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(0,122,61,0.15)' }]}>
                      <Icon name="school-outline" size={14} color="#007A3D" />
                      <Text style={[styles.badgeText, { color: '#007A3D' }]}>Student</Text>
                    </View>
                    {profile?.student?.isWarZone && (
                      <View style={[styles.badge, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                        <Icon name="shield-checkmark-outline" size={14} color="#10B981" />
                        <Text style={[styles.badgeText, { color: '#10B981' }]}>Free Access · War Zone</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="location-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.textSecondary, marginLeft: 6 }}>
                      {profile?.student?.location || 'Location not specified'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={[styles.statsGrid, isMobile && { flexDirection: 'column' }]}>
              {statCards.map((s, i) => (
                <View key={i} style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                    <Icon name={s.icon} size={22} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Enrolled courses */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>My Courses</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {enrollments.length === 0 ? (
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 16 }}>You are not enrolled in any courses yet.</Text>
              ) : enrollments.map((e, i) => (
                <View key={e.id} style={[styles.row, i !== enrollments.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}>
                  <Icon name="play-circle" size={20} color="#007A3D" />
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>{e.course?.name || 'Course'}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{e.status}</Text>
                </View>
              ))}
            </View>

            {/* Quiz Results */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Quiz Results</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {quizResults.length === 0 ? (
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 16 }}>No quiz results yet.</Text>
              ) : quizResults.slice(0, 10).map((q, i) => (
                <View key={q.id} style={[styles.row, i !== Math.min(quizResults.length, 10) - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}>
                  <View style={[styles.scoreCircle, { backgroundColor: q.passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                    <Text style={[styles.scoreText, { color: q.passed ? '#10B981' : '#EF4444' }]}>{q.score}%</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.rowTitle, { color: theme.colors.textPrimary, marginLeft: 0 }]} numberOfLines={1}>
                      {q.course?.name || 'Quiz'}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {q.correctAnswers}/{q.totalQuestions} correct  ·  {new Date(q.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.passBadge, { backgroundColor: q.passed ? '#10B981' : '#EF4444' }]}>
                    <Text style={styles.passBadgeText}>{q.passed ? 'Pass' : 'Fail'}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Certificates */}
            {certificates.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Certificates Earned</Text>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  {certificates.map((c, i) => (
                    <View key={c.id} style={[styles.row, i !== certificates.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}>
                      <Icon name="ribbon" size={20} color="#CE1126" />
                      <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Certificate #{c.id}</Text>
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>{c.grade || 'Pass'}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Attendance Log */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Attendance Log</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Each day you log in and engage with the platform is recorded here.
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {attendance.length === 0 ? (
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 16 }}>No attendance recorded yet.</Text>
              ) : (
                <View style={styles.calendarGrid}>
                  {attendance.slice(0, 30).map((a, i) => (
                    <View key={i} style={[styles.calDay, { backgroundColor: '#10B981' + '22', borderColor: '#10B981' + '44' }]}>
                      <Icon name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                        {new Date(a.activityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Uploads */}
            <View style={styles.uploadHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>My Documents</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.colors.primary, opacity: uploading ? 0.7 : 1 }]}
                onPress={handleAddUpload}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="cloud-upload-outline" size={16} color="#fff" />}
                <Text style={styles.addBtnText}>{uploading ? 'Uploading…' : 'Upload'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Upload supporting documents (e.g. school records, reports). Sponsors can view these to support your education.
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {uploads.length === 0 ? (
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 16 }}>No documents uploaded yet.</Text>
              ) : uploads.map((up, i) => (
                <View key={up.id} style={[styles.row, i !== uploads.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}>
                  <Icon name={up.type === 'image' ? 'image' : 'document-text'} size={20} color="#CE1126" />
                  <TouchableOpacity style={{ flex: 1, marginHorizontal: 10 }} onPress={() => Linking.openURL(resolveFileUrl(up.fileUrl))}>
                    <Text style={[styles.rowTitle, { color: theme.colors.textPrimary, marginLeft: 0 }]} numberOfLines={1}>{up.title}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteUpload(up.id)}>
                    <Icon name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 20 },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 6 },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '600', marginLeft: 10 },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scoreCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 13, fontWeight: '800' },
  passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  passBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 4 },
  calDay: { borderWidth: 1, borderRadius: 8, padding: 6, alignItems: 'center', minWidth: 52 },
});

export default StudentProfileScreen;
