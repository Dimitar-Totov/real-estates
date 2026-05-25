import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { messages as messagesApi } from '../../lib/api';
import type { ReceivedMessage, SentMessage } from '../../lib/types';

type Tab = 'received' | 'sent';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Avatar({ name }: { name: string | null }) {
  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{(name ?? '?')[0].toUpperCase()}</Text>
    </View>
  );
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<ReceivedMessage[]>([]);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceived, setSelectedReceived] = useState<ReceivedMessage | null>(null);
  const [selectedSent, setSelectedSent] = useState<SentMessage | null>(null);
  const [replyVisible, setReplyVisible] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/(screens)/auth');
  }, [user]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'received') {
        setReceived(await messagesApi.received());
      } else {
        setSent(await messagesApi.sent());
      }
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    if (user) loadMessages();
  }, [tab, user, loadMessages]);

  const handleSelectReceived = async (msg: ReceivedMessage) => {
    setSelectedReceived(msg);
    if (!msg.seenAt) {
      try {
        await messagesApi.markSeen(msg.id);
        setReceived(prev => prev.map(m => m.id === msg.id ? { ...m, seenAt: new Date().toISOString() } : m));
      } catch {}
    }
  };

  const handleReply = async () => {
    if (!selectedReceived || !replyBody.trim()) return;
    setReplySending(true);
    try {
      await messagesApi.send(selectedReceived.senderId, `Re: ${selectedReceived.subject}`, replyBody.trim());
      setReplyVisible(false);
      setReplyBody('');
      Alert.alert('Sent', 'Your reply has been sent.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setReplySending(false);
    }
  };

  const renderReceivedItem = ({ item }: { item: ReceivedMessage }) => {
    const unseen = !item.seenAt;
    return (
      <TouchableOpacity
        style={[s.messageItem, unseen && s.unseenItem]}
        onPress={() => handleSelectReceived(item)}
        activeOpacity={0.7}
      >
        <View style={s.messageItemInner}>
          <View>
            <Avatar name={item.senderName} />
            {unseen && <View style={s.unseenDot} />}
          </View>
          <View style={s.messageContent}>
            <View style={s.messageRow}>
              <Text style={[s.senderName, unseen && s.boldText]} numberOfLines={1}>
                {item.senderName ?? 'Unknown'}
              </Text>
              <Text style={[s.messageDate, unseen && s.boldDateText]}>
                {formatDate(item.sentAt)}
              </Text>
            </View>
            <Text style={[s.messageSubject, unseen && s.boldSubjectText]} numberOfLines={1}>
              {item.subject}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSentItem = ({ item }: { item: SentMessage }) => (
    <TouchableOpacity style={s.messageItem} onPress={() => setSelectedSent(item)} activeOpacity={0.7}>
      <View style={s.messageItemInner}>
        <Avatar name={item.receiverName} />
        <View style={s.messageContent}>
          <View style={s.messageRow}>
            <Text style={s.senderName} numberOfLines={1}>{item.receiverName ?? 'Unknown'}</Text>
            <Text style={s.messageDate}>{formatDate(item.sentAt)}</Text>
          </View>
          <Text style={s.messageSubject} numberOfLines={1}>{item.subject}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const unseenCount = received.filter(m => !m.seenAt).length;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'received' && s.activeTab]}
          onPress={() => { setTab('received'); setSelectedReceived(null); setSelectedSent(null); }}
        >
          <Text style={[s.tabText, tab === 'received' && s.activeTabText]}>Received</Text>
          {unseenCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unseenCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'sent' && s.activeTab]}
          onPress={() => { setTab('sent'); setSelectedReceived(null); setSelectedSent(null); }}
        >
          <Text style={[s.tabText, tab === 'sent' && s.activeTabText]}>Sent</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#e8c97e" /></View>
      ) : tab === 'received' ? (
        received.length === 0
          ? <View style={s.center}><Text style={s.emptyText}>No messages yet</Text></View>
          : <FlatList
              data={received}
              keyExtractor={item => String(item.id)}
              renderItem={renderReceivedItem}
              ItemSeparatorComponent={() => <View style={s.separator} />}
            />
      ) : (
        sent.length === 0
          ? <View style={s.center}><Text style={s.emptyText}>No messages yet</Text></View>
          : <FlatList
              data={sent}
              keyExtractor={item => String(item.id)}
              renderItem={renderSentItem}
              ItemSeparatorComponent={() => <View style={s.separator} />}
            />
      )}

      {/* Received detail modal */}
      <Modal
        visible={!!selectedReceived}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedReceived(null)}
      >
        {selectedReceived && (
          <SafeAreaView style={s.modalContainer}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedReceived(null)} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.replyBtn} onPress={() => setReplyVisible(true)}>
                <Text style={s.replyBtnText}>Reply</Text>
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              <Text style={s.detailSubject}>{selectedReceived.subject}</Text>
              <View style={s.detailMeta}>
                <Avatar name={selectedReceived.senderName} />
                <View style={s.detailMetaText}>
                  <Text style={s.detailFrom}>From: {selectedReceived.senderName ?? 'Unknown'}</Text>
                  <Text style={s.detailDate}>{formatFullDate(selectedReceived.sentAt)}</Text>
                </View>
              </View>
              <Text style={s.detailMessage}>{selectedReceived.message}</Text>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* Sent detail modal */}
      <Modal
        visible={!!selectedSent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSent(null)}
      >
        {selectedSent && (
          <SafeAreaView style={s.modalContainer}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedSent(null)} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              <Text style={s.detailSubject}>{selectedSent.subject}</Text>
              <View style={s.detailMeta}>
                <Avatar name={selectedSent.receiverName} />
                <View style={s.detailMetaText}>
                  <Text style={s.detailFrom}>To: {selectedSent.receiverName ?? 'Unknown'}</Text>
                  <Text style={s.detailDate}>{formatFullDate(selectedSent.sentAt)}</Text>
                </View>
              </View>
              <Text style={s.detailMessage}>{selectedSent.message}</Text>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* Reply modal */}
      <Modal
        visible={replyVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReplyVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={s.modalContainer}>
            <View style={s.modalHeader}>
              <TouchableOpacity
                onPress={() => { setReplyVisible(false); setReplyBody(''); }}
                style={s.backBtn}
              >
                <Text style={s.backBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.replyBtn, (!replyBody.trim() || replySending) && s.disabledBtn]}
                onPress={handleReply}
                disabled={!replyBody.trim() || replySending}
              >
                {replySending
                  ? <ActivityIndicator size="small" color="#1a1a2e" />
                  : <Text style={s.replyBtnText}>Send</Text>
                }
              </TouchableOpacity>
            </View>
            <View style={s.replyForm}>
              {selectedReceived && (
                <View style={s.replySubjectRow}>
                  <Text style={s.replySubjectLabel}>Subject</Text>
                  <Text style={s.replySubjectValue}>Re: {selectedReceived.subject}</Text>
                </View>
              )}
              <TextInput
                style={s.replyInput}
                multiline
                placeholder="Write your reply…"
                placeholderTextColor="#666"
                value={replyBody}
                onChangeText={setReplyBody}
                autoFocus
                textAlignVertical="top"
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
  },
  activeTab: { backgroundColor: '#e8c97e' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#aaa' },
  activeTabText: { color: '#1a1a2e' },
  badge: {
    backgroundColor: '#e84e4e',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  messageItem: { backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 14 },
  unseenItem: { backgroundColor: '#1e2040' },
  messageItemInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2d2d4a', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#e8c97e', fontSize: 16, fontWeight: '700' },
  unseenDot: {
    position: 'absolute', top: -1, right: -1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4a9eff', borderWidth: 2, borderColor: '#1e2040',
  },
  messageContent: { flex: 1 },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  senderName: { fontSize: 15, color: '#ccc', flex: 1, marginRight: 8 },
  boldText: { fontWeight: '700', color: '#fff' },
  messageDate: { fontSize: 12, color: '#888' },
  boldDateText: { fontWeight: '700', color: '#ccc' },
  messageSubject: { fontSize: 13, color: '#888', marginTop: 2 },
  boldSubjectText: { fontWeight: '600', color: '#bbb' },
  separator: { height: 1, backgroundColor: '#2a2a3e' },
  modalContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backBtnText: { color: '#e8c97e', fontSize: 16 },
  replyBtn: {
    backgroundColor: '#e8c97e',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  disabledBtn: { opacity: 0.5 },
  replyBtnText: { color: '#1a1a2e', fontWeight: '700', fontSize: 14 },
  modalBody: { flex: 1, padding: 20 },
  detailSubject: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailMetaText: { marginLeft: 10 },
  detailFrom: { fontSize: 14, color: '#ccc', fontWeight: '600' },
  detailDate: { fontSize: 12, color: '#888', marginTop: 2 },
  detailMessage: { fontSize: 15, color: '#ccc', lineHeight: 24 },
  replyForm: { flex: 1, padding: 16 },
  replySubjectRow: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  replySubjectLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 4 },
  replySubjectValue: { fontSize: 14, color: '#ccc' },
  replyInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    lineHeight: 24,
  },
});
