import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
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

const TeacherChatScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

  const [usersList, setUsersList] = useState([]);
  const [peersList, setPeersList] = useState([]);
  const [sponsorsList, setSponsorsList] = useState([]);
  const [studentActiveTab, setStudentActiveTab] = useState('teachers'); // 'teachers' | 'sponsors'
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const sponsorChannelMapRef = useRef({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // { [userId]: count }
  const [lastActivity, setLastActivity] = useState({});  // { [userId]: timestamp } for sorting
  const [myChannels, setMyChannels] = useState([]);      // student's own DM channels

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const activeChannelRef = useRef(null);
  const channelUserMapRef = useRef({});
  // Ref mirrors myChannels so socket 'connect' handler always has current list
  const myChannelsRef = useRef([]);

  const isTeacher = user?.role === 'instructor' || user?.role === 'superadmin';

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  // Keep ref in sync AND immediately join rooms if socket already connected
  useEffect(() => {
    myChannelsRef.current = myChannels;
    if (socketRef.current?.connected && myChannels.length > 0) {
      myChannels.forEach(c => socketRef.current.emit('joinChannel', c.id));
    }
  }, [myChannels]);

  // Fetch user list once on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        if (isTeacher) {
          const [students, peers, channels] = await Promise.all([
            api.get('/forum/students'),
            api.get('/forum/peers'),
            api.get('/forum/direct-channels'),
          ]);
          setUsersList(students || []);
          setPeersList(peers || []);
          setMyChannels(channels || []);
          // Build channel→user map so teacher receives unread events for all rooms
          const chanMap = {};
          (channels || []).forEach(ch => {
            if (ch.otherUser?.id) chanMap[ch.id] = ch.otherUser.id;
          });
          channelUserMapRef.current = chanMap;
        } else {
          const [instructors, channels, sponsors] = await Promise.all([
            api.get('/forum/instructors'),
            api.get('/forum/direct-channels'),
            api.get('/sponsorships/my-sponsors'),
          ]);
          setUsersList(instructors || []);
          setMyChannels(channels || []);
          setSponsorsList(sponsors || []);
          // Build channel→user map and initial lastActivity from existing channel history
          const chanMap = {};
          const actMap = {};
          (channels || []).forEach(ch => {
            if (ch.otherUser?.id) {
              chanMap[ch.id] = ch.otherUser.id;
              const t = new Date(ch.updatedAt).getTime();
              if (!actMap[ch.otherUser.id] || t > actMap[ch.otherUser.id]) actMap[ch.otherUser.id] = t;
            }
          });
          channelUserMapRef.current = chanMap;
          setLastActivity(actMap);
        }
      } catch (err) {
        console.error('Failed to load chat users:', err);
        Toast.show({ type: 'error', text1: 'Failed to load user list' });
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    // Re-join all rooms on every connect/reconnect using the ref (no stale closure)
    socket.on('connect', () => {
      myChannelsRef.current.forEach(c => socket.emit('joinChannel', c.id));
    });

    socket.on('newMessage', (msg) => {
      const current = activeChannelRef.current;
      if (current && msg.channelId === current.id) {
        setMessages((prev) => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        const userId = channelUserMapRef.current[msg.channelId];
        if (userId) {
          setUnreadCounts(prev => ({ ...prev, [userId]: (prev[userId] || 0) + 1 }));
          setLastActivity(prev => ({ ...prev, [userId]: Date.now() }));
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  // Used by instructor/admin (and peer-to-peer) to open a direct chat — no course context
  const handleSelectUser = async (targetUser) => {
    setSelectedUser(targetUser);
    setSelectedCourse(null);
    setLoadingMessages(true);
    if (isMobile) setShowMobileChat(true);

    try {
      const channel = await api.post('/forum/channels/direct', { targetUserId: targetUser.id });
      channelUserMapRef.current[channel.id] = targetUser.id;
      setUnreadCounts(prev => { const n = { ...prev }; delete n[targetUser.id]; return n; });
      setLastActivity(prev => ({ ...prev, [targetUser.id]: Date.now() }));
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.error('Error starting direct chat:', err);
      Toast.show({ type: 'error', text1: 'Failed to open chat window' });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Used by students: tap instructor → show course picker in right panel (no channel yet)
  const handleSelectInstructor = (instructor) => {
    setSelectedUser(instructor);
    setSelectedCourse(null);
    setActiveChannel(null);
    setMessages([]);
    if (isMobile) setShowMobileChat(true);
  };

  // Used by students to open a course-specific chat with an instructor
  const handleSelectCourse = async (instructor, course) => {
    setSelectedUser(instructor);
    setSelectedCourse(course);
    setLoadingMessages(true);
    if (isMobile) setShowMobileChat(true);

    try {
      const channel = await api.post('/forum/channels/direct', {
        targetUserId: instructor.id,
        courseId: course?.id || null,
        courseName: course?.name || null,
      });
      channelUserMapRef.current[channel.id] = instructor.id;
      setUnreadCounts(prev => { const n = { ...prev }; delete n[instructor.id]; return n; });
      setLastActivity(prev => ({ ...prev, [instructor.id]: Date.now() }));
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.error('Error starting course chat:', err);
      Toast.show({ type: 'error', text1: 'Failed to open chat' });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectSponsor = async (sponsor) => {
    setSelectedSponsor(sponsor);
    setSelectedUser(null);
    setSelectedCourse(null);
    setActiveChannel(null);
    setMessages([]);
    setLoadingMessages(true);
    if (isMobile) setShowMobileChat(true);
    try {
      // Use the existing direct channel created when sponsor sponsored this student
      const channel = await api.post('/forum/channels/direct', { targetUserId: sponsor.id });
      sponsorChannelMapRef.current[channel.id] = sponsor.id;
      setUnreadCounts(prev => { const n = { ...prev }; delete n[sponsor.id]; return n; });
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to open sponsor chat' });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannel) return;
    socketRef.current.emit('sendMessage', {
      channelId: activeChannel.id,
      senderId: user.id,
      content: inputText.trim()
    });
    setInputText('');
  };

  const filteredUsers = usersList
    .filter(u => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      const matchUser = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchCourse = !isTeacher && (u.courses || []).some(c => c.name.toLowerCase().includes(q));
      return matchUser || matchCourse;
    })
    .sort((a, b) => (lastActivity[b.id] || 0) - (lastActivity[a.id] || 0));

  const filteredPeers = peersList
    .filter(p => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    })
    .sort((a, b) => (lastActivity[b.id] || 0) - (lastActivity[a.id] || 0));

  // Flat person row used for both peers and students in teacher view
  const renderPersonRow = (person, label) => {
    const isSelected = selectedUser?.id === person.id && !selectedCourse;
    const unread = unreadCounts[person.id] || 0;
    return (
      <TouchableOpacity
        key={person.id}
        style={[
          styles.userItem,
          { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }
        ]}
        onPress={() => handleSelectUser(person)}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text
            size={44}
            label={person.name.substring(0, 2).toUpperCase()}
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
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>{person.name}</Text>
          <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary, fontWeight: unread > 0 ? '700' : '400' }]}>{label}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const handleKeyPress = (e) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderUserItem = ({ item }) => {
    // ── Student view: one WhatsApp-style row per instructor ──
    const isSelected = selectedUser?.id === item.id;
    const courseCount = (item.courses || []).length;
    const unread = unreadCounts[item.id] || 0;
    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }
        ]}
        onPress={() => handleSelectInstructor(item)}
        activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text
            size={44}
            label={item.name.substring(0, 2).toUpperCase()}
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
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>{item.name}</Text>
          <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary, fontWeight: unread > 0 ? '700' : '400' }]}>
            {item.role === 'superadmin' ? 'Admin' : 'Instructor'}
            {courseCount > 0 ? `  ·  ${courseCount} course${courseCount > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <Avatar.Text
            size={32}
            label={item.sender?.name.substring(0, 2).toUpperCase() || '??'}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ fontSize: 11, color: '#fff' }}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isMe
              ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 }
              : { backgroundColor: isDark ? '#2C2C3E' : '#EAEAEA', borderBottomLeftRadius: 2 }
          ]}
        >
          {!isMe && (
            <Text style={[styles.messageSender, { color: theme.colors.primary, fontWeight: '700' }]}>
              {item.sender?.name}
            </Text>
          )}
          <Text style={{ color: isMe ? '#fff' : theme.colors.textPrimary, fontSize: 15, lineHeight: 20 }}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary, alignSelf: isMe ? 'flex-end' : 'flex-start' }
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const leftPanel = (
    <View style={[styles.leftPanel, { borderRightColor: theme.colors.border }]}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search conversation..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {loadingUsers ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : isTeacher ? (
        // ── Teacher view: two sections ──
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          ListHeaderComponent={
            <>
              {/* Instructors & Admins section */}
              {filteredPeers.length > 0 && (
                <>
                  <View style={[styles.sectionLabel, { borderBottomColor: theme.colors.border }]}>
                    <Icon name="account-group" size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.sectionLabelText, { color: theme.colors.textSecondary }]}>INSTRUCTORS & ADMINS</Text>
                  </View>
                  {filteredPeers.map(p => renderPersonRow(p, p.role === 'superadmin' ? 'Admin' : 'Instructor'))}
                </>
              )}

              {/* Divider between sections */}
              {filteredPeers.length > 0 && filteredUsers.length > 0 && (
                <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />
              )}

              {/* Students section */}
              {filteredUsers.length > 0 && (
                <>
                  <View style={[styles.sectionLabel, { borderBottomColor: theme.colors.border }]}>
                    <Icon name="school" size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.sectionLabelText, { color: theme.colors.textSecondary }]}>STUDENTS</Text>
                  </View>
                  {filteredUsers.map(item => (
                    renderPersonRow(item, 'Student')
                  ))}
                </>
              )}

              {filteredPeers.length === 0 && filteredUsers.length === 0 && (
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No conversations found.</Text>
              )}
            </>
          }
        />
      ) : (
        // ── Student view: tab bar + teachers or sponsors ──
        <>
          {(() => {
            const teacherUnreadTotal = usersList.reduce((sum, u) => sum + (unreadCounts[u.id] || 0), 0);
            const sponsorUnreadTotal = sponsorsList.reduce((sum, s) => sum + (unreadCounts[s.id] || 0), 0);
            return (
              <View style={[styles.tabBar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  style={[styles.tab, studentActiveTab === 'teachers' && { borderBottomColor: theme.colors.primary }]}
                  onPress={() => { setStudentActiveTab('teachers'); setSelectedSponsor(null); setActiveChannel(null); setMessages([]); setShowMobileChat(false); }}
                >
                  <Icon name="account-tie" size={15} color={studentActiveTab === 'teachers' ? theme.colors.primary : theme.colors.textSecondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.tabText, { color: studentActiveTab === 'teachers' ? theme.colors.primary : theme.colors.textSecondary }]}>Teachers</Text>
                  {teacherUnreadTotal > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{teacherUnreadTotal > 9 ? '9+' : teacherUnreadTotal}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, studentActiveTab === 'sponsors' && { borderBottomColor: theme.colors.primary }]}
                  onPress={() => { setStudentActiveTab('sponsors'); setSelectedUser(null); setSelectedCourse(null); setActiveChannel(null); setMessages([]); setShowMobileChat(false); }}
                >
                  <Icon name="heart" size={15} color={studentActiveTab === 'sponsors' ? theme.colors.primary : theme.colors.textSecondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.tabText, { color: studentActiveTab === 'sponsors' ? theme.colors.primary : theme.colors.textSecondary }]}>My Sponsors</Text>
                  {sponsorUnreadTotal > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{sponsorUnreadTotal > 9 ? '9+' : sponsorUnreadTotal}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })()}
          {studentActiveTab === 'teachers' ? (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No conversations found.</Text>
              }
            />
          ) : (
            <FlatList
              data={sponsorsList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedSponsor?.id === item.id;
                const unread = unreadCounts[item.id] || 0;
                return (
                  <TouchableOpacity
                    style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
                    onPress={() => handleSelectSponsor(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ position: 'relative' }}>
                      <Avatar.Text
                        size={44}
                        label={item.name.substring(0, 2).toUpperCase()}
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
                      <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>{item.name}</Text>
                      <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>My Sponsor</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 24 }}>
                  <Icon name="heart-outline" size={54} color={theme.colors.border} />
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>You don't have a sponsor yet.</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );

  // Student selected an instructor but hasn't picked a course yet — show course picker
  const coursePicker = selectedUser && !isTeacher && !activeChannel ? (
    <View style={{ flex: 1 }}>
      {/* Course picker header */}
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text
          size={40}
          label={selectedUser.name.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
          labelStyle={{ color: '#fff' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{selectedUser.name}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>
            {selectedUser.role === 'superadmin' ? 'Admin' : 'Instructor'}  ·  Choose a course to chat about
          </Text>
        </View>
      </View>

      {/* Course grid */}
      <View style={[styles.coursePickerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.coursePickerTitle, { color: theme.colors.textPrimary }]}>
          What would you like to discuss?
        </Text>
        <Text style={[styles.coursePickerSub, { color: theme.colors.textSecondary }]}>
          Each course has its own separate conversation thread.
        </Text>
        <View style={styles.courseGrid}>
          {(selectedUser.courses || []).map(course => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleSelectCourse(selectedUser, course)}
              activeOpacity={0.75}
            >
              <View style={[styles.courseCardIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon name="book-open-variant" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.courseCardName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                {course.name}
              </Text>
              <View style={[styles.courseCardBtn, { backgroundColor: theme.colors.primary }]}>
                <Icon name="message-text" size={14} color="#fff" />
                <Text style={styles.courseCardBtnText}>Open Chat</Text>
              </View>
            </TouchableOpacity>
          ))}
          {/* General chat option */}
          <TouchableOpacity
            style={[styles.courseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handleSelectCourse(selectedUser, null)}
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
      </View>
    </View>
  ) : null;

  // Sponsor chat panel (student side)
  const sponsorChatPanel = selectedSponsor && activeChannel ? (
    <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text size={40} label={selectedSponsor.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: theme.colors.primary }} labelStyle={{ color: '#fff' }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{selectedSponsor.name}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>My Sponsor</Text>
        </View>
      </View>
      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 40 }} />
      ) : (
        <ScrollView ref={flatListRef} style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })} showsVerticalScrollIndicator={false}>
          {messages.map(item => (
            <React.Fragment key={item.id.toString()}>{renderMessage({ item })}</React.Fragment>
          ))}
        </ScrollView>
      )}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
          placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
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
  ) : selectedSponsor ? (
    <View style={styles.rightPlaceholder}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  ) : null;

  const rightPanel = (!selectedUser && !selectedSponsor) ? (
    <View style={styles.rightPlaceholder}>
      <Icon name="chat-processing-outline" size={80} color={theme.colors.border} />
      <Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>Teacher Chat Room</Text>
      <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>
        {isTeacher
          ? 'Select a student from the sidebar to view details and start chatting.'
          : 'Select one of your instructors to ask questions or discuss lectures.'}
      </Text>
    </View>
  ) : selectedSponsor ? sponsorChatPanel
  : coursePicker ? coursePicker : (
    <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Chat Header */}
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text
          size={40}
          label={selectedUser.name.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
          labelStyle={{ color: '#fff' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{selectedUser.name}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>
            {selectedUser.role === 'superadmin' ? 'Admin' : selectedUser.role === 'instructor' ? 'Instructor' : 'Student'}
            {selectedCourse ? `  ·  📚 ${selectedCourse.name}` : ''}
          </Text>
        </View>
      </View>

      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={flatListRef}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <React.Fragment key={item.id.toString()}>
              {renderMessage({ item })}
            </React.Fragment>
          ))}
        </ScrollView>
      )}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
          placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
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

  return (
    <MainLayout showSidebar={true} showBack={false} activeRoute="TeacherChat" onNavigate={(route) => navigation.navigate(route)}>
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        isWeb ? { height: height - HEADER_HEIGHT, overflow: 'hidden' } : {},
      ]}>
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
              <Icon name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name="chat-processing" size={22} color="#007A3D" />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Teacher Chat</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
                {isTeacher ? 'Connect with your students' : 'Connect with your instructor'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chat panels — no input inside here */}
        <View style={styles.panelsRow}>
          {isMobile ? (
            showMobileChat ? rightPanel : leftPanel
          ) : (
            <>
              {leftPanel}
              <View style={styles.rightPanel}>
                {rightPanel}
              </View>
            </>
          )}
        </View>

      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: 5 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pageHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  bannerTextGroup: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  bannerSubtitle: { fontSize: 13 },
  panelsRow: { flex: 1, flexDirection: 'row', minHeight: 0, overflow: 'hidden' },
  leftPanel: { width: '100%', maxWidth: 320, flex: 1, borderRightWidth: 1, minHeight: 0, overflow: 'hidden' },
  rightPanel: { flex: 1, minHeight: 0, overflow: 'hidden' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.05)' },
  userName: { fontSize: 15, fontWeight: '700' },
  userRole: { fontSize: 12, marginTop: 2 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  sectionDivider: { height: 1, marginVertical: 8, marginHorizontal: 16 },
  emptyText: { textAlign: 'center', marginTop: 40 },
  coursePickerContainer: { flex: 1, padding: 24 },
  coursePickerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  coursePickerSub: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  courseCard: { width: 160, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'flex-start', gap: 10 },
  courseCardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  courseCardName: { fontSize: 14, fontWeight: '600', lineHeight: 20, flex: 1 },
  courseCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  courseCardBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  rightPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  placeholderSub: { fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  chatHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  chatHeaderSub: { fontSize: 12, marginTop: 2 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatar: { marginRight: 8, marginBottom: 4 },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  messageSender: { fontSize: 12, marginBottom: 4 },
  messageTime: { fontSize: 10, marginTop: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  unreadBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

export default TeacherChatScreen;
