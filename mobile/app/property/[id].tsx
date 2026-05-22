import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  Modal, TouchableOpacity, Dimensions, StatusBar, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  properties as propertiesApi,
  agents as agentsApi,
  visitings as visitingsApi,
  messages as messagesApi,
} from '../../lib/api';
import type { Agent, Property } from '../../lib/types';
import { useAuth } from '../../lib/auth-context';

const { width: SW, height: SH } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  for_sale: { label: 'For Sale · Active', color: '#10b981' },
  for_rent: { label: 'For Rent · Active', color: '#3b82f6' },
  sold:     { label: 'Sold',              color: '#9ca3af' },
  rented:   { label: 'Rented',            color: '#9ca3af' },
};

const TYPE_LABELS: Record<string, string> = {
  house: 'House', apartment: 'Apartment', condo: 'Condo',
  townhouse: 'Townhouse', land: 'Land', commercial: 'Commercial',
};

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateWorkdays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dd}`;
}

function parseDateStr(s: string): Date {
  const [y, mo, d] = s.split('T')[0].split('-').map(Number);
  return new Date(y, mo - 1, d);
}

function isToday(d: Date): boolean {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isPastHour(d: Date, h: number): boolean {
  return isToday(d) && new Date().getHours() >= h;
}

function isVisitExpired(visitDate: string, hour: number): boolean {
  const d = parseDateStr(visitDate);
  d.setHours(hour + 1, 0, 0, 0);
  return d < new Date();
}

function formatHour(h: number): string {
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

function fullDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

type BookingInfo = {
  booked: boolean;
  visitDate?: string;
  hour?: number;
  status?: 'pending' | 'confirmed' | 'cancelled';
  visitingId?: number;
};

// ─── Message modal ────────────────────────────────────────────────────────────

function MessageModal({ agentName, receiverId, onClose }: {
  agentName: string;
  receiverId: number;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setErr(null);
    try {
      await messagesApi.send(receiverId, subject.trim(), body.trim());
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={m.overlay}>
        <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>Message {agentName}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={m.closeX}>✕</Text>
            </TouchableOpacity>
          </View>
          {sent ? (
            <View style={m.sentBox}>
              <Text style={m.sentCheck}>✓</Text>
              <Text style={m.sentMsg}>Message sent!</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={m.input}
                placeholder="Subject"
                placeholderTextColor="#9ca3af"
                value={subject}
                onChangeText={setSubject}
              />
              <TextInput
                style={[m.input, m.textarea]}
                placeholder="Your message…"
                placeholderTextColor="#9ca3af"
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {err && <Text style={m.errText}>{err}</Text>}
              <TouchableOpacity
                style={[m.sendBtn, (!subject.trim() || !body.trim() || sending) && m.sendBtnOff]}
                onPress={handleSend}
                disabled={!subject.trim() || !body.trim() || sending}
              >
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={m.sendBtnTxt}>Send Message</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Tour booking section ─────────────────────────────────────────────────────

function TourBookingSection({ propertyId, userId }: { propertyId: number; userId: number | null }) {
  const workdays = useMemo(() => generateWorkdays(10), []);
  const [selDate, setSelDate] = useState<Date>(workdays[0]);
  const [selHour, setSelHour] = useState<number | null>(null);
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [busySet, setBusySet] = useState<Set<string>>(new Set());
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoadingInfo(false); return; }
    Promise.all([
      visitingsApi.check(propertyId),
      visitingsApi.busySlots(propertyId),
    ])
      .then(([status, slots]) => {
        setInfo(status);
        setBusySet(new Set(slots.map(s => `${s.visitDate.split('T')[0]}:${s.hour}`)));
      })
      .catch(() => setInfo({ booked: false }))
      .finally(() => setLoadingInfo(false));
  }, [propertyId, userId]);

  async function book() {
    if (!userId || selHour === null) return;
    setSubmitting(true);
    setErr(null);
    try {
      // Use local date at UTC midnight to avoid day-shift in UTC+ timezones
      await visitingsApi.create(propertyId, `${toDateKey(selDate)}T00:00:00.000Z`, selHour);
      const updated = await visitingsApi.check(propertyId);
      setInfo(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function clearAndRebook() {
    if (!info?.visitingId) return;
    setErr(null);
    try {
      await visitingsApi.deleteVisiting(info.visitingId);
      setInfo({ booked: false });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to clear booking');
    }
  }

  if (!userId) {
    return (
      <View style={b.card}>
        <Text style={b.cardTitle}>Thinking of buying?</Text>
        <Text style={b.guestNote}>Sign in to schedule a private tour</Text>
      </View>
    );
  }

  if (loadingInfo) {
    return (
      <View style={b.card}>
        <Text style={b.cardTitle}>Thinking of buying?</Text>
        <ActivityIndicator color="#CC0000" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (info?.booked) {
    const { status, visitDate, hour } = info;
    const expired = visitDate != null && hour != null ? isVisitExpired(visitDate, hour) : false;

    if (status === 'confirmed') {
      return (
        <View style={b.card}>
          <Text style={b.cardTitle}>Thinking of buying?</Text>
          <View style={[b.banner, b.bannerGreen]}>
            <Text style={b.bannerIcon}>✓</Text>
            <View style={b.bannerBody}>
              <Text style={b.bannerHead}>Tour Confirmed!</Text>
              {visitDate != null && hour != null && (
                <Text style={b.bannerSub}>{fullDateLabel(parseDateStr(visitDate))} at {formatHour(hour)}</Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    if (status === 'pending' && !expired) {
      return (
        <View style={b.card}>
          <Text style={b.cardTitle}>Thinking of buying?</Text>
          <View style={[b.banner, b.bannerAmber]}>
            <Text style={b.bannerIcon}>⏳</Text>
            <View style={b.bannerBody}>
              <Text style={b.bannerHead}>Tour Pending</Text>
              {visitDate != null && hour != null && (
                <Text style={b.bannerSub}>{fullDateLabel(parseDateStr(visitDate))} at {formatHour(hour)}</Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    // expired pending or cancelled
    return (
      <View style={b.card}>
        <Text style={b.cardTitle}>Thinking of buying?</Text>
        <View style={[b.banner, b.bannerGray]}>
          <Text style={b.bannerIcon}>{status === 'cancelled' ? '✕' : '⏰'}</Text>
          <View style={b.bannerBody}>
            <Text style={b.bannerHead}>{status === 'cancelled' ? 'Tour Cancelled' : 'Tour Expired'}</Text>
            <Text style={b.bannerSub}>
              {status === 'cancelled' ? 'Your request was not approved.' : 'This tour has passed.'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={b.rebookBtn} onPress={clearAndRebook}>
          <Text style={b.rebookTxt}>Book a New Tour</Text>
        </TouchableOpacity>
        {err && <Text style={b.errTxt}>{err}</Text>}
      </View>
    );
  }

  // Idle: booking form
  const selKey = toDateKey(selDate);

  return (
    <View style={b.card}>
      <Text style={b.cardTitle}>Thinking of buying?</Text>
      <Text style={b.cardSub}>Schedule a private tour</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={b.dateRow}
        style={b.dateScroll}
      >
        {workdays.map((d, i) => {
          const on = toDateKey(d) === selKey;
          return (
            <TouchableOpacity
              key={i}
              style={[b.dayChip, on && b.dayChipOn]}
              onPress={() => { setSelDate(d); setSelHour(null); }}
            >
              <Text style={[b.dayTxt, on && b.dayTxtOn]}>{dateLabel(d)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={b.hourGrid}>
        {HOURS.map(h => {
          const busy = busySet.has(`${selKey}:${h}`);
          const past = isPastHour(selDate, h);
          const off = busy || past;
          const on = selHour === h;
          return (
            <TouchableOpacity
              key={h}
              style={[b.hourChip, on && b.hourChipOn, off && b.hourChipOff]}
              onPress={() => !off && setSelHour(h)}
              disabled={off}
            >
              <Text style={[b.hourTxt, on && b.hourTxtOn, off && b.hourTxtOff]}>{formatHour(h)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {err && <Text style={b.errTxt}>{err}</Text>}

      <TouchableOpacity
        style={[b.bookBtn, (selHour === null || submitting) && b.bookBtnOff]}
        onPress={book}
        disabled={selHour === null || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={b.bookTxt}>Schedule Tour</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Agent section ────────────────────────────────────────────────────────────

function AgentSection({ agent, userId }: { agent: Agent; userId: number | null }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const canMessage = userId !== null && userId !== agent.userId;

  return (
    <View style={ag.card}>
      <Text style={ag.cardTitle}>Listed by Agent</Text>
      <View style={ag.row}>
        {agent.image
          ? <Image source={{ uri: agent.image }} style={ag.avatar} />
          : (
            <View style={ag.avatarFallback}>
              <Text style={ag.initial}>{agent.name[0]?.toUpperCase()}</Text>
            </View>
          )
        }
        <View style={ag.info}>
          <Text style={ag.name}>{agent.name}</Text>
          <Text style={ag.role}>RealEstate · Top Agent</Text>
          {agent.phone && <Text style={ag.phone}>{agent.phone}</Text>}
        </View>
        {canMessage && (
          <TouchableOpacity style={ag.msgBtn} onPress={() => setMsgOpen(true)} activeOpacity={0.8}>
            <Text style={ag.msgIcon}>✉</Text>
          </TouchableOpacity>
        )}
      </View>
      {msgOpen && (
        <MessageModal agentName={agent.name} receiverId={agent.userId} onClose={() => setMsgOpen(false)} />
      )}
    </View>
  );
}

// ─── Gallery modal ────────────────────────────────────────────────────────────

function GalleryModal({ images, initialIndex, onClose }: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * SW, animated: false });
    }, 30);
  }, []);

  function goTo(i: number) {
    if (i < 0 || i >= images.length) return;
    scrollRef.current?.scrollTo({ x: i * SW, animated: true });
    setIndex(i);
  }

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={g.container}>

        <View style={g.header}>
          <View style={g.headerLeft} />
          <View style={g.counterWrap}>
            <Text style={g.counterText}>{index + 1}</Text>
            <Text style={g.counterSep}> / </Text>
            <Text style={g.counterTotal}>{images.length}</Text>
          </View>
          <TouchableOpacity style={g.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={g.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            setIndex(Math.round(e.nativeEvent.contentOffset.x / SW));
          }}
          scrollEventThrottle={16}
          style={g.strip}
        >
          {images.map((uri, i) => (
            <View key={i} style={g.slide}>
              <Image source={{ uri }} style={g.fullImage} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {index > 0 && (
          <TouchableOpacity style={[g.arrow, g.arrowLeft]} onPress={() => goTo(index - 1)} activeOpacity={0.8}>
            <Text style={g.arrowGlyph}>‹</Text>
          </TouchableOpacity>
        )}

        {index < images.length - 1 && (
          <TouchableOpacity style={[g.arrow, g.arrowRight]} onPress={() => goTo(index + 1)} activeOpacity={0.8}>
            <Text style={g.arrowGlyph}>›</Text>
          </TouchableOpacity>
        )}

        {images.length > 1 && images.length <= 12 && (
          <View style={g.dots}>
            {images.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                <View style={[g.dot, i === index && g.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={g.thumbStrip}
            style={g.thumbScrollView}
          >
            {images.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.75}>
                <View style={[g.thumb, i === index && g.thumbActive]}>
                  <Image source={{ uri }} style={g.thumbImg} resizeMode="cover" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Property detail screen ───────────────────────────────────────────────────

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      propertiesApi.get(Number(id)),
      propertiesApi.coverImage(Number(id)).catch(() => ({ coverImage: null })),
      agentsApi.list().catch(() => [] as Agent[]),
    ])
      .then(([p, coverResult, allAgents]) => {
        setProperty(p);
        navigation.setOptions({ title: p.title });

        const foundAgent = p.listedByAgentId
          ? (allAgents.find(a => a.id === p.listedByAgentId) ?? allAgents[p.id % allAgents.length] ?? null)
          : (allAgents[p.id % allAgents.length] ?? null);
        setAgent(foundAgent);

        const r2FromDb = (p.images ?? []).filter(u => u.includes('.r2.dev/'));
        const seen = new Set<string>();
        const imgs: string[] = [];

        if (coverResult.coverImage) { seen.add(coverResult.coverImage); imgs.push(coverResult.coverImage); }
        for (const url of r2FromDb) {
          if (!seen.has(url)) { seen.add(url); imgs.push(url); }
        }
        if (imgs.length === 0) {
          for (const url of p.images ?? []) imgs.push(url);
        }

        setResolvedImages(imgs);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load property'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#CC0000" /></View>;
  }

  if (error || !property) {
    return <View style={s.centered}><Text style={s.errorText}>{error ?? 'Property not found'}</Text></View>;
  }

  const p = property;
  const price = parseFloat(p.price);
  const sqft = p.squareFeet ? Math.round(parseFloat(p.squareFeet)) : null;
  const status = STATUS_CONFIG[p.status] ?? { label: p.status, color: '#9ca3af' };
  const images = resolvedImages;
  const cover = images[0] ?? null;

  function openGallery(i: number) {
    if (images.length === 0) return;
    setGalleryIndex(i);
    setGalleryOpen(true);
  }

  return (
    <>
      {galleryOpen && (
        <GalleryModal images={images} initialIndex={galleryIndex} onClose={() => setGalleryOpen(false)} />
      )}

      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>

        {/* ── Hero image ── */}
        <TouchableOpacity
          style={s.imageContainer}
          activeOpacity={0.92}
          onPress={() => openGallery(0)}
          disabled={images.length === 0}
        >
          {cover
            ? <Image source={{ uri: cover }} style={s.heroImage} resizeMode="cover" />
            : <View style={s.imagePlaceholder}><Text style={s.imagePlaceholderIcon}>🏠</Text></View>
          }

          <View style={s.imageOverlay} />

          <View style={s.imageBadges}>
            <View style={[s.statusBadge, { backgroundColor: status.color }]}>
              <Text style={s.statusBadgeText}>{status.label}</Text>
            </View>
            <View style={s.typeBadge}>
              <Text style={s.typeBadgeText}>{TYPE_LABELS[p.type] ?? p.type}</Text>
            </View>
          </View>

          {images.length > 1 && (
            <View style={s.photoPill}>
              <Text style={s.photoPillText}>📷  {images.length} photos</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Thumbnail strip ── */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.thumbRow}
            style={s.thumbScrollView}
          >
            {images.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => openGallery(i)} activeOpacity={0.8}>
                <Image source={{ uri }} style={[s.thumbImg, i === 0 && s.thumbFirst]} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Content ── */}
        <View style={s.content}>
          <Text style={s.price}>
            ${price.toLocaleString()}
            {p.status === 'for_rent' && <Text style={s.priceSuffix}>/mo</Text>}
          </Text>
          <Text style={s.title}>{p.title}</Text>
          <Text style={s.address}>📍 {p.address}, {p.city}, {p.state} {p.zipCode}</Text>

          {(p.bedrooms != null || p.bathrooms != null || sqft != null) && (
            <View style={s.statsRow}>
              {p.bedrooms != null && (
                <View style={s.statChip}>
                  <Text style={s.statValue}>{p.bedrooms}</Text>
                  <Text style={s.statLabel}>Beds</Text>
                </View>
              )}
              {p.bathrooms != null && (
                <View style={s.statChip}>
                  <Text style={s.statValue}>{p.bathrooms}</Text>
                  <Text style={s.statLabel}>Baths</Text>
                </View>
              )}
              {sqft != null && (
                <View style={s.statChip}>
                  <Text style={s.statValue}>{sqft.toLocaleString()}</Text>
                  <Text style={s.statLabel}>Sq Ft</Text>
                </View>
              )}
            </View>
          )}

          {p.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About this home</Text>
              <Text style={s.description}>{p.description}</Text>
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionTitle}>Property Details</Text>
            <View style={s.detailsGrid}>
              <DetailRow label="Type"   value={TYPE_LABELS[p.type] ?? p.type} />
              <DetailRow label="Status" value={status.label} />
              {p.yearBuilt != null && <DetailRow label="Year Built" value={String(p.yearBuilt)} />}
              {p.lotSize   != null && <DetailRow label="Lot Size"   value={`${Math.round(parseFloat(p.lotSize)).toLocaleString()} sqft`} />}
              {p.garage && <DetailRow label="Garage" value="Yes" />}
              {p.pool   && <DetailRow label="Pool"   value="Yes" />}
            </View>
          </View>

          <TourBookingSection propertyId={p.id} userId={user?.id ?? null} />

          {agent && <AgentSection agent={agent} userId={user?.id ?? null} />}
        </View>

      </ScrollView>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center' },

  imageContainer: { height: 280, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  heroImage: { width: '100%', height: 280 },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 64 },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.28)' },
  imageBadges: { position: 'absolute', bottom: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  typeBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  typeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  photoPill: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  photoPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  thumbScrollView: { backgroundColor: '#f8fafc', maxHeight: 76 },
  thumbRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  thumbImg: { width: 80, height: 56, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbFirst: { borderColor: '#CC0000' },

  content: { padding: 20 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#CC0000', marginBottom: 6 },
  priceSuffix: { fontSize: 16, fontWeight: '400', color: '#9ca3af' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  address: { fontSize: 14, color: '#6b7280', marginBottom: 20 },

  statsRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  statChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  section: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 20, marginTop: 4, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 22 },

  detailsGrid: { gap: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
});

// ─── Gallery styles ───────────────────────────────────────────────────────────

const g = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: 'rgba(9,9,11,0.72)',
  },
  headerLeft: { width: 40 },
  counterWrap: { flexDirection: 'row', alignItems: 'baseline' },
  counterText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  counterSep:  { fontSize: 16, color: 'rgba(255,255,255,0.45)', marginHorizontal: 2 },
  counterTotal:{ fontSize: 16, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 20 },

  strip: { flex: 1 },
  slide: { width: SW, height: SH, alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: SW, height: SH * 0.72 },

  arrow: {
    position: 'absolute', top: '50%', marginTop: -28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  arrowLeft:  { left: 14 },
  arrowRight: { right: 14 },
  arrowGlyph: { color: '#fff', fontSize: 34, fontWeight: '300', lineHeight: 40, marginTop: -3 },

  dots: {
    position: 'absolute', bottom: 100, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 7, zIndex: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 20, borderRadius: 3, backgroundColor: '#fff' },

  thumbScrollView: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  thumbStrip: { paddingHorizontal: 14, paddingVertical: 14, gap: 8, flexDirection: 'row' },
  thumb: { borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  thumbActive: { borderColor: '#fff' },
  thumbImg: { width: 68, height: 52 },
});

// ─── Booking styles ───────────────────────────────────────────────────────────

const b = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20,
    padding: 20, marginBottom: 20, backgroundColor: '#fafafa',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  guestNote: { fontSize: 14, color: '#6b7280', marginTop: 8 },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderRadius: 14, padding: 16, marginTop: 12,
  },
  bannerGreen: { backgroundColor: '#f0fdf4' },
  bannerAmber: { backgroundColor: '#fffbeb' },
  bannerGray:  { backgroundColor: '#f9fafb' },
  bannerIcon: { fontSize: 22, marginTop: 1 },
  bannerBody: { flex: 1 },
  bannerHead: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  bannerSub:  { fontSize: 13, color: '#6b7280', lineHeight: 18 },

  rebookBtn: {
    marginTop: 14, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 12, paddingVertical: 11, alignItems: 'center',
  },
  rebookTxt: { fontSize: 14, fontWeight: '600', color: '#374151' },
  errTxt: { fontSize: 12, color: '#ef4444', marginTop: 8 },

  dateScroll: { marginBottom: 14 },
  dateRow: { gap: 8, paddingVertical: 2 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  dayChipOn: { backgroundColor: '#CC0000', borderColor: '#CC0000' },
  dayTxt:    { fontSize: 13, fontWeight: '600', color: '#374151' },
  dayTxtOn:  { color: '#fff' },

  hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  hourChip: {
    width: '22%', paddingVertical: 9, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  hourChipOn:  { backgroundColor: '#CC0000', borderColor: '#CC0000' },
  hourChipOff: { backgroundColor: '#f3f4f6', borderColor: '#f3f4f6' },
  hourTxt:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  hourTxtOn:   { color: '#fff' },
  hourTxtOff:  { color: '#d1d5db' },

  bookBtn: {
    backgroundColor: '#CC0000', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  bookBtnOff: { backgroundColor: '#e5e7eb' },
  bookTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Agent styles ─────────────────────────────────────────────────────────────

const ag = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20,
    padding: 20, marginBottom: 32, backgroundColor: '#fafafa',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#CC0000', alignItems: 'center', justifyContent: 'center',
  },
  initial: { fontSize: 22, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  role: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  phone: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  msgBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  msgIcon: { fontSize: 18 },
});

// ─── Message modal styles ─────────────────────────────────────────────────────

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeX: { fontSize: 18, color: '#9ca3af', fontWeight: '600' },

  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: '#111827', marginBottom: 12, backgroundColor: '#fafafa',
  },
  textarea: { height: 110, paddingTop: 12 },
  errText: { fontSize: 12, color: '#ef4444', marginBottom: 8 },

  sendBtn: {
    backgroundColor: '#CC0000', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: '#e5e7eb' },
  sendBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  sentBox:  { alignItems: 'center', paddingVertical: 32 },
  sentCheck: { fontSize: 40, color: '#10b981', marginBottom: 12 },
  sentMsg:  { fontSize: 16, fontWeight: '600', color: '#111827' },
});
