import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import SearchableDropdown from '../../components/ui/SearchableDropdown';
import AddMaterialModal from '../../components/AddMaterialModal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { uploadAPI } from '../../services/apiClient';
import { resolveFileUrl } from '../../utils/urlHelpers';

const GREEN = '#007A3D';
const RED = '#CE1126';

const CreateCourseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, courseData } = route.params || {};
  const { addCourse, updateCourse, categories } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isEditMode = !!courseId;
  const isTablet = width > 768;
  const isMobile = width <= 480;
  const isSuperAdmin = user?.role === 'superadmin';

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

  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [language, setLanguage] = useState('English');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [duration, setDuration] = useState('');
  const [materials, setMaterials] = useState([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('recorded');

  const categoryNames = categories.map((cat) => cat.name);
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const languages = ['English', 'Urdu'];
  const deliveryModes = [
    { label: 'Recorded (Whole)', value: 'recorded' },
    { label: 'Live (Whole)', value: 'live' },
    { label: 'Topic-wise Mixed', value: 'topic-wise' }
  ];

  useEffect(() => {
    if (!isEditMode || !courseData) {
      return;
    }

    setCourseName(courseData.name || '');
    setDescription(courseData.description || '');
    setLevel(courseData.level || 'Beginner');
    setLanguage(courseData.language || 'English');
    setCategory(courseData.category?.name || categories[0]?.name || '');
    setDuration(courseData.duration || '');
    setThumbnailImage(courseData.thumbnailImage || null);
    setMaterials(courseData.materials || []);
    setDeliveryMode(courseData.deliveryMode || 'recorded');
  }, [categories, courseData, isEditMode]);

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

  const handleAddMaterial = (newMaterial) => {
    setMaterials((prev) => [...prev, newMaterial]);
  };

  const handleRemoveMaterial = (id) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadThumbnail = async (file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadAPI.uploadFile(formData);
      if (!response.success) {
        throw new Error(response.error || 'Upload failed');
      }
      setThumbnailImage(response.file.url);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Thumbnail uploaded' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to upload thumbnail' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImagePick = async () => {
    if (Platform.OS !== 'web') {
      Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Image upload on mobile is not available yet.' });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (file) {
        await uploadThumbnail(file);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!courseName || !description || !category || !duration) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all required fields' });
      return;
    }

    const selectedCategory = categories.find((cat) => cat.name === category);
    if (!selectedCategory) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Invalid category selected' });
      return;
    }

    const payload = {
      name: courseName,
      description,
      level,
      language,
      categoryId: selectedCategory.id,
      duration,
      creationMode: 'manual',
      thumbnailImage,
      deliveryMode,
      materials: materials.map((item) => ({
        type: item.type,
        uri: item.uri,
        title: item.fileName || item.uri,
        description: item.description || '',
      })),
    };

    const result = isEditMode
      ? await updateCourse(courseId, payload)
      : await addCourse(payload);

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to save course' });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: isEditMode ? 'Course updated' : 'Course created',
    });

    if (isEditMode) {
      navigation.goBack();
      return;
    }

    navigation.navigate('AddTopics', { courseId: result.course.id });
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
            <Icon name="create" size={22} color={GREEN} />
          </View>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>
              {isEditMode ? 'Edit Course' : 'Create New Course'}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
              Manual lecture delivery with uploaded learning materials
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.mainColumn}>
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Details</Text>
              <AppInput label="Course Name *" value={courseName} onChangeText={setCourseName} placeholder="Enter course name" />
              <AppInput
                label="Description *"
                value={description}
                onChangeText={setDescription}
                placeholder="Enter course description"
                multiline={true}
                numberOfLines={4}
              />
              <SearchableDropdown
                label="Category *"
                options={categoryNames}
                selectedValue={category}
                onSelect={setCategory}
                placeholder="Select a category"
              />
              <AppInput label="Duration *" value={duration} onChangeText={setDuration} placeholder="e.g. 4 weeks" />
            </View>

            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Settings</Text>
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                All courses now use manual topics, uploaded resources, and teacher-defined quizzes.
              </Text>

              <Text style={[styles.chipLabel, { color: theme.colors.textSecondary }]}>Level</Text>
              <View style={styles.chipsRow}>
                {levels.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      {
                        borderColor: level === item ? GREEN : theme.colors.border,
                        backgroundColor: level === item ? GREEN : theme.colors.surface,
                      },
                    ]}
                    onPress={() => setLevel(item)}
                  >
                    <Text style={{ color: level === item ? '#fff' : theme.colors.textSecondary }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.chipLabel, { color: theme.colors.textSecondary }]}>Language</Text>
              <View style={styles.chipsRow}>
                {languages.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      {
                        borderColor: language === item ? GREEN : theme.colors.border,
                        backgroundColor: language === item ? GREEN : theme.colors.surface,
                      },
                    ]}
                    onPress={() => setLanguage(item)}
                  >
                    <Text style={{ color: language === item ? '#fff' : theme.colors.textSecondary }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.chipLabel, { color: theme.colors.textSecondary }]}>Delivery Mode</Text>
              <View style={styles.chipsRow}>
                {deliveryModes.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      {
                        borderColor: deliveryMode === item.value ? GREEN : theme.colors.border,
                        backgroundColor: deliveryMode === item.value ? GREEN : theme.colors.surface,
                      },
                    ]}
                    onPress={() => setDeliveryMode(item.value)}
                  >
                    <Text style={{ color: deliveryMode === item.value ? '#fff' : theme.colors.textSecondary }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.sideColumn}>
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Format</Text>
              <View style={styles.formatBox}>
                <View style={styles.formatIcon}>
                  <Icon name="videocam" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formatTitle, { color: theme.colors.textPrimary }]}>Manual Lecture Delivery</Text>
                  <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                    Add topic resources yourself using links, PDFs, files, and images.
                  </Text>
                </View>
                <Icon name="checkmark-circle" size={22} color={GREEN} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Thumbnail</Text>
              {thumbnailImage ? (
                <View style={styles.thumbnailWrap}>
                  <Image source={{ uri: resolveFileUrl(thumbnailImage) }} style={styles.thumbnail} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeThumb} onPress={() => setThumbnailImage(null)}>
                    <Icon name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.thumbnailPlaceholder} onPress={handleImagePick} disabled={uploadingImage}>
                  <Icon name="camera-outline" size={30} color={GREEN} />
                  <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>
                    {uploadingImage ? 'Uploading...' : 'Upload course thumbnail'}
                  </Text>
                  <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>PNG or JPG up to 5MB</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.materialHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Materials</Text>
                <TouchableOpacity style={styles.addMaterialButton} onPress={() => setShowAddMaterialModal(true)}>
                  <Icon name="add" size={18} color={GREEN} />
                </TouchableOpacity>
              </View>

              {materials.length === 0 ? (
                <View style={styles.emptyMaterials}>
                  <Icon name="folder-open-outline" size={28} color={theme.colors.textTertiary} />
                  <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>No course-level materials added yet.</Text>
                </View>
              ) : (
                <View style={styles.materialsList}>
                  {materials.map((item) => (
                    <View key={item.id} style={styles.materialRow}>
                      <Text numberOfLines={1} style={[styles.materialName, { color: theme.colors.textPrimary }]}>
                        {item.fileName || item.uri}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveMaterial(item.id)}>
                        <Icon name="close-circle" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.actions}>
          <AppButton title="Cancel" onPress={() => navigation.goBack()} variant="outline" style={styles.actionButton} />
          <AppButton
            title={isEditMode ? 'Update Course' : 'Create Course'}
            onPress={handleSubmit}
            variant="primary"
            style={styles.actionButton}
            leftIcon={isEditMode ? 'save-outline' : 'checkmark'}
          />
        </Animated.View>
      </ScrollView>

      <AddMaterialModal
        visible={showAddMaterialModal}
        onClose={() => setShowAddMaterialModal(false)}
        onAddMaterial={handleAddMaterial}
      />
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isTablet, isMobile) => StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: isMobile ? 16 : 24, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
    borderColor: 'rgba(0,122,61,0.15)',
  },
  backButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
  },
  bannerIcon: { backgroundColor: GREEN + '20', borderRadius: 12, padding: 12 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '800' },
  bannerSubtitle: { fontSize: 13, marginTop: 2 },
  grid: { flexDirection: isTablet ? 'row' : 'column', gap: 20 },
  mainColumn: { flex: 2, gap: 20 },
  sideColumn: { flex: 1, gap: 20 },
  card: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
    padding: isMobile ? 16 : 20,
    gap: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  helperText: { fontSize: 13, lineHeight: 20 },
  chipLabel: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  formatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: GREEN + '10',
  },
  formatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  thumbnailWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  thumbnail: { width: '100%', height: 180 },
  removeThumb: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    minHeight: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: GREEN + '50',
    backgroundColor: GREEN + '08',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  placeholderTitle: { fontSize: 14, fontWeight: '700' },
  materialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addMaterialButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GREEN + '40',
    backgroundColor: GREEN + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMaterials: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  materialsList: { gap: 10 },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.background,
  },
  materialName: { flex: 1, fontSize: 13 },
  actions: {
    flexDirection: isMobile ? 'column-reverse' : 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
  },
  actionButton: { minWidth: isMobile ? '100%' : 160 },
});

export default CreateCourseScreen;
