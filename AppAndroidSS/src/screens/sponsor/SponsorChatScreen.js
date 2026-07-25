import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import io from 'socket.io-client';
import api from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/ui/MainLayout';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const HEADER_HEIGHT = 62;

const SponsorChatScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

  // 'students' = sponsored students, 'teachers' = instructors
  const [activeTab, setActiveTab] = useState('students');

  const [studentChannels, setStudentChannels] = useState([]);  // direct channels with sponsored students
  const [teacherChannels, setTeacherChannels] = useState([]);  // pre-existing DM channels with teachers
  const [teachersList, setTeachersList] = useState([]);        // all instructors
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const activeChannelRef = useRef(null);
  const teacherChannelMapRef = useRef({});
  // Refs mirror state so the socket 'connect' handler always has current channel lists
  const studentChannelsRef = useRef([]);
  const teacherChannelsRef = useRef([]);

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  useEffect(() => {
    setSelectedStudent(null);
    setSelectedTeacher(null);
    setActiveChannel(null);
    setMessages([]);
    setShowMobileChat(false);
  }, [activeTab]);

  // Keep refs in sync AND immediately join rooms if socket is already connected
  useEffect(() => {
    studentChannelsRef.current = studentChannels;
    if (socketRef.current?.connected) {
      studentChannels.forEach(c => socketRef.current.emit('joinChannel', c.id));
    }
  }, [studentChannels]);

  useEffect(() => {
    teacherChannelsRef.current = teacherChannels;
    if (socketRef.current?.connected) {
      teacherChannels.forEach(c => socketRef.current.emit('joinChannel', c.id));
    }
  }, [teacherChannels]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    // on('connect') fires on initial connect AND every reconnect — re-join all rooms each time
    socket.on('connect', () => {
      studentChannelsRef.current.forEach(c => socket.emit('joinChannel', c.id));
      teacherChannelsRef.current.forEach(c => socket.emit('joinChannel', c.id));
    });

    socket.on('newMessage', (msg) => {
      const current = activeChannelRef.current;
      if (current && msg.channelId === current.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        setUnreadCounts(prev => ({ ...prev, [msg.channelId]: (prev[msg.channelId] || 0) + 1 }));
        setStudentChannels(prev => {
          const idx = prev.findIndex(c => c.id === msg.channelId);
          if (idx < 0) return prev;
          const updated = [...prev];
          const [moved] = updated.splice(idx, 1);
          return [{ ...moved, updatedAt: new Date().toISOString() }, ...updated];
        });
        const tid = teacherChannelMapRef.current[msg.channelId];
        if (tid) {
          setTeachersList(prev => {
            const idx = prev.findIndex(t => t.id === tid);
            if (idx < 0) return prev;
            const updated = [...prev];
            const [moved] = updated.splice(idx, 1);
            return [moved, ...updated];
          });
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchStudentChannels();
    fetchTeachers();
  }, []);

  const fetchStudentChannels = async () => {
    try {
      setLoading(true);
      const data = await api.get('/forum/direct-channels');
      // Only channels with sponsored students — deduplicate by student id (keep oldest)
      const seen = new Set();
      const unique = (data || [])
        .filter(c => c.otherUser?.role === 'student')
        .filter(c => {
          if (seen.has(c.otherUser.id)) return false;
          seen.add(c.otherUser.id);
          return true;
        });
      setStudentChannels(unique);
    } catch (err) {
      console.error('Failed to fetch student channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const [instructors, myChannels] = await Promise.all([
        api.get('/forum/instructors'),
        api.get('/forum/direct-channels'),
      ]);
      setTeachersList(instructors || []);
      // Pre-populate teacher channel map so unread badges work without opening the chat
      const tChans = (myChannels || []).filter(
        ch => ch.otherUser?.role === 'instructor' || ch.otherUser?.role === 'superadmin'
      );
      const map = {};
      tChans.forEach(ch => { map[ch.id] = ch.otherUser.id; });
      teacherChannelMapRef.current = { ...teacherChannelMapRef.current, ...map };
      setTeacherChannels(tChans); // triggers joinAll effect
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleSelectStudent = async (channel) => {
    setSelectedStudent(channel);
    setLoadingMessages(true);
    if (isMobile) setShowMobileChat(true);
    setUnreadCounts(prev => { const n = { ...prev }; delete n[channel.id]; return n; });
    try {
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.error('Failed to open channel:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    setLoadingMessages(true);
    if (isMobile) setShowMobileChat(true);
    try {
      const channel = await api.post('/forum/channels/direct', { targetUserId: teacher.id });
      teacherChannelMapRef.current[channel.id] = teacher.id;
      setUnreadCounts(prev => { const n = { ...prev }; delete n[channel.id]; return n; });
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.error('Failed to open teacher chat:', err);
    } finally {
      setLoadingMessages(false);
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

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <Avatar.Text
            size={32}
            label={(item.sender?.name || '?').substring(0, 2).toUpperCase()}
            style={[styles.msgAvatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ fontSize: 11, color: '#fff' }}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMe
            ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 }
            : { backgroundColor: isDark ? '#2C2C3E' : '#EAEAEA', borderBottomLeftRadius: 2 }
        ]}>
          {!isMe && (
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
              {item.sender?.name}
            </Text>
          )}
          <Text style={{ color: isMe ? '#fff' : theme.colors.textPrimary, fontSize: 15, lineHeight: 20 }}>
            {item.content}
          </Text>
          <Text style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary, fontSize: 10, marginTop: 6, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderStudentRow = (channel) => {
    const isSelected = selectedStudent?.id === channel.id;
    const unread = unreadCounts[channel.id] || 0;
    const person = channel.otherUser;
    return (
      <TouchableOpacity
        key={channel.id}
        style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
        onPress={() => handleSelectStudent(channel)}
        activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text
            size={44}
            label={(person?.name || 'S').substring(0, 2).toUpperCase()}
            style={{ backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#2C2C3E' : '#E0E0E0') }}
            labelStyle={{ color: isSelected ? '#fff' : theme.colors.textPrimary }}
          />
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>{person?.name || 'Student'}</Text>
          <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>Sponsored Student</Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderTeacherRow = (teacher) => {
    const isSelected = selectedTeacher?.id === teacher.id;
    const chId = Object.entries(teacherChannelMapRef.current).find(([, tid]) => tid === teacher.id)?.[0];
    const unread = chId ? (unreadCounts[chId] || 0) : 0;
    return (
      <TouchableOpacity
        key={teacher.id}
        style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
        onPress={() => handleSelectTeacher(teacher)}
        activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text
            size={44}
            label={teacher.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#2C2C3E' : '#E0E0E0') }}
            labelStyle={{ color: isSelected ? '#fff' : theme.colors.textPrimary }}
          />
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>{teacher.name}</Text>
          <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>
            {teacher.role === 'superadmin' ? 'Admin' : 'Instructor'}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const chatHeader = (person, subtitle) => (
    <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      {isMobile && (
        <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      )}
      <Avatar.Text
        size={40}
        label={(person?.name || '?').substring(0, 2).toUpperCase()}
        style={{ backgroundColor: theme.colors.primary }}
        labelStyle={{ color: '#fff' }}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{person?.name || 'Unknown'}</Text>
        <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );

  const chatPanel = (person, subtitle) => (
    <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {chatHeader(person, subtitle)}
      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(item => (
            <React.Fragment key={item.id.toString()}>
              {renderMessage({ item })}
            </React.Fragment>
          ))}
        </ScrollView>
      )}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
          placeholder="Write a message… (Enter to send)"
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          onKeyPress={handleKeyPress}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: inputText.trim() ? theme.colors.primary : 'rgba(150,150,150,0.1)' }]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Icon name="send" size={20} color={inputText.trim() ? '#fff' : theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const studentUnreadTotal = studentChannels.reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);
  const teacherUnreadTotal = teacherChannels.reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);

  const leftPanel = (
    <View style={[styles.leftPanel, { borderRightColor: theme.colors.border }]}>
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('students')}
        >
          <Icon name="school" size={15} color={activeTab === 'students' ? theme.colors.primary : theme.colors.textSecondary} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, { color: activeTab === 'students' ? theme.colors.primary : theme.colors.textSecondary }]}>My Students</Text>
          {studentUnreadTotal > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{studentUnreadTotal > 9 ? '9+' : studentUnreadTotal}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'teachers' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('teachers')}
        >
          <Icon name="account-tie" size={15} color={activeTab === 'teachers' ? theme.colors.primary : theme.colors.textSecondary} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, { color: activeTab === 'teachers' ? theme.colors.primary : theme.colors.textSecondary }]}>Teachers</Text>
          {teacherUnreadTotal > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{teacherUnreadTotal > 9 ? '9+' : teacherUnreadTotal}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'students' ? (
        <FlatList
          data={studentChannels}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => renderStudentRow(item)}
          ListEmptyComponent={
            <View style={styles.emptyConv}>
              <Icon name="heart-outline" size={54} color={theme.colors.border} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No students yet</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Sponsor a student from your dashboard to start chatting.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={teachersList}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => renderTeacherRow(item)}
          ListEmptyComponent={
            <View style={styles.emptyConv}>
              <Icon name="account-tie-outline" size={54} color={theme.colors.border} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No teachers found</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No instructors are available.</Text>
            </View>
          }
        />
      )}
    </View>
  );

  const rightPanel = activeTab === 'students' ? (
    !selectedStudent ? (
      <View style={styles.rightPlaceholder}>
        <Icon name="heart-outline" size={80} color={theme.colors.border} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>Message Your Students</Text>
        <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>
          Select a sponsored student from the left to start a private conversation.
        </Text>
      </View>
    ) : chatPanel(selectedStudent.otherUser, 'Sponsored Student')
  ) : (
    !selectedTeacher ? (
      <View style={styles.rightPlaceholder}>
        <Icon name="teach" size={80} color={theme.colors.border} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>Message a Teacher</Text>
        <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>
          Select an instructor to ask about your sponsored student's progress.
        </Text>
      </View>
    ) : chatPanel(selectedTeacher, selectedTeacher.role === 'superadmin' ? 'Admin' : 'Instructor')
  );

  return (
    <MainLayout
      showSidebar={true}
      showBack={false}
      activeRoute="SponsorChat"
      onNavigate={r => navigation.navigate(r)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isWeb ? { height: height - HEADER_HEIGHT, overflow: 'hidden' } : {},
      ]}>
        {/* Header */}
        <View style={[styles.pageHeaderBanner, { backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)', borderColor: 'rgba(0,122,61,0.15)' }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.bannerIconCircle]}>
              <Icon name="message-text" size={22} color="#007A3D" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Messages</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>Chat with your students and teachers</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,122,61,0.08)', borderRadius: 20 }]} onPress={fetchStudentChannels}>
            <Icon name="refresh" size={20} color="#007A3D" />
          </TouchableOpacity>
        </View>

        <View style={styles.panelsRow}>
          {isMobile ? (
            showMobileChat ? rightPanel : leftPanel
          ) : (
            <>
              {leftPanel}
              <View style={styles.rightPanel}>{rightPanel}</View>
            </>
          )}
        </View>

      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  pageHeaderBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, margin: 16, marginBottom: 4, borderRadius: 16, borderWidth: 1 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,61,0.15)', justifyContent: 'center', alignItems: 'center' },
  bannerTextGroup: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  bannerSubtitle: { fontSize: 13 },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  panelsRow: { flex: 1, flexDirection: 'row', minHeight: 0, overflow: 'hidden' },
  leftPanel: { width: '100%', maxWidth: 320, flex: 1, borderRightWidth: 1, minHeight: 0, overflow: 'hidden' },
  rightPanel: { flex: 1, minHeight: 0, overflow: 'hidden' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: 5 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.05)' },
  userName: { fontSize: 15, fontWeight: '700' },
  userRole: { fontSize: 12, marginTop: 2 },
  emptyConv: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyText: { marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  rightPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  placeholderSub: { fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  chatHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  chatHeaderSub: { fontSize: 12, marginTop: 2 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { marginRight: 8, marginBottom: 4 },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  unreadBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

export default SponsorChatScreen;
