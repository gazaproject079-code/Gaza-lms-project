import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export const toastConfig = (theme) => ({
  success: ({ text1, text2 }) => (
    <View style={[styles.container, {
      backgroundColor: theme.colors.card,
      borderLeftColor: theme.colors.success,
      shadowColor: theme.colors.shadow,
    }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.successLight }]}>
        <Icon name="checkmark-circle" size={24} color={theme.colors.success} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View style={[styles.container, {
      backgroundColor: theme.colors.card,
      borderLeftColor: theme.colors.error,
      shadowColor: theme.colors.shadow,
    }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorLight }]}>
        <Icon name="close-circle" size={24} color={theme.colors.error} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }) => (
    <View style={[styles.container, {
      backgroundColor: theme.colors.card,
      borderLeftColor: theme.colors.info,
      shadowColor: theme.colors.shadow,
    }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.infoLight }]}>
        <Icon name="information-circle" size={24} color={theme.colors.info} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  warning: ({ text1, text2 }) => (
    <View style={[styles.container, {
      backgroundColor: theme.colors.card,
      borderLeftColor: theme.colors.warning,
      shadowColor: theme.colors.shadow,
    }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.warningLight }]}>
        <Icon name="warning" size={24} color={theme.colors.warning} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
});

const styles = StyleSheet.create({
  container: {
    width: '90%',
    maxWidth: 500,
    minHeight: 60,
    marginHorizontal: '5%',
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
