import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Linking,
  ActivityIndicator, useWindowDimensions, Modal, Platform, TextInput,
} from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api, { uploadMultipart } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';

const LibraryScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [form, setForm] = useState({ title: '', description: '', url: '', type: 'link' });

  const isAdmin = user?.role === 'instructor' || user?.role === 'superadmin';

  useEffect(() => { fetchLibraryItems(); }, []);

  const fetchLibraryItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/library');
      setItems(response);
    } catch (error) {
      console.error('Failed to fetch library items:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── File upload (web only) ─────────────────────────────────────────────────
  const handleFilePick = (type) => {
    if (Platform.OS !== 'web') {
      Toast.show({ type: 'info', text1: 'File upload is only available on web' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'pdf' ? 'application/pdf' : 'video/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      setUploadedFileName(file.name);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const data = await uploadMultipart('/library/upload', formData);
        setForm(prev => ({ ...prev, url: data.url }));
        Toast.show({ type: 'success', text1: 'File uploaded successfully', text2: file.name });
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: err.message });
        setUploadedFileName('');
        setForm(prev => ({ ...prev, url: '' }));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // ── Create / Approve / Delete ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      Toast.show({ type: 'error', text1: 'Title and URL are required' });
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/library', form);
      Toast.show({
        type: 'success',
        text1: 'Resource submitted',
        text2: isAdmin ? 'Published to the library' : 'Pending instructor approval',
      });
      setForm({ title: '', description: '', url: '', type: 'link' });
      setUploadedFileName('');
      setShowAddModal(false);
      fetchLibraryItems();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (item, status) => {
    try {
      await api.put(`/library/${item.id}/approve`, { status });
      fetchLibraryItems();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed' });
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.del(`/library/${item.id}`);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed' });
    }
  };

  // ── Open: web → preview modal, native → browser ───────────────────────────
  const openItem = (item) => {
    if (Platform.OS === 'web') {
      setPreviewItem(item);
    } else {
      Linking.openURL(item.url);
    }
  };

  // ── URL helpers ────────────────────────────────────────────────────────────
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  // PDFs from Cloudinary are resource_type:raw → direct URL forces download.
  // Route through Google Docs Viewer so the browser renders them inline.
  const getPdfViewerUrl = (rawUrl, embedded = true) =>
    `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}${embedded ? '&embedded=true' : ''}`;

  // URL to use when "Open in Browser" is pressed
  const getBrowserUrl = (item) => {
    if (item.type === 'pdf') return getPdfViewerUrl(item.url, false);
    return item.url;
  };

  // ── Web inline preview (iframe or <video>) ─────────────────────────────────
  const renderWebPreview = (item) => {
    const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');

    // Cloudinary video (non-YouTube) → HTML5 video element
    if (item.type === 'video' && !isYouTube) {
      return (
        <video
          src={item.url}
          controls
          style={{ width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#000', outline: 'none' }}
        />
      );
    }

    // PDF → Google Docs Viewer iframe
    if (item.type === 'pdf') {
      return (
        <iframe
          src={getPdfViewerUrl(item.url)}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
          title={item.title}
        />
      );
    }

    // Link (including YouTube) → embed/direct iframe
    return (
      <iframe
        src={getEmbedUrl(item.url)}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        title={item.title}
      />
    );
  };

  // ── Sidebar items ──────────────────────────────────────────────────────────
  const getSidebarItems = (role) => {
    if (role === 'instructor' || role === 'superadmin') {
      return [
        { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
        { label: 'Skill Categories', icon: 'layers-outline', iconActive: 'layers', route: 'CategoryManagement' },
        { label: 'Manage Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
        { label: 'Students', icon: 'people-outline', iconActive: 'people', route: 'Students' },
        { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
        { label: 'Course Feedback', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Feedback' },
        { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
        { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
      ];
    }
    return [
      { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
      { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
      { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
      { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
      { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
      { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
      { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
      { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
    ];
  };

  // ── Library item card ──────────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }]} elevation={0}>
      <LinearGradient colors={[`${theme.colors.primary}15`, theme.colors.card]} style={styles.cardGradient}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Icon
              name={item.type === 'pdf' ? 'file-pdf-box' : item.type === 'video' ? 'play-circle' : 'link'}
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
            {isAdmin && (
              <Text style={[styles.status, { color: item.status === 'approved' ? theme.colors.success : theme.colors.warning }]}>
                {item.status.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isAdmin && item.status === 'pending' && (
              <IconButton icon="check" size={20} iconColor="#10B981" onPress={() => handleApprove(item, 'approved')} />
            )}
            {isAdmin && (
              <IconButton icon="trash-can-outline" size={20} iconColor="#EF4444" onPress={() => handleDelete(item)} />
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => openItem(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>OPEN</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  );

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={getSidebarItems(user?.role)}
      activeRoute="Library"
      onNavigate={(name) => navigation.navigate(name)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
      showBack={false}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

        {/* Header Banner */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
          borderColor: 'rgba(0,122,61,0.15)',
        }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name="bookshelf" size={22} color="#007A3D" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Global Library</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>Access learning materials anytime, anywhere</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Resource</Text>
          </TouchableOpacity>
        </View>

        {/* Items list */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="bookshelf" size={60} color={theme.colors.textMuted} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>The library is currently empty.</Text>
              </View>
            }
          />
        )}

        {/* ── Preview Modal ─────────────────────────────────────────────────── */}
        <Modal visible={!!previewItem} transparent animationType="fade" onRequestClose={() => setPreviewItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.previewModal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

              {/* Modal header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {previewItem?.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <TouchableOpacity
                    style={[styles.openBrowserBtn, { borderColor: theme.colors.primary }]}
                    onPress={() => previewItem && Linking.openURL(getBrowserUrl(previewItem))}
                    activeOpacity={0.8}
                  >
                    <Icon name="open-in-new" size={15} color={theme.colors.primary} />
                    <Text style={[styles.openBrowserText, { color: theme.colors.primary }]}>Open in Browser</Text>
                  </TouchableOpacity>
                  <IconButton icon="close" iconColor={theme.colors.textPrimary} size={24} onPress={() => setPreviewItem(null)} />
                </View>
              </View>

              {/* Preview body */}
              <View style={styles.modalBody}>
                {Platform.OS === 'web' && previewItem ? (
                  renderWebPreview(previewItem)
                ) : (
                  // Native fallback — no WebView installed, just prompt to open in browser
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                    <Icon
                      name={previewItem?.type === 'pdf' ? 'file-pdf-box' : previewItem?.type === 'video' ? 'play-circle' : 'link'}
                      size={80}
                      color={theme.colors.primary}
                    />
                    <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 260 }}>
                      Tap "Open in Browser" to view this resource.
                    </Text>
                    <TouchableOpacity
                      style={[styles.openBrowserBtnLarge, { backgroundColor: theme.colors.primary }]}
                      onPress={() => previewItem && Linking.openURL(getBrowserUrl(previewItem))}
                    >
                      <Icon name="open-in-new" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Open in Browser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Add Resource Modal ────────────────────────────────────────────── */}
        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.addModalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Add a Resource</Text>
                <IconButton icon="close" iconColor={theme.colors.textPrimary} size={24} onPress={() => setShowAddModal(false)} />
              </View>
              <View style={{ padding: 16, gap: 12 }}>

                {/* Title */}
                <TextInput
                  style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  placeholder="Title"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={form.title}
                  onChangeText={t => setForm({ ...form, title: t })}
                />

                {/* Description */}
                <TextInput
                  style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={form.description}
                  onChangeText={t => setForm({ ...form, description: t })}
                />

                {/* Type chips */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['link', 'pdf', 'video'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, {
                        borderColor: form.type === t ? theme.colors.primary : theme.colors.border,
                        backgroundColor: form.type === t ? theme.colors.primary + '15' : 'transparent',
                      }]}
                      onPress={() => {
                        setForm({ ...form, type: t, url: '' });
                        setUploadedFileName('');
                      }}
                    >
                      <Icon
                        name={t === 'pdf' ? 'file-pdf-box' : t === 'video' ? 'play-circle' : 'link'}
                        size={16}
                        color={form.type === t ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text style={{ color: form.type === t ? theme.colors.primary : theme.colors.textSecondary, fontWeight: '600', fontSize: 13, marginLeft: 4 }}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Link URL input */}
                {form.type === 'link' && (
                  <TextInput
                    style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    placeholder="Paste URL (website, YouTube, etc.)"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={form.url}
                    onChangeText={t => setForm({ ...form, url: t })}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                )}

                {/* PDF / Video: file picker + optional manual URL */}
                {(form.type === 'pdf' || form.type === 'video') && (
                  <>
                    {/* File picker button */}
                    <TouchableOpacity
                      style={[styles.filePickBtn, {
                        borderColor: form.url ? '#10B981' : theme.colors.primary,
                        backgroundColor: form.url ? 'rgba(16,185,129,0.08)' : theme.colors.primary + '10',
                      }]}
                      onPress={() => handleFilePick(form.type)}
                      disabled={uploading}
                      activeOpacity={0.75}
                    >
                      {uploading ? (
                        <>
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                          <Text style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 10 }}>Uploading…</Text>
                        </>
                      ) : form.url ? (
                        <>
                          <Icon name="check-circle" size={20} color="#10B981" />
                          <Text style={{ color: '#10B981', fontWeight: '700', marginLeft: 8, flex: 1 }} numberOfLines={1}>
                            {uploadedFileName || 'File uploaded'}
                          </Text>
                          <TouchableOpacity onPress={() => { setForm(p => ({ ...p, url: '' })); setUploadedFileName(''); }}>
                            <Icon name="close-circle" size={18} color={theme.colors.textSecondary} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Icon name={form.type === 'pdf' ? 'file-pdf-box' : 'video-plus'} size={22} color={theme.colors.primary} />
                          <Text style={{ color: theme.colors.primary, fontWeight: '700', marginLeft: 10 }}>
                            {Platform.OS === 'web'
                              ? `Pick ${form.type === 'pdf' ? 'PDF' : 'Video'} from device`
                              : `Pick ${form.type === 'pdf' ? 'PDF' : 'Video'} (web only)`}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Manual URL fallback */}
                    {!form.url && (
                      <TextInput
                        style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        placeholder={`Or paste ${form.type.toUpperCase()} URL directly`}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={form.url}
                        onChangeText={t => setForm({ ...form, url: t })}
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    )}
                  </>
                )}

                {/* Student approval notice */}
                {!isAdmin && (
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    Your submission will be reviewed by an instructor before appearing in the library.
                  </Text>
                )}

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: (submitting || uploading) ? 0.7 : 1 }]}
                  onPress={handleCreate}
                  disabled={submitting || uploading}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.submitBtnText}>Submit Resource</Text>
                  }
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,61,0.15)', justifyContent: 'center', alignItems: 'center' },
  bannerTextGroup: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  bannerSubtitle: { fontSize: 13 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16 },
  card: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  cardGradient: { padding: 16 },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, paddingVertical: 0 },
  iconContainer: { marginRight: 16, backgroundColor: 'rgba(255,255,255,0.5)', padding: 10, borderRadius: 12 },
  textContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 14, marginBottom: 6 },
  status: { fontSize: 12, fontWeight: 'bold' },
  actionBtn: { marginLeft: 8, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { marginTop: 60, alignItems: 'center' },
  emptyText: { marginTop: 16, fontSize: 16 },
  // Modals shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', flex: 1, marginRight: 8 },
  modalBody: { flex: 1, padding: 10 },
  // Preview modal
  previewModal: {
    width: '100%',
    maxWidth: 960,
    height: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  openBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openBrowserText: { fontSize: 13, fontWeight: '700' },
  openBrowserBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  // Add resource modal
  addModalContent: { width: '100%', maxWidth: 480, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  filePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  submitBtn: { marginTop: 4, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default LibraryScreen;
