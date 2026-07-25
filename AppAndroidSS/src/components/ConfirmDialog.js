import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from './ui/AppButton';
import { useTheme } from '../context/ThemeContext';

// Section 19 - Modals & Overlays
// Section 27 - Global Glassmorphism

const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  size = 'small', // small: 400px, medium: 560px, large: 720px
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  // Modal sizes (Section 19.1)
  const sizeConfig = {
    small: 400,
    medium: 560,
    large: 720,
  };

  const maxWidth = sizeConfig[size] || sizeConfig.small;

  // Glassmorphism styles — full effect in both dark and light modes (Section 27.2)
  const getDialogStyle = () => {
    const baseStyle = {
      width: '100%',
      maxWidth,
      borderRadius: 24,
      borderWidth: 1,
    };

    if (isWeb) {
      return {
        ...baseStyle,
        backgroundColor: isDark ? 'rgba(15,15,30,0.92)' : 'rgba(255,255,255,0.95)',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: isDark ? 0.5 : 0.15,
        shadowRadius: 40,
      };
    }

    // Native (mobile)
    return {
      ...baseStyle,
      backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    };
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={[styles.overlay, {
          backgroundColor: 'rgba(0,0,0,0.6)',
          ...(isWeb ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
        }]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          style={[
            styles.dialog,
            getDialogStyle(),
          ]}
          activeOpacity={1}
        >
          {/* Close icon top-right (Section 19.2) */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Icon
              name="close"
              size={24}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: confirmVariant === 'danger'
                  ? theme.colors.errorLight
                  : theme.colors.warningLight,
              }
            ]}>
              <Icon
                name="alert-circle"
                size={32}
                color={confirmVariant === 'danger' ? theme.colors.error : theme.colors.warning}
              />
            </View>
            <Text style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              }
            ]}>
              {title}
            </Text>
          </View>

          <Text style={[
            styles.message,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.regular,
            }
          ]}>
            {message}
          </Text>

          <View style={styles.buttons}>
            <AppButton
              title={cancelText}
              onPress={onCancel}
              variant="outline"
              size="md"
              style={styles.button}
            />
            <AppButton
              title={confirmText}
              onPress={onConfirm}
              variant={confirmVariant}
              size="md"
              style={styles.button}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24, // Section spacing
  },
  dialog: {
    padding: 24,      // Section 19.2: Padding 24px
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18, // Section Title: 18px
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21, // 1.5x line height
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default ConfirmDialog;
