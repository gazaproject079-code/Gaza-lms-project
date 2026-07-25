import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

// Section 10 - Form Elements
// Search input with icon, clear button, and optional filters

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
  onClear,
  onFilterPress,
  showFilter = false,
  autoFocus = false,
  style,
  inputStyle,
  size = 'md', // sm, md, lg
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Size configurations
  const sizeConfig = {
    sm: { height: 36, fontSize: 13, iconSize: 18, padding: 10 },
    md: { height: 44, fontSize: 14, iconSize: 20, padding: 12 }, // Section 10.1: Input height 44px
    lg: { height: 52, fontSize: 16, iconSize: 22, padding: 14 },
  };

  const config = sizeConfig[size];

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  const styles = getStyles(theme, isDark, config, isFocused, isWeb);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {/* Search Icon */}
      <Icon
        name="search"
        size={config.iconSize}
        color={isFocused ? '#FF8C42' : theme.colors.textTertiary}
        style={styles.searchIcon}
      />

      {/* Input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            fontSize: config.fontSize,
          },
          inputStyle,
        ]}
      />

      {/* Clear Button */}
      {value?.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <Icon
            name="close-circle"
            size={config.iconSize}
            color={theme.colors.textTertiary}
          />
        </TouchableOpacity>
      )}

      {/* Filter Button */}
      {showFilter && (
        <TouchableOpacity
          onPress={onFilterPress}
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <Icon
            name="options"
            size={config.iconSize}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const getStyles = (theme, isDark, config, isFocused, isWeb) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: config.height,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(26,26,46,0.04)',
      borderRadius: 12, // Section 10.1: Border radius 12px
      borderWidth: isFocused ? 2 : 1,
      borderColor: isFocused
        ? '#FF8C42'
        : isDark
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(26,26,46,0.10)',
      paddingHorizontal: config.padding,
      ...(isWeb && {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 200ms ease',
      }),
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: '100%',
      paddingVertical: 0,
      fontFamily: theme.typography.fontFamily.regular,
      ...(isWeb && {
        outlineStyle: 'none',
      }),
    },
    clearButton: {
      padding: 4,
      marginLeft: 4,
      borderRadius: 12,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(26,26,46,0.05)',
    },
    filterButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(26,26,46,0.06)',
    },
  });

export default SearchBar;
