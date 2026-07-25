import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const AnimatedInput = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default', 
  placeholder, 
  multiline = false,
  numberOfLines = 1,
  ...props 
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Label as separate Text component above input - never overlaps */}
      {label && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: '#F5F5F7',
            borderColor: isFocused ? theme.colors.primary : '#E5E7EB',
            color: theme.colors.text,
            cursorColor: theme.colors.primary,
          },
          multiline && styles.multilineInput,
          isFocused && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholder={placeholder || ''}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    minHeight: 48,
  },
  inputFocused: {
    borderWidth: 2,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default AnimatedInput;
