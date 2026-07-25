import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput, SafeAreaView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const SearchableDropdown = ({ options, selectedValue, onSelect, placeholder, label }) => {
  const { theme, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = (value) => {
    onSelect(value);
    setSearchQuery('');
    setModalVisible(false);
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.placeholderText]}>
          {selectedValue || placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            Platform.OS === 'web'
              ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
              : {},
          ]}
        >
          <View
            style={[
              styles.modalContent,
              Platform.OS === 'web'
                ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
                : {},
            ]}
          >
            <View style={styles.modalHeader}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={theme.colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close-circle" size={30} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const getStyles = (theme, isDark) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.textPrimary,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.10)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.04)',
    height: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  placeholderText: {
    color: theme.colors.placeholder,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: isDark ? 'rgba(15,15,30,0.92)' : 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.08)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: isDark ? 0.5 : 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.10)',
    marginRight: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.04)',
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)',
  },
});

export default SearchableDropdown;
