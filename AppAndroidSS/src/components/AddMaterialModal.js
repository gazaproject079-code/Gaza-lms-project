import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';
import { useTheme } from '../context/ThemeContext';
import { API_BASE } from '../services/apiClient';

const AddMaterialModal = ({ visible, onClose, onAddMaterial }) => {
  const { theme, isDark } = useTheme();
  const [materialSource, setMaterialSource] = useState('file'); // 'file' | 'link'

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Link / YouTube state
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');

  const resetAll = () => {
    setSelectedFile(null);
    setFileUri('');
    setFileName('');
    setFileDescription('');
    setLinkTitle('');
    setLinkUrl('');
    setLinkDescription('');
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleSelectFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,image/png,image/jpeg,image/jpg,application/pdf';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
          if (!allowedTypes.includes(file.type)) {
            Alert.alert('Error', 'Please select a PDF or image file only.');
            return;
          }
          setFileName(file.name);
          setSelectedFile(file);
          setFileUri(URL.createObjectURL(file));
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Select File',
        'Please enter the file name or path manually. Actual file picker integration requires react-native-document-picker library.'
      );
    }
  };

  const handleAddFile = async () => {
    if (!selectedFile && !fileName) {
      Alert.alert('Error', 'Please select a file.');
      return;
    }

    if (Platform.OS === 'web' && selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`${API_BASE}/upload/file`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        let fileType = 'pdf';
        if (result.file.mimetype.startsWith('image/')) {
          fileType = 'image';
        }

        onAddMaterial({
          id: Date.now().toString(),
          type: fileType,
          uri: result.file.url,
          fileName: result.file.filename,
          description: fileDescription,
        });

        resetAll();
        onClose();
        Alert.alert('Success', 'File uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', error.message || 'Failed to upload file');
      } finally {
        setUploading(false);
      }
    } else {
      onAddMaterial({
        id: Date.now().toString(),
        type: 'pdf',
        uri: fileName,
        fileName: fileName,
        description: fileDescription,
      });
      resetAll();
      onClose();
    }
  };

  const isYouTubeUrl = (url) =>
    url.includes('youtube.com') || url.includes('youtu.be');

  const handleAddLink = () => {
    if (!linkTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for this link.');
      return;
    }
    if (!linkUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL.');
      return;
    }

    onAddMaterial({
      id: Date.now().toString(),
      type: 'link',
      uri: linkUrl.trim(),
      title: linkTitle.trim(),
      fileName: linkTitle.trim(),
      description: linkDescription,
      isYoutube: isYouTubeUrl(linkUrl),
    });

    resetAll();
    onClose();
  };

  const styles = getStyles(theme, isDark);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Add Material
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Source Toggle */}
          <View style={[styles.sourceToggle, { borderColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[
                styles.sourceTab,
                materialSource === 'file' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setMaterialSource('file')}
            >
              <Icon
                name="document-attach-outline"
                size={15}
                color={materialSource === 'file' ? '#fff' : theme.colors.textSecondary}
              />
              <Text style={[styles.sourceTabText, { color: materialSource === 'file' ? '#fff' : theme.colors.textSecondary }]}>
                Upload File
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sourceTab,
                materialSource === 'link' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setMaterialSource('link')}
            >
              <Icon
                name="logo-youtube"
                size={15}
                color={materialSource === 'link' ? '#fff' : theme.colors.textSecondary}
              />
              <Text style={[styles.sourceTabText, { color: materialSource === 'link' ? '#fff' : theme.colors.textSecondary }]}>
                Video / Link
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {materialSource === 'file' ? (
              <View>
                <AppButton
                  title="Select File (PDF / Image)"
                  onPress={handleSelectFile}
                  variant="outline"
                  fullWidth
                  leftIcon="cloud-upload-outline"
                  style={styles.selectFileButton}
                  disabled={uploading}
                />

                {!!fileName && (
                  <View style={[styles.infoRow, { backgroundColor: theme.colors.surface }]}>
                    <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
                    <Text style={[styles.infoRowText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {fileName}
                    </Text>
                  </View>
                )}

                {uploading && (
                  <View style={[styles.infoRow, { backgroundColor: theme.colors.surface }]}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.infoRowText, { color: theme.colors.textSecondary }]}>
                      Uploading...
                    </Text>
                  </View>
                )}

                <AppInput
                  label="File Name (for mobile / manual entry)"
                  value={fileName}
                  onChangeText={setFileName}
                  placeholder="e.g., introduction.pdf"
                  editable={!uploading}
                />
                <AppInput
                  label="Description (Optional)"
                  value={fileDescription}
                  onChangeText={setFileDescription}
                  placeholder="Brief description of the material"
                  multiline
                  numberOfLines={2}
                  editable={!uploading}
                />

                <View style={styles.buttonRow}>
                  <AppButton title="Cancel" onPress={handleClose} variant="outline" style={styles.halfBtn} disabled={uploading} />
                  <AppButton
                    title={uploading ? 'Uploading...' : 'Add Material'}
                    onPress={handleAddFile}
                    variant="primary"
                    style={styles.halfBtn}
                    disabled={uploading}
                  />
                </View>
              </View>
            ) : (
              <View>
                {/* Hint */}
                <View style={[styles.linkHint, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '30' }]}>
                  <Icon name="logo-youtube" size={20} color="#FF0000" />
                  <Text style={[styles.linkHintText, { color: theme.colors.textSecondary }]}>
                    Paste a YouTube URL, Google Drive link, or any video/article URL. Students will see a clickable link.
                  </Text>
                </View>

                <AppInput
                  label="Title *"
                  value={linkTitle}
                  onChangeText={setLinkTitle}
                  placeholder="e.g., Introduction Video"
                />
                <AppInput
                  label="URL *"
                  value={linkUrl}
                  onChangeText={setLinkUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <AppInput
                  label="Description (Optional)"
                  value={linkDescription}
                  onChangeText={setLinkDescription}
                  placeholder="What will students learn from this?"
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.buttonRow}>
                  <AppButton title="Cancel" onPress={handleClose} variant="outline" style={styles.halfBtn} />
                  <AppButton title="Add Link" onPress={handleAddLink} variant="primary" style={styles.halfBtn} leftIcon="link" />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme, isDark) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
      width: '90%',
      maxWidth: 440,
      borderRadius: 16,
      padding: 20,
      maxHeight: '88%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
    },
    closeBtn: {
      padding: 4,
    },
    sourceToggle: {
      flexDirection: 'row',
      borderRadius: 10,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: 16,
    },
    sourceTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 6,
    },
    sourceTabText: {
      fontSize: 13,
      fontWeight: '600',
    },
    selectFileButton: {
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
      gap: 8,
    },
    infoRowText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
      paddingBottom: 4,
    },
    halfBtn: {
      flex: 1,
    },
    linkHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
      marginBottom: 14,
      gap: 10,
    },
    linkHintText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
  });

export default AddMaterialModal;
