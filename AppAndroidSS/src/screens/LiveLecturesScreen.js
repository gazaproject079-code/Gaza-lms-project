import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Linking, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/apiClient';

const GREEN = '#007A3D';
const RED = '#CE1126';

const LiveLecturesScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    meetingLink: '',
    courseId: ''
  });

  const isInstructor = user?.role === 'instructor' || user?.role === 'superadmin';

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await api.get('/live-lectures');
      setLectures(res.liveLectures || []);
    } catch (err) {
      console.error('Failed to load lectures:', err);
      Toast.show({ type: 'error', text1: 'Failed to load live lectures' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      // If instructor, filter courses where course.userId === user.id (unless superadmin)
      const list = res.courses || [];
      if (user?.role === 'instructor') {
        setCourses(list.filter(c => c.userId === user.id));
      } else {
        setCourses(list);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  useEffect(() => {
    fetchLectures();
    if (isInstructor) {
      fetchCourses();
    }
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.scheduledTime || !form.meetingLink || !form.courseId) {
      Toast.show({ type: 'error', text1: 'All fields except description are required' });
      return;
    }
    try {
      setSaving(true);
      await api.post('/live-lectures', form);
      Toast.show({ type: 'success', text1: 'Live lecture scheduled' });
      setShowModal(false);
      setForm({ title: '', description: '', scheduledTime: '', meetingLink: '', courseId: '' });
      fetchLectures();
    } catch (err) {
      console.error('Failed to schedule lecture:', err);
      Toast.show({ type: 'error', text1: 'Failed to schedule live lecture' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/live-lectures/${id}`, { status });
      Toast.show({ type: 'success', text1: `Lecture status updated to ${status}` });
      fetchLectures();
    } catch (err) {
      console.error('Failed to update lecture status:', err);
      Toast.show({ type: 'error', text1: 'Failed to update lecture status' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/live-lectures/${id}`);
      Toast.show({ type: 'success', text1: 'Lecture deleted successfully' });
      fetchLectures();
    } catch (err) {
      console.error('Failed to delete lecture:', err);
      Toast.show({ type: 'error', text1: 'Failed to delete lecture' });
    }
  };

  const handleJoin = (link) => {
    if (!link) return;
    Linking.openURL(link).catch((err) => {
      console.error("Couldn't open URL:", err);
      Toast.show({ type: 'error', text1: 'Failed to open meeting link' });
    });
  };

  const liveNow = lectures.filter(l => l.status === 'live');
  const upcoming = lectures.filter(l => l.status === 'scheduled');
  const past = lectures.filter(l => l.status === 'ended');

  const renderLectureCard = ({ item }) => {
    const isLive = item.status === 'live';
    const isEnded = item.status === 'ended';

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.courseTag, { color: GREEN, backgroundColor: 'rgba(255, 140, 66, 0.12)' }]}>
            {item.course?.name || 'General Course'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: isLive ? 'rgba(239, 68, 68, 0.12)' : isEnded ? 'rgba(150, 150, 150, 0.12)' : 'rgba(16, 185, 129, 0.12)' }]}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={{ fontSize: 11, fontWeight: '700', color: isLive ? '#EF4444' : isEnded ? theme.colors.textSecondary : '#10B981' }}>
              {isLive ? 'LIVE' : isEnded ? 'ENDED' : 'SCHEDULED'}
            </Text>
          </View>
        </View>

        <Text style={[styles.lectureTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
        {!!item.description && (
          <Text style={[styles.lectureDesc, { color: theme.colors.textSecondary }]}>{item.description}</Text>
        )}

        <View style={styles.metaRow}>
          <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {new Date(item.scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {!isEnded && (
            <TouchableOpacity style={[styles.joinBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleJoin(item.meetingLink)}>
              <Icon name="video-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.joinBtnText}>Join Lecture</Text>
            </TouchableOpacity>
          )}

          {isInstructor && (
            <View style={styles.instructorActions}>
              {!isEnded && !isLive && (
                <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => handleUpdateStatus(item.id, 'live')}>
                  <Icon name="play" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
              {isLive && (
                <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(150,150,150,0.1)' }]} onPress={() => handleUpdateStatus(item.id, 'ended')}>
                  <Icon name="stop" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => handleDelete(item.id)}>
                <Icon name="delete" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <MainLayout showSidebar={true} activeRoute="LiveLectures" onNavigate={(route) => navigation.navigate(route)}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 24 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Live Lectures</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Attend classes in real-time or schedule new ones</Text>
          </View>
          {isInstructor && (
            <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setShowModal(true)}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Schedule Lecture</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridContainer}>
            {/* Live Now Section */}
            {liveNow.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.liveDot, { width: 8, height: 8, marginRight: 8 }]} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Live Now</Text>
                </View>
                <FlatList
                  data={liveNow}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderLectureCard}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Upcoming Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Upcoming Lectures</Text>
              {upcoming.length > 0 ? (
                <FlatList
                  data={upcoming}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderLectureCard}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={{ color: theme.colors.textSecondary, marginVertical: 12 }}>No upcoming lectures scheduled.</Text>
              )}
            </View>

            {/* Past Lectures Section */}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Past Lectures</Text>
                <FlatList
                  data={past}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderLectureCard}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        )}

        {/* Schedule Modal */}
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Schedule Live Lecture</Text>

              <ScrollView style={{ maxHeight: 400, marginVertical: 12 }}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Course</Text>
                <View style={[styles.dropdownContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.textPrimary,
                      padding: 10,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ background: theme.colors.surface }}>Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id} style={{ background: theme.colors.surface }}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </View>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Lecture Title</Text>
                <TextInput
                  placeholder="e.g. Intro to Node.js Frameworks"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
                <TextInput
                  placeholder="Details of what will be covered..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background, minHeight: 60 }]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Scheduled Time (YYYY-MM-DD HH:MM)</Text>
                <TextInput
                  placeholder="e.g. 2026-07-05 14:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
                  value={form.scheduledTime}
                  onChangeText={(text) => setForm({ ...form, scheduledTime: text })}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Meeting Link (Zoom/Google Meet)</Text>
                <TextInput
                  placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
                  value={form.meetingLink}
                  onChangeText={(text) => setForm({ ...form, meetingLink: text })}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.colors.border }]} onPress={() => setShowModal(false)}>
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]} onPress={handleCreate} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Schedule</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  gridContainer: { gap: 24 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  courseTag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  lectureTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  lectureDesc: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { fontSize: 13 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  instructorActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  actionIconBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 460, borderRadius: 16, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  dropdownContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 }
});

export default LiveLecturesScreen;
