import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView,
  Platform, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/auth-context';
import {
  users as usersApi,
  visitings as visitingsApi,
  properties as propertiesApi,
  meetings as meetingsApi,
} from '../../lib/api';
import type { User, VisitingRow, Property, Meeting } from '../../lib/types';

const PAGE_SIZE = 5;

function formatHour(h: number): string {
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function formatVisitDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMeetingDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const VISITING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef3c7' },
  confirmed: { label: 'Confirmed', color: '#065f46', bg: '#d1fae5' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' },
};

// ─── Edit modals ──────────────────────────────────────────────────────────────

function EditLocationModal({ visible, initial, onSave, onClose }: {
  visible: boolean;
  initial: string;
  onSave: (v: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setValue(initial); }, [visible]);

  async function handleSave() {
    setSaving(true);
    try { await onSave(value.trim()); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={md.overlay}>
        <TouchableOpacity style={md.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={md.sheet}>
          <View style={md.sheetHeader}>
            <Text style={md.sheetTitle}>Edit Location</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={md.closeX}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={md.input}
            placeholder="City, Country"
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={setValue}
          />
          <TouchableOpacity style={[md.saveBtn, saving && md.saveBtnOff]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={md.saveBtnTxt}>Save</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EditSocialsModal({ visible, initial, onSave, onClose }: {
  visible: boolean;
  initial: { facebookUrl: string; linkedinUrl: string; twitterUrl: string };
  onSave: (v: typeof initial) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setDraft(initial); }, [visible]);

  async function handleSave() {
    setSaving(true);
    try { await onSave(draft); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={md.overlay}>
        <TouchableOpacity style={md.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={md.sheet}>
          <View style={md.sheetHeader}>
            <Text style={md.sheetTitle}>Edit Social Links</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={md.closeX}>✕</Text>
            </TouchableOpacity>
          </View>
          {(['facebookUrl', 'linkedinUrl', 'twitterUrl'] as const).map(key => (
            <TextInput
              key={key}
              style={md.input}
              placeholder={key === 'facebookUrl' ? 'Facebook URL' : key === 'linkedinUrl' ? 'LinkedIn URL' : 'Twitter / X URL'}
              placeholderTextColor="#9ca3af"
              value={draft[key]}
              onChangeText={v => setDraft(d => ({ ...d, [key]: v }))}
              autoCapitalize="none"
              keyboardType="url"
            />
          ))}
          <TouchableOpacity style={[md.saveBtn, saving && md.saveBtnOff]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={md.saveBtnTxt}>Save</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EditContactModal({ visible, initial, onSave, onClose }: {
  visible: boolean;
  initial: { officePhone: string; mobilePhone: string; contactEmail: string };
  onSave: (v: typeof initial) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [emailErr, setEmailErr] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setDraft(initial); setEmailErr(false); } }, [visible]);

  async function handleSave() {
    if (draft.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail)) {
      setEmailErr(true);
      setTimeout(() => setEmailErr(false), 3000);
      return;
    }
    setSaving(true);
    try { await onSave(draft); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={md.overlay}>
        <TouchableOpacity style={md.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={md.sheet}>
          <View style={md.sheetHeader}>
            <Text style={md.sheetTitle}>Edit Contact Info</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={md.closeX}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={md.input}
            placeholder="Office phone"
            placeholderTextColor="#9ca3af"
            value={draft.officePhone}
            onChangeText={v => setDraft(d => ({ ...d, officePhone: v }))}
            keyboardType="phone-pad"
          />
          <TextInput
            style={md.input}
            placeholder="Mobile phone"
            placeholderTextColor="#9ca3af"
            value={draft.mobilePhone}
            onChangeText={v => setDraft(d => ({ ...d, mobilePhone: v }))}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[md.input, emailErr && md.inputErr]}
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            value={draft.contactEmail}
            onChangeText={v => setDraft(d => ({ ...d, contactEmail: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailErr && <Text style={md.errTxt}>Please enter a valid email address</Text>}
          <TouchableOpacity style={[md.saveBtn, saving && md.saveBtnOff]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={md.saveBtnTxt}>Save</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MarkSoldModal({ visible, meeting, onConfirm, onClose }: {
  visible: boolean;
  meeting: Meeting | null;
  onConfirm: (transactionType: 'bought' | 'rented', buyer: string) => Promise<void>;
  onClose: () => void;
}) {
  const [txType, setTxType] = useState<'bought' | 'rented'>('bought');
  const [buyer, setBuyer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setTxType('bought'); setBuyer(''); } }, [visible]);

  async function handleConfirm() {
    if (!buyer.trim()) return;
    setSaving(true);
    try { await onConfirm(txType, buyer.trim()); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={md.overlay}>
        <TouchableOpacity style={md.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={md.sheet}>
          <View style={md.sheetHeader}>
            <Text style={md.sheetTitle}>Mark as Sold</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={md.closeX}>✕</Text>
            </TouchableOpacity>
          </View>
          {meeting && <Text style={md.soldProp} numberOfLines={1}>{meeting.propertyTitle}</Text>}
          <View style={ms.txRow}>
            <TouchableOpacity
              style={[ms.txChip, txType === 'bought' && ms.txChipOn]}
              onPress={() => setTxType('bought')}
            >
              <Text style={[ms.txTxt, txType === 'bought' && ms.txTxtOn]}>Bought</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.txChip, txType === 'rented' && ms.txChipOn]}
              onPress={() => setTxType('rented')}
            >
              <Text style={[ms.txTxt, txType === 'rented' && ms.txTxtOn]}>Rented</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={md.input}
            placeholder={txType === 'bought' ? 'Buyer name' : 'Tenant name'}
            placeholderTextColor="#9ca3af"
            value={buyer}
            onChangeText={setBuyer}
          />
          <TouchableOpacity
            style={[md.saveBtn, (!buyer.trim() || saving) && md.saveBtnOff]}
            onPress={handleConfirm}
            disabled={!buyer.trim() || saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={md.saveBtnTxt}>Confirm</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Visiting card ────────────────────────────────────────────────────────────

function VisitingCard({ row, isAgent, onPress, onAccept, onDecline }: {
  row: VisitingRow;
  isAgent: boolean;
  onPress?: () => void;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
}) {
  const st = VISITING_STATUS[row.status] ?? VISITING_STATUS.pending;

  return (
    <TouchableOpacity style={vc.card} onPress={onPress} activeOpacity={0.88}>
      {row.coverImage
        ? <Image source={{ uri: row.coverImage }} style={vc.image} resizeMode="cover" />
        : <View style={vc.imageFallback}><Text style={vc.imageFallbackIcon}>🏠</Text></View>
      }
      <View style={vc.body}>
        <Text style={vc.title} numberOfLines={1}>{row.title}</Text>
        <Text style={vc.address} numberOfLines={1}>{row.address}, {row.city}</Text>
        <Text style={vc.dateRow}>
          {formatVisitDate(row.visitDate)} · {formatHour(row.hour)}
        </Text>
        {isAgent && row.requesterName && (
          <Text style={vc.requester}>By: {row.requesterName}</Text>
        )}
        <View style={[vc.badge, { backgroundColor: st.bg }]}>
          <Text style={[vc.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
        {isAgent && row.status === 'pending' && (
          <View style={vc.actionRow}>
            <TouchableOpacity style={vc.acceptBtn} onPress={() => onAccept?.(row.visitingId)}>
              <Text style={vc.acceptTxt}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={vc.declineBtn} onPress={() => onDecline?.(row.visitingId)}>
              <Text style={vc.declineTxt}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Meeting row ──────────────────────────────────────────────────────────────

function MeetingRow({ meeting, onMarkSold }: {
  meeting: Meeting;
  onMarkSold: (m: Meeting) => void;
}) {
  const sold = meeting.markedSoldAt != null;

  return (
    <View style={mr.row}>
      <View style={mr.topRow}>
        <Text style={mr.date}>{formatMeetingDate(meeting.meetingDate)}</Text>
        {sold
          ? <View style={mr.soldBadge}><Text style={mr.soldBadgeTxt}>Sold</Text></View>
          : (
            <TouchableOpacity style={mr.markBtn} onPress={() => onMarkSold(meeting)}>
              <Text style={mr.markBtnTxt}>Mark Sold</Text>
            </TouchableOpacity>
          )
        }
      </View>
      <Text style={mr.propTitle} numberOfLines={1}>{meeting.propertyTitle}</Text>
      <Text style={mr.propAddr} numberOfLines={1}>{meeting.propertyAddress}</Text>
      <View style={mr.infoRow}>
        <Text style={mr.infoLabel}>Requester:</Text>
        <Text style={mr.infoValue}>{meeting.requesterUsername}</Text>
      </View>
      {meeting.requesterPhone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${meeting.requesterPhone}`)}>
          <View style={mr.infoRow}>
            <Text style={mr.infoLabel}>Phone:</Text>
            <Text style={[mr.infoValue, mr.link]}>{meeting.requesterPhone}</Text>
          </View>
        </TouchableOpacity>
      )}
      {meeting.requesterEmail && (
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${meeting.requesterEmail}`)}>
          <View style={mr.infoRow}>
            <Text style={mr.infoLabel}>Email:</Text>
            <Text style={[mr.infoValue, mr.link]}>{meeting.requesterEmail}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [visitings, setVisitings] = useState<VisitingRow[]>([]);
  const [listings, setListings] = useState<Property[]>([]);
  const [meetingRows, setMeetingRows] = useState<Meeting[]>([]);
  const [meetingsTotal, setMeetingsTotal] = useState(0);
  const [meetingsPage, setMeetingsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'showings' | 'listings' | 'meetings'>('showings');

  const [editLocation, setEditLocation] = useState(false);
  const [editSocials, setEditSocials] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [markSoldTarget, setMarkSoldTarget] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!authUser) { setLoading(false); return; }
    loadAll();
  }, [authUser]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([
        usersApi.me(),
        visitingsApi.my().catch(() => [] as VisitingRow[]),
      ]);
      setProfile(p);
      setVisitings(v);

      if (p.role === 'agent') {
        const [props, mtgs] = await Promise.all([
          propertiesApi.my().catch(() => [] as Property[]),
          meetingsApi.my(1).catch(() => ({ rows: [], total: 0 })),
        ]);
        setListings(props);
        setMeetingRows(mtgs.rows);
        setMeetingsTotal(mtgs.total);
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadMeetingsPage(page: number) {
    try {
      const data = await meetingsApi.my(page);
      setMeetingRows(data.rows);
      setMeetingsTotal(data.total);
      setMeetingsPage(page);
    } catch {
      showToast('Failed to load meetings', 'error');
    }
  }

  async function pickAndUpload(type: 'avatar' | 'cover') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingCover(true);

    try {
      const { publicUrl } = await usersApi.uploadImage(type, asset.uri, mimeType);
      setProfile(prev => prev
        ? { ...prev, [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: publicUrl }
        : prev
      );
      showToast(`${type === 'avatar' ? 'Avatar' : 'Cover'} updated`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Upload failed', 'error');
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  }

  async function saveLocation(location: string) {
    const updated = await usersApi.updateMe({ location: location || null });
    setProfile(updated);
    showToast('Location updated');
  }

  async function saveSocials(draft: { facebookUrl: string; linkedinUrl: string; twitterUrl: string }) {
    const updated = await usersApi.updateMe({
      facebookUrl: draft.facebookUrl.trim() || null,
      linkedinUrl: draft.linkedinUrl.trim() || null,
      twitterUrl: draft.twitterUrl.trim() || null,
    });
    setProfile(updated);
    showToast('Social links updated');
  }

  async function saveContact(draft: { officePhone: string; mobilePhone: string; contactEmail: string }) {
    const updated = await usersApi.updateMe({
      officePhone: draft.officePhone.trim() || null,
      mobilePhone: draft.mobilePhone.trim() || null,
      contactEmail: draft.contactEmail.trim() || null,
    });
    setProfile(updated);
    showToast('Contact info updated');
  }

  async function handleAccept(id: number) {
    try {
      await visitingsApi.accept(id);
      setVisitings(vs => vs.map(v => v.visitingId === id ? { ...v, status: 'confirmed' } : v));
      showToast('Showing confirmed');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to confirm', 'error');
    }
  }

  async function handleDecline(id: number) {
    try {
      await visitingsApi.decline(id);
      setVisitings(vs => vs.map(v => v.visitingId === id ? { ...v, status: 'cancelled' } : v));
      showToast('Showing declined');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to decline', 'error');
    }
  }

  async function handleMarkSold(txType: 'bought' | 'rented', buyer: string) {
    if (!markSoldTarget) return;
    await meetingsApi.sold({
      meetingId: markSoldTarget.id,
      propertyName: markSoldTarget.propertyTitle,
      buyer,
      transactionType: txType,
    });
    const now = new Date().toISOString();
    setMeetingRows(rows =>
      rows.map(r => r.id === markSoldTarget.id ? { ...r, markedSoldAt: now } : r)
    );
    setListings(ls => ls.filter(l => l.title !== markSoldTarget.propertyTitle));
    showToast('Property marked as sold');
  }

  // ── Redirect if not logged in
  if (!loading && !authUser) {
    return (
      <View style={s.centered}>
        <Text style={s.guestTitle}>Sign in to view your profile</Text>
        <TouchableOpacity style={s.signInBtn} onPress={() => router.push('/(screens)/auth')}>
          <Text style={s.signInBtnTxt}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#CC0000" /></View>;
  }

  if (!profile) return null;

  const isAgent = profile.role === 'agent';
  const totalMeetingPages = Math.ceil(meetingsTotal / PAGE_SIZE);

  return (
    <>
      {/* Toast */}
      {toast && (
        <View style={[s.toast, toast.type === 'error' ? s.toastError : s.toastSuccess]}>
          <Text style={s.toastTxt}>{toast.msg}</Text>
          <TouchableOpacity onPress={() => setToast(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.toastClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>

        {/* ── Cover + Avatar ── */}
        <View style={s.coverWrap}>
          {profile.coverUrl
            ? <Image source={{ uri: profile.coverUrl }} style={s.cover} resizeMode="cover" />
            : <View style={s.coverFallback} />
          }
          {uploadingCover && (
            <View style={s.coverUploadOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <TouchableOpacity style={s.coverEditBtn} onPress={() => pickAndUpload('cover')} disabled={uploadingCover}>
            <Text style={s.coverEditIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <View style={s.avatarRow}>
          <View style={s.avatarWrap}>
            {uploadingAvatar
              ? <View style={[s.avatar, s.avatarLoading]}><ActivityIndicator color="#CC0000" /></View>
              : profile.avatarUrl
                ? <Image source={{ uri: profile.avatarUrl }} style={s.avatar} />
                : (
                  <View style={[s.avatar, s.avatarFallback]}>
                    <Text style={s.avatarInitial}>{profile.username[0]?.toUpperCase()}</Text>
                  </View>
                )
            }
            <TouchableOpacity style={s.avatarEditBtn} onPress={() => pickAndUpload('avatar')} disabled={uploadingAvatar}>
              <Text style={s.avatarEditIcon}>✎</Text>
            </TouchableOpacity>
          </View>

          <View style={s.nameBlock}>
            <Text style={s.username}>{profile.username}</Text>
            <View style={[s.roleBadge, isAgent ? s.roleBadgeAgent : s.roleBadgeUser]}>
              <Text style={s.roleBadgeTxt}>{isAgent ? 'Agent' : 'Member'}</Text>
            </View>
          </View>
        </View>

        {/* ── Info section ── */}
        <View style={s.infoSection}>

          {/* Location */}
          <View style={s.infoRow}>
            <Text style={s.infoIcon}>📍</Text>
            <Text style={s.infoText}>
              {profile.location
                ? <Text
                    style={s.infoLink}
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(profile.location!)}`)}
                  >{profile.location}</Text>
                : <Text style={s.infoEmpty}>Add location</Text>
              }
            </Text>
            <TouchableOpacity style={s.editChip} onPress={() => setEditLocation(true)}>
              <Text style={s.editChipTxt}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Social links */}
          <View style={s.infoRow}>
            <Text style={s.infoIcon}>🔗</Text>
            <View style={s.socialsGroup}>
              {profile.facebookUrl
                ? <TouchableOpacity onPress={() => Linking.openURL(profile.facebookUrl!)}>
                    <Text style={s.socialLink}>Facebook</Text>
                  </TouchableOpacity>
                : null
              }
              {profile.linkedinUrl
                ? <TouchableOpacity onPress={() => Linking.openURL(profile.linkedinUrl!)}>
                    <Text style={s.socialLink}>LinkedIn</Text>
                  </TouchableOpacity>
                : null
              }
              {profile.twitterUrl
                ? <TouchableOpacity onPress={() => Linking.openURL(profile.twitterUrl!)}>
                    <Text style={s.socialLink}>Twitter / X</Text>
                  </TouchableOpacity>
                : null
              }
              {!profile.facebookUrl && !profile.linkedinUrl && !profile.twitterUrl && (
                <Text style={s.infoEmpty}>No social links</Text>
              )}
            </View>
            <TouchableOpacity style={s.editChip} onPress={() => setEditSocials(true)}>
              <Text style={s.editChipTxt}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Contact info */}
          <View style={s.infoRow}>
            <Text style={s.infoIcon}>📞</Text>
            <View style={s.contactGroup}>
              {profile.officePhone
                ? <TouchableOpacity onPress={() => Linking.openURL(`tel:${profile.officePhone}`)}>
                    <Text style={s.socialLink}>{profile.officePhone} (Office)</Text>
                  </TouchableOpacity>
                : null
              }
              {profile.mobilePhone
                ? <TouchableOpacity onPress={() => Linking.openURL(`tel:${profile.mobilePhone}`)}>
                    <Text style={s.socialLink}>{profile.mobilePhone} (Mobile)</Text>
                  </TouchableOpacity>
                : null
              }
              {profile.contactEmail
                ? <TouchableOpacity onPress={() => Linking.openURL(`mailto:${profile.contactEmail}`)}>
                    <Text style={s.socialLink}>{profile.contactEmail}</Text>
                  </TouchableOpacity>
                : null
              }
              {!profile.officePhone && !profile.mobilePhone && !profile.contactEmail && (
                <Text style={s.infoEmpty}>No contact info</Text>
              )}
            </View>
            <TouchableOpacity style={s.editChip} onPress={() => setEditContact(true)}>
              <Text style={s.editChipTxt}>Edit</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* ── Tab bar (agents) / section title (users) ── */}
        {isAgent ? (
          <View style={s.tabBar}>
            {(['showings', 'listings', 'meetings'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.tabItem, activeTab === tab && s.tabItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>
                  {tab === 'showings' ? `Showings${visitings.length ? ` (${visitings.length})` : ''}`
                    : tab === 'listings' ? `Listings${listings.length ? ` (${listings.length})` : ''}`
                    : `Meetings${meetingsTotal ? ` (${meetingsTotal})` : ''}`
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Requested Showings {visitings.length ? `(${visitings.length})` : ''}</Text>
          </View>
        )}

        {/* ── Showings ── */}
        {(!isAgent || activeTab === 'showings') && (
          visitings.length === 0
            ? <View style={s.emptyState}><Text style={s.emptyTxt}>No showings yet</Text></View>
            : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.carousel}
              >
                {visitings.map(v => (
                  <VisitingCard
                    key={v.visitingId}
                    row={v}
                    isAgent={isAgent}
                    onPress={() => router.push(`/property/${v.propertyId}`)}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </ScrollView>
            )
        )}

        {/* ── Listings (agent only) ── */}
        {isAgent && activeTab === 'listings' && (
          listings.length === 0
            ? <View style={s.emptyState}><Text style={s.emptyTxt}>No listings yet</Text></View>
            : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.carousel}
              >
                {listings.map(p => (
                  <View key={p.id} style={lc.card}>
                    {p.images?.[0]
                      ? <Image source={{ uri: p.images[0] }} style={lc.image} resizeMode="cover" />
                      : <View style={lc.imageFallback}><Text style={lc.fallbackIcon}>🏠</Text></View>
                    }
                    <View style={lc.body}>
                      <Text style={lc.title} numberOfLines={1}>{p.title}</Text>
                      <Text style={lc.price}>${parseFloat(p.price).toLocaleString()}</Text>
                      <Text style={lc.addr} numberOfLines={1}>{p.city}, {p.state}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )
        )}

        {/* ── Meetings (agent only) ── */}
        {isAgent && activeTab === 'meetings' && (
          <View style={s.meetingsWrap}>
            {meetingRows.length === 0
              ? <View style={s.emptyState}><Text style={s.emptyTxt}>No meetings yet</Text></View>
              : meetingRows.map(m => (
                <MeetingRow key={m.id} meeting={m} onMarkSold={setMarkSoldTarget} />
              ))
            }

            {totalMeetingPages > 1 && (
              <View style={s.pagination}>
                <TouchableOpacity
                  style={[s.pageBtn, meetingsPage === 1 && s.pageBtnOff]}
                  onPress={() => loadMeetingsPage(meetingsPage - 1)}
                  disabled={meetingsPage === 1}
                >
                  <Text style={s.pageBtnTxt}>‹ Prev</Text>
                </TouchableOpacity>
                <Text style={s.pageInfo}>{meetingsPage} / {totalMeetingPages}</Text>
                <TouchableOpacity
                  style={[s.pageBtn, meetingsPage === totalMeetingPages && s.pageBtnOff]}
                  onPress={() => loadMeetingsPage(meetingsPage + 1)}
                  disabled={meetingsPage === totalMeetingPages}
                >
                  <Text style={s.pageBtnTxt}>Next ›</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit modals ── */}
      <EditLocationModal
        visible={editLocation}
        initial={profile.location ?? ''}
        onSave={saveLocation}
        onClose={() => setEditLocation(false)}
      />
      <EditSocialsModal
        visible={editSocials}
        initial={{
          facebookUrl: profile.facebookUrl ?? '',
          linkedinUrl: profile.linkedinUrl ?? '',
          twitterUrl: profile.twitterUrl ?? '',
        }}
        onSave={saveSocials}
        onClose={() => setEditSocials(false)}
      />
      <EditContactModal
        visible={editContact}
        initial={{
          officePhone: profile.officePhone ?? '',
          mobilePhone: profile.mobilePhone ?? '',
          contactEmail: profile.contactEmail ?? '',
        }}
        onSave={saveContact}
        onClose={() => setEditContact(false)}
      />
      <MarkSoldModal
        visible={markSoldTarget !== null}
        meeting={markSoldTarget}
        onConfirm={handleMarkSold}
        onClose={() => setMarkSoldTarget(null)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestTitle: { fontSize: 17, fontWeight: '600', color: '#374151', marginBottom: 16, textAlign: 'center' },
  signInBtn: { backgroundColor: '#CC0000', paddingHorizontal: 32, paddingVertical: 13, borderRadius: 12 },
  signInBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Toast
  toast: {
    position: 'absolute', top: 12, left: 16, right: 16, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
  },
  toastSuccess: { backgroundColor: '#065f46' },
  toastError:   { backgroundColor: '#991b1b' },
  toastTxt:   { color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 },
  toastClose: { color: '#fff', fontSize: 16, marginLeft: 12 },

  // Cover
  coverWrap: { height: 160, position: 'relative' },
  cover: { width: '100%', height: 160 },
  coverFallback: { width: '100%', height: 160, backgroundColor: '#1a1a2e' },
  coverUploadOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  coverEditBtn: {
    position: 'absolute', bottom: 10, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  coverEditIcon: { fontSize: 16 },

  // Avatar row
  avatarRow: {
    flexDirection: 'row',
    paddingHorizontal: 16, marginTop: -40, marginBottom: 12,
  },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#fff' },
  avatarLoading: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  avatarFallback: { backgroundColor: '#CC0000', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#fff' },
  avatarEditBtn: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  avatarEditIcon: { fontSize: 12, color: '#374151' },
  nameBlock: { flex: 1, paddingTop: 42 },
  username: { fontSize: 20, fontWeight: '700', color: '#111827' },
  roleBadge: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  roleBadgeAgent: { backgroundColor: '#fef3c7' },
  roleBadgeUser:  { backgroundColor: '#eff6ff' },
  roleBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#374151' },

  // Info section
  infoSection: { paddingHorizontal: 16, paddingBottom: 8 },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8,
  },
  infoIcon: { fontSize: 16, marginTop: 1, width: 22 },
  infoText: { flex: 1, fontSize: 14, color: '#374151' },
  infoLink: { color: '#2563eb', fontSize: 14 },
  infoEmpty: { color: '#9ca3af', fontSize: 14, fontStyle: 'italic' },
  socialsGroup: { flex: 1, gap: 4 },
  contactGroup: { flex: 1, gap: 4 },
  socialLink: { fontSize: 14, color: '#2563eb' },
  editChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  editChipTxt: { fontSize: 12, fontWeight: '600', color: '#6b7280' },

  // Tab bar
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    marginHorizontal: 16, marginTop: 8,
  },
  tabItem: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: '#CC0000' },
  tabTxt: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTxtActive: { color: '#CC0000' },

  sectionHeader: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  // Carousel
  carousel: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  emptyState: { paddingVertical: 32, alignItems: 'center' },
  emptyTxt: { fontSize: 14, color: '#9ca3af' },

  // Meetings
  meetingsWrap: { paddingHorizontal: 16, paddingTop: 8 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pageBtnOff: { opacity: 0.4 },
  pageBtnTxt: { fontSize: 14, fontWeight: '600', color: '#374151' },
  pageInfo: { fontSize: 14, color: '#6b7280' },
});

// Visiting card styles
const vc = StyleSheet.create({
  card: { width: 220, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  image: { width: '100%', height: 120 },
  imageFallback: { width: '100%', height: 120, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  imageFallbackIcon: { fontSize: 32 },
  body: { padding: 12 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  address: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  dateRow: { fontSize: 12, color: '#374151', fontWeight: '500', marginBottom: 6 },
  requester: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginBottom: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 6 },
  acceptBtn: { flex: 1, backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  acceptTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  declineBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  declineTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// Listing card styles
const lc = StyleSheet.create({
  card: { width: 200, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  image: { width: '100%', height: 110 },
  imageFallback: { width: '100%', height: 110, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  fallbackIcon: { fontSize: 28 },
  body: { padding: 12 },
  title: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 3 },
  price: { fontSize: 14, fontWeight: '700', color: '#CC0000', marginBottom: 2 },
  addr: { fontSize: 12, color: '#6b7280' },
});

// Meeting row styles
const mr = StyleSheet.create({
  row: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14,
    padding: 14, marginBottom: 10, backgroundColor: '#fafafa',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { fontSize: 13, fontWeight: '700', color: '#4f46e5' },
  soldBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  soldBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  markBtn: {
    backgroundColor: '#1a1a2e', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8,
  },
  markBtnTxt: { fontSize: 12, fontWeight: '700', color: '#e8c97e' },
  propTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  propAddr: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  infoRow: { flexDirection: 'row', gap: 4, marginBottom: 2 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', width: 72 },
  infoValue: { fontSize: 12, color: '#374151', flex: 1 },
  link: { color: '#2563eb' },
});

// Modal styles
const md = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeX: { fontSize: 18, color: '#9ca3af', fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: '#111827', marginBottom: 12, backgroundColor: '#fafafa',
  },
  inputErr: { borderColor: '#ef4444' },
  errTxt: { fontSize: 12, color: '#ef4444', marginBottom: 10, marginTop: -6 },
  saveBtn: {
    backgroundColor: '#CC0000', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnOff: { backgroundColor: '#e5e7eb' },
  saveBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  soldProp: { fontSize: 13, color: '#6b7280', marginBottom: 14, fontStyle: 'italic' },
});

// Mark sold modal extra styles
const ms = StyleSheet.create({
  txRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  txChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  txChipOn: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  txTxt: { fontSize: 14, fontWeight: '600', color: '#374151' },
  txTxtOn: { color: '#fff' },
});
