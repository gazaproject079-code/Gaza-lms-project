import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useWindowDimensions, ActivityIndicator, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/ui/MainLayout';
import apiClient from '../../services/apiClient';

const GREEN = '#007A3D';
const RED   = '#CE1126';

const SponsorDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [students, setStudents]               = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [sponsoring, setSponsoring]           = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sponsoredRes, availableRes] = await Promise.all([
        apiClient.get('/sponsorships/my-students'),
        apiClient.get('/sponsorships/available-students'),
      ]);
      setStudents(Array.isArray(sponsoredRes) ? sponsoredRes : []);
      setAvailableStudents(Array.isArray(availableRes) ? availableRes : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSponsor = async (studentId) => {
    try {
      setSponsoring(studentId);
      await apiClient.post(`/sponsorships/sponsor/${studentId}`);
      fetchData();
    } catch (err) {
      console.error('Error sponsoring student:', err);
    } finally {
      setSponsoring(null);
    }
  };

  const cardBg     = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.06)';

  const renderStudentRow = (st, i, arr, isSponsored) => (
    <View
      key={st.id}
      style={[
        styles.studentRow,
        isMobile && { flexDirection: 'column', alignItems: 'flex-start' },
        i !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.avatar, { backgroundColor: (isSponsored ? GREEN : '#10B981') + '20' }]}>
          <Icon name="person" size={20} color={isSponsored ? GREEN : '#10B981'} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.studentName, { color: theme.colors.textPrimary }]}>{st.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
            <Icon name="location-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{st.location || 'Unknown'}</Text>
            {st.isWarZone && (
              <View style={styles.warBadge}>
                <Text style={styles.warBadgeText}>Conflict Zone</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.actionRow, isMobile && { marginTop: 14, width: '100%' }]}>
        <TouchableOpacity
          style={[styles.btn, { borderColor: GREEN, backgroundColor: isDark ? 'rgba(0,122,61,0.12)' : 'rgba(0,122,61,0.08)' }]}
          onPress={() => navigation.navigate('StudentPublicProfile', { studentId: st.id })}
        >
          <Icon name="analytics-outline" size={15} color={GREEN} />
          <Text style={[styles.btnText, { color: GREEN }]}>View Progress</Text>
        </TouchableOpacity>

        {isSponsored ? (
          <TouchableOpacity
            style={[styles.btn, { borderColor: GREEN, backgroundColor: GREEN }]}
            onPress={() => navigation.navigate('Chat')}
          >
            <Icon name="chatbubble-ellipses-outline" size={15} color="#FFFFFF" />
            <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Message</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { borderColor: '#10B981', backgroundColor: '#10B981', opacity: sponsoring === st.id ? 0.6 : 1 }]}
            onPress={() => handleSponsor(st.id)}
            disabled={sponsoring === st.id}
          >
            {sponsoring === st.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="heart-outline" size={15} color="#FFFFFF" />}
            <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Sponsor</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <MainLayout
      showSidebar
      activeRoute="SponsorDashboard"
      onNavigate={r => navigation.navigate(r)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header Banner ── */}
        <View style={[styles.headerBanner, {
          backgroundColor: isDark ? 'rgba(0,122,61,0.08)' : 'rgba(0,122,61,0.05)',
          borderColor: 'rgba(0,122,61,0.18)',
        }]}>
          <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(0,122,61,0.15)' }]}>
            <Icon name="heart" size={26} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Sponsor Dashboard</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Welcome back, <Text style={{ color: GREEN, fontWeight: '700' }}>{user?.name}</Text>. Track your students' progress.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,122,61,0.08)' }]}
            onPress={fetchData}
          >
            <Icon name="refresh-outline" size={20} color={GREEN} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <View style={[styles.statsRow, isMobile && { flexDirection: 'column' }]}>
          {[
            { label: 'Sponsored Students', value: students.length,        color: GREEN,      icon: 'heart' },
            { label: 'Seeking Support',    value: availableStudents.length, color: '#10B981', icon: 'school' },
          ].map((s, i) => (
            <View key={i} style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.statIconCircle, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── My Students ── */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: GREEN + '18' }]}>
            <Icon name="people" size={18} color={GREEN} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Sponsored Students</Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {loading ? (
            <ActivityIndicator size="large" color={GREEN} style={{ margin: 32 }} />
          ) : students.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="heart-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                You have not sponsored any students yet.
              </Text>
            </View>
          ) : (
            students.map((st, i) => renderStudentRow(st, i, students, true))
          )}
        </View>

        {/* ── Available Students ── */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: '#10B98118' }]}>
            <Icon name="search" size={18} color="#10B981" />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Students Seeking Support</Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {loading ? (
            <ActivityIndicator size="large" color="#10B981" style={{ margin: 32 }} />
          ) : availableStudents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="school-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No students are seeking sponsorship right now.
              </Text>
            </View>
          ) : (
            availableStudents.map((st, i) => renderStudentRow(st, i, availableStudents, false))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60, maxWidth: 1000, width: '100%', alignSelf: 'center' },

  // Header banner
  headerBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18, borderWidth: 1, marginBottom: 24 },
  headerIconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, lineHeight: 18 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 6 },
  statIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statNum: { fontSize: 32, fontWeight: '900' },
  statLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800' },

  // Card + rows
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 32, overflow: 'hidden' },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  studentName: { fontSize: 15, fontWeight: '700' },
  warBadge: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  warBadgeText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: '700' },

  // Empty state
  emptyBox: { alignItems: 'center', padding: 36, gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});

export default SponsorDashboard;
