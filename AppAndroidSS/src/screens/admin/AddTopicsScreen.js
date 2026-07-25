import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ScrollView,
  Modal,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import AddMaterialModal from '../../components/AddMaterialModal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const GREEN = '#007A3D';
const RED = '#CE1126';
const TOPIC_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#06B6D4', '#EF4444', '#F59E0B'];

const AddTopicsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params;
  const { courses, addTopic, updateTopic, deleteTopic, fetchCourses } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const course = courses.find((item) => item.id === courseId);
  const topics = course?.topics || [];
  const isSuperAdmin = user?.role === 'superadmin';
  const isTablet = width > 768;
  const isMobile = width <= 480;
  const isOwner = course?.user?.id === user?.id;
  const canManageAllCourses = user?.permissions?.canManageAllCourses === true;
  const canAddTopics = isOwner || isSuperAdmin || canManageAllCourses;

  const [topicTitle, setTopicTitle] = useState('');
  const [topicMaterials, setTopicMaterials] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedTopicMaterials, setSelectedTopicMaterials] = useState(null);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);

  const [topicType, setTopicType] = useState('recorded');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const sidebarItems = isSuperAdmin ? [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Manage Instructors', icon: 'person-outline', iconActive: 'person', route: 'ManageAdmins' },
    { label: 'All Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
    { label: 'All Students', icon: 'school-outline', iconActive: 'school', route: 'Students' },
    { label: 'Categories', icon: 'layers-outline', iconActive: 'layers', route: 'Categories' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
  ] : [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Skill Categories', icon: 'layers-outline', iconActive: 'layers', route: 'CategoryManagement' },
    { label: 'Manage Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
    { label: 'Students', icon: 'people-outline', iconActive: 'people', route: 'Students' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
    { label: 'Course Feedback', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Feedback' },
  ];

  const stats = useMemo(() => ({
    totalTopics: topics.length,
    totalMaterials: topics.reduce((sum, item) => sum + (item.materials?.length || 0), 0),
    completedTopics: topics.filter((item) => item.status === 'completed').length,
  }), [topics]);

  const handleNavigate = (navRoute) => {
    if (!isSuperAdmin) {
      navigation.navigate(navRoute);
      return;
    }
    if (navRoute === 'ManageAdmins') {
      navigation.navigate('ManageUsers', { userType: 'instructor' });
      return;
    }
    if (navRoute === 'ManageExperts') {
      navigation.navigate('ManageUsers', { userType: 'expert' });
      return;
    }
    if (navRoute === 'Categories') {
      navigation.navigate('CategoryManagement');
      return;
    }
    navigation.navigate(navRoute);
  };

  const normalizeQuizQuestions = (rawQuestions) => {
    if (Array.isArray(rawQuestions)) return rawQuestions;
    if (typeof rawQuestions !== 'string') return [];
    try {
      const parsed = JSON.parse(rawQuestions);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  };

  const resetModal = () => {
    setTopicTitle('');
    setTopicMaterials([]);
    setQuizQuestions([]);
    setEditingTopic(null);
    setTopicType('recorded');
    setVideoUrl('');
    setVideoDuration('');
    setScheduledTime('');
    setMeetingLink('');
    setShowAddModal(false);
  };

  const handleOpenAddModal = () => {
    setTopicTitle('');
    setTopicMaterials([]);
    setQuizQuestions([]);
    setEditingTopic(null);
    setTopicType('recorded');
    setVideoUrl('');
    setVideoDuration('');
    setScheduledTime('');
    setMeetingLink('');
    setShowAddModal(true);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setTopicTitle(topic.title);
    setTopicMaterials(topic.materials || []);
    setTopicType(topic.topicType || 'recorded');
    if (topic.recording) {
      setVideoUrl(topic.recording.videoUrl || '');
      setVideoDuration(topic.recording.duration || '');
    } else {
      setVideoUrl('');
      setVideoDuration('');
    }
    if (topic.liveLecture) {
      const liveTime = topic.liveLecture.scheduledTime
        ? new Date(topic.liveLecture.scheduledTime).toISOString().slice(0, 16).replace('T', ' ')
        : '';
      setScheduledTime(liveTime);
      setMeetingLink(topic.liveLecture.meetingLink || '');
    } else {
      setScheduledTime('');
      setMeetingLink('');
    }
    setQuizQuestions(
      normalizeQuizQuestions(topic.quizzes?.[0]?.questions).map((question, index) => ({
        id: question.id?.toString() || `${topic.id}-${index + 1}`,
        question: question.question || question.prompt || '',
        options: Array.isArray(question.options) ? question.options : ['', '', '', ''],
        correctAnswer: Number.isInteger(question.correctAnswer) ? question.correctAnswer : 0,
      }))
    );
    setShowAddModal(true);
  };

  const handleAddQuestion = () => {
    setQuizQuestions((prev) => [...prev, { id: Date.now().toString(), question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const handleSaveTopic = async () => {
    if (!topicTitle.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a topic title' });
      return;
    }

    const activeTopicType = (course?.deliveryMode === 'recorded' || course?.deliveryMode === 'live')
      ? course.deliveryMode
      : topicType;

    if (activeTopicType === 'live') {
      if (!scheduledTime.trim()) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a scheduled time' });
        return;
      }
      if (!meetingLink.trim()) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a meeting link' });
        return;
      }
    } else if (activeTopicType === 'recorded') {
      if (!videoUrl.trim()) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a video URL' });
        return;
      }
    }

    if (quizQuestions.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please add at least one quiz question' });
      return;
    }

    for (const question of quizQuestions) {
      if (!question.question.trim()) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Each question needs text' });
        return;
      }
      if (question.options.some((option) => !option.trim())) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Fill in every answer option' });
        return;
      }
    }

    const payload = {
      title: topicTitle.trim(),
      topicType: activeTopicType,
      liveLecture: activeTopicType === 'live' ? { scheduledTime, meetingLink } : null,
      recording: activeTopicType === 'recorded' && videoUrl ? { videoUrl, duration: videoDuration } : null,
      materials: topicMaterials.map((item) => ({
        type: item.type,
        uri: item.uri,
        title: item.fileName || item.uri,
        description: item.description || '',
      })),
      questions: quizQuestions.map((item, index) => ({
        id: item.id || `${index + 1}`,
        question: item.question.trim(),
        prompt: item.question.trim(),
        options: item.options.map((option) => option.trim()),
        correctAnswer: item.correctAnswer,
      })),
    };

    const result = editingTopic
      ? await updateTopic(editingTopic.id, payload)
      : await addTopic({ courseId, ...payload });

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to save topic' });
      return;
    }

    await fetchCourses();
    resetModal();
    Toast.show({ type: 'success', text1: 'Success', text2: editingTopic ? 'Topic updated successfully' : 'Topic added successfully' });
  };

  const confirmDeleteTopic = async () => {
    setShowDeleteDialog(false);
    if (!topicToDelete) return;
    const result = await deleteTopic(topicToDelete.id);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to delete topic' });
      return;
    }
    setTopicToDelete(null);
    await fetchCourses();
    Toast.show({ type: 'success', text1: 'Success', text2: 'Topic deleted successfully' });
  };

  const handleOpenMaterial = (material) => {
    const fileUrl = resolveFileUrl(material.uri);
    if (Platform.OS === 'web') {
      window.open(fileUrl, '_blank');
      return;
    }
    Linking.openURL(fileUrl);
  };

  const styles = getStyles(theme, isDark, isTablet, isMobile);

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Courses"
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: isSuperAdmin ? 'Admin' : 'Instructor', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.bannerIcon}>
            <Icon name="list" size={22} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Add Topics</Text>
            <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
              Manual lecture delivery with uploaded resources and custom quizzes
            </Text>
          </View>
          {canAddTopics ? (
            <TouchableOpacity style={styles.bannerAction} onPress={handleOpenAddModal}>
              <Icon name="add" size={18} color="#fff" />
              <Text style={styles.bannerActionText}>Add Topic</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#007A3D' }]}>{stats.totalTopics}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Topics</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#06B6D4' }]}>{stats.totalMaterials}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Materials</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completedTopics}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
          <Icon name="videocam" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            Add YouTube links, PDFs, images, and other files for each topic. Students will move through topics in order.
          </Text>
        </View>

        {topics.length > 0 ? (
          <View style={styles.topicsGrid}>
            {topics.map((topic, index) => {
              const color = TOPIC_COLORS[index % TOPIC_COLORS.length];
              return (
                <Animated.View key={topic.id} entering={FadeInDown.duration(400).delay(index * 80)} style={styles.topicCardWrapper}>
                  <View style={[styles.topicCard, { borderLeftColor: color }]}>
                    <View style={styles.topicCardHeader}>
                      <View style={[styles.topicNumberBox, { backgroundColor: color + '18' }]}>
                        <Text style={[styles.topicNumber, { color }]}>{String(index + 1).padStart(2, '0')}</Text>
                      </View>
                      {canAddTopics ? (
                        <View style={styles.cardActions}>
                          <TouchableOpacity style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '15' }]} onPress={() => handleEditTopic(topic)}>
                            <Icon name="create-outline" size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionIcon, { backgroundColor: theme.colors.error + '15' }]}
                            onPress={() => {
                              setTopicToDelete(topic);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Icon name="trash-outline" size={16} color={theme.colors.error} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.topicTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>{topic.title}</Text>

                    <View style={styles.topicMeta}>
                      <StatusBadge status={topic.status || 'pending'} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                        <Icon 
                          name={topic.topicType === 'live' ? 'videocam' : 'play-circle'} 
                          size={14} 
                          color={topic.topicType === 'live' ? '#E11D48' : '#10B981'} 
                        />
                        <Text style={{ 
                          fontSize: 12, 
                          fontWeight: '600', 
                          marginLeft: 4, 
                          color: topic.topicType === 'live' ? '#E11D48' : '#10B981' 
                        }}>
                          {topic.topicType === 'live' ? 'Live' : 'Recorded'}
                        </Text>
                      </View>
                      <Text style={[styles.materialCount, { color: theme.colors.textSecondary, marginLeft: 'auto' }]}>{topic.materials?.length || 0} materials</Text>
                    </View>

                    {(topic.materials?.length || 0) > 0 ? (
                      <TouchableOpacity
                        style={[styles.viewButton, { backgroundColor: color + '10', borderColor: color + '30' }]}
                        onPress={() => {
                          setSelectedTopicMaterials({ title: topic.title, materials: topic.materials || [] });
                          setShowMaterialsModal(true);
                        }}
                      >
                        <Icon name="folder-open-outline" size={16} color={color} />
                        <Text style={[styles.viewButtonText, { color }]}>View Materials</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="list-outline"
              title="No topics yet"
              subtitle="Add your first topic to start building this course."
              actionLabel={canAddTopics ? 'Add Topic' : undefined}
              onAction={canAddTopics ? handleOpenAddModal : undefined}
            />
          </View>
        )}

        {topics.length > 0 && canAddTopics ? (
          <AppButton
            title="Finish - Go to Courses"
            onPress={() => navigation.navigate('Courses')}
            variant="primary"
            style={styles.finishButton}
            leftIcon="checkmark-done"
          />
        ) : null}
      </ScrollView>

      <Modal visible={showAddModal} transparent={true} animationType="fade" onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{editingTopic ? 'Edit Topic' : 'Add Topic'}</Text>
              <TouchableOpacity onPress={resetModal}>
                <Icon name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              <AppInput label="Topic Title *" value={topicTitle} onChangeText={setTopicTitle} placeholder="Enter topic title" />

              {course?.deliveryMode === 'topic-wise' && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.chipLabel, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Topic Format</Text>
                  <View style={[styles.chipsRow, { marginBottom: 12, flexDirection: 'row' }]}>
                    {[
                      { label: 'Recorded Lecture', value: 'recorded' },
                      { label: 'Live Lecture', value: 'live' }
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.chip,
                          {
                            borderColor: topicType === item.value ? GREEN : theme.colors.border,
                            backgroundColor: topicType === item.value ? GREEN : theme.colors.surface,
                            marginRight: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 6,
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => setTopicType(item.value)}
                      >
                        <Text style={{ color: topicType === item.value ? '#fff' : theme.colors.textSecondary }}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {((course?.deliveryMode === 'topic-wise' && topicType === 'recorded') || course?.deliveryMode === 'recorded' || !course?.deliveryMode) && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 10 }]}>Recording Details</Text>
                  <AppInput
                    label="Video URL (YouTube / Drive)"
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                  />
                  <AppInput
                    label="Video Duration"
                    value={videoDuration}
                    onChangeText={setVideoDuration}
                    placeholder="e.g. 45 mins"
                  />
                </View>
              )}

              {((course?.deliveryMode === 'topic-wise' && topicType === 'live') || course?.deliveryMode === 'live') && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 10 }]}>Live Lecture Schedule</Text>
                  <AppInput
                    label="Scheduled Time *"
                    value={scheduledTime}
                    onChangeText={setScheduledTime}
                    placeholder="YYYY-MM-DD HH:MM (e.g. 2026-07-15 15:00)"
                  />
                  <AppInput
                    label="Meeting Link *"
                    value={meetingLink}
                    onChangeText={setMeetingLink}
                    placeholder="e.g. Google Meet or Zoom link"
                  />
                </View>
              )}

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Materials ({topicMaterials.length})</Text>
                  <TouchableOpacity style={styles.addInlineButton} onPress={() => setShowAddMaterialModal(true)}>
                    <Icon name="add" size={16} color={GREEN} />
                    <Text style={{ color: GREEN, fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                </View>

                {topicMaterials.map((item) => (
                  <View key={item.id} style={styles.inlineRow}>
                    <Text numberOfLines={1} style={[styles.inlineText, { color: theme.colors.textPrimary }]}>{item.fileName || item.uri}</Text>
                    <TouchableOpacity onPress={() => setTopicMaterials((prev) => prev.filter((material) => material.id !== item.id))}>
                      <Icon name="close-circle" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Quiz Questions</Text>
                  <TouchableOpacity style={styles.addInlineButton} onPress={handleAddQuestion}>
                    <Icon name="add" size={16} color={GREEN} />
                    <Text style={{ color: GREEN, fontWeight: '700' }}>Question</Text>
                  </TouchableOpacity>
                </View>

                {quizQuestions.map((question, questionIndex) => (
                  <View key={question.id} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <Text style={[styles.questionTitle, { color: theme.colors.textPrimary }]}>Question {questionIndex + 1}</Text>
                      <TouchableOpacity onPress={() => setQuizQuestions((prev) => prev.filter((item) => item.id !== question.id))}>
                        <Icon name="trash-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>

                    <AppInput
                      label="Question"
                      value={question.question}
                      onChangeText={(value) => setQuizQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, question: value } : item))}
                      placeholder="Enter question text"
                    />

                    {question.options.map((option, optionIndex) => (
                      <View key={`${question.id}-${optionIndex}`} style={styles.optionRow}>
                        <TouchableOpacity
                          style={[
                            styles.optionMarker,
                            {
                              borderColor: question.correctAnswer === optionIndex ? GREEN : theme.colors.border,
                              backgroundColor: question.correctAnswer === optionIndex ? GREEN : theme.colors.surface,
                            },
                          ]}
                          onPress={() => setQuizQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, correctAnswer: optionIndex } : item))}
                        >
                          <Text style={{ color: question.correctAnswer === optionIndex ? '#fff' : theme.colors.textSecondary, fontWeight: '700' }}>
                            {String.fromCharCode(65 + optionIndex)}
                          </Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <AppInput
                            label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                            value={option}
                            onChangeText={(value) => setQuizQuestions((prev) => prev.map((item) => {
                              if (item.id !== question.id) return item;
                              const nextOptions = [...item.options];
                              nextOptions[optionIndex] = value;
                              return { ...item, options: nextOptions };
                            }))}
                            placeholder="Enter answer option"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton title="Cancel" onPress={resetModal} variant="outline" style={{ flex: 1 }} />
              <AppButton title={editingTopic ? 'Update Topic' : 'Save Topic'} onPress={handleSaveTopic} variant="primary" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMaterialsModal} transparent={true} animationType="fade" onRequestClose={() => setShowMaterialsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Topic Materials</Text>
              <TouchableOpacity onPress={() => setShowMaterialsModal(false)}>
                <Icon name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>{selectedTopicMaterials?.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectedTopicMaterials?.materials || []).map((material, index) => (
                <TouchableOpacity key={`${material.uri}-${index}`} style={styles.inlineRow} onPress={() => handleOpenMaterial(material)}>
                  <Text numberOfLines={1} style={[styles.inlineText, { color: theme.colors.textPrimary }]}>
                    {material.title || material.fileName || 'Material'}
                  </Text>
                  <Icon name="open-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AddMaterialModal visible={showAddMaterialModal} onClose={() => setShowAddMaterialModal(false)} onAddMaterial={(material) => setTopicMaterials((prev) => [...prev, material])} />

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Topic"
        message={`Are you sure you want to delete "${topicToDelete?.title}"?`}
        confirmText="Delete"
        onConfirm={confirmDeleteTopic}
        onCancel={() => {
          setShowDeleteDialog(false);
          setTopicToDelete(null);
        }}
      />
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isTablet, isMobile) => StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: isMobile ? 16 : 24, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 24, backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)', borderColor: 'rgba(0,122,61,0.15)' },
  backButton: { padding: 10, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)' },
  bannerIcon: { backgroundColor: GREEN + '20', borderRadius: 12, padding: 12 },
  bannerTitle: { fontSize: 20, fontWeight: '800' },
  bannerSubtitle: { fontSize: 13, marginTop: 2 },
  bannerAction: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, outline: 'none' },
  bannerActionText: { color: '#fff', fontWeight: '700' },
  statsRow: { flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 20 },
  statCard: { flex: 1, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff', alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 6 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 22 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  topicCardWrapper: { width: isTablet ? (Platform.OS === 'web' ? 'calc(50% - 8px)' : '48%') : '100%' },
  topicCard: { padding: 18, borderRadius: 16, borderWidth: 1, borderLeftWidth: 3, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff', minHeight: 210 },
  topicCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  topicNumberBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  topicNumber: { fontSize: 26, fontWeight: '800' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  topicTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  topicMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14, alignItems: 'center' },
  materialCount: { fontSize: 12, fontWeight: '600' },
  viewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, marginTop: 'auto' },
  viewButtonText: { fontSize: 13, fontWeight: '700' },
  emptyContainer: { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff', borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)', padding: 24 },
  finishButton: { marginTop: 24 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalContent: { width: '100%', maxWidth: 620, maxHeight: '88%', padding: 24, borderRadius: 20, backgroundColor: isDark ? 'rgba(15,15,30,0.96)' : '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 13, marginBottom: 12 },
  sectionBlock: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  addInlineButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.background, marginBottom: 10 },
  inlineText: { flex: 1, fontSize: 13 },
  questionCard: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.background, marginBottom: 14 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionTitle: { fontSize: 14, fontWeight: '700' },
  optionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  optionMarker: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
});

export default AddTopicsScreen;
