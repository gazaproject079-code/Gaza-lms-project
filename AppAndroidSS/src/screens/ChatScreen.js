import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import io from 'socket.io-client';
import api from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const HEADER_HEIGHT = 62;

const ChatScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

  const role = user?.role;
  const isInstructor = role === 'instructor' || role === 'superadmin';
  const isStudent = role === 'student';
  const isSponsor = role === 'sponsor';

  const defaultTab = isInstructor ? 'students' : isStudent ? 'teachers' : 'students';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Contact lists
  const [studentChannels, setStudentChannels] = useState([]);  // instructor/sponsor: DM channels with students
  const [instructorList, setInstructorList] = useState([]);    // student/sponsor: all instructors
  const [peerList, setPeerList] = useState([]);                // instructor: peer instructors/admins
  const [sponsorList, setSponsorList] = useState([]);          // instructor/student: sponsors
  const [allMyChannels, setAllMyChannels] = useState([]);      // all my direct channels (for unread routing)

  // Selection
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(null); // instructor: grouped student
  const [selectedConv, setSelectedConv] = useState(null);                 // instructor: specific thread

  // Chat
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
  const channelMapRef = useRef({});  // channelId → otherUserId  (for unread badge routing)
  const allMyChannelsRef = useRef([]);

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  // Reset everything when switching tabs
  useEffect(() => {
    setSelectedContact(null);
    setSelectedCourse(null);
    setSelectedStudentGroup(null);
    setSelectedConv(null);
    setActiveChannel(null);
    setMessages([]);
    setShowMobileChat(false);
  }, [activeTab]);

  // Keep ref in sync + rejoin rooms
  useEffect(() => {
    allMyChannelsRef.current = allMyChannels;
    if (socketRef.current?.connected) {
      allMyChannels.forEach(c => socketRef.current.emit('joinChannel', c.id));
    }
  }, [allMyChannels]);

  // Socket
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      allMyChannelsRef.current.forEach(c => socket.emit('joinChannel', c.id));
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
        // Bubble the channel to the top of the student channels list
        setStudentChannels(prev => {
          const idx = prev.findIndex(c => c.id === msg.channelId);
          if (idx < 0) return prev;
          const updated = [...prev];
          const [moved] = updated.splice(idx, 1);
          return [{ ...moved, updatedAt: new Date().toISOString() }, ...updated];
        });
      }
    });

    return () => socket.disconnect();
  }, []);

  // Initial data load
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const channels = await api.get('/forum/direct-channels');
      setAllMyChannels(channels || []);

      // Build channelId → userId map for unread routing
      const map = {};
      (channels || []).forEach(c => { if (c.otherUser?.id) map[c.id] = c.otherUser.id; });
      channelMapRef.current = map;

      if (isInstructor) {
        const [peers, sponsors] = await Promise.all([
          api.get('/forum/peers'),
          api.get('/forum/sponsors').catch(() => []),
        ]);
        setStudentChannels((channels || []).filter(c => c.otherUser?.role === 'student'));
        setPeerList(peers || []);
        setSponsorList(sponsors || []);
      } else if (isStudent) {
        const [instructors, sponsors] = await Promise.all([
          api.get('/forum/instructors'),
          api.get('/sponsorships/my-sponsors').catch(() => []),
        ]);
        setInstructorList(instructors || []);
        setSponsorList(sponsors || []);
      } else if (isSponsor) {
        const instructors = await api.get('/forum/instructors');
        const seen = new Set();
        const unique = (channels || [])
          .filter(c => c.otherUser?.role === 'student')
          .filter(c => { if (seen.has(c.otherUser?.id)) return false; seen.add(c.otherUser?.id); return true; });
        setStudentChannels(unique);
        setInstructorList(instructors || []);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load conversations' });
    } finally {
      setLoading(false);
    }
  };

  // Open a channel that already exists
  const openChannel = async (channel) => {
    setLoadingMessages(true);
    setUnreadCounts(prev => { const n = { ...prev }; delete n[channel.id]; return n; });
    try {
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open conversation' });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Create or find a direct channel then open it
  const openDirectChannel = async (targetUserId, courseId = null, courseName = null) => {
    setLoadingMessages(true);
    try {
      const channel = await api.post('/forum/channels/direct', { targetUserId, courseId, courseName });
      channelMapRef.current[channel.id] = targetUserId;
      await openChannel(channel);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open chat' });
      setLoadingMessages(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSelectStudentGroup = (group) => {
    setSelectedStudentGroup(group);
    setSelectedConv(null);
    setActiveChannel(null);
    setMessages([]);
    if (isMobile) setShowMobileChat(true);
  };

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv);
    await openChannel(conv);
  };

  const handleSelectPeer = async (peer) => {
    setSelectedContact(peer);
    if (isMobile) setShowMobileChat(true);
    await openDirectChannel(peer.id);
  };

  const handleSelectSponsor = async (sponsor) => {
    setSelectedContact(sponsor);
    if (isMobile) setShowMobileChat(true);
    await openDirectChannel(sponsor.id);
  };

  const handleSelectInstructor = (instructor) => {
    // Student: show course picker first
    setSelectedContact(instructor);
    setSelectedCourse(null);
    setActiveChannel(null);
    setMessages([]);
    if (isMobile) setShowMobileChat(true);
  };

  const handleSelectCourse = async (instructor, course) => {
    setSelectedCourse(course);
    await openDirectChannel(instructor.id, course?.id || null, course?.name || null);
  };

  const handleSelectStudentChannel = async (channel) => {
    // Sponsor: open existing sponsored-student channel
    setSelectedContact(channel.otherUser);
    if (isMobile) setShowMobileChat(true);
    await openChannel(channel);
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

  // ── Render helpers ─────────────────────────────────────────────────────────────

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <Avatar.Text size={32}
            label={(item.sender?.name || '??').substring(0, 2).toUpperCase()}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ fontSize: 11, color: '#fff' }}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMe
            ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 }
            : { backgroundColor: isDark ? '#2C2C3E' : '#EAEAEA', borderBottomLeftRadius: 2 },
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

  const renderContactRow = ({ person, label, onPress, isSelected, unread = 0 }) => (
    <TouchableOpacity
      key={person.id}
      style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ position: 'relative' }}>
        <Avatar.Text size={44}
          label={(person.name || 'U').substring(0, 2).toUpperCase()}
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
        <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>
          {person.name}
        </Text>
        <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  // ── Left panel content (role + tab specific) ───────────────────────────────────

  const renderLeftContent = () => {
    if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />;

    // ── INSTRUCTOR ─────────────────────────────────────────────────────────────
    if (isInstructor) {
      if (activeTab === 'students') {
        // Group channels by student
        const groups = Object.values(
          studentChannels.reduce((acc, conv) => {
            const uid = conv.otherUser?.id;
            if (!uid) return acc;
            if (!acc[uid]) acc[uid] = { user: conv.otherUser, convs: [] };
            acc[uid].convs.push(conv);
            return acc;
          }, {})
        );
        return (
          <FlatList
            style={styles.listFlex}
            data={groups}
            keyExtractor={item => item.user?.id?.toString()}
            renderItem={({ item: group }) => {
              const totalUnread = group.convs.reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);
              const isSelected = selectedStudentGroup?.user?.id === group.user?.id;
              return (
                <TouchableOpacity
                  style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
                  onPress={() => {
                    if (group.convs.length === 1) {
                      setSelectedStudentGroup(group);
                      setSelectedConv(group.convs[0]);
                      if (isMobile) setShowMobileChat(true);
                      openChannel(group.convs[0]);
                    } else {
                      handleSelectStudentGroup(group);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ position: 'relative' }}>
                    <Avatar.Text size={44}
                      label={(group.user?.name || 'S').substring(0, 2).toUpperCase()}
                      style={{ backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#2C2C3E' : '#E0E0E0') }}
                      labelStyle={{ color: isSelected ? '#fff' : theme.colors.textPrimary }}
                    />
                    {totalUnread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{totalUnread > 9 ? '9+' : totalUnread}</Text></View>}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: totalUnread > 0 ? '800' : '700' }]}>{group.user?.name}</Text>
                    <Text style={[styles.userRole, { color: totalUnread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>
                      Student · {group.convs.length} thread{group.convs.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="message-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No student messages yet</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Student messages will appear here.</Text>
              </View>
            }
          />
        );
      }

      if (activeTab === 'instructors') {
        return (
          <FlatList
            style={styles.listFlex}
            data={peerList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === item.id)?.[0];
              const unread = chId ? (unreadCounts[chId] || 0) : 0;
              return renderContactRow({
                person: item,
                label: item.role === 'superadmin' ? 'Admin' : 'Instructor',
                onPress: () => handleSelectPeer(item),
                isSelected: selectedContact?.id === item.id,
                unread,
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="account-group-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No peers found</Text>
              </View>
            }
          />
        );
      }

      if (activeTab === 'sponsors') {
        return (
          <FlatList
            style={styles.listFlex}
            data={sponsorList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === item.id)?.[0];
              const unread = chId ? (unreadCounts[chId] || 0) : 0;
              return renderContactRow({
                person: item,
                label: 'Sponsor',
                onPress: () => handleSelectSponsor(item),
                isSelected: selectedContact?.id === item.id,
                unread,
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="heart-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No sponsors</Text>
              </View>
            }
          />
        );
      }
    }

    // ── STUDENT ────────────────────────────────────────────────────────────────
    if (isStudent) {
      if (activeTab === 'teachers') {
        return (
          <FlatList
            style={styles.listFlex}
            data={instructorList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const myChans = allMyChannels.filter(c => c.otherUser?.id === item.id);
              const unread = myChans.reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);
              return renderContactRow({
                person: item,
                label: item.role === 'superadmin' ? 'Admin' : `Instructor${(item.courses || []).length > 0 ? `  ·  ${item.courses.length} course${item.courses.length > 1 ? 's' : ''}` : ''}`,
                onPress: () => handleSelectInstructor(item),
                isSelected: selectedContact?.id === item.id,
                unread,
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="account-tie-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No teachers found</Text>
              </View>
            }
          />
        );
      }

      if (activeTab === 'sponsors') {
        return (
          <FlatList
            style={styles.listFlex}
            data={sponsorList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === item.id)?.[0];
              const unread = chId ? (unreadCounts[chId] || 0) : 0;
              return renderContactRow({
                person: item,
                label: 'My Sponsor',
                onPress: () => handleSelectSponsor(item),
                isSelected: selectedContact?.id === item.id,
                unread,
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="heart-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No sponsors yet</Text>
              </View>
            }
          />
        );
      }
    }

    // ── SPONSOR ────────────────────────────────────────────────────────────────
    if (isSponsor) {
      if (activeTab === 'students') {
        return (
          <FlatList
            style={styles.listFlex}
            data={studentChannels}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item: channel }) => {
              const unread = unreadCounts[channel.id] || 0;
              return renderContactRow({
                person: channel.otherUser || {},
                label: 'Sponsored Student',
                onPress: () => handleSelectStudentChannel(channel),
                isSelected: activeChannel?.id === channel.id,
                unread,
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="school-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No students yet</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Sponsor a student to start chatting.</Text>
              </View>
            }
          />
        );
      }

      if (activeTab === 'teachers') {
        return (
          <FlatList
            style={styles.listFlex}
            data={instructorList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === item.id)?.[0];
              const unread = chId ? (unreadCounts[chId] || 0) : 0;
              return renderContactRow({
                person: item,
                label: item.role === 'superadmin' ? 'Admin' : 'Instructor',
                onPress: () => handleSelectPeer(item),
                isSelected: selectedContact?.id === item.id,
                unread,
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <Icon name="account-tie-outline" size={54} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No teachers found</Text>
              </View>
            }
          />
        );
      }
    }

    return null;
  };

  // ── Tabs config ────────────────────────────────────────────────────────────────

  const tabs = (() => {
    const studentsUnread = studentChannels.reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);
    const peersUnread = peerList.reduce((s, p) => {
      const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === p.id)?.[0];
      return s + (chId ? (unreadCounts[chId] || 0) : 0);
    }, 0);
    const sponsorsUnread = sponsorList.reduce((s, sp) => {
      const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === sp.id)?.[0];
      return s + (chId ? (unreadCounts[chId] || 0) : 0);
    }, 0);
    const teachersUnread = instructorList.reduce((s, ins) => {
      return s + allMyChannels.filter(c => c.otherUser?.id === ins.id).reduce((ss, c) => ss + (unreadCounts[c.id] || 0), 0);
    }, 0);

    if (isInstructor) return [
      { key: 'students',    icon: 'message-text',   label: 'Students',    unread: studentsUnread },
      { key: 'instructors', icon: 'account-group',  label: 'Instructors', unread: peersUnread },
      { key: 'sponsors',    icon: 'heart',           label: 'Sponsors',    unread: sponsorsUnread },
    ];
    if (isStudent) return [
      { key: 'teachers', icon: 'account-tie', label: 'Teachers', unread: teachersUnread },
      { key: 'sponsors', icon: 'heart',        label: 'Sponsors', unread: sponsorsUnread },
    ];
    // sponsor
    return [
      { key: 'students', icon: 'school',       label: 'My Students', unread: studentsUnread },
      { key: 'teachers', icon: 'account-tie',  label: 'Teachers',    unread: peersUnread },
    ];
  })();

  // ── Left panel ─────────────────────────────────────────────────────────────────

  const leftPanel = (
    <View style={[styles.leftPanel, { borderRightColor: theme.colors.border }]}>
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon} size={15}
              color={activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }]}>
              {tab.label}
            </Text>
            {tab.unread > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.unread > 9 ? '9+' : tab.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {renderLeftContent()}
    </View>
  );

  // ── Chat panel — EXACT same structure as the working TeacherChatScreen ──────────

  const chatPanel = (chatUser, subtitle) => (
    <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text size={40}
          label={(chatUser?.name || '?').substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
          labelStyle={{ color: '#fff' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{chatUser?.name || 'Unknown'}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        </View>
        {selectedStudentGroup && selectedConv && (
          <TouchableOpacity
            onPress={() => { setSelectedConv(null); setActiveChannel(null); setMessages([]); }}
            style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
          >
            <Icon name="format-list-bulleted" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: theme.colors.background, minHeight: 0 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(item => (
            <React.Fragment key={item.id.toString()}>{renderMessage({ item })}</React.Fragment>
          ))}
        </ScrollView>
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
          placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
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

  // ── Course picker (student: pick which course to discuss) ──────────────────────

  const coursePicker = selectedContact && isStudent && !activeChannel ? (
    <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text size={40}
          label={selectedContact.name.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
          labelStyle={{ color: '#fff' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{selectedContact.name}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>
            {selectedContact.role === 'superadmin' ? 'Admin' : 'Instructor'} · Choose a course to discuss
          </Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 24 }}>
        <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>What would you like to discuss?</Text>
        <Text style={[styles.pickerSub, { color: theme.colors.textSecondary }]}>Each course has its own separate conversation thread.</Text>
        <View style={styles.courseGrid}>
          {(selectedContact.courses || []).map(course => (
            <TouchableOpacity key={course.id}
              style={[styles.courseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleSelectCourse(selectedContact, course)}
              activeOpacity={0.75}
            >
              <View style={[styles.courseCardIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon name="book-open-variant" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.courseCardName, { color: theme.colors.textPrimary }]} numberOfLines={2}>{course.name}</Text>
              <View style={[styles.courseCardBtn, { backgroundColor: theme.colors.primary }]}>
                <Icon name="message-text" size={14} color="#fff" />
                <Text style={styles.courseCardBtnText}>Open Chat</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.courseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handleSelectCourse(selectedContact, null)}
            activeOpacity={0.75}
          >
            <View style={[styles.courseCardIcon, { backgroundColor: 'rgba(150,150,150,0.15)' }]}>
              <Icon name="chat-outline" size={24} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.courseCardName, { color: theme.colors.textPrimary }]}>General</Text>
            <View style={[styles.courseCardBtn, { backgroundColor: isDark ? '#2C2C3E' : '#E8E8E8' }]}>
              <Icon name="message-text" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.courseCardBtnText, { color: theme.colors.textSecondary }]}>Open Chat</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  ) : null;

  // ── Thread picker (instructor: student has multiple course threads) ─────────────

  const threadPicker = selectedStudentGroup && !selectedConv ? (
    <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text size={40}
          label={(selectedStudentGroup.user?.name || 'S').substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
          labelStyle={{ color: '#fff' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{selectedStudentGroup.user?.name}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>Student · Select a conversation thread</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>Conversation Threads</Text>
        <Text style={[styles.pickerSub, { color: theme.colors.textSecondary }]}>This student has messaged you across multiple courses.</Text>
        {selectedStudentGroup.convs.map(conv => {
          const courseName = conv.name?.startsWith('direct-course-') ? conv.description : null;
          const convUnread = unreadCounts[conv.id] || 0;
          return (
            <TouchableOpacity key={conv.id}
              style={[styles.threadRow, { backgroundColor: theme.colors.surface, borderColor: convUnread > 0 ? theme.colors.primary + '60' : theme.colors.border }]}
              onPress={() => handleSelectConv(conv)}
              activeOpacity={0.75}
            >
              <View style={[styles.threadIcon, { backgroundColor: courseName ? theme.colors.primary + '20' : 'rgba(150,150,150,0.15)' }]}>
                <Icon name={courseName ? 'book-open-variant' : 'chat-outline'} size={20}
                  color={courseName ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: convUnread > 0 ? '800' : '700' }]}>
                  {courseName || 'General Chat'}
                </Text>
                <Text style={[styles.userRole, { color: convUnread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>
                  {convUnread > 0 ? `${convUnread} new message${convUnread > 1 ? 's' : ''}` : 'Tap to open'}
                </Text>
              </View>
              {convUnread > 0
                ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{convUnread > 9 ? '9+' : convUnread}</Text></View>
                : <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  ) : null;

  // ── Right panel ────────────────────────────────────────────────────────────────

  const getChatUserInfo = () => {
    if (isInstructor && selectedStudentGroup && selectedConv) {
      return { user: selectedStudentGroup.user, subtitle: selectedConv.description || 'Student' };
    }
    if (selectedContact && activeChannel) {
      let subtitle = '';
      if (selectedContact.role === 'student') subtitle = 'Student';
      else if (selectedContact.role === 'superadmin') subtitle = 'Admin';
      else if (selectedContact.role === 'instructor') subtitle = 'Instructor';
      else if (selectedContact.role === 'sponsor') subtitle = 'Sponsor';
      else subtitle = selectedContact.role || 'Contact';
      if (isStudent && selectedCourse) subtitle += `  ·  📚 ${selectedCourse.name}`;
      return { user: selectedContact, subtitle };
    }
    return null;
  };

  const chatUserInfo = getChatUserInfo();

  const rightPanel = (() => {
    if (threadPicker) return threadPicker;
    if (coursePicker) return coursePicker;
    if (chatUserInfo) return chatPanel(chatUserInfo.user, chatUserInfo.subtitle);
    return (
      <View style={styles.rightPlaceholder}>
        <Icon name="chat-processing-outline" size={80} color={theme.colors.border} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>
          {isInstructor ? 'Chat Room' : isStudent ? 'My Chats' : 'Messages'}
        </Text>
        <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>
          Select a contact from the left to start chatting.
        </Text>
      </View>
    );
  })();

  // ── Banner config ──────────────────────────────────────────────────────────────

  const banner = isInstructor
    ? { icon: 'chat-processing', title: 'Chat Room', subtitle: 'Connect with students, colleagues & sponsors' }
    : isStudent
    ? { icon: 'message-text', title: 'My Chats', subtitle: 'Chat with your teachers and sponsors' }
    : { icon: 'message-text', title: 'Messages', subtitle: 'Chat with your students and teachers' };

  // ── Main render — IDENTICAL container/panel structure to TeacherChatScreen ─────

  return (
    <MainLayout showSidebar={true} showBack={false} activeRoute="Chat" onNavigate={(route) => navigation.navigate(route)}>
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isWeb ? { height: height - HEADER_HEIGHT, overflow: 'hidden' } : {},
      ]}>
        {/* Banner */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)',
          borderColor: 'rgba(0,122,61,0.15)',
        }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name={banner.icon} size={22} color="#007A3D" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>{banner.title}</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>{banner.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,122,61,0.08)', borderRadius: 20 }]}
            onPress={fetchData}
          >
            <Icon name="refresh" size={20} color="#007A3D" />
          </TouchableOpacity>
        </View>

        {/* Two-panel row */}
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

// Styles are IDENTICAL to the working TeacherChatScreen
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
  listFlex: { flex: 1 },
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
  iconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatar: { marginRight: 8, marginBottom: 4 },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  unreadBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  pickerSub: { fontSize: 13, marginBottom: 20, lineHeight: 18, color: '#888' },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  courseCard: { width: 160, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'flex-start', gap: 10 },
  courseCardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  courseCardName: { fontSize: 14, fontWeight: '600', lineHeight: 20, flex: 1 },
  courseCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  courseCardBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  threadRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  threadIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;
