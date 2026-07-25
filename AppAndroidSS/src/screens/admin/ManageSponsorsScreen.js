import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';

const GREEN = '#007A3D';
const RED = '#CE1126';

const ManageSponsorsScreen = () => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users/sponsors');
      setSponsors(res?.sponsors || []);
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (sponsor) => {
    setTogglingId(sponsor.id);
    try {
      await apiClient.patch(`/users/${sponsor.id}/toggle-status`);
      setSponsors(prev =>
        prev.map(s => s.id === sponsor.id ? { ...s, isActive: !s.isActive } : s)
      );
    } catch (err) {
      console.error('Toggle status error:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() =>
    sponsors.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sponsors, searchQuery]
  );

  const stats = useMemo(() => ({
    total: sponsors.length,
    active: sponsors.filter(s => s.isActive).length,
    inactive: sponsors.filter(s => !s.isActive).length,
  }), [sponsors]);

  const getAvatarColor = (name) => {
    const palette = ['#007A3D', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
    return palette[name.charCodeAt(0) % palette.length];
  };

  if (loading) {
    return (
      <MainLayout showSidebar={true} activeRoute="ManageSponsors" onNavigate={r => navigation.navigate(r)} userInfo={user} onLogout={logout} onSettings={() => navigation.navigate('Settings')}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      activeRoute="ManageSponsors"
      onNavigate={r => navigation.navigate(r)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { padding: isMobile ? 16 : 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerBanner, { backgroundColor: isDark ? 'rgba(0,122,61,0.08)' : 'rgba(0,122,61,0.05)', borderColor: 'rgba(0,122,61,0.15)' }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(0,122,61,0.15)' }]}>
            <Icon name="heart" size={22} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Manage Sponsors</Text>
            <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>View and manage sponsor accounts</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, isMobile && { flexDirection: 'column' }]}>
          {[
            { label: 'Total Sponsors', value: stats.total, color: GREEN, icon: 'heart' },
            { label: 'Active', value: stats.active, color: '#10B981', icon: 'checkmark-circle' },
            { label: 'Inactive', value: stats.inactive, color: '#EF4444', icon: 'close-circle' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <AppInput
          placeholder="Search sponsors by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
          containerStyle={{ marginBottom: 20 }}
        />

        {/* Sponsor Cards */}
        {filtered.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
            <Icon name="heart-outline" size={40} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No sponsors found</Text>
          </View>
        ) : (
          <View style={[styles.grid, !isMobile && { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {filtered.map(sponsor => {
              const avatarColor = getAvatarColor(sponsor.name);
              return (
                <View
                  key={sponsor.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                      width: isLargeScreen ? 'calc(33.333% - 11px)' : isTablet ? 'calc(50% - 8px)' : '100%',
                    },
                  ]}
                >
                  {/* Avatar + Info */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.avatarText}>{sponsor.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sponsorName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{sponsor.name}</Text>
                      <Text style={[styles.sponsorEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>{sponsor.email}</Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: sponsor.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', borderColor: sponsor.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)' }]}>
                    <View style={[styles.statusDot, { backgroundColor: sponsor.isActive ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: sponsor.isActive ? '#10B981' : '#EF4444' }]}>{sponsor.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>

                  {/* Meta */}
                  <View style={styles.metaRow}>
                    <Icon name="call-outline" size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{sponsor.phone || 'No phone'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="location-outline" size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{sponsor.location || 'Location not set'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="calendar-outline" size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>Joined {new Date(sponsor.createdAt).toLocaleDateString()}</Text>
                  </View>

                  {/* Action */}
                  <TouchableOpacity
                    style={[styles.toggleBtn, { backgroundColor: sponsor.isActive ? RED : GREEN }]}
                    onPress={() => handleToggleStatus(sponsor)}
                    disabled={togglingId === sponsor.id}
                  >
                    {togglingId === sponsor.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name={sponsor.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'} size={15} color="#FFFFFF" />
                        <Text style={styles.toggleBtnText}>{sponsor.isActive ? 'Deactivate' : 'Activate'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  headerBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  pageSubtitle: { fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 4 },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, textAlign: 'center' },
  grid: { gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  sponsorName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sponsorEmail: { fontSize: 13 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 6, marginBottom: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText: { fontSize: 12 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 9, borderRadius: 10 },
  toggleBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyBox: { borderRadius: 16, borderWidth: 1, padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16 },
});

export default ManageSponsorsScreen;
