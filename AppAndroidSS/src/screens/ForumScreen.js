import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { IconButton, Avatar } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import io from 'socket.io-client';
import api from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';
import { useWindowDimensions } from 'react-native';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Icon options for channel creation
const CHANNEL_ICONS = [
  { name: 'forum',             label: 'General' },
  { name: 'book-open-variant', label: 'Learning' },
  { name: 'code-braces',       label: 'Code' },
  { name: 'flask',             label: 'Science' },
  { name: 'lightbulb',         label: 'Ideas' },
  { name: 'account-group',     label: 'Community' },
  { name: 'trophy',            label: 'Achievements' },
  { name: 'star',              label: 'Featured' },
  { name: 'fire',              label: 'Trending' },
  { name: 'newspaper-variant', label: 'News' },
  { name: 'bullhorn',          label: 'Announce' },
  { name: 'palette',           label: 'Design' },
  { name: 'music',             label: 'Music' },
  { name: 'camera',            label: 'Photo' },
  { name: 'chart-line',        label: 'Analytics' },
  { name: 'earth',             label: 'Global' },
  { name: 'heart',             label: 'Social' },
  { name: 'briefcase',         label: 'Career' },
  { name: 'gamepad-variant',   label: 'Gaming' },
  { name: 'headphones',        label: 'Media' },
  { name: 'language',          label: 'Language' },
  { name: 'food',              label: 'Food' },
  { name: 'soccer',            label: 'Sports' },
  { name: 'leaf',              label: 'Nature' },
];

const ForumScreen = ({ route, navigation }) => {
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    icon: 'forum',
    adminOnly: false,
  });

  const isAdmin = user?.role === 'instructor' || user?.role === 'superadmin';
  const canPostInChannel = (ch) => !ch?.adminOnly || isAdmin;

  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchChannels();

    socketRef.current = io(SOCKET_URL, { withCredentials: true });

    socketRef.current.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socketRef.current.on('messageDenied', ({ reason }) => {
      Toast.show({ type: 'error', text1: 'Cannot send message', text2: reason });
    });

    return () => socketRef.current.disconnect();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const fetched = await api.get('/forum/channels');
      setChannels((fetched || []).filter(ch => ch.type !== 'direct'));
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) {
      Toast.show({ type: 'error', text1: 'Channel name is required' });
      return;
    }
    try {
      setCreating(true);
      await api.post('/forum/channels', channelForm);
      Toast.show({ type: 'success', text1: 'Channel created' });
      setChannelForm({ name: '', description: '', icon: 'forum', adminOnly: false });
      setShowCreateModal(false);
      fetchChannels();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to create channel', text2: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinChannel = async (channel) => {
    if (activeChannel) socketRef.current.emit('leaveChannel', activeChannel.id);
    setActiveChannel(channel);
    socketRef.current.emit('joinChannel', channel.id);
    try {
      const res = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(res);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannel) return;
    socketRef.current.emit('sendMessage', {
      channelId: activeChannel.id,
      senderId: user.id,
      content: inputText.trim(),
    });
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSidebarItems = (role) => {
    if (role === 'sponsor') {
      return [
        { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'SponsorDashboard' },
        { label: 'Messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
      ];
    }
    if (role === 'instructor' || role === 'superadmin') {
      return [
        { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
        { label: 'Skill Categories', icon: 'layers-outline', iconActive: 'layers', route: 'CategoryManagement' },
        { label: 'Manage Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
        { label: 'Students', icon: 'people-outline', iconActive: 'people', route: 'Students' },
        { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
        { label: 'Course Feedback', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Feedback' },
        { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
        { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
      ];
    }
    return [
      { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
      { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
      { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
      { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
      { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
      { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
      { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
      { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
    ];
  };

  const renderChannel = ({ item }) => {
    const isActive = activeChannel?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.channelItem,
          { backgroundColor: isActive ? theme.colors.primary + '20' : theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 },
        ]}
        onPress={() => handleJoinChannel(item)}
      >
        {/* Channel icon */}
        <View style={[styles.channelIconCircle, { backgroundColor: isActive ? theme.colors.primary : theme.colors.primary + '20' }]}>
          <Icon name={item.icon || 'forum'} size={22} color={isActive ? '#fff' : theme.colors.primary} />
        </View>

        <View style={styles.channelTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.channelName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
            {item.adminOnly && (
              <View style={[styles.instructorBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon name="shield-account" size={11} color={theme.colors.primary} />
                <Text style={[styles.instructorBadgeText, { color: theme.colors.primary }]}>Instructors post</Text>
              </View>
            )}
          </View>
          {item.description ? (
            <Text style={[styles.channelDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.openBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleJoinChannel(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.openBtnText}>OPEN</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <Avatar.Text
            size={36}
            label={(item.sender?.name?.charAt(0) || 'U').toUpperCase()}
            style={[styles.msgAvatar, { backgroundColor: theme.colors.primary }]}
            color="#fff"
          />
        )}
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isMe ? theme.colors.primary : theme.colors.card,
            borderBottomRightRadius: isMe ? 4 : 16,
            borderBottomLeftRadius: isMe ? 16 : 4,
            borderWidth: isMe ? 0 : 1,
            borderColor: theme.colors.border,
          },
        ]}>
          {!isMe && <Text style={[styles.senderName, { color: theme.colors.primary }]}>{item.sender?.name}</Text>}
          <Text style={[styles.messageContent, { color: isMe ? '#fff' : theme.colors.textPrimary }]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading && channels.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={getSidebarItems(user?.role)}
      activeRoute="Forum"
      onNavigate={(name) => navigation.navigate(name)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
      showBack={false}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

        {activeChannel ? (
          /* ── Chat view ─────────────────────────────────────────────────── */
          <View style={styles.chatContainer}>
            {/* Chat header */}
            <View style={[styles.chatHeader, { backgroundColor: theme.colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <TouchableOpacity style={styles.backButton} onPress={() => setActiveChannel(null)}>
                <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <View style={[styles.channelIconCircle, { backgroundColor: theme.colors.primary + '20', width: 36, height: 36, borderRadius: 10 }]}>
                <Icon name={activeChannel.icon || 'forum'} size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{activeChannel.name}</Text>
                {activeChannel.description ? (
                  <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>{activeChannel.description}</Text>
                ) : null}
              </View>
              {activeChannel.adminOnly && (
                <View style={[styles.instructorBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Icon name="shield-account" size={12} color={theme.colors.primary} />
                  <Text style={[styles.instructorBadgeText, { color: theme.colors.primary }]}>Instructors post only</Text>
                </View>
              )}
            </View>

            {/* Messages */}
            <LinearGradient
              colors={[theme.colors.background, isDark ? '#0B1F33' : '#EFE8DA']}
              style={styles.messagesContainer}
            >
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
              />
            </LinearGradient>

            {/* Input — shown only if user can post */}
            {canPostInChannel(activeChannel) ? (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              >
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
                  placeholder="Message..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onKeyPress={handleKeyPress}
                  multiline
                />
                <IconButton
                  icon="send-circle"
                  size={40}
                  iconColor={inputText.trim() ? theme.colors.primary : theme.colors.textMuted}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim()}
                />
              </KeyboardAvoidingView>
            ) : (
              <View style={[styles.readonlyBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
                <Icon name="shield-account" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.readonlyText, { color: theme.colors.textSecondary }]}>
                  Only instructors can post in this channel
                </Text>
              </View>
            )}
          </View>

        ) : (
          /* ── Channel list ──────────────────────────────────────────────── */
          <View style={styles.channelsContainer}>
            {/* Header banner */}
            <View style={[styles.pageHeaderBanner, {
              backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
              borderColor: 'rgba(0,122,61,0.15)',
            }]}>
              <View style={styles.bannerLeft}>
                <TouchableOpacity
                  style={[styles.bannerBackButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
                  onPress={() => navigation.goBack()}
                >
                  <IonIcon name="arrow-back" size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.bannerIconCircle}>
                  <Icon name="forum" size={22} color="#007A3D" />
                </View>
                <View style={styles.bannerTextGroup}>
                  <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Discussion Forum</Text>
                  <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>Connect with the community</Text>
                </View>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.newChannelBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.85}
                >
                  <Icon name="plus" size={18} color="#fff" />
                  <Text style={styles.newChannelBtnText}>New Channel</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={channels}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderChannel}
              contentContainerStyle={styles.channelList}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.textSecondary }}>
                  No channels available.
                </Text>
              }
            />
          </View>
        )}

        {/* ── Create Channel Modal ──────────────────────────────────────── */}
        <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.createModal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

              {/* Modal header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.createTitle, { color: theme.colors.textPrimary }]}>Create Channel</Text>
                <IconButton icon="close" iconColor={theme.colors.textSecondary} size={22} onPress={() => setShowCreateModal(false)} />
              </View>

              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>

                {/* Channel name */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>CHANNEL NAME</Text>
                <TextInput
                  style={[styles.createInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  placeholder="e.g. general-chat"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={channelForm.name}
                  onChangeText={t => setChannelForm({ ...channelForm, name: t })}
                />

                {/* Description */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 14 }]}>DESCRIPTION (optional)</Text>
                <TextInput
                  style={[styles.createInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  placeholder="What is this channel about?"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={channelForm.description}
                  onChangeText={t => setChannelForm({ ...channelForm, description: t })}
                />

                {/* Icon picker */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 14 }]}>CHANNEL ICON</Text>

                {/* Selected icon preview */}
                <View style={[styles.selectedIconPreview, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <View style={[styles.selectedIconCircle, { backgroundColor: theme.colors.primary }]}>
                    <Icon name={channelForm.icon} size={28} color="#fff" />
                  </View>
                  <Text style={[styles.selectedIconName, { color: theme.colors.textPrimary }]}>
                    {CHANNEL_ICONS.find(i => i.name === channelForm.icon)?.label || channelForm.icon}
                  </Text>
                </View>

                {/* Icon grid */}
                <View style={styles.iconGrid}>
                  {CHANNEL_ICONS.map((ic) => {
                    const selected = channelForm.icon === ic.name;
                    return (
                      <TouchableOpacity
                        key={ic.name}
                        style={[
                          styles.iconGridItem,
                          {
                            backgroundColor: selected ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                        onPress={() => setChannelForm({ ...channelForm, icon: ic.name })}
                        activeOpacity={0.7}
                      >
                        <Icon name={ic.name} size={22} color={selected ? '#fff' : theme.colors.textSecondary} />
                        <Text style={[styles.iconGridLabel, { color: selected ? '#fff' : theme.colors.textSecondary }]} numberOfLines={1}>
                          {ic.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Messaging restriction checkbox */}
                <TouchableOpacity
                  style={[styles.checkboxRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.border }]}
                  onPress={() => setChannelForm({ ...channelForm, adminOnly: !channelForm.adminOnly })}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.checkbox,
                    channelForm.adminOnly && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    !channelForm.adminOnly && { borderColor: 'rgba(150,150,150,0.5)' },
                  ]}>
                    {channelForm.adminOnly && <Icon name="check" size={13} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="shield-account" size={16} color={channelForm.adminOnly ? theme.colors.primary : theme.colors.textSecondary} />
                      <Text style={{ color: channelForm.adminOnly ? theme.colors.primary : theme.colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
                        Instructors-only posting
                      </Text>
                    </View>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {channelForm.adminOnly
                        ? 'Only instructors & admins can send messages. All users can read.'
                        : 'All users can send and read messages in this channel.'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createBtn, { backgroundColor: theme.colors.primary, opacity: creating ? 0.7 : 1 }]}
                    onPress={handleCreateChannel}
                    disabled={creating}
                  >
                    {creating
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={{ color: '#fff', fontWeight: '700' }}>Create Channel</Text>
                    }
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Channel list
  channelsContainer: { flex: 1 },
  pageHeaderBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, margin: 16, marginBottom: 4, borderRadius: 16, borderWidth: 1,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bannerBackButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,61,0.15)', justifyContent: 'center', alignItems: 'center' },
  bannerTextGroup: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  bannerSubtitle: { fontSize: 13 },
  newChannelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  newChannelBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  channelList: { padding: 16 },
  channelItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 16, marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
  },
  channelIconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  channelTextContainer: { flex: 1 },
  channelName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  channelDesc: { fontSize: 13 },
  instructorBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  instructorBadgeText: { fontSize: 11, fontWeight: '700' },
  openBtn: { marginLeft: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  openBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Chat view
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  chatHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  chatHeaderSub: { fontSize: 12 },
  backButton: { marginRight: 12, padding: 4 },
  messagesContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { marginRight: 8, marginBottom: 4 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, elevation: 1 },
  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  messageContent: { fontSize: 15, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingHorizontal: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 16 },
  readonlyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderTopWidth: 1 },
  readonlyText: { fontSize: 13, fontWeight: '600' },

  // Create modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  createModal: { width: '100%', maxWidth: 520, borderRadius: 20, borderWidth: 1, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  createTitle: { fontSize: 18, fontWeight: '800' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  createInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 2 },
  // Icon picker
  selectedIconPreview: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  selectedIconCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  selectedIconName: { fontSize: 15, fontWeight: '700' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  iconGridItem: { width: 64, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
  iconGridLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginTop: 2, flexShrink: 0 },
  // Buttons
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 10, borderWidth: 1 },
  createBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 10 },
});

export default ForumScreen;
