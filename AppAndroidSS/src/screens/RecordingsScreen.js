import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/apiClient';

const GREEN = '#007A3D';
const RED = '#CE1126';

const RecordingsScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [recordings, setRecordings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    courseId: ''
  });

  const isInstructor = user?.role === 'instructor' || user?.role === 'superadmin';

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recordings');
      const list = res.recordings || [];
      setRecordings(list);
      if (list.length > 0 && !selectedRecording) {
        setSelectedRecording(list[0]);
      }
    } catch (err) {
      console.error('Failed to load recordings:', err);
      Toast.show({ type: 'error', text1: 'Failed to load recordings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
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
    fetchRecordings();
    if (isInstructor) {
      fetchCourses();
    }
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.videoUrl || !form.courseId) {
      Toast.show({ type: 'error', text1: 'Title, Video URL, and Course are required' });
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/recordings', form);
      Toast.show({ type: 'success', text1: 'Recording added successfully' });
      setShowModal(false);
      setForm({ title: '', description: '', videoUrl: '', duration: '', courseId: '' });
      
      // Refresh recordings and select the newly created one
      const refreshedRes = await api.get('/recordings');
      const newList = refreshedRes.recordings || [];
      setRecordings(newList);
      const newlyAdded = newList.find(r => r.id === res.recording?.id);
      if (newlyAdded) {
        setSelectedRecording(newlyAdded);
      }
    } catch (err) {
      console.error('Failed to create recording:', err);
      Toast.show({ type: 'error', text1: 'Failed to add recording' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/recordings/${id}`);
      Toast.show({ type: 'success', text1: 'Recording deleted successfully' });
      
      // Update local state
      const updated = recordings.filter(r => r.id !== id);
      setRecordings(updated);
      
      if (selectedRecording?.id === id) {
        setSelectedRecording(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete recording:', err);
      Toast.show({ type: 'error', text1: 'Failed to delete recording' });
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube Matcher
    let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    // Google Drive Matcher
    match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    return url;
  };

  const renderRecordingItem = ({ item }) => {
    const isSelected = selectedRecording?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.playlistItem,
          { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }
        ]}
        onPress={() => setSelectedRecording(item)}
      >
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? '#2C2C3E' : '#E0E0E0' }]}>
          <Icon name="play-circle" size={24} color={GREEN} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.recordingTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.recordingDuration, { color: theme.colors.textSecondary }]}>
            {item.duration || 'Video'} • {item.course?.name || 'Course'}
          </Text>
        </View>
        {isInstructor && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
            <Icon name="trash-can-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const LeftPlaylistPanel = () => (
    <View style={[styles.leftPanel, { borderRightColor: theme.colors.border }]}>
      <Text style={[styles.panelHeaderTitle, { color: theme.colors.textPrimary }]}>Playlist</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecordingItem}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No recordings found.
            </Text>
          }
        />
      )}
    </View>
  );

  const RightPlayerPanel = () => {
    if (!selectedRecording) {
      return (
        <View style={styles.rightPlaceholder}>
          <Icon name="play-box-multiple-outline" size={80} color={theme.colors.border} />
          <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>No Video Selected</Text>
          <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>
            Select a recording from the list to begin streaming your lecture.
          </Text>
        </View>
      );
    }

    const embedUrl = getEmbedUrl(selectedRecording.videoUrl);

    return (
      <View style={{ flex: 1, padding: 24 }}>
        {/* Video Player */}
        <View style={[styles.videoContainer, { backgroundColor: '#000', borderColor: theme.colors.border }]}>
          {Platform.OS === 'web' ? (
            <iframe
              src={embedUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="video-off" size={48} color={theme.colors.textSecondary} />
              <Text style={{ color: '#fff', marginTop: 12 }}>Inline playback only supported on Web.</Text>
            </View>
          )}
        </View>

        {/* Video Metadata */}
        <View style={styles.metaContainer}>
          <Text style={[styles.mainTitle, { color: theme.colors.textPrimary }]}>{selectedRecording.title}</Text>
          <Text style={[styles.mainCourseName, { color: GREEN }]}>
            {selectedRecording.course?.name || 'General Course'}
          </Text>
          {!!selectedRecording.description && (
            <Text style={[styles.mainDesc, { color: theme.colors.textSecondary }]}>
              {selectedRecording.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <MainLayout showSidebar={true} activeRoute="Recordings" onNavigate={(route) => navigation.navigate(route)}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Course Recordings</Text>
              <Text style={{ color: theme.colors.textSecondary }}>Watch past lectures at your own pace</Text>
            </View>
            {isInstructor && (
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setShowModal(true)}>
                <Icon name="plus" size={20} color="#fff" />
                <Text style={styles.createBtnText}>Add Recording</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentRow}>
            {isMobile ? (
              // On mobile, show player first, then simple listing below it
              <ScrollView style={{ flex: 1 }}>
                <RightPlayerPanel />
                <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                  <LeftPlaylistPanel />
                </View>
              </ScrollView>
            ) : (
              // Dual-pane layout on desktop
              <>
                <LeftPlaylistPanel />
                <View style={styles.rightPanel}>
                  <RightPlayerPanel />
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Create Modal */}
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Add Course Recording</Text>

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

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Recording Title</Text>
                <TextInput
                  placeholder="e.g. Chapter 3: Setting Up Express Routers"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
                <TextInput
                  placeholder="Details of what was covered..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background, minHeight: 60 }]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Duration (e.g. 1:15:30)</Text>
                <TextInput
                  placeholder="e.g. 45:10"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
                  value={form.duration}
                  onChangeText={(text) => setForm({ ...form, duration: text })}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Video URL (YouTube/Google Drive)</Text>
                <TextInput
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
                  value={form.videoUrl}
                  onChangeText={(text) => setForm({ ...form, videoUrl: text })}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.colors.border }]} onPress={() => setShowModal(false)}>
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]} onPress={handleCreate} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  contentRow: { flex: 1, flexDirection: 'row' },
  leftPanel: { width: '100%', maxWidth: 320, flex: 1, borderRightWidth: 1, padding: 16 },
  panelHeaderTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  rightPanel: { flex: 1 },
  playlistItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
  thumbnailPlaceholder: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  recordingTitle: { fontSize: 14, fontWeight: '700' },
  recordingDuration: { fontSize: 12, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40 },
  rightPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  placeholderSub: { fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  metaContainer: { gap: 8 },
  mainTitle: { fontSize: 22, fontWeight: 'bold' },
  mainCourseName: { fontSize: 14, fontWeight: '700' },
  mainDesc: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 460, borderRadius: 16, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  dropdownContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 }
});

export default RecordingsScreen;
