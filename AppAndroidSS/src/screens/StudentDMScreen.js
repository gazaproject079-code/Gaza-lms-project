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
const HEADER_HEIGHT = 64;

const StudentDMScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

  const [activeTab, setActiveTab] = useState('students');
  const [conversations, setConversations] = useState([]);
  const [peersList, setPeersList] = useState([]);
  const [sponsorsList, setSponsorsList] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const sponsorChannelMapRef = useRef({});
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const activeChannelRef = useRef(null);
  const peerChannelMapRef = useRef({});
  const conversationsRef = useRef([]);

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  useEffect(() => {
    setSelectedStudentGroup(null);
    setSelectedConv(null);
    setSelectedPeer(null);
    setSelectedSponsor(null);
    setActiveChannel(null);
    setMessages([]);
    setShowMobileChat(false);
  }, [activeTab]);

  useEffect(() => {
    fetchConversations();
    fetchPeers();
    fetchSponsors();
  }, []);

  useEffect(() => {
    conversationsRef.current = conversations;
    if (socketRef.current?.connected && conversations.length > 0) {
      conversations.forEach(c => socketRef.current.emit('joinChannel', c.id));
    }
  }, [conversations]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      conversationsRef.current.forEach(c => socket.emit('joinChannel', c.id));
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
        setUnreadCounts(prev => ({ ...prev, [msg.channelId]: (prev[msg.channelId] || 0) + 1 }));
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === msg.channelId);
          if (idx < 0) return prev;
          const updated = [...prev];
          const [moved] = updated.splice(idx, 1);
          return [{ ...moved, updatedAt: new Date().toISOString() }, ...updated];
        });
        const peerId = peerChannelMapRef.current[msg.channelId];
        if (peerId) {
          setPeersList(prev => {
            const pidx = prev.findIndex(p => p.id === peerId);
            if (pidx < 0) return prev;
            const updated = [...prev];
            const [moved] = updated.splice(pidx, 1);
            return [moved, ...updated];
          });
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/forum/direct-channels');
      setConversations(data || []);
      (data || []).forEach(ch => {
        const role = ch.otherUser?.role;
        const uid = ch.otherUser?.id;
        if (!uid) return;
        if (role === 'instructor' || role === 'superadmin') peerChannelMapRef.current[ch.id] = uid;
        else if (role === 'sponsor') sponsorChannelMapRef.current[ch.id] = uid;
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load conversations' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPeers = async () => {
    try { const data = await api.get('/forum/peers'); setPeersList(data || []); } catch { }
  };

  const fetchSponsors = async () => {
    try { const data = await api.get('/forum/sponsors'); setSponsorsList(data || []); } catch { }
  };

  const openChannel = async (channel) => {
    setLoadingMessages(true);
    setUnreadCounts(prev => { const n = { ...prev }; delete n[channel.id]; return n; });
    try {
      if (activeChannelRef.current) socketRef.current.emit('leaveChannel', activeChannelRef.current.id);
      setActiveChannel(channel);
      socketRef.current.emit('joinChannel', channel.id);
      const msgs = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(msgs || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open conversation' });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectSponsor = async (sponsor) => {
    setSelectedSponsor(sponsor);
    if (isMobile) setShowMobileChat(true);
    setLoadingMessages(true);
    try {
      const channel = await api.post('/forum/channels/direct', { targetUserId: sponsor.id });
      sponsorChannelMapRef.current[channel.id] = sponsor.id;
      await openChannel(channel);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open sponsor chat' });
      setLoadingMessages(false);
    }
  };

  const handleSelectStudentGroup = (group) => {
    setSelectedStudentGroup(group);
    setSelectedConv(null);
    setActiveChannel(null);
    setMessages([]);
    if (isMobile) setShowMobileChat(true);
  };

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv);
    if (isMobile) setShowMobileChat(true);
    await openChannel(conv);
  };

  const handleSelectPeer = async (peer) => {
    setSelectedPeer(peer);
    if (isMobile) setShowMobileChat(true);
    setLoadingMessages(true);
    try {
      const channel = await api.post('/forum/channels/direct', { targetUserId: peer.id });
      peerChannelMapRef.current[channel.id] = peer.id;
      await openChannel(channel);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open chat' });
      setLoadingMessages(false);
    }
  };

  const handleKeyPress = (e) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  // ── Student group row ────────────────────────────────────────────────────────
  const renderStudentGroupRow = (group) => {
    const isSelected = selectedStudentGroup?.user?.id === group.user?.id;
    const totalUnread = group.convs.reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);
    return (
      <TouchableOpacity
        key={group.user?.id}
        style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
        onPress={() => handleSelectStudentGroup(group)}
        activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text size={44} label={(group.user?.name || 'S').substring(0, 2).toUpperCase()}
            style={{ backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#2C2C3E' : '#E0E0E0') }}
            labelStyle={{ color: isSelected ? '#fff' : theme.colors.textPrimary }} />
          {totalUnread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{totalUnread > 9 ? '9+' : totalUnread}</Text></View>}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: totalUnread > 0 ? '800' : '700' }]}>{group.user?.name || 'Unknown'}</Text>
          <Text style={[styles.userRole, { color: totalUnread > 0 ? theme.colors.primary : theme.colors.textSecondary, fontWeight: totalUnread > 0 ? '700' : '400' }]}>
            Student · {group.convs.length} conversation{group.convs.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderPeerRow = (peer) => {
    const isSelected = selectedPeer?.id === peer.id;
    const peerChannelId = Object.entries(peerChannelMapRef.current).find(([, pid]) => pid === peer.id)?.[0];
    const peerUnread = peerChannelId ? (unreadCounts[peerChannelId] || 0) : 0;
    return (
      <TouchableOpacity key={peer.id}
        style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
        onPress={() => handleSelectPeer(peer)} activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text size={44} label={peer.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#2C2C3E' : '#E0E0E0') }}
            labelStyle={{ color: isSelected ? '#fff' : theme.colors.textPrimary }} />
          {peerUnread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{peerUnread > 9 ? '9+' : peerUnread}</Text></View>}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: peerUnread > 0 ? '800' : '700' }]}>{peer.name}</Text>
          <Text style={[styles.userRole, { color: peerUnread > 0 ? theme.colors.primary : theme.colors.textSecondary, fontWeight: peerUnread > 0 ? '700' : '400' }]}>
            {peer.role === 'superadmin' ? 'Admin' : 'Instructor'}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderSponsorRow = (sponsor) => {
    const isSelected = selectedSponsor?.id === sponsor.id;
    const chId = Object.entries(sponsorChannelMapRef.current).find(([, sid]) => sid === sponsor.id)?.[0];
    const unread = chId ? (unreadCounts[chId] || 0) : 0;
    return (
      <TouchableOpacity key={sponsor.id}
        style={[styles.userItem, { backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }]}
        onPress={() => handleSelectSponsor(sponsor)} activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Avatar.Text size={44} label={sponsor.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#2C2C3E' : '#E0E0E0') }}
            labelStyle={{ color: isSelected ? '#fff' : theme.colors.textPrimary }} />
          {unread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unread > 9 ? '9+' : unread}</Text></View>}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontWeight: unread > 0 ? '800' : '700' }]}>{sponsor.name}</Text>
          <Text style={[styles.userRole, { color: unread > 0 ? theme.colors.primary : theme.colors.textSecondary }]}>Sponsor</Text>
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
          <Avatar.Text size={32} label={(item.sender?.name || '??').substring(0, 2).toUpperCase()}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ fontSize: 11, color: '#fff' }} />
        )}
        <View style={[styles.messageBubble,
          isMe
            ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 }
            : { backgroundColor: isDark ? '#2C2C3E' : '#EAEAEA', borderBottomLeftRadius: 2 }
        ]}>
          {!isMe && <Text style={[styles.messageSender, { color: theme.colors.primary, fontWeight: '700' }]}>{item.sender?.name}</Text>}
          <Text style={{ color: isMe ? '#fff' : theme.colors.textPrimary, fontSize: 15, lineHeight: 20 }}>{item.content}</Text>
          <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary, alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // ── Input bar (reused inside every chat panel) ────────────────────────────────
  const inputBar = (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
        placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
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
  );

  // ── Chat panel — input is INSIDE here, sibling of ScrollView ─────────────────
  const chatPanel = (chatUser) => (
    <View style={styles.chatPanelColumn}>
      {/* Header */}
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text size={40} label={(chatUser?.name || '?').substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }} labelStyle={{ color: '#fff' }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{chatUser?.name || 'Unknown'}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>
            {chatUser?.role === 'student' ? 'Student' : chatUser?.role === 'superadmin' ? 'Admin' : chatUser?.role === 'instructor' ? 'Instructor' : chatUser?.role || 'User'}
            {activeTab === 'students' && selectedConv?.name?.startsWith('direct-course-') && selectedConv.description ? `  ·  📚 ${selectedConv.description}` : ''}
          </Text>
        </View>
        {activeTab === 'students' && (
          <TouchableOpacity onPress={() => { setSelectedConv(null); setActiveChannel(null); setMessages([]); }}
            style={[styles.backToThreadsBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Icon name="format-list-bulleted" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={flatListRef}
          style={[styles.messagesScroll, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <React.Fragment key={item.id.toString()}>{renderMessage({ item })}</React.Fragment>
          ))}
        </ScrollView>
      )}

      {/* Input — sibling of messagesContainer, always pinned at the bottom */}
      {inputBar}
    </View>
  );

  // ── Thread picker ─────────────────────────────────────────────────────────────
  const threadPicker = selectedStudentGroup ? (
    <View style={styles.chatPanelColumn}>
      <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {isMobile && (
          <TouchableOpacity onPress={() => setShowMobileChat(false)} style={{ marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Avatar.Text size={40} label={(selectedStudentGroup.user?.name || 'S').substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }} labelStyle={{ color: '#fff' }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>{selectedStudentGroup.user?.name}</Text>
          <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>Student · Select a conversation thread</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.threadPickerContainer}>
        <Text style={[styles.threadPickerTitle, { color: theme.colors.textPrimary }]}>Conversation Threads</Text>
        <Text style={[styles.threadPickerSub, { color: theme.colors.textSecondary }]}>This student has messaged you across multiple courses.</Text>
        {selectedStudentGroup.convs.map(conv => {
          const courseName = conv.name?.startsWith('direct-course-') ? conv.description : null;
          const convUnread = unreadCounts[conv.id] || 0;
          return (
            <TouchableOpacity key={conv.id}
              style={[styles.threadRow, { backgroundColor: theme.colors.surface, borderColor: convUnread > 0 ? theme.colors.primary + '60' : theme.colors.border }]}
              onPress={() => handleSelectConv(conv)} activeOpacity={0.75}
            >
              <View style={[styles.threadIcon, { backgroundColor: courseName ? theme.colors.primary + '20' : 'rgba(150,150,150,0.15)' }]}>
                <Icon name={courseName ? 'book-open-variant' : 'chat-outline'} size={20} color={courseName ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.threadTitle, { color: theme.colors.textPrimary, fontWeight: convUnread > 0 ? '800' : '700' }]} numberOfLines={1}>
                  {courseName || 'General Chat'}
                </Text>
                <Text style={[styles.threadSub, { color: convUnread > 0 ? theme.colors.primary : theme.colors.textSecondary, fontWeight: convUnread > 0 ? '700' : '400' }]}>
                  {convUnread > 0 ? `${convUnread} new message${convUnread > 1 ? 's' : ''}` : 'Tap to open this conversation'}
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

  // ── Left panel ────────────────────────────────────────────────────────────────
  const studentsUnreadTotal = conversations.reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);
  const peersUnreadTotal = Object.keys(peerChannelMapRef.current).reduce((sum, chId) => sum + (unreadCounts[chId] || 0), 0);
  const sponsorsUnreadTotal = Object.keys(sponsorChannelMapRef.current).reduce((sum, chId) => sum + (unreadCounts[chId] || 0), 0);

  const studentGroups = Object.values(
    conversations
      .filter(conv => conv.otherUser?.role === 'student')
      .reduce((acc, conv) => {
        const uid = conv.otherUser?.id;
        if (!uid) return acc;
        if (!acc[uid]) acc[uid] = { user: conv.otherUser, convs: [] };
        acc[uid].convs.push(conv);
        return acc;
      }, {})
  ).sort((a, b) => {
    const aTime = Math.max(...a.convs.map(c => new Date(c.updatedAt).getTime()));
    const bTime = Math.max(...b.convs.map(c => new Date(c.updatedAt).getTime()));
    return bTime - aTime;
  });

  const leftPanel = (
    <View style={[styles.leftPanel, { borderRightColor: theme.colors.border }]}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'students', icon: 'message-text', label: 'Student DMs', unread: studentsUnreadTotal },
          { key: 'peers', icon: 'account-group', label: 'Instructors', unread: peersUnreadTotal },
          { key: 'sponsors', icon: 'heart', label: 'Sponsors', unread: sponsorsUnreadTotal },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab(tab.key)}>
            <Icon name={tab.icon} size={15} color={activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }]}>{tab.label}</Text>
            {tab.unread > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{tab.unread > 9 ? '9+' : tab.unread}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'students' ? (
        <FlatList style={styles.listFlex} data={studentGroups} keyExtractor={(item) => item.user?.id?.toString()}
          renderItem={({ item }) => renderStudentGroupRow(item)}
          ListEmptyComponent={<View style={styles.emptyConv}><Icon name="message-outline" size={54} color={theme.colors.border} /><Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No messages yet</Text><Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Student DMs will appear here once students send you a message.</Text></View>}
        />
      ) : activeTab === 'peers' ? (
        <FlatList style={styles.listFlex} data={peersList} keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderPeerRow(item)}
          ListEmptyComponent={<View style={styles.emptyConv}><Icon name="account-group-outline" size={54} color={theme.colors.border} /><Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No peers found</Text><Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No other instructors or admins are available to chat.</Text></View>}
        />
      ) : (
        <FlatList style={styles.listFlex} data={sponsorsList} keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderSponsorRow(item)}
          ListEmptyComponent={<View style={styles.emptyConv}><Icon name="heart-outline" size={54} color={theme.colors.border} /><Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No sponsors yet</Text><Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Sponsors who sign up will appear here.</Text></View>}
        />
      )}
    </View>
  );

  // ── Right panel ───────────────────────────────────────────────────────────────
  const rightPanel = activeTab === 'sponsors' ? (
    !selectedSponsor
      ? <View style={styles.rightPlaceholder}><Icon name="heart-outline" size={80} color={theme.colors.border} /><Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>Sponsor Chat</Text><Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>Select a sponsor from the left to start a conversation.</Text></View>
      : chatPanel(selectedSponsor)
  ) : activeTab === 'peers' ? (
    !selectedPeer
      ? <View style={styles.rightPlaceholder}><Icon name="account-group-outline" size={80} color={theme.colors.border} /><Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>Instructor Chat</Text><Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>Select an instructor or admin from the left to start a private conversation.</Text></View>
      : chatPanel(selectedPeer)
  ) : (
    !selectedStudentGroup
      ? <View style={styles.rightPlaceholder}><Icon name="message-text-outline" size={80} color={theme.colors.border} /><Text style={[styles.placeholderTitle, { color: theme.colors.textPrimary }]}>Student DM Inbox</Text><Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>Select a student from the left to view and reply to their messages.</Text></View>
      : !selectedConv ? threadPicker
      : chatPanel(selectedStudentGroup.user)
  );

  return (
    <MainLayout showSidebar={true} showBack={false} activeRoute="StudentDMs" onNavigate={(route) => navigation.navigate(route)}>
      {/*
        ROOT: explicit pixel height on web (same pattern as AIChatScreen).
        This creates a hard boundary so children never overflow and push the
        input off-screen. On native, flex:1 is sufficient because Yoga
        handles min-height correctly by default.
      */}
      <View style={[
        styles.root,
        { backgroundColor: theme.colors.background },
        isWeb ? { height: height - HEADER_HEIGHT, overflow: 'hidden' } : { flex: 1 },
      ]}>
        {/* Banner */}
        <View style={[styles.pageHeaderBanner, { backgroundColor: isDark ? 'rgba(0,122,61,0.06)' : 'rgba(0,122,61,0.05)', borderColor: 'rgba(0,122,61,0.15)' }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}><Icon name="message-text" size={22} color="#007A3D" /></View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Student DMs</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>Receive and reply to student direct messages</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,122,61,0.08)', borderRadius: 20 }]} onPress={fetchConversations}>
            <Icon name="refresh" size={20} color="#007A3D" />
          </TouchableOpacity>
        </View>

        {/* Two-panel row — overflow:hidden ensures panels never expand past root */}
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
  root: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  pageHeaderBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, margin: 16, marginBottom: 4, borderRadius: 16, borderWidth: 1,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,61,0.15)', justifyContent: 'center', alignItems: 'center' },
  bannerTextGroup: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  bannerSubtitle: { fontSize: 13 },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  // Panels
  panelsRow: { flex: 1, flexDirection: 'row', overflow: 'hidden', minHeight: 0 },
  leftPanel: { width: '100%', maxWidth: 320, flexDirection: 'column', overflow: 'hidden', borderRightWidth: 1, minHeight: 0 },
  rightPanel: { flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 },

  // Tab bar
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: 5 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  listFlex: { flex: 1 },

  // Contact rows
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.05)' },
  userName: { fontSize: 15, fontWeight: '700' },
  userRole: { fontSize: 12, marginTop: 2 },
  emptyConv: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyText: { marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Right placeholders
  rightPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  placeholderSub: { fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 },

  // Chat panel column — flex:1 column so messages fill space between header & input
  chatPanelColumn: { flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  chatHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  chatHeaderSub: { fontSize: 12, marginTop: 2 },
  backToThreadsBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  // Messages
  messagesScroll: { flex: 1, minHeight: 0 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatar: { marginRight: 8, marginBottom: 4 },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  messageSender: { fontSize: 12, marginBottom: 4 },
  messageTime: { fontSize: 10, marginTop: 6 },

  // Input — no flex, natural height, always at bottom of chatPanelColumn
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },

  // Thread picker
  threadPickerContainer: { padding: 20 },
  threadPickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  threadPickerSub: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  threadRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  threadIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  threadTitle: { fontSize: 14, fontWeight: '700' },
  threadSub: { fontSize: 12, marginTop: 2 },

  // Badges
  unreadBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

export default StudentDMScreen;
