import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const GREEN = '#007A3D';
const RED = '#CE1126';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',    color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  sent:      { label: 'Email Sent', color: '#007A3D', bg: '#EFF8F2', icon: 'mail-outline' },
  expired:   { label: 'Expired',    color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
  completed: { label: 'Completed',  color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
};

const TodoScreen = () => {
  const { todos, addTodo, toggleTodo, deleteTodo, fetchTodos } = useData();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

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

  const handleNavigate = (route) => navigation.navigate(route);

  useEffect(() => { fetchTodos(); }, []);

  const stats = useMemo(() => {
    const total     = todos.length;
    const pending   = todos.filter(t => t.status === 'pending' || t.status === 'sent').length;
    const completed = todos.filter(t => t.status === 'completed').length;
    const expired   = todos.filter(t => t.status === 'expired').length;
    return { total, pending, completed, expired };
  }, [todos]);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setIsAdding(true);
    await addTodo({ text: newTodo.trim(), type: 'reminder', scheduledAt: scheduledAt || null });
    setNewTodo('');
    setScheduledAt('');
    setIsAdding(false);
    setShowAddModal(false);
  };

  const formatScheduledAt = (val) => {
    if (!val) return null;
    const localInputMatch = typeof val === 'string'
      ? val.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
      : null;
    const d = localInputMatch
      ? new Date(
          Number(localInputMatch[1]),
          Number(localInputMatch[2]) - 1,
          Number(localInputMatch[3]),
          Number(localInputMatch[4]),
          Number(localInputMatch[5]),
          0,
          0
        )
      : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const getStatusAccentColor = (status) => STATUS_CONFIG[status]?.color || GREEN;

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  const renderReminderCard = (item, index) => {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const accentColor = getStatusAccentColor(item.status);

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.duration(400).delay(index * 70)}
        style={styles.cardWrapper}
      >
        <View style={[
          styles.reminderCard,
          {
            backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)',
            borderRadius: 16,
          },
        ]}>
          {/* Left accent bar */}
          <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />

          {/* Header row: checkbox + text */}
          <View style={styles.cardHeader}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                {
                  borderColor: item.completed ? '#10B981' : theme.colors.border,
                  backgroundColor: item.completed ? '#10B981' : 'transparent',
                },
              ]}
              onPress={() => toggleTodo(item.id)}
            >
              {item.completed && <Icon name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>

            <View style={styles.cardTextArea}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: item.completed ? theme.colors.textTertiary : theme.colors.textPrimary },
                  item.completed && styles.cardTitleCompleted,
                ]}
                numberOfLines={2}
              >
                {item.text}
              </Text>

              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                <Icon name={statusCfg.icon} size={11} color={statusCfg.color} />
                <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
              </View>
            </View>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {item.scheduledAt ? (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: `${accentColor}18` }]}>
                  <Icon name="alarm-outline" size={12} color={accentColor} />
                </View>
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  {formatScheduledAt(item.scheduledAt)}
                </Text>
              </View>
            ) : (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: 'rgba(0,122,61,0.10)' }]}>
                  <Icon name="calendar-outline" size={12} color={GREEN} />
                </View>
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>No schedule set</Text>
              </View>
            )}
            {item.completed && item.completedAt && (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: 'rgba(16,185,129,0.10)' }]}>
                  <Icon name="checkmark-done-outline" size={12} color="#10B981" />
                </View>
                <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                  Done {new Date(item.completedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)' }]} />

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: item.completed
                    ? 'rgba(239,68,68,0.10)'
                    : 'rgba(16,185,129,0.10)',
                  borderWidth: 1.5,
                  borderColor: item.completed
                    ? 'rgba(239,68,68,0.25)'
                    : 'rgba(16,185,129,0.25)',
                },
              ]}
              onPress={() => toggleTodo(item.id)}
            >
              <Icon
                name={item.completed ? 'close-circle-outline' : 'checkmark-circle-outline'}
                size={15}
                color={item.completed ? '#EF4444' : '#10B981'}
              />
              <Text style={[styles.actionBtnText, { color: item.completed ? '#EF4444' : '#10B981' }]}>
                {item.completed ? 'Undo' : 'Complete'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.08)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(239,68,68,0.25)',
                },
              ]}
              onPress={() => deleteTodo(item.id)}
            >
              <Icon name="trash-outline" size={15} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Todo"
      onNavigate={handleNavigate}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header Banner */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
          borderColor: 'rgba(0,122,61,0.15)',
        }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name="checkmark-circle" size={22} color={GREEN} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Reminders</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
                Manage your learning reminders
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0,122,61,0.12)' }]}>
              <Icon name="list" size={20} color={GREEN} />
            </View>
            <Text style={[styles.statValue, { color: GREEN }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Icon name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.07)' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Icon name="close-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.expired}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Expired</Text>
          </View>
        </View>

        {/* Reminders Grid */}
        {todos.length > 0 ? (
          <View style={styles.remindersGrid}>
            {todos.map((item, index) => renderReminderCard(item, index))}
          </View>
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="checkmark-circle-outline"
              title="No reminders yet"
              subtitle="Tap 'Add Reminder' to create your first reminder"
              actionLabel="Add Reminder"
              onAction={() => setShowAddModal(true)}
            />
          </AppCard>
        )}
      </ScrollView>

      {/* ─── Add Reminder Modal — Glassmorphic ─── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          ...(isWeb ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
        }}>
          <View style={{
            width: '100%',
            maxWidth: 460,
            backgroundColor: isDark ? 'rgba(15,15,30,0.94)' : 'rgba(255,255,255,0.97)',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.1)',
            padding: 28,
            ...(isWeb ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: isDark ? 0.5 : 0.15,
            shadowRadius: 40,
            elevation: 20,
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: '#007A3D20', borderRadius: 12, padding: 10 }}>
                  <Icon name="alarm" size={20} color={GREEN} />
                </View>
                <View>
                  <Text style={{ color: isDark ? '#FFFFFF' : '#1A1A2E', fontSize: 18, fontWeight: '800' }}>
                    New Reminder
                  </Text>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', fontSize: 12, marginTop: 2 }}>
                    Fill in the details below
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => { setShowAddModal(false); setNewTodo(''); setScheduledAt(''); }}
                style={{ padding: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.06)', borderRadius: 8 }}
              >
                <Icon name="close" size={20} color={isDark ? '#FFFFFF' : '#1A1A2E'} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)', marginBottom: 24 }} />

            {/* Reminder Text */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                Reminder Text
              </Text>
              <AppInput
                value={newTodo}
                onChangeText={setNewTodo}
                placeholder="What do you want to be reminded about?"
              />
            </View>

            {/* Date & Time */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                Schedule Date & Time
              </Text>
              {isWeb ? (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(26,26,46,0.14)'}`,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.03)',
                    color: isDark ? '#FFFFFF' : '#1A1A2E',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <TextInput
                  value={scheduledAt}
                  onChangeText={setScheduledAt}
                  placeholder="YYYY-MM-DDTHH:MM"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={{
                    borderWidth: 1.5,
                    borderRadius: 12,
                    padding: 11,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(26,26,46,0.14)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.03)',
                  }}
                />
              )}

              {scheduledAt ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  backgroundColor: 'rgba(0,122,61,0.08)',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                }}>
                  <Icon name="alarm-outline" size={13} color={GREEN} />
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(26,26,46,0.65)', fontSize: 12, flex: 1 }}>
                    Email reminder 30 min before · {formatScheduledAt(scheduledAt) || 'Invalid date'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,46,0.15)',
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={() => { setShowAddModal(false); setNewTodo(''); setScheduledAt(''); }}
              >
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.7)', fontWeight: '600', fontSize: 14 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 12,
                  backgroundColor: GREEN,
                  padding: 14,
                  alignItems: 'center',
                  opacity: isAdding ? 0.7 : 1,
                  ...(isWeb && { boxShadow: '0 4px 16px rgba(0,122,61,0.4)' }),
                }}
                onPress={handleAddTodo}
                disabled={isAdding}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  {isAdding ? 'Adding...' : 'Add Reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
};

const getStyles = (theme, isDark, isLargeScreen, isTablet, isMobile) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isMobile ? 16 : 24,
      paddingBottom: 40,
    },

    // Page Header Banner
    pageHeaderBanner: {
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isTablet ? 'center' : 'flex-start',
      padding: isMobile ? 16 : 20,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
    },
    bannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: isTablet ? 1 : undefined,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,122,61,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerTextGroup: {
      flex: 1,
    },
    pageTitle: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: '700',
      marginBottom: 2,
    },
    pageSubtitle: {
      fontSize: 13,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: GREEN,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      alignSelf: isTablet ? 'auto' : 'flex-start',
      ...(Platform.OS === 'web' && { boxShadow: '0 2px 12px rgba(0,122,61,0.35)' }),
    },
    addBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },

    // Stats Section
    statsSection: {
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 12 : 16,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: 110,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      gap: 4,
      ...(Platform.OS === 'web' && { boxShadow: isDark ? 'none' : '0 1px 8px rgba(26,26,46,0.06)' }),
    },
    statIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    statValue: {
      fontSize: isMobile ? 28 : 32,
      fontWeight: '700',
      lineHeight: isMobile ? 34 : 38,
    },
    statLabel: {
      fontSize: 13,
      textAlign: 'center',
    },

    // Reminders Grid
    remindersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    cardWrapper: {
      width: isLargeScreen
        ? 'calc(50% - 8px)'
        : isTablet
          ? 'calc(50% - 8px)'
          : '100%',
      ...(Platform.OS !== 'web' && {
        width: isTablet ? '48%' : '100%',
      }),
    },
    reminderCard: {
      padding: isMobile ? 14 : 16,
      overflow: 'hidden',
      position: 'relative',
      ...(Platform.OS === 'web' && { boxShadow: isDark ? 'none' : '0 2px 12px rgba(26,26,46,0.07)' }),
    },
    cardAccentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 3,
      height: '100%',
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 10,
    },
    checkbox: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
      flexShrink: 0,
    },
    cardTextArea: {
      flex: 1,
      gap: 6,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
    },
    cardTitleCompleted: {
      textDecorationLine: 'line-through',
      opacity: 0.5,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaIconWrap: {
      width: 20,
      height: 20,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 12,
    },
    cardDivider: {
      height: 1,
      marginBottom: 12,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 10,
      gap: 5,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

export default TodoScreen;
