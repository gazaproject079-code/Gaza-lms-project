import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import io from 'socket.io-client';
import api from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/ui/MainLayout';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const HEADER_HEIGHT = 62;

// ── Small reusable components ─────────────────────────────────────────────────

const getInitials = (name) =>
  (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const AvatarCircle = ({ name, size = 44, primaryColor }) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: (primaryColor || '#6366f1') + '22',
    justifyContent: 'center', alignItems: 'center',
  }}>
    <Text style={{ color: primaryColor || '#6366f1', fontSize: size * 0.34, fontWeight: '800' }}>
      {getInitials(name)}
    </Text>
  </View>
);

const UnreadBadge = ({ count }) => (
  <View style={styles.unreadBadge}>
    <Text style={styles.unreadBadgeText}>{count > 9 ? '9+' : count}</Text>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────

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

  // Mobile navigation state
  const [showChat, setShowChat] = useState(false);

  // Contact lists
  const [studentChannels, setStudentChannels] = useState([]);
  const [instructorList, setInstructorList] = useState([]);
  const [peerList, setPeerList] = useState([]);
  const [sponsorList, setSponsorList] = useState([]);
  const [allMyChannels, setAllMyChannels] = useState([]);
  const allMyChannelsRef = useRef([]);

  // Selection state
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const activeChannelRef = useRef(null);
  const channelMapRef = useRef({});

  // Messages
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedContact(null);
    setSelectedCourse(null);
    setSelectedStudentGroup(null);
    setSelectedConv(null);
    setActiveChannel(null);
    setMessages([]);
    setShowChat(false);
  }, [activeTab]);

  // Keep socket up-to-date with channel list
  useEffect(() => {
    allMyChannelsRef.current = allMyChannels;
    if (socketRef.current?.connected) {
      allMyChannels.forEach(c => socketRef.current.emit('joinChannel', c.id));
    }
  }, [allMyChannels]);

  // Socket.IO
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

  useEffect(() => { fetchData(); }, []);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setLoading(true);
      const channels = await api.get('/forum/direct-channels');
      setAllMyChannels(channels || []);

      const map = {};
      const initialUnread = {};
      (channels || []).forEach(c => {
        if (c.otherUser?.id) map[c.id] = c.otherUser.id;
        if (c.unreadCount > 0) initialUnread[c.id] = c.unreadCount;
      });
      channelMapRef.current = map;
      setUnreadCounts(initialUnread);

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
          .filter(c => {
            if (seen.has(c.otherUser?.id)) return false;
            seen.add(c.otherUser?.id);
            return true;
          });
        setStudentChannels(unique);
        setInstructorList(instructors || []);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load conversations' });
    } finally {
      setLoading(false);
    }
  };

  // ── Channel helpers ──────────────────────────────────────────────────────────

  const openChannel = async (channel) => {
    setLoadingMessages(true);
    setUnreadCounts(prev => { const n = { ...prev }; delete n[channel.id]; return n; });
    try {
      if (activeChannelRef.current) socketRef.current?.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current?.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      // Persist "read" so unread count resets even after logout/login
      api.post(`/forum/channels/${channel.id}/read`).catch(() => {});
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open conversation' });
    } finally {
      setLoadingMessages(false);
    }
  };

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

  // ── Message sending ──────────────────────────────────────────────────────────

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannel) return;
    socketRef.current?.emit('sendMessage', {
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

  // ── Contact selection handlers ───────────────────────────────────────────────

  const handleSelectStudentGroup = (group) => {
    setSelectedStudentGroup(group);
    setSelectedConv(null);
    setActiveChannel(null);
    setMessages([]);
    if (isMobile) setShowChat(true);
  };

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv);
    await openChannel(conv);
  };

  const handleSelectPeer = async (peer) => {
    setSelectedContact(peer);
    if (isMobile) setShowChat(true);
    await openDirectChannel(peer.id);
  };

  const handleSelectSponsor = async (sponsor) => {
    setSelectedContact(sponsor);
    if (isMobile) setShowChat(true);
    await openDirectChannel(sponsor.id);
  };

  const handleSelectInstructor = (instructor) => {
    setSelectedContact(instructor);
    setSelectedCourse(null);
    setActiveChannel(null);
    setMessages([]);
    if (isMobile) setShowChat(true);
  };

  const handleSelectCourse = async (instructor, course) => {
    setSelectedCourse(course);
    await openDirectChannel(instructor.id, course?.id || null, course?.name || null);
  };

  const handleSelectStudentChannel = async (channel) => {
    setSelectedContact(channel.otherUser);
    if (isMobile) setShowChat(true);
    await openChannel(channel);
  };

  // ── Tabs config ──────────────────────────────────────────────────────────────

  // Helper: sum unread counts across all channels with a given other-user id
  const unreadForUser = (userId) =>
    allMyChannels
      .filter(c => c.otherUser?.id === userId)
      .reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);

  const tabs = (() => {
    const studentsUnread  = studentChannels.reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);
    const peersUnread     = peerList.reduce((s, p) => s + unreadForUser(p.id), 0);
    const sponsorsUnread  = sponsorList.reduce((s, sp) => s + unreadForUser(sp.id), 0);
    const teachersUnread  = instructorList.reduce((s, ins) => s + unreadForUser(ins.id), 0);

    if (isInstructor) return [
      { key: 'students',    icon: 'school-outline', iconActive: 'school', label: 'Students',   unread: studentsUnread },
      { key: 'instructors', icon: 'people-outline', iconActive: 'people', label: 'Colleagues', unread: peersUnread },
      { key: 'sponsors',    icon: 'heart-outline',  iconActive: 'heart',  label: 'Sponsors',   unread: sponsorsUnread },
    ];
    if (isStudent) return [
      { key: 'teachers', icon: 'person-outline', iconActive: 'person', label: 'Teachers', unread: teachersUnread },
      { key: 'sponsors', icon: 'heart-outline',  iconActive: 'heart',  label: 'Sponsors', unread: sponsorsUnread },
    ];
    // sponsor
    return [
      { key: 'students', icon: 'school-outline', iconActive: 'school', label: 'My Students', unread: studentsUnread },
      { key: 'teachers', icon: 'people-outline', iconActive: 'people', label: 'Teachers',    unread: teachersUnread },
    ];
  })();

  // ── Empty state ──────────────────────────────────────────────────────────────

  const EmptyState = ({ icon, text, sub }) => (
    <View style={styles.emptyState}>
      <Icon name={icon} size={44} color={theme.colors.textSecondary + '50'} />
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>{text}</Text>
      {sub ? <Text style={[styles.emptyStateSub, { color: theme.colors.textSecondary }]}>{sub}</Text> : null}
    </View>
  );

  // ── Contact row ──────────────────────────────────────────────────────────────

  const ContactRow = ({ person, label, onPress, isSelected, unread = 0 }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.contactRow,
        { borderBottomColor: theme.colors.border },
        isSelected && { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)' },
      ]}
    >
      {isSelected && <View style={[styles.selectedBar, { backgroundColor: theme.colors.primary }]} />}
      <View style={{ position: 'relative', flexShrink: 0 }}>
        <AvatarCircle name={person.name} primaryColor={theme.colors.primary} />
        {unread > 0 && <UnreadBadge count={unread} />}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={[styles.contactName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '600' }]}
          numberOfLines={1}
        >
          {person.name}
        </Text>
        <Text
          style={[styles.contactLabel, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={theme.colors.textSecondary + '80'} />
    </TouchableOpacity>
  );

  // ── Left panel: contacts list by tab ────────────────────────────────────────

  const renderContacts = () => {
    if (loading) return <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 48 }} />;

    if (isInstructor) {
      if (activeTab === 'students') {
        const groups = Object.values(
          studentChannels.reduce((acc, conv) => {
            const uid = conv.otherUser?.id;
            if (!uid) return acc;
            if (!acc[uid]) acc[uid] = { user: conv.otherUser, convs: [] };
            acc[uid].convs.push(conv);
            return acc;
          }, {})
        );
        if (groups.length === 0) return <EmptyState icon="school-outline" text="No student messages yet" />;
        return groups.map(group => {
          const totalUnread = group.convs.reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);
          return (
            <ContactRow
              key={group.user?.id}
              person={group.user || {}}
              label={`Student · ${group.convs.length} thread${group.convs.length !== 1 ? 's' : ''}`}
              isSelected={selectedStudentGroup?.user?.id === group.user?.id}
              unread={totalUnread}
              onPress={() => {
                if (group.convs.length === 1) {
                  setSelectedStudentGroup(group);
                  setSelectedConv(group.convs[0]);
                  if (isMobile) setShowChat(true);
                  openChannel(group.convs[0]);
                } else {
                  handleSelectStudentGroup(group);
                }
              }}
            />
          );
        });
      }
      if (activeTab === 'instructors') {
        if (peerList.length === 0) return <EmptyState icon="people-outline" text="No colleagues found" />;
        return peerList.map(item => {
          const unread = unreadForUser(item.id);
          return (
            <ContactRow key={item.id} person={item}
              label={item.role === 'superadmin' ? 'Admin' : 'Instructor'}
              isSelected={selectedContact?.id === item.id}
              unread={unread}
              onPress={() => handleSelectPeer(item)}
            />
          );
        });
      }
      if (activeTab === 'sponsors') {
        if (sponsorList.length === 0) return <EmptyState icon="heart-outline" text="No sponsors yet" />;
        return sponsorList.map(item => {
          const unread = unreadForUser(item.id);
          return (
            <ContactRow key={item.id} person={item} label="Sponsor"
              isSelected={selectedContact?.id === item.id}
              unread={unread}
              onPress={() => handleSelectSponsor(item)}
            />
          );
        });
      }
    }

    if (isStudent) {
      if (activeTab === 'teachers') {
        if (instructorList.length === 0) return <EmptyState icon="person-outline" text="No teachers found" />;
        return instructorList.map(item => {
          const myChans = allMyChannels.filter(c => c.otherUser?.id === item.id);
          const unread = myChans.reduce((s, c) => s + (unreadCounts[c.id] || 0), 0);
          return (
            <ContactRow key={item.id} person={item}
              label={item.role === 'superadmin' ? 'Admin' : `Instructor${(item.courses || []).length > 0 ? ` · ${item.courses.length} course${item.courses.length > 1 ? 's' : ''}` : ''}`}
              isSelected={selectedContact?.id === item.id}
              unread={unread}
              onPress={() => handleSelectInstructor(item)}
            />
          );
        });
      }
      if (activeTab === 'sponsors') {
        if (sponsorList.length === 0) return <EmptyState icon="heart-outline" text="No sponsors yet" sub="Wait for a sponsor to support you." />;
        return sponsorList.map(item => {
          const unread = unreadForUser(item.id);
          return (
            <ContactRow key={item.id} person={item} label="My Sponsor"
              isSelected={selectedContact?.id === item.id}
              unread={unread}
              onPress={() => handleSelectSponsor(item)}
            />
          );
        });
      }
    }

    if (isSponsor) {
      if (activeTab === 'students') {
        if (studentChannels.length === 0) return <EmptyState icon="school-outline" text="No students yet" sub="Sponsor a student to start chatting." />;
        return studentChannels.map(channel => (
          <ContactRow key={channel.id} person={channel.otherUser || {}} label="Sponsored Student"
            isSelected={activeChannel?.id === channel.id}
            unread={unreadCounts[channel.id] || 0}
            onPress={() => handleSelectStudentChannel(channel)}
          />
        ));
      }
      if (activeTab === 'teachers') {
        if (instructorList.length === 0) return <EmptyState icon="people-outline" text="No teachers found" />;
        return instructorList.map(item => {
          const chId = Object.entries(channelMapRef.current).find(([, uid]) => uid === item.id)?.[0];
          return (
            <ContactRow key={item.id} person={item}
              label={item.role === 'superadmin' ? 'Admin' : 'Instructor'}
              isSelected={selectedContact?.id === item.id}
              unread={chId ? (unreadCounts[chId] || 0) : 0}
              onPress={() => handleSelectPeer(item)}
            />
          );
        });
      }
    }

    return null;
  };

  // ── Right panel: thread picker (instructor clicks a student with multiple threads) ──

  const renderThreadPicker = () => (
    <View style={styles.pickerColumn}>
      <View style={[styles.pickerHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {isMobile && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowChat(false)}>
            <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <AvatarCircle name={selectedStudentGroup?.user?.name} primaryColor={theme.colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.panelHeaderName, { color: theme.colors.textPrimary }]}>{selectedStudentGroup?.user?.name}</Text>
          <Text style={[styles.panelHeaderSub, { color: theme.colors.textSecondary }]}>Select a conversation thread</Text>
        </View>
      </View>
      <ScrollView style={styles.pickerScroll} contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>Conversation Threads</Text>
        <Text style={[styles.pickerSub, { color: theme.colors.textSecondary }]}>
          This student has started separate conversations for each course.
        </Text>
        {(selectedStudentGroup?.convs || []).map(conv => {
          const courseName = conv.name?.startsWith('direct-course-') ? conv.description : null;
          const convUnread = unreadCounts[conv.id] || 0;
          return (
            <TouchableOpacity
              key={conv.id}
              style={[styles.threadCard, {
                backgroundColor: theme.colors.surface,
                borderColor: convUnread > 0 ? (theme.colors.primary + '70') : theme.colors.border,
              }]}
              onPress={() => handleSelectConv(conv)}
              activeOpacity={0.75}
            >
              <View style={[styles.threadIcon, {
                backgroundColor: courseName ? (theme.colors.primary + '18') : 'rgba(150,150,150,0.1)',
              }]}>
                <Icon name={courseName ? 'book-outline' : 'chatbubble-outline'} size={20}
                  color={courseName ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.threadName, { color: theme.colors.textPrimary, fontWeight: convUnread > 0 ? '800' : '600' }]}>
                  {courseName || 'General Chat'}
                </Text>
                <Text style={[styles.threadSub, { color: convUnread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>
                  {convUnread > 0 ? `${convUnread} new message${convUnread > 1 ? 's' : ''}` : courseName ? 'Course thread' : 'General thread'}
                </Text>
              </View>
              {convUnread > 0
                ? <UnreadBadge count={convUnread} />
                : <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary + '80'} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Right panel: course picker (student picks which course to discuss) ────────

  const renderCoursePicker = () => (
    <View style={styles.pickerColumn}>
      <View style={[styles.pickerHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {isMobile && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowChat(false)}>
            <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <AvatarCircle name={selectedContact?.name} primaryColor={theme.colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.panelHeaderName, { color: theme.colors.textPrimary }]}>{selectedContact?.name}</Text>
          <Text style={[styles.panelHeaderSub, { color: theme.colors.textSecondary }]}>
            {selectedContact?.role === 'superadmin' ? 'Admin' : 'Instructor'} · Choose a topic
          </Text>
        </View>
      </View>
      <ScrollView style={styles.pickerScroll} contentContainerStyle={{ padding: 24 }}>
        <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>What would you like to discuss?</Text>
        <Text style={[styles.pickerSub, { color: theme.colors.textSecondary }]}>
          Each course gets its own separate conversation thread.
        </Text>
        <View style={styles.courseGrid}>
          {(selectedContact?.courses || []).map(course => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleSelectCourse(selectedContact, course)}
              activeOpacity={0.75}
            >
              <View style={[styles.courseCardIcon, { backgroundColor: theme.colors.primary + '18' }]}>
                <Icon name="book-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.courseCardName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                {course.name}
              </Text>
              <View style={[styles.courseCardBtn, { backgroundColor: theme.colors.primary }]}>
                <Icon name="chatbubble-outline" size={13} color="#fff" />
                <Text style={styles.courseCardBtnText}>Open Chat</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.courseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handleSelectCourse(selectedContact, null)}
            activeOpacity={0.75}
          >
            <View style={[styles.courseCardIcon, { backgroundColor: 'rgba(150,150,150,0.1)' }]}>
              <Icon name="chatbubble-outline" size={22} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.courseCardName, { color: theme.colors.textPrimary }]}>General</Text>
            <View style={[styles.courseCardBtn, { backgroundColor: isDark ? '#2a2a3e' : '#e8e8e8' }]}>
              <Icon name="chatbubble-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={[styles.courseCardBtnText, { color: theme.colors.textSecondary }]}>Open Chat</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ── Right panel: messages + pinned input ──────────────────────────────────────
  //
  // LAYOUT GUARANTEE (mirrors AIChatScreen.js which is proven to work):
  //   chatColumn  → flex:1, flexDirection:'column', overflow:'hidden', minHeight:0
  //     chatHeader  → fixed height
  //     ScrollView  → flex:1                   ← ONLY scrollable part
  //     inputArea   → fixed height, sibling    ← ALWAYS pinned at bottom

  const renderChat = (chatUser, subtitle) => (
    <View style={styles.chatColumn}>
      {/* ── Chat header ── */}
      <View style={[styles.chatHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {isMobile && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowChat(false)}>
            <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <AvatarCircle name={chatUser?.name} size={40} primaryColor={theme.colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.panelHeaderName, { color: theme.colors.textPrimary }]}>
            {chatUser?.name || 'Unknown'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <View style={styles.onlineDot} />
            <Text style={[styles.panelHeaderSub, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
          </View>
        </View>
        {selectedStudentGroup && selectedConv && (
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => { setSelectedConv(null); setActiveChannel(null); setMessages([]); }}
          >
            <Icon name="list-outline" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Messages — THE ONLY SCROLLABLE AREA IN THE CHAT COLUMN ── */}
      {loadingMessages ? (
        <View style={styles.loadingMessages}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIcon, { backgroundColor: theme.colors.primary + '12' }]}>
                <Icon name="chatbubble-ellipses-outline" size={36} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyChatTitle, { color: theme.colors.textPrimary }]}>Start the conversation</Text>
              <Text style={[styles.emptyChatSub, { color: theme.colors.textSecondary }]}>
                Send a message to begin chatting with {chatUser?.name}.
              </Text>
            </View>
          ) : (
            messages.map(item => {
              const isMe = item.senderId === user?.id;
              return (
                <View key={item.id?.toString()} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                  {!isMe && (
                    <View style={[styles.msgAvatar, { backgroundColor: theme.colors.primary + '18' }]}>
                      <Text style={[styles.msgAvatarText, { color: theme.colors.primary }]}>
                        {getInitials(item.sender?.name)}
                      </Text>
                    </View>
                  )}
                  <View style={[
                    styles.msgBubble,
                    isMe
                      ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 }
                      : {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f4',
                          borderBottomLeftRadius: 4,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        },
                  ]}>
                    {!isMe && (
                      <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                        {item.sender?.name}
                      </Text>
                    )}
                    <Text style={[styles.msgText, { color: isMe ? '#fff' : theme.colors.textPrimary }]}>
                      {item.content}
                    </Text>
                    <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.55)' : theme.colors.textSecondary }]}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Input area — PINNED AT BOTTOM, NEVER SCROLLS ── */}
      <View style={[styles.inputArea, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <View style={[styles.inputBox, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f7',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }]}>
          <TextInput
            style={[styles.textInput, { color: theme.colors.textPrimary }]}
            placeholder="Type a message…"
            placeholderTextColor={theme.colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onKeyPress={handleKeyPress}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, {
              backgroundColor: inputText.trim() ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : '#e0e0e0'),
            }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Icon name="send" size={16} color={inputText.trim() ? '#fff' : theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.inputHint, { color: theme.colors.textSecondary + '90' }]}>
          Enter to send · Shift+Enter for new line
        </Text>
      </View>
    </View>
  );

  // ── Decide what to render in the right panel ─────────────────────────────────

  const getChatInfo = () => {
    if (isInstructor && selectedStudentGroup && selectedConv) {
      const isCourseThread = selectedConv.name?.startsWith('direct-course-');
      const subtitle = isCourseThread
        ? `Student  ·  ${selectedConv.description || 'Course Chat'}`
        : 'Student  ·  General Chat';
      return { chatUser: selectedStudentGroup.user, subtitle };
    }
    if (selectedContact && activeChannel) {
      let subtitle = '';
      if (selectedContact.role === 'student') subtitle = 'Student';
      else if (selectedContact.role === 'superadmin') subtitle = 'Admin';
      else if (selectedContact.role === 'instructor') subtitle = 'Instructor';
      else if (selectedContact.role === 'sponsor') subtitle = 'Sponsor';
      else subtitle = selectedContact.role || 'Contact';
      if (isStudent && selectedCourse) subtitle += `  ·  ${selectedCourse.name}`;
      return { chatUser: selectedContact, subtitle };
    }
    return null;
  };

  const chatInfo = getChatInfo();

  const rightContent = (() => {
    if (isInstructor && selectedStudentGroup && !selectedConv) return renderThreadPicker();
    if (isStudent && selectedContact && !activeChannel) return renderCoursePicker();
    if (chatInfo) return renderChat(chatInfo.chatUser, chatInfo.subtitle);

    const placeholder = isInstructor
      ? { icon: 'chatbubble-ellipses-outline', title: 'Chat Room', sub: 'Select a contact on the left to start a conversation.' }
      : isStudent
      ? { icon: 'chatbubble-outline', title: 'My Chats', sub: 'Choose a teacher or sponsor to start chatting.' }
      : { icon: 'chatbubble-outline', title: 'Messages', sub: 'Select a student or teacher to start chatting.' };

    return (
      <View style={styles.placeholder}>
        <View style={[styles.placeholderIconBg, { backgroundColor: theme.colors.primary + '10' }]}>
          <Icon name={placeholder.icon} size={42} color={theme.colors.primary} />
        </View>
        <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>{placeholder.title}</Text>
        <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>{placeholder.sub}</Text>
      </View>
    );
  })();

  // ── Banner config ─────────────────────────────────────────────────────────────

  const bannerConfig = isInstructor
    ? { icon: 'chatbubble-ellipses-outline', title: 'Chat Room',  sub: 'Connect with students, colleagues & sponsors' }
    : isStudent
    ? { icon: 'chatbubble-outline',           title: 'My Chats',  sub: 'Chat with your teachers and sponsors' }
    : { icon: 'chatbubble-outline',           title: 'Messages',  sub: 'Chat with your students and teachers' };

  // ── Main render ───────────────────────────────────────────────────────────────
  //
  // ROOT LAYOUT (mirrors proven AIChatScreen pattern):
  //   container → flexDirection:'column'  +  isWeb: explicit height + overflow:'hidden'
  //     banner  → fixed height
  //     panels  → flex:1, flexDirection:'row', overflow:'hidden', minHeight:0
  //       leftPanel  → fixed width 290, flexDirection:'column', overflow:'hidden', minHeight:0
  //         tabBar   → fixed height
  //         ScrollView (contacts) → flex:1   ← SCROLLABLE
  //       rightPanel → flex:1, flexDirection:'column', overflow:'hidden', minHeight:0
  //         [ chatColumn OR pickerColumn OR placeholder ]

  const bodyHeight = isWeb ? height - HEADER_HEIGHT : undefined;

  return (
    <MainLayout showSidebar activeRoute="Chat" onNavigate={r => navigation.navigate(r)}>
      {/* ── Outer container: explicit pixel height on web so content never overflows ── */}
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isWeb ? { height: bodyHeight, overflow: 'hidden' } : { flex: 1 },
      ]}>

        {/* ── Page banner (design unchanged from original) ── */}
        <View style={[styles.banner, {
          backgroundColor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)',
          borderColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)',
        }]}>
          <TouchableOpacity
            style={[styles.bannerBack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.bannerIconBg, { backgroundColor: theme.colors.primary + '18' }]}>
            <Icon name={bannerConfig.icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>{bannerConfig.title}</Text>
            <Text style={[styles.bannerSub, { color: theme.colors.textSecondary }]}>{bannerConfig.sub}</Text>
          </View>
          <TouchableOpacity
            style={[styles.bannerAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)' }]}
            onPress={fetchData}
          >
            <Icon name="refresh-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Two-panel body ── */}
        <View style={styles.panels}>

          {/* ── LEFT PANEL: contacts sidebar (scrollable) ── */}
          {(!isMobile || !showChat) && (
            <View style={[
              styles.leftPanel,
              { borderRightColor: theme.colors.border, backgroundColor: isDark ? theme.colors.surface : '#fafafa' },
              isMobile && { width: '100%' },
            ]}>
              {/* Tab bar */}
              <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
                {tabs.map(tab => {
                  const active = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, active && { borderBottomColor: theme.colors.primary }]}
                      onPress={() => setActiveTab(tab.key)}
                    >
                      <Icon
                        name={active ? tab.iconActive : tab.icon}
                        size={14}
                        color={active ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text style={[styles.tabLabel, {
                        color: active ? theme.colors.primary : theme.colors.textSecondary,
                        fontWeight: active ? '700' : '500',
                      }]}>
                        {tab.label}
                      </Text>
                      {tab.unread > 0 && (
                        <View style={styles.tabBadge}>
                          <Text style={styles.tabBadgeText}>{tab.unread > 9 ? '9+' : tab.unread}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Contacts — scrollable */}
              <ScrollView
                style={styles.contactsScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 6 }}
              >
                {renderContacts()}
              </ScrollView>
            </View>
          )}

          {/* ── RIGHT PANEL: chat area ── */}
          {(!isMobile || showChat) && (
            <View style={styles.rightPanel}>
              {rightContent}
            </View>
          )}

        </View>
      </View>
    </MainLayout>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Root container — flex column; on web gets explicit pixel height to prevent overflow
  container: {
    flexDirection: 'column',
    minHeight: 0,
  },

  // ── Banner ──
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 14,
    marginBottom: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 1,
  },
  bannerSub: {
    fontSize: 12,
  },
  bannerAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Two-panel row ──
  panels: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    overflow: 'hidden',
  },

  // ── Left panel ── fixed width, contacts scroll inside
  leftPanel: {
    width: 290,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    borderRightWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 11,
  },
  tabBadge: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  // Contacts list — the SCROLLABLE part of the left panel
  contactsScroll: {
    flex: 1,
  },

  // ── Contact row ──
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: 3,
    borderRadius: 2,
  },
  contactName: {
    fontSize: 14,
  },
  contactLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  // ── Unread badge ──
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Right panel ── takes all remaining horizontal space
  rightPanel: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },

  // ── Chat column ── the core layout that pins input at bottom
  chatColumn: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  panelHeaderName: {
    fontSize: 15,
    fontWeight: '700',
  },
  panelHeaderSub: {
    fontSize: 11,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Messages ScrollView — ONLY scrollable part of chat column
  loadingMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  messagesContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyChat: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyChatIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyChatTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyChatSub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },

  // Message bubbles
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  msgAvatarText: {
    fontSize: 10,
    fontWeight: '800',
  },
  msgBubble: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'right',
  },

  // ── Input area — pinned sibling of messagesList ──
  inputArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
    minHeight: 22,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  inputHint: {
    fontSize: 10,
    textAlign: 'center',
  },

  // ── Picker column (thread picker / course picker) ──
  pickerColumn: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerScroll: {
    flex: 1,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  pickerSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },

  // Thread cards
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  threadIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadName: {
    fontSize: 14,
    marginBottom: 3,
  },
  threadSub: {
    fontSize: 12,
  },

  // Course grid
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseCard: {
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  courseCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseCardName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  courseCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  courseCardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Placeholder (no contact selected) ──
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  placeholderIconBg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholderSub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 19,
  },

  // ── Empty state in contacts list ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 52,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});

export default ChatScreen;
