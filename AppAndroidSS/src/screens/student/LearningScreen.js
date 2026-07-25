import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  Image,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainLayout from '../../components/ui/MainLayout';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const LearningScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const { courseId, topicId } = route.params;
  const { courses, checkEnrollment, fetchCourses, enrollments, fetchMyEnrollments, updateTopicProgress } = useData();

  const course = courses.find(c => String(c.id) === String(courseId));
  const topic = course?.topics?.find(t => String(t.id) === String(topicId));
  const topicMaterials = topic?.materials || [];

  const allMaterials = useMemo(() => {
    const list = [...topicMaterials];
    if (topic?.topicType === 'live' && topic?.liveLecture) {
      list.unshift({
        id: 'live-lecture-info',
        type: 'live-lecture',
        title: 'Live Session Details',
        liveLecture: topic.liveLecture,
      });
    } else if (topic?.recording?.videoUrl) {
      list.unshift({
        id: 'recording-video',
        type: 'link',
        uri: topic.recording.videoUrl,
        title: 'Class Recording',
        description: `Duration: ${topic.recording.duration || 'N/A'}`,
      });
    }
    return list;
  }, [topicMaterials, topic]);

  const isWeb = Platform.OS === 'web';
  const isMobile = windowWidth < 768;
  const isLargeScreen = windowWidth >= 1024;

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // 'topics' | 'notes' | null
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [topicCompleted, setTopicCompleted] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const [notesSavedAt, setNotesSavedAt] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const autoNavDone = useRef(false);

  const enrollmentProgress = useMemo(() => {
    const e = enrollments.find(en =>
      String(en.courseId) === String(courseId) || String(en.course?.id) === String(courseId)
    );
    return Math.round(e?.progress ?? 0);
  }, [courseId, enrollments]);

  const sidebarItems = [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
    { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
    { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
    { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
    { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
    { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
  ];

  // Sync completion state
  useEffect(() => {
    setTopicCompleted(!!topic?.completed);
  }, [topicId, topic?.completed]);

  // Initial material selection
  useEffect(() => {
    if (allMaterials.length > 0) {
      setSelectedMaterial(allMaterials[0]);
    } else {
      setSelectedMaterial(null);
    }
  }, [topicId]);

  // Auto-navigate to first non-completed topic
  useEffect(() => {
    if (autoNavDone.current || !course?.topics?.length) return;
    autoNavDone.current = true;
    const currentTopic = course.topics.find(t => String(t.id) === String(topicId));
    if (currentTopic?.completed) return;
    const sorted = [...course.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const firstNonCompleted = sorted.find(t => !t.completed) || sorted[0];
    if (String(firstNonCompleted.id) !== String(topicId)) {
      navigation.replace('Learning', { courseId, topicId: firstNonCompleted.id });
    }
  }, [course?.topics]);

  // Check enrollment
  useEffect(() => {
    const verify = async () => {
      setEnrollmentLoading(true);
      const result = await checkEnrollment(courseId);
      if (result.success) {
        setIsEnrolled(result.enrolled);
        if (!result.enrolled) {
          Toast.show({ type: 'error', text1: 'Not Enrolled', text2: 'Enroll in this course first.' });
          navigation.navigate('CourseDetail', { courseId });
        }
      }
      setEnrollmentLoading(false);
    };
    verify();
    fetchCourses();
  }, [courseId]);

  // Notes storage
  const notesKey = user?.id && topicId ? `@skillsphere:notes:${user.id}:${topicId}` : null;
  useEffect(() => {
    if (!notesKey) return;
    AsyncStorage.getItem(notesKey).then(saved => { if (saved) setStudentNotes(saved); });
  }, [notesKey]);

  const saveNotes = async () => {
    if (!notesKey) return;
    setSavingNotes(true);
    try {
      await AsyncStorage.setItem(notesKey, studentNotes);
      setNotesSavedAt(new Date());
      Toast.show({ type: 'success', text1: 'Notes Saved' });
    } catch {
      Toast.show({ type: 'error', text1: 'Save Failed' });
    } finally {
      setSavingNotes(false);
    }
  };

  const exportNotesPDF = () => {
    if (!studentNotes.trim() || Platform.OS !== 'web') {
      Toast.show({ type: 'info', text1: 'Export Unavailable', text2: studentNotes.trim() ? 'Available on web only.' : 'No notes yet.' });
      return;
    }
    const html = `<!DOCTYPE html><html><head><title>${course?.name} – Notes</title>
      <style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px}
      h1{color:${theme.colors.primary}}pre{white-space:pre-wrap;font-size:15px;line-height:1.7}</style></head>
      <body><h1>${course?.name}</h1><h2>${topic?.title}</h2>
      <pre>${studentNotes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handleCompleteTopic = async () => {
    const result = await updateTopicProgress({ courseId, topicId, completed: true });
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to update progress' });
      return;
    }
    await Promise.all([fetchCourses(), fetchMyEnrollments()]);
    setTopicCompleted(true);
    Toast.show({ type: 'success', text1: 'Lecture Complete!', text2: 'Now take the quiz to move forward.' });
  };

  // ── Material viewer helpers ─────────────────────────────────────────────────
  const getYouTubeEmbedUrl = url => {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=0&rel=0` : url;
  };
  const getGoogleEmbedUrl = url => {
    const m = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    if (url.includes('docs.google.com')) return url.replace(/\/(edit|view|pub)(\?.*)?$/, '/preview');
    return url;
  };
  const getEmbedUrl = url => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return getYouTubeEmbedUrl(url);
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return getGoogleEmbedUrl(url);
    return url;
  };
  const getLinkMeta = (url = '') => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' };
    if (url.includes('drive.google.com')) return { label: 'Google Drive', icon: 'logo-google', color: '#4285F4' };
    if (url.includes('docs.google.com')) return { label: 'Google Docs', icon: 'logo-google', color: '#4285F4' };
    if (url.includes('vimeo.com')) return { label: 'Vimeo', icon: 'videocam', color: '#1AB7EA' };
    if (url.includes('github.com')) return { label: 'GitHub', icon: 'logo-github', color: '#24292e' };
    return { label: 'Link', icon: 'link', color: theme.colors.primary };
  };
  const getMaterialIcon = type => {
    if (type === 'pdf') return 'document-text';
    if (type === 'image') return 'image';
    if (type === 'link') return 'link';
    return 'document';
  };
  const openMaterial = material => {
    const url = resolveFileUrl(material.uri);
    if (Platform.OS === 'web') { window.open(url, '_blank'); } else { Linking.openURL(url).catch(() => {}); }
  };

  const renderMaterialViewer = material => {
    if (!material) return (
      <View style={styles.viewerEmpty}>
        <Icon name="folder-open-outline" size={48} color="rgba(255,255,255,0.25)" />
        <Text style={styles.viewerEmptyText}>No materials added to this topic yet</Text>
      </View>
    );

    if (material.type === 'live-lecture') {
      const ll = material.liveLecture;
      return (
        <View style={styles.viewerEmpty}>
          <Icon name="videocam" size={64} color="#E11D48" />
          <Text style={[styles.viewerEmptyText, { color: '#fff', fontSize: 16, fontWeight: '700' }]}>Live Session</Text>
          {ll?.scheduledAt && (
            <Text style={[styles.viewerEmptyText, { fontSize: 13 }]}>
              {new Date(ll.scheduledAt).toLocaleString()}
            </Text>
          )}
          {ll?.meetingLink && (
            <TouchableOpacity
              style={[styles.openBtn, { backgroundColor: '#E11D48' }]}
              onPress={() => { if (Platform.OS === 'web') { window.open(ll.meetingLink, '_blank'); } else { Linking.openURL(ll.meetingLink).catch(() => {}); } }}
            >
              <Icon name="videocam" size={18} color="#fff" />
              <Text style={styles.openBtnText}>Join Live Session</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const resolvedUri = resolveFileUrl(material.uri);

    if (material.type === 'link') {
      const meta = getLinkMeta(material.uri);
      if (Platform.OS === 'web') {
        return (
          <View style={{ flex: 1, position: 'relative' }}>
            <iframe
              src={getEmbedUrl(material.uri)}
              title={material.title || meta.label}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </View>
        );
      }
      return (
        <View style={styles.viewerEmpty}>
          <Icon name={meta.icon} size={64} color={meta.color} />
          <Text style={[styles.viewerEmptyText, { color: '#fff' }]}>{material.title || meta.label}</Text>
          <TouchableOpacity style={[styles.openBtn, { backgroundColor: meta.color }]} onPress={() => openMaterial(material)}>
            <Icon name="open-outline" size={18} color="#fff" />
            <Text style={styles.openBtnText}>Open in {meta.label}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (material.type === 'pdf') {
      if (Platform.OS === 'web') {
        const src = isMobile
          ? `https://docs.google.com/viewer?url=${encodeURIComponent(resolvedUri)}&embedded=true`
          : resolvedUri;
        return (
          <iframe src={src} title={material.title || 'PDF'} style={{ width: '100%', height: '100%', border: 'none' }} />
        );
      }
      return (
        <TouchableOpacity style={styles.viewerEmpty} onPress={() => openMaterial(material)}>
          <Icon name="document-text" size={64} color="#e74c3c" />
          <Text style={styles.viewerEmptyText}>{material.title || 'PDF Document'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Tap to open</Text>
        </TouchableOpacity>
      );
    }

    if (material.type === 'image') {
      return <Image source={{ uri: resolvedUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />;
    }

    return (
      <TouchableOpacity style={styles.viewerEmpty} onPress={() => openMaterial(material)}>
        <Icon name="document" size={64} color={theme.colors.primary} />
        <Text style={styles.viewerEmptyText}>{material.title || material.fileName || 'Open Material'}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Tap to open</Text>
      </TouchableOpacity>
    );
  };

  // ── Topics Sidebar ──────────────────────────────────────────────────────────
  const renderTopicsSidebar = () => (
    <View style={styles.panelContent}>
      <View style={styles.panelHeaderRow}>
        <View style={[styles.panelHeaderIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <MaterialIcon name="book-open-variant" size={18} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.panelTitle, { color: theme.colors.textPrimary }]}>Course Progress</Text>
          <Text style={[styles.panelSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>{course?.name}</Text>
        </View>
      </View>
      <View style={styles.panelProgressRow}>
        <Text style={[styles.panelProgressLabel, { color: theme.colors.textSecondary }]}>
          {course?.topics?.filter(t => t.completed).length || 0} of {course?.topics?.length || 0} topics
        </Text>
        <Text style={[styles.panelProgressPct, { color: theme.colors.primary }]}>
          {Math.round(((course?.topics?.filter(t => t.completed).length || 0) / (course?.topics?.length || 1)) * 100)}%
        </Text>
      </View>
      <View style={[styles.panelProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border }]}>
        <View style={[styles.panelProgressFill, {
          width: `${Math.round(((course?.topics?.filter(t => t.completed).length || 0) / (course?.topics?.length || 1)) * 100)}%`,
          backgroundColor: theme.colors.primary,
        }]} />
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {course?.topics?.map(item => {
          const isCurrent = String(item.id) === String(topicId);
          const isLocked = !item.completed && !isCurrent;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.topicItem, isCurrent && { backgroundColor: theme.colors.primary + '18', borderLeftColor: theme.colors.primary }]}
              onPress={() => { setActivePanel(null); navigation.replace('Learning', { courseId, topicId: item.id }); }}
            >
              <View style={[styles.topicStatusIcon, {
                backgroundColor: item.completed ? '#10B981' : isCurrent ? theme.colors.primary : theme.colors.border,
              }]}>
                <Icon name={item.completed ? 'checkmark' : isCurrent ? 'play' : 'lock-closed'} size={12} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topicItemTitle, { color: isLocked ? theme.colors.textTertiary : theme.colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Icon name={item.topicType === 'live' ? 'videocam' : 'play-circle'} size={11}
                    color={item.topicType === 'live' ? '#E11D48' : '#10B981'} />
                  <Text style={{ fontSize: 11, color: item.topicType === 'live' ? '#E11D48' : '#10B981', fontWeight: '600' }}>
                    {item.topicType === 'live' ? 'Live' : 'Recorded'}
                  </Text>
                  {item.completed && <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>· Done</Text>}
                  {isCurrent && <Text style={[{ fontSize: 11, color: theme.colors.primary, marginLeft: 4 }]}>· {enrollmentProgress}%</Text>}
                </View>
                {isCurrent && (
                  <View style={[styles.topicProgressBar, { backgroundColor: theme.colors.primary + '20' }]}>
                    <View style={[styles.topicProgressFill, { width: `${enrollmentProgress}%`, backgroundColor: theme.colors.primary }]} />
                  </View>
                )}
              </View>
              <Icon name="chevron-forward" size={16} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Notes Panel ─────────────────────────────────────────────────────────────
  const renderNotesPanel = () => (
    <View style={styles.panelContent}>
      <View style={styles.panelHeaderRow}>
        <View style={[styles.panelHeaderIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <Icon name="document-text" size={18} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.panelTitle, { color: theme.colors.textPrimary }]}>Class Notes</Text>
          <Text style={[styles.panelSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>{topic?.title}</Text>
        </View>
      </View>
      <TextInput
        style={[styles.notesEditor, {
          color: theme.colors.textPrimary,
          backgroundColor: isDark ? theme.colors.background : '#f8fafc',
          borderColor: theme.colors.border,
        }]}
        value={studentNotes}
        onChangeText={setStudentNotes}
        multiline
        textAlignVertical="top"
        placeholder="Write your notes here…"
        placeholderTextColor={theme.colors.textTertiary}
      />
      <View style={[styles.notesFooter, { borderTopColor: theme.colors.border, backgroundColor: isDark ? theme.colors.surface : '#fff' }]}>
        <Text style={[styles.notesSavedText, { color: theme.colors.textTertiary }]}>
          {notesSavedAt
            ? `Saved ${new Date(notesSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Not saved yet'}
        </Text>
        <TouchableOpacity style={[styles.notesBtn, { backgroundColor: '#10B981' }]} onPress={exportNotesPDF}>
          <Icon name="download-outline" size={13} color="#fff" />
          <Text style={styles.notesBtnText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.notesBtn, { backgroundColor: theme.colors.primary }]} onPress={saveNotes} disabled={savingNotes}>
          <Icon name="save-outline" size={13} color="#fff" />
          <Text style={styles.notesBtnText}>{savingNotes ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Early returns ───────────────────────────────────────────────────────────
  if (!course || !topic) {
    return (
      <MainLayout showSidebar={false} showHeader showBack>
        <View style={styles.centered}>
          <EmptyState icon="alert-circle-outline" title="Topic not found" subtitle="The requested topic does not exist." />
        </View>
      </MainLayout>
    );
  }
  if (enrollmentLoading) {
    return (
      <MainLayout showSidebar={false} showHeader showBack>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Checking enrollment…</Text>
        </View>
      </MainLayout>
    );
  }
  if (!isEnrolled) {
    return (
      <MainLayout showSidebar={false} showHeader showBack>
        <View style={styles.centered}>
          <EmptyState icon="lock-closed-outline" title="Not Enrolled" subtitle="Enroll in this course to access lectures." />
        </View>
      </MainLayout>
    );
  }

  const togglePanel = panel => setActivePanel(prev => prev === panel ? null : panel);

  const RAIL_BG = isDark ? theme.colors.surface : '#1e293b';
  const PANEL_BG = isDark ? theme.colors.backgroundSecondary : theme.colors.surface;
  const AREA_BG = isDark ? theme.colors.background : '#0f172a';
  const VIEWER_BG = isDark ? theme.colors.surface : '#1e293b';

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="EnrolledCourses"
      onNavigate={name => navigation.navigate(name)}
    >
      <View style={[styles.mainContent, { backgroundColor: AREA_BG }]}>

        {/* ── Icon rail (desktop/tablet) ──────────────────────────────── */}
        {!isMobile && (
          <View style={[styles.iconRail, { backgroundColor: RAIL_BG, borderRightColor: 'rgba(255,255,255,0.07)' }]}>
            <TouchableOpacity
              style={[styles.railBtn, activePanel === 'topics' && { backgroundColor: theme.colors.primary + '22', borderColor: theme.colors.primary + '55' }]}
              onPress={() => togglePanel('topics')}
            >
              <MaterialIcon name="book-open-variant" size={22} color={activePanel === 'topics' ? theme.colors.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.railLabel, { color: activePanel === 'topics' ? theme.colors.primary : 'rgba(255,255,255,0.7)' }]}>Topics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.railBtn, activePanel === 'notes' && { backgroundColor: theme.colors.primary + '22', borderColor: theme.colors.primary + '55' }]}
              onPress={() => togglePanel('notes')}
            >
              <Icon name={activePanel === 'notes' ? 'document-text' : 'document-text-outline'} size={22} color={activePanel === 'notes' ? theme.colors.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.railLabel, { color: activePanel === 'notes' ? theme.colors.primary : 'rgba(255,255,255,0.7)' }]}>Notes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Sliding panel ───────────────────────────────────────────── */}
        {!isMobile && activePanel && (
          <View style={[styles.slidePanel, { backgroundColor: PANEL_BG, borderRightColor: 'rgba(255,255,255,0.07)' }]}>
            {activePanel === 'topics' && renderTopicsSidebar()}
            {activePanel === 'notes' && renderNotesPanel()}
          </View>
        )}

        {/* ── Main learning area ──────────────────────────────────────── */}
        <View style={[styles.learningArea, { backgroundColor: AREA_BG }]}>

          {/* Mini progress strip */}
          {isMobile ? (
            <View style={[styles.mobileHeader, { backgroundColor: isDark ? theme.colors.surface : '#0f172a', borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
              <TouchableOpacity style={styles.mobileBackBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginHorizontal: 10 }}>
                <Icon name="book-outline" size={14} color={theme.colors.primary} />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
                  {topic?.title}
                </Text>
              </View>
              <View style={{ width: 80, height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${enrollmentProgress}%`, backgroundColor: theme.colors.primary, borderRadius: 3 }} />
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700', marginLeft: 6 }}>{enrollmentProgress}%</Text>
            </View>
          ) : (
            <View style={styles.desktopHeader}>
              <TouchableOpacity style={[styles.desktopBackBtn, { borderColor: 'rgba(255,255,255,0.15)' }]} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={18} color="#fff" />
              </TouchableOpacity>
              <Icon name="book-outline" size={15} color={theme.colors.primary} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1, minWidth: 0 }} numberOfLines={1}>
                {topic?.title}
              </Text>
              <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', maxWidth: 320 }}>
                <View style={{ height: '100%', width: `${enrollmentProgress}%`, backgroundColor: theme.colors.primary, borderRadius: 3 }} />
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700', flexShrink: 0 }}>{enrollmentProgress}%</Text>
              {topicCompleted && (
                <View style={[styles.completedBadge, { backgroundColor: '#10B981' + '20', borderColor: '#10B981' }]}>
                  <Icon name="checkmark-circle" size={13} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>Completed</Text>
                </View>
              )}
            </View>
          )}

          {/* Material viewer */}
          <View style={styles.viewerSection}>
            {/* Single compact bar: icon + pills (if multiple) or title + open button */}
            <View style={[styles.matHeaderBar, { backgroundColor: isDark ? theme.colors.backgroundTertiary : '#1e293b' }]}>
              <Icon name={getMaterialIcon((selectedMaterial || allMaterials[0])?.type)} size={13} color={theme.colors.primary} />
              {allMaterials.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ gap: 4, alignItems: 'center' }}
                >
                  {allMaterials.map((mat, idx) => {
                    const isActive = selectedMaterial?.id === mat.id || (!selectedMaterial && idx === 0);
                    return (
                      <TouchableOpacity
                        key={mat.id || idx}
                        style={[styles.matTab, isActive && { backgroundColor: theme.colors.primary }]}
                        onPress={() => setSelectedMaterial(mat)}
                      >
                        <Icon name={getMaterialIcon(mat.type)} size={10} color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'} />
                        <Text style={[styles.matTabText, { color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }]} numberOfLines={1}>
                          {mat.title || mat.fileName || `Material ${idx + 1}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.matHeaderTitle} numberOfLines={1}>
                  {(selectedMaterial || allMaterials[0])?.title || (selectedMaterial || allMaterials[0])?.fileName || topic?.title || 'Topic Materials'}
                </Text>
              )}
              {(selectedMaterial || allMaterials[0])?.type === 'link' && (
                <TouchableOpacity style={styles.matOpenBtn} onPress={() => openMaterial(selectedMaterial || allMaterials[0])}>
                  <Icon name="open-outline" size={13} color="#fff" />
                  <Text style={styles.matOpenBtnText}>Open</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Viewer body — takes all remaining space */}
            <View style={[styles.viewerBody, { backgroundColor: VIEWER_BG }]}>
              {allMaterials.length === 0
                ? (
                  <View style={styles.viewerEmpty}>
                    <Icon name="folder-open-outline" size={48} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.viewerEmptyText}>No materials added to this topic yet</Text>
                  </View>
                )
                : renderMaterialViewer(selectedMaterial || allMaterials[0])}
            </View>
          </View>

          {/* Mobile inline panel */}
          {isMobile && activePanel && (
            <View style={[styles.mobilePanel, { backgroundColor: PANEL_BG, borderTopColor: 'rgba(255,255,255,0.08)' }]}>
              {activePanel === 'topics' && renderTopicsSidebar()}
              {activePanel === 'notes' && renderNotesPanel()}
              {activePanel === 'materials' && (
                <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.panelSectionLabel, { color: theme.colors.textTertiary }]}>MATERIALS</Text>
                  {allMaterials.length === 0 ? (
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 13, fontStyle: 'italic' }}>No materials yet.</Text>
                  ) : allMaterials.map((mat, idx) => {
                    const isActive = selectedMaterial?.id === mat.id;
                    return (
                      <TouchableOpacity
                        key={mat.id || idx}
                        style={[styles.matListItem, {
                          borderColor: isActive ? theme.colors.primary + '66' : theme.colors.border,
                          backgroundColor: isActive ? theme.colors.primary + '15' : 'transparent',
                        }]}
                        onPress={() => { setSelectedMaterial(mat); setActivePanel(null); }}
                      >
                        <Icon name={getMaterialIcon(mat.type)} size={18} color={isActive ? theme.colors.primary : theme.colors.textSecondary} />
                        <Text style={{ flex: 1, color: isActive ? theme.colors.primary : theme.colors.textPrimary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                          {mat.title || mat.fileName || `Material ${idx + 1}`}
                        </Text>
                        {isActive && <Icon name="checkmark-circle" size={16} color={theme.colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* ── Bottom bar ───────────────────────────────────────────── */}
          {isMobile ? (
            <View style={[styles.mobileTabBar, { backgroundColor: isDark ? theme.colors.surface : '#1e293b', borderTopColor: 'rgba(255,255,255,0.1)' }]}>
              <TouchableOpacity style={styles.mobileTabItem} onPress={() => togglePanel('topics')}>
                <MaterialIcon name="book-open-variant" size={22} color={activePanel === 'topics' ? theme.colors.primary : 'rgba(255,255,255,0.45)'} />
                <Text style={[styles.mobileTabLabel, { color: activePanel === 'topics' ? theme.colors.primary : 'rgba(255,255,255,0.45)' }]}>Topics</Text>
              </TouchableOpacity>
              {/* Centre action button */}
              {!topicCompleted ? (
                <TouchableOpacity
                  style={[styles.mobileTabCenter, { backgroundColor: theme.colors.primary }]}
                  onPress={handleCompleteTopic}
                >
                  <Icon name="checkmark-done" size={24} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.mobileTabCenter, { backgroundColor: '#10B981' }]}
                  onPress={() => navigation.navigate('Quiz', { courseId, topicId })}
                >
                  <MaterialIcon name="help-circle" size={26} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.mobileTabItem} onPress={() => togglePanel('notes')}>
                <Icon name={activePanel === 'notes' ? 'document-text' : 'document-text-outline'} size={22} color={activePanel === 'notes' ? theme.colors.primary : 'rgba(255,255,255,0.45)'} />
                <Text style={[styles.mobileTabLabel, { color: activePanel === 'notes' ? theme.colors.primary : 'rgba(255,255,255,0.45)' }]}>Notes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.desktopBottomBar, { backgroundColor: isDark ? theme.colors.surface : '#1e293b', borderTopColor: 'rgba(255,255,255,0.08)' }]}>
              {!topicCompleted ? (
                <TouchableOpacity
                  style={[styles.bottomBarBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}
                  onPress={handleCompleteTopic}
                >
                  <Icon name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.bottomBarBtnText}>Complete Lecture</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.bottomBarBtn, { backgroundColor: '#10B981', flex: 1 }]}
                  onPress={() => navigation.navigate('Quiz', { courseId, topicId })}
                >
                  <MaterialIcon name="help-circle" size={20} color="#fff" />
                  <Text style={styles.bottomBarBtnText}>Take Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </MainLayout>
  );
};

const getMaterialIcon = type => {
  if (type === 'pdf') return 'document-text';
  if (type === 'image') return 'image';
  if (type === 'link') return 'link';
  return 'document';
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 15 },

  mainContent: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Icon rail
  iconRail: {
    width: 76,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    gap: 4,
    borderRightWidth: 1,
  },
  railBtn: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  railLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Sliding panel
  slidePanel: {
    width: 290,
    flexShrink: 0,
    overflow: 'hidden',
    borderRightWidth: 1,
  },
  panelContent: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  panelHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelTitle: { fontSize: 13, fontWeight: '700' },
  panelSubtitle: { fontSize: 11, marginTop: 1 },
  panelProgressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 6 },
  panelProgressLabel: { fontSize: 11 },
  panelProgressPct: { fontSize: 11, fontWeight: '700' },
  panelProgressBar: { height: 4, marginHorizontal: 14, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  panelProgressFill: { height: '100%', borderRadius: 2 },
  panelSectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },

  // Topic item
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  topicStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  topicItemTitle: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  topicProgressBar: { height: 3, borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  topicProgressFill: { height: '100%', borderRadius: 2 },

  // Notes panel
  notesEditor: {
    flex: 1,
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 120,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  notesSavedText: { flex: 1, fontSize: 11 },
  notesBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  notesBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Learning area
  learningArea: {
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'column',
  },

  // Mobile header
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    gap: 8,
  },
  mobileBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },

  // Desktop header
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  desktopBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },

  // Viewer section
  viewerSection: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  matHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
  },
  matHeaderTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  matOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  matOpenBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  matTabsContent: { gap: 4, paddingHorizontal: 4, alignItems: 'center' },
  matTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    maxWidth: 140,
  },
  matTabText: { fontSize: 10, fontWeight: '600' },
  viewerBody: {
    flex: 1,
    overflow: 'hidden',
  },
  viewerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  viewerEmptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  openExternalText: { fontSize: 13, fontWeight: '600' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Mobile inline panel
  mobilePanel: {
    height: 240,
    flexShrink: 0,
    borderTopWidth: 1,
    minHeight: 160,
    maxHeight: 260,
  },
  matListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },

  // Mobile tab bar
  mobileTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 74 : 56,
  },
  mobileTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
  },
  mobileTabLabel: { fontSize: 10, fontWeight: '600' },
  mobileTabCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Desktop bottom bar
  desktopBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  bottomBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    outline: 'none',
  },
  bottomBarBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default LearningScreen;
