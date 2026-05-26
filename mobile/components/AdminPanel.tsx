import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Image, RefreshControl,
} from 'react-native';
import { admin as adminApi, type AdminUserResult, type AdminCandidate } from '../lib/api';

const NAVY = '#1e3a5f';
const TEAL = '#0d9488';
const ORANGE = '#f97316';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SPECIALTIES = [
  { id: 'Residential Sales',      emoji: '🏠', desc: 'Houses & apartments'  },
  { id: 'Commercial Real Estate', emoji: '🏢', desc: 'Office & retail space' },
  { id: 'Luxury Properties',      emoji: '✨', desc: 'High-end estates'      },
  { id: 'Property Management',    emoji: '🔑', desc: 'Rentals & tenants'     },
  { id: 'Investment Properties',  emoji: '📈', desc: 'ROI-focused deals'     },
  { id: 'First-Time Buyers',      emoji: '🌟', desc: 'Starter home guide'    },
  { id: 'New Developments',       emoji: '🏗️', desc: 'Off-plan & builds'    },
  { id: 'Vacation & Resort',      emoji: '🌴', desc: 'Holiday properties'    },
];

const CANDIDATE_FIELDS: { key: keyof AdminCandidate; label: string; icon: string }[] = [
  { key: 'personalInfo',   label: 'Personal Info',   icon: '👤' },
  { key: 'education',      label: 'Education',        icon: '🎓' },
  { key: 'workExperience', label: 'Work Experience',  icon: '💼' },
  { key: 'skills',         label: 'Skills',           icon: '⚡' },
  { key: 'availability',   label: 'Availability',     icon: '🕐' },
];

type Tab = 'dashboard' | 'user-management' | 'agent-candidates';
type DashboardStats = { properties: number; agents: number; users: number; forSale: number; forRent: number };
type MonthlyData = { year: number; sold: number[]; rented: number[]; listed: number[] };

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <View style={[sc.card, { backgroundColor: bg }]}>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card:  { flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  value: { fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 32 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  return (
    <View style={pb.wrap}>
      <View style={pb.header}>
        <Text style={pb.label}>{label}</Text>
        <Text style={[pb.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={pb.track}>
        <View style={[pb.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={pb.sub}>{sub}</Text>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:   { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label:  { fontSize: 13, fontWeight: '600', color: '#374151' },
  pct:    { fontSize: 13, fontWeight: '700' },
  track:  { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  fill:   { height: 8, borderRadius: 4 },
  sub:    { fontSize: 11, color: '#9ca3af', marginTop: 4 },
});

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ monthly }: { monthly: MonthlyData | null }) {
  const MAX_H = 80;
  const sold   = monthly?.sold   ?? Array(12).fill(0);
  const rented = monthly?.rented ?? Array(12).fill(0);
  const listed = monthly?.listed ?? Array(12).fill(0);
  const allValues = [...sold, ...rented, ...listed];
  const maxVal = Math.max(...allValues, 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4, gap: 2 }}>
        {MONTHS.map((m, i) => (
          <View key={m} style={{ alignItems: 'center', width: 36 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: MAX_H, gap: 2 }}>
              <View style={{ width: 8, height: Math.max(2, (sold[i] / maxVal) * MAX_H), backgroundColor: TEAL, borderRadius: 3 }} />
              <View style={{ width: 8, height: Math.max(2, (rented[i] / maxVal) * MAX_H), backgroundColor: ORANGE, borderRadius: 3 }} />
              <View style={{ width: 8, height: Math.max(2, (listed[i] / maxVal) * MAX_H), backgroundColor: NAVY, borderRadius: 3 }} />
            </View>
            <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>{m}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ stats, monthly, refreshing, onRefresh }: {
  stats: DashboardStats | null;
  monthly: MonthlyData | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const total = (stats?.forSale ?? 0) + (stats?.forRent ?? 0);
  const salePct = total > 0 ? Math.round(((stats?.forSale ?? 0) / total) * 100) : 50;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={dt.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
    >
      {/* Stats */}
      <View style={dt.statsRow}>
        <StatCard label="Properties" value={stats?.properties ?? 0} bg={ORANGE} />
        <StatCard label="Agents"     value={stats?.agents     ?? 0} bg={NAVY}   />
        <StatCard label="Users"      value={stats?.users      ?? 0} bg={TEAL}   />
      </View>

      {/* Monthly chart */}
      <View style={dt.card}>
        <Text style={dt.cardTitle}>Monthly Properties</Text>
        <Text style={dt.cardSub}>Full year — {monthly?.year ?? new Date().getFullYear()}</Text>
        <View style={{ marginTop: 16 }}>
          <BarChart monthly={monthly} />
        </View>
        <View style={dt.legend}>
          {[{ color: TEAL, label: 'Sold' }, { color: ORANGE, label: 'Rented' }, { color: NAVY, label: 'Listed' }].map(({ color, label }) => (
            <View key={label} style={dt.legendItem}>
              <View style={[dt.legendDot, { backgroundColor: color }]} />
              <Text style={dt.legendTxt}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Property status */}
      <View style={dt.card}>
        <Text style={dt.cardTitle}>Project Overview</Text>
        <Text style={dt.cardSub}>For Sale vs For Rent</Text>
        <View style={dt.splitBar}>
          <View style={[dt.splitFill, { flex: salePct, backgroundColor: TEAL }]} />
          <View style={[dt.splitFill, { flex: 100 - salePct, backgroundColor: ORANGE }]} />
        </View>
        <View style={dt.splitLegend}>
          <View style={dt.splitItem}>
            <View style={[dt.legendDot, { backgroundColor: TEAL }]} />
            <Text style={dt.legendTxt}>For Sale ({stats?.forSale ?? 0})</Text>
          </View>
          <View style={dt.splitItem}>
            <View style={[dt.legendDot, { backgroundColor: ORANGE }]} />
            <Text style={dt.legendTxt}>For Rent ({stats?.forRent ?? 0})</Text>
          </View>
        </View>
      </View>

      {/* Property Analytics */}
      <View style={dt.card}>
        <Text style={dt.cardTitle}>Property Analytics</Text>
        <Text style={dt.cardSub}>Profit, payments &amp; visitor trends</Text>
        <View style={{ marginTop: 16 }}>
          <ProgressBar pct={68} color={TEAL}   label="Profit"         sub="$124,500 · ↑ 12.4% vs last period" />
          <ProgressBar pct={82} color={ORANGE} label="Total Payments" sub="$98,300 collected · Tax: $14,250"  />
        </View>
        <View style={dt.visitorRow}>
          <Text style={dt.visitorLabel}>Visitor Analytics</Text>
          <Text style={[dt.visitorPct, { color: TEAL }]}>↑ 8.2%</Text>
        </View>
        <View style={dt.visitorBars}>
          {[30, 55, 40, 70, 52, 90, 65, 110, 75, 130, 95, 145].map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 40 }}>
              <View style={{ width: '60%', height: Math.round((v / 145) * 36), backgroundColor: TEAL, borderRadius: 2, opacity: 0.6 + (v / 145) * 0.4 }} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const dt = StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub:      { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  legend:       { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendTxt:    { fontSize: 12, color: '#6b7280' },
  splitBar:     { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 16, marginBottom: 12 },
  splitFill:    { height: 12 },
  splitLegend:  { flexDirection: 'row', gap: 16 },
  splitItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  visitorRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  visitorLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  visitorPct:   { fontSize: 13, fontWeight: '700' },
  visitorBars:  { flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 1, marginTop: 8 },
});

// ─── Make Agent Modal ─────────────────────────────────────────────────────────

function MakeAgentModal({ user, onClose, onSuccess }: { user: AdminUserResult; onClose: () => void; onSuccess: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);
    try {
      await adminApi.makeAgent({
        userId:    user.id,
        name:      user.username,
        specialty: selected,
        city:      user.location || 'Unknown',
        image:     user.avatarUrl || '',
        phone:     user.officePhone || user.mobilePhone || '',
        email:     user.contactEmail || user.email,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={mam.overlay}>
        <TouchableOpacity style={mam.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={mam.sheet}>
          {/* Header */}
          <View style={mam.header}>
            <View style={mam.headerIcon}><Text style={{ fontSize: 22 }}>🏡</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={mam.headerTitle}>Assign as Agent</Text>
              <Text style={mam.headerSub} numberOfLines={1}>
                Setting up <Text style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{user.username}</Text> as an agent
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={mam.specLabel}>Choose a speciality</Text>
            <View style={mam.specGrid}>
              {SPECIALTIES.map((s) => {
                const active = selected === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[mam.specCell, active && mam.specCellActive]}
                    onPress={() => setSelected(s.id)}
                    disabled={loading}
                  >
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                    <Text style={[mam.specName, active && { color: TEAL }]} numberOfLines={2}>{s.id}</Text>
                    <Text style={mam.specDesc} numberOfLines={1}>{s.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error && <Text style={mam.error}>{error}</Text>}

            <View style={mam.btnRow}>
              <TouchableOpacity style={mam.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={mam.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mam.confirmBtn, (!selected || loading) && mam.confirmBtnOff]}
                onPress={handleConfirm}
                disabled={!selected || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={mam.confirmTxt}>✓ Confirm</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const mam = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: 'flex-end' },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,18,35,0.65)' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18, backgroundColor: TEAL },
  headerIcon:     { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  specLabel:      { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  specGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCell:       { width: '47%', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#fafafa', gap: 4 },
  specCellActive: { borderColor: TEAL, backgroundColor: '#f0fdfa' },
  specName:       { fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' },
  specDesc:       { fontSize: 10, color: '#9ca3af', textAlign: 'center' },
  error:          { marginTop: 12, color: '#ef4444', fontSize: 13, textAlign: 'center' },
  btnRow:         { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:      { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  cancelTxt:      { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  confirmBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  confirmBtnOff:  { backgroundColor: '#d1d5db' },
  confirmTxt:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── User Management Tab ──────────────────────────────────────────────────────

function UserManagementTab() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState<AdminUserResult[]>([]);
  const [index,      setIndex]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [modalUser,  setModalUser]  = useState<AdminUserResult | null>(null);
  const [toast,      setToast]      = useState<string | null>(null);

  async function handleRefresh() {
    if (!query.trim() || !searched) return;
    setRefreshing(true);
    setIndex(0);
    try {
      setResults(await adminApi.searchUsers(query.trim()));
    } catch {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setRefreshing(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setIndex(0);
    try {
      const data = await adminApi.searchUsers(q);
      setResults(data);
    } catch {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const user = results[index];
  const multiple = results.length > 1;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={um.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={NAVY} />}
    >
      {toast && (
        <View style={um.toast}><Text style={um.toastTxt}>{toast}</Text></View>
      )}

      {/* Search row */}
      <View style={um.searchRow}>
        <TextInput
          style={um.input}
          placeholder="Search by username..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={(v) => { setQuery(v); if (!v) { setSearched(false); setResults([]); setError(null); } }}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[um.searchBtn, (loading || !query.trim()) && um.searchBtnOff]}
          onPress={runSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={um.searchBtnTxt}>Search</Text>}
        </TouchableOpacity>
      </View>

      {error && <Text style={um.error}>{error}</Text>}

      {searched && !loading && !error && results.length === 0 && (
        <Text style={um.empty}>No users found for "{query}".</Text>
      )}

      {user && (
        <>
          {/* User card */}
          <View style={um.card}>
            {/* Gradient header */}
            <View style={um.cardHeader}>
              <Text style={um.joinedTxt}>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            </View>

            {/* Avatar */}
            <View style={um.avatarRow}>
              <View style={um.avatarWrap}>
                {user.avatarUrl
                  ? <Image source={{ uri: user.avatarUrl }} style={um.avatar} />
                  : (
                    <View style={[um.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: TEAL }]}>
                      <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{user.username.charAt(0).toUpperCase()}</Text>
                    </View>
                  )
                }
              </View>
            </View>

            <View style={um.cardBody}>
              <Text style={um.username}>{user.username}</Text>
              {user.location
                ? <Text style={um.location}>📍 {user.location}</Text>
                : <Text style={[um.location, { color: '#d1d5db' }]}>📍 No location set</Text>
              }

              <View style={um.divider} />

              {/* Contact info */}
              <View style={um.contactRow}>
                <Text style={um.contactIcon}>📞</Text>
                <View>
                  <Text style={um.contactLabel}>Office</Text>
                  <Text style={[um.contactValue, !user.officePhone && um.contactNone]}>
                    {user.officePhone || 'No office phone added yet'}
                  </Text>
                </View>
              </View>
              <View style={um.contactRow}>
                <Text style={um.contactIcon}>📱</Text>
                <View>
                  <Text style={um.contactLabel}>Mobile</Text>
                  <Text style={[um.contactValue, !user.mobilePhone && um.contactNone]}>
                    {user.mobilePhone || 'No mobile phone added yet'}
                  </Text>
                </View>
              </View>
              <View style={um.contactRow}>
                <Text style={um.contactIcon}>✉️</Text>
                <View>
                  <Text style={um.contactLabel}>Email</Text>
                  <Text style={[um.contactValue, !user.contactEmail && um.contactNone, user.contactEmail && { color: TEAL }]}>
                    {user.contactEmail || 'No contact email added yet'}
                  </Text>
                </View>
              </View>

              <View style={um.divider} />

              {/* Make Agent button */}
              {(user.officePhone || user.mobilePhone || user.contactEmail) ? (
                <TouchableOpacity style={um.makeAgentBtn} onPress={() => setModalUser(user)}>
                  <Text style={um.makeAgentTxt}>Make Agent</Text>
                </TouchableOpacity>
              ) : (
                <View style={um.noContactBtn}>
                  <Text style={um.noContactTxt}>No Contact Info</Text>
                </View>
              )}
            </View>
          </View>

          {/* Navigation */}
          {multiple && (
            <View style={um.navRow}>
              <TouchableOpacity
                style={[um.navBtn, index === 0 && um.navBtnOff]}
                onPress={() => setIndex(i => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                <Text style={um.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={um.navCount}>{index + 1} of {results.length}</Text>
              <TouchableOpacity
                style={[um.navBtn, index === results.length - 1 && um.navBtnOff]}
                onPress={() => setIndex(i => Math.min(results.length - 1, i + 1))}
                disabled={index === results.length - 1}
              >
                <Text style={um.navArrow}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {modalUser && (
        <MakeAgentModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          onSuccess={() => {
            setModalUser(null);
            setQuery('');
            setResults([]);
            setSearched(false);
            setIndex(0);
            showToast(`${modalUser.username} is now an agent!`);
          }}
        />
      )}
    </ScrollView>
  );
}

const um = StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  toast:        { backgroundColor: '#065f46', borderRadius: 12, padding: 12, marginBottom: 14, alignItems: 'center' },
  toastTxt:     { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input:        { flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', backgroundColor: '#fafafa' },
  searchBtn:    { width: 88, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  searchBtnOff: { opacity: 0.45 },
  searchBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  error:        { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  empty:        { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 32 },
  card:         { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 },
  cardHeader:   { height: 80, backgroundColor: TEAL, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 10 },
  joinedTxt:    { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  avatarRow:    { alignItems: 'center', marginTop: -40 },
  avatarWrap:   { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', overflow: 'hidden' },
  avatar:       { width: '100%', height: '100%' },
  cardBody:     { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
  username:     { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  location:     { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  divider:      { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },
  contactRow:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  contactIcon:  { fontSize: 16, width: 24, textAlign: 'center', marginTop: 2 },
  contactLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue: { fontSize: 13, color: '#374151', marginTop: 1 },
  contactNone:  { color: '#d1d5db', fontStyle: 'italic' },
  makeAgentBtn: { borderRadius: 30, paddingVertical: 14, backgroundColor: TEAL, alignItems: 'center' },
  makeAgentTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  noContactBtn: { borderRadius: 30, paddingVertical: 14, backgroundColor: '#f3f4f6', alignItems: 'center' },
  noContactTxt: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  navRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 8 },
  navBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  navBtnOff:    { opacity: 0.35 },
  navArrow:     { fontSize: 22, color: '#6b7280', lineHeight: 26 },
  navCount:     { fontSize: 14, fontWeight: '600', color: '#374151' },
});

// ─── Agent Candidates Tab ─────────────────────────────────────────────────────

function AgentCandidatesTab() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [index,      setIndex]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting,  setAccepting]  = useState(false);
  const [specialty,  setSpecialty]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'accept' | 'decline' | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchCandidates() {
    try {
      setCandidates(await adminApi.agentCandidates());
    } catch {}
  }

  async function handleRefresh() {
    setRefreshing(true);
    setIndex(0);
    await fetchCandidates();
    setRefreshing(false);
  }

  useEffect(() => {
    fetchCandidates().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAccepting(false);
    setSpecialty(null);
  }, [index]);

  function removeCandidate(id: number) {
    setCandidates(prev => {
      const next = prev.filter(c => c.id !== id);
      setIndex(i => Math.min(i, Math.max(next.length - 1, 0)));
      return next;
    });
  }

  async function handleAccept() {
    if (!specialty || !candidate) return;
    setSubmitting('accept');
    try {
      await adminApi.acceptCandidate(candidate.id, specialty);
      showToast(`${candidate.username} is now an agent!`);
      removeCandidate(candidate.id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to accept', false);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDecline() {
    if (!candidate) return;
    setSubmitting('decline');
    try {
      await adminApi.declineCandidate(candidate.id);
      showToast(`Application from ${candidate.username} was declined.`);
      removeCandidate(candidate.id);
    } catch {
      showToast('Failed to decline', false);
    } finally {
      setSubmitting(null);
    }
  }

  const candidate = candidates[index];
  const appliedDate = candidate ? new Date(candidate.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const initial = candidate ? candidate.username.charAt(0).toUpperCase() : '';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={loading || !candidate ? ac.centerFlex : ac.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={NAVY} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color={NAVY} />
      ) : !candidate ? (
        <>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
          <Text style={ac.emptyTxt}>No agent candidates yet.</Text>
        </>
      ) : (
        <>
          {toast && (
            <View style={[ac.toast, { backgroundColor: toast.ok ? '#065f46' : '#991b1b' }]}>
              <Text style={ac.toastTxt}>{toast.msg}</Text>
            </View>
          )}

          {/* Section header */}
          <View style={ac.sectionHeader}>
            <View>
              <Text style={ac.sectionTitle}>Agent Candidates</Text>
              <Text style={ac.sectionSub}>{candidates.length} application{candidates.length !== 1 ? 's' : ''} received</Text>
            </View>
            {candidates.length > 1 && (
              <View style={ac.countBadge}>
                <Text style={ac.countTxt}>{index + 1} of {candidates.length}</Text>
              </View>
            )}
          </View>

          {/* Card */}
          <View style={ac.card}>
            {/* Left: gradient avatar section */}
            <View style={ac.cardLeft}>
              <View style={ac.avatarWrap}>
                {candidate.avatarUrl
                  ? <Image source={{ uri: candidate.avatarUrl }} style={ac.avatar} />
                  : (
                    <View style={[ac.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 48, fontWeight: '800', color: '#fff' }}>{initial}</Text>
                    </View>
                  )
                }
              </View>
              <Text style={ac.candidateName}>{candidate.username}</Text>
              <View style={ac.idBadge}><Text style={ac.idTxt}># Candidate {candidate.id}</Text></View>
              <Text style={ac.appliedTxt}>📅 Applied {appliedDate}</Text>
            </View>

            {/* Right: info fields + actions */}
            <View style={ac.cardRight}>
              <Text style={ac.cardRightTitle}>{candidate.username}</Text>
              <Text style={ac.cardRightSub}>Agent Application</Text>

              {CANDIDATE_FIELDS.map(({ key, label, icon }) => {
                const value = candidate[key] as string | null;
                return (
                  <View key={key} style={ac.fieldRow}>
                    <View style={ac.fieldIcon}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={ac.fieldLabel}>{label}</Text>
                      <Text style={[ac.fieldValue, !value && ac.fieldNone]}>
                        {value || 'Not provided'}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Actions */}
              <View style={ac.actions}>
                {!accepting ? (
                  <View style={ac.actionRow}>
                    <TouchableOpacity
                      style={ac.acceptBtn}
                      onPress={() => setAccepting(true)}
                      disabled={submitting !== null}
                    >
                      <Text style={ac.acceptTxt}>✓ Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={ac.declineBtn}
                      onPress={handleDecline}
                      disabled={submitting !== null}
                    >
                      {submitting === 'decline'
                        ? <ActivityIndicator color="#ef4444" size="small" />
                        : <Text style={ac.declineTxt}>✕ Decline</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={ac.specPrompt}>Choose a specialty for {candidate.username}</Text>
                    <View style={ac.specGrid}>
                      {SPECIALTIES.map(s => (
                        <TouchableOpacity
                          key={s.id}
                          style={[ac.specPill, specialty === s.id && ac.specPillActive]}
                          onPress={() => setSpecialty(s.id === specialty ? null : s.id)}
                          disabled={submitting !== null}
                        >
                          <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                          <Text style={[ac.specPillTxt, specialty === s.id && { color: '#065f46' }]}>{s.id}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={ac.actionRow}>
                      <TouchableOpacity
                        style={[ac.acceptBtn, (!specialty || submitting !== null) && { opacity: 0.45 }]}
                        onPress={handleAccept}
                        disabled={!specialty || submitting !== null}
                      >
                        {submitting === 'accept'
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={ac.acceptTxt}>✓ Confirm Accept</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={ac.backBtn}
                        onPress={() => { setAccepting(false); setSpecialty(null); }}
                        disabled={submitting !== null}
                      >
                        <Text style={ac.backTxt}>← Back</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Navigation */}
          {candidates.length > 1 && (
            <View style={ac.navWrap}>
              <View style={ac.navRow}>
                <TouchableOpacity
                  style={ac.navBtn}
                  onPress={() => setIndex(i => (i - 1 + candidates.length) % candidates.length)}
                >
                  <Text style={ac.navArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={ac.navCount}>{index + 1} / {candidates.length}</Text>
                <TouchableOpacity
                  style={ac.navBtn}
                  onPress={() => setIndex(i => (i + 1) % candidates.length)}
                >
                  <Text style={ac.navArrow}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={ac.dots}>
                {candidates.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[ac.dot, i === index && ac.dotActive]}
                    onPress={() => setIndex(i)}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const ac = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerFlex:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTxt:      { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  scroll:        { padding: 16, paddingBottom: 40 },
  toast:         { borderRadius: 12, padding: 12, marginBottom: 14, alignItems: 'center' },
  toastTxt:      { color: '#fff', fontWeight: '600', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle:  { fontSize: 22, fontWeight: '800', color: NAVY },
  sectionSub:    { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  countBadge:    { backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  countTxt:      { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  card:          { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
  cardLeft:      { paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', backgroundColor: NAVY },
  avatarWrap:    { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  avatar:        { width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.15)' },
  candidateName: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  idBadge:       { marginTop: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  idTxt:         { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  appliedTxt:    { marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  cardRight:     { padding: 20 },
  cardRightTitle:{ fontSize: 22, fontWeight: '800', color: NAVY },
  cardRightSub:  { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, marginBottom: 16 },
  fieldRow:      { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(13,148,136,0.09)', alignItems: 'center', justifyContent: 'center' },
  fieldLabel:    { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldValue:    { fontSize: 13, color: '#1f2937', marginTop: 2, lineHeight: 19 },
  fieldNone:     { color: '#d1d5db', fontStyle: 'italic' },
  actions:       { marginTop: 16 },
  actionRow:     { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  acceptBtn:     { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', minWidth: 100 },
  acceptTxt:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  declineBtn:    { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: '#fecaca', alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  declineTxt:    { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  backBtn:       { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  backTxt:       { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  specPrompt:    { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  specGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  specPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fafafa' },
  specPillActive:{ borderColor: '#059669', backgroundColor: '#ecfdf5' },
  specPillTxt:   { fontSize: 12, fontWeight: '600', color: '#374151' },
  navWrap:       { alignItems: 'center', gap: 14, marginBottom: 8 },
  navRow:        { flexDirection: 'row', alignItems: 'center', gap: 24 },
  navBtn:        { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  navArrow:      { fontSize: 24, color: '#6b7280', lineHeight: 28 },
  navCount:      { fontSize: 14, fontWeight: '700', color: NAVY, minWidth: 56, textAlign: 'center' },
  dots:          { flexDirection: 'row', gap: 8 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  dotActive:     { backgroundColor: TEAL, transform: [{ scale: 1.3 }] },
});

// ─── Admin Panel (main export) ────────────────────────────────────────────────

export default function AdminPanel() {
  const [tab,        setTab]        = useState<Tab>('dashboard');
  const [stats,      setStats]      = useState<DashboardStats | null>(null);
  const [monthly,    setMonthly]    = useState<MonthlyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard() {
    await Promise.all([
      adminApi.stats().then(setStats).catch(() => {}),
      adminApi.monthlyProperties().then(setMonthly).catch(() => {}),
    ]);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard',        label: 'Dashboard'        },
    { key: 'user-management',  label: 'User Management'  },
    { key: 'agent-candidates', label: 'Agent Candidates' },
  ];

  return (
    <View style={ap.root}>
      {/* Tab switcher */}
      <View style={ap.tabBar}>
        <View style={ap.tabGroup}>
          {TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[ap.tabBtn, tab === key && ap.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[ap.tabTxt, tab === key && ap.tabTxtActive]} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === 'dashboard'        && <DashboardTab stats={stats} monthly={monthly} refreshing={refreshing} onRefresh={handleRefresh} />}
        {tab === 'user-management'  && <UserManagementTab />}
        {tab === 'agent-candidates' && <AgentCandidatesTab />}
      </View>
    </View>
  );
}

const ap = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f9fafb' },
  tabBar:       { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 12 },
  tabGroup:     { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 4, gap: 4 },
  tabBtn:       { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: NAVY },
  tabTxt:       { fontSize: 11, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  tabTxtActive: { color: '#fff' },
});
