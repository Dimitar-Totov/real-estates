import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { agents as agentsApi, messages as messagesApi } from '../../../lib/api';
import type { Agent } from '../../../lib/types';

// ─── Local types ──────────────────────────────────────────────────────────────

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  username: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Reviews Modal ────────────────────────────────────────────────────────────

function ReviewsModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await agentsApi.reviews(agent.id, p);
      setReviews(data.reviews as unknown as Review[]);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [agent.id]);

  useEffect(() => { fetchPage(page); }, [fetchPage, page]);

  const color = avatarColor(agent.name);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={rm.container}>
        {/* Header */}
        <View style={rm.header}>
          <View style={[rm.agentAvatar, { backgroundColor: color }]}>
            <Text style={rm.agentAvatarText}>{agent.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={rm.headerInfo}>
            <Text style={rm.agentName} numberOfLines={1}>{agent.name}</Text>
            <Text style={rm.reviewCount}>{total} review{total !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={rm.closeBtn}>
            <Text style={rm.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={rm.accentLine} />

        {/* Reviews */}
        <ScrollView style={rm.list} contentContainerStyle={rm.listContent}>
          {loading ? (
            <View style={rm.center}>
              <ActivityIndicator color="#f59e0b" size="large" />
              <Text style={rm.centerSub}>Loading reviews…</Text>
            </View>
          ) : fetchError ? (
            <View style={rm.center}>
              <Text style={rm.centerTitle}>Failed to load</Text>
              <TouchableOpacity onPress={() => fetchPage(page)}>
                <Text style={rm.retry}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : reviews.length === 0 ? (
            <View style={rm.center}>
              <Text style={rm.emptyIcon}>💬</Text>
              <Text style={rm.centerTitle}>No reviews yet</Text>
              <Text style={rm.centerSub}>Be the first to share your experience with {agent.name}.</Text>
            </View>
          ) : reviews.map((review) => (
            <View key={review.id} style={rm.reviewCard}>
              <View style={[rm.reviewAvatar, { backgroundColor: avatarColor(review.username) }]}>
                <Text style={rm.reviewAvatarText}>{review.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={rm.reviewBody}>
                <View style={rm.reviewTopRow}>
                  <Text style={rm.reviewUsername}>{review.username}</Text>
                  <Text style={rm.reviewDate}>{formatDate(review.createdAt)}</Text>
                </View>
                <View style={rm.reviewStarRow}>
                  {[1, 2, 3, 4, 5, 6].map((star) => (
                    <Text key={star} style={[rm.reviewStar, { opacity: star <= review.rating ? 1 : 0.25 }]}>★</Text>
                  ))}
                  <Text style={rm.reviewRating}>{review.rating}/6</Text>
                </View>
                {review.comment ? <Text style={rm.reviewComment}>{review.comment}</Text> : null}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Pagination */}
        {!loading && !fetchError && pages > 1 && (
          <View style={rm.pagination}>
            <TouchableOpacity
              style={[rm.pageBtn, page === 1 && rm.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Text style={rm.pageBtnText}>← Prev</Text>
            </TouchableOpacity>
            <Text style={rm.pageInfo}>{page} / {pages}</Text>
            <TouchableOpacity
              style={[rm.pageBtn, page === pages && rm.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
            >
              <Text style={rm.pageBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Email Modal ──────────────────────────────────────────────────────────────

function EmailModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [subject, setSubject] = useState(`Inquiry for ${agent.name}`);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!body.trim()) { Alert.alert('Error', 'Please write a message.'); return; }
    setSending(true);
    try {
      await messagesApi.send(agent.userId, subject || `Inquiry for ${agent.name}`, body.trim());
      Alert.alert('Sent', 'Your message has been sent successfully.');
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={em.container}>
          <View style={em.header}>
            <TouchableOpacity onPress={onClose} style={em.cancelBtn}>
              <Text style={em.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={em.title}>Email Agent</Text>
            <TouchableOpacity
              style={[em.actionBtn, (!body.trim() || sending) && em.actionBtnDisabled]}
              onPress={send}
              disabled={!body.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#1a1a2e" />
                : <Text style={em.actionBtnText}>Send</Text>}
            </TouchableOpacity>
          </View>

          <View style={em.toRow}>
            <Text style={em.fieldLabel}>To</Text>
            <Text style={em.toValue}>{agent.name}</Text>
          </View>
          <View style={em.subjectRow}>
            <Text style={em.fieldLabel}>Subject</Text>
            <TextInput
              style={em.subjectInput}
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#999"
            />
          </View>
          <TextInput
            style={em.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Write your message…"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Comment Modal ────────────────────────────────────────────────────────────

function CommentModal({
  agent, existing, onClose, onSaved,
}: {
  agent: Agent;
  existing: string | null;
  onClose: () => void;
  onSaved: (comment: string) => void;
}) {
  const [comment, setComment] = useState(existing ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!comment.trim()) { Alert.alert('Error', 'Please write a comment.'); return; }
    setSaving(true);
    try {
      await agentsApi.comment(agent.id, comment.trim());
      onSaved(comment.trim());
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={em.container}>
          <View style={em.header}>
            <TouchableOpacity onPress={onClose} style={em.cancelBtn}>
              <Text style={em.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={em.title}>Leave a Comment</Text>
            <TouchableOpacity
              style={[em.actionBtn, (!comment.trim() || saving) && em.actionBtnDisabled]}
              onPress={save}
              disabled={!comment.trim() || saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#1a1a2e" />
                : <Text style={em.actionBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <Text style={em.commentAgent}>
            Commenting on <Text style={{ fontWeight: '700' }}>{agent.name}</Text>
          </Text>
          <TextInput
            style={[em.bodyInput, { flex: 1 }]}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this agent…"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            maxLength={500}
            autoFocus
          />
          <Text style={em.charCount}>{comment.length}/500</Text>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({
  agent, myRating, myComment, canRate, reviewCount,
  onPressReviews, onEmail, onComment, onRated,
}: {
  agent: Agent;
  myRating: number | null;
  myComment: string | null;
  canRate: boolean;
  reviewCount: number;
  onPressReviews: () => void;
  onEmail: () => void;
  onComment: () => void;
  onRated: (star: number) => void;
}) {
  const [localRating, setLocalRating] = useState<number | null>(myRating);
  const [ratingLoading, setRatingLoading] = useState(false);
  const color = avatarColor(agent.name);

  const handleRate = async (star: number) => {
    if (localRating !== null || ratingLoading) return;
    setRatingLoading(true);
    try {
      await agentsApi.rate(agent.id, star);
      setLocalRating(star);
      onRated(star);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to rate');
    } finally {
      setRatingLoading(false);
    }
  };

  const hasComment = !!myComment;
  const agentRating = Number(agent.rating ?? 0);

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={onPressReviews}>
      {/* Image / Avatar */}
      <View style={[s.cardImage, { backgroundColor: color + '28' }]}>
        <Text style={[s.cardAvatarText, { color }]}>{agent.name.charAt(0)}</Text>
        {agent.image ? (
          <Image source={{ uri: agent.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View style={s.ratingBadge}>
          <Text style={s.ratingBadgeStar}>★</Text>
          <Text style={s.ratingBadgeValue}>{agentRating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        <Text style={s.agentName}>{agent.name}</Text>
        <Text style={s.agentSpecialty}>{agent.specialty ?? '—'}</Text>

        {/* Stars display */}
        <View style={s.stars}>
          {[1, 2, 3, 4, 5, 6].map((star) => (
            <Text key={star} style={[s.star, { opacity: agentRating >= star ? 1 : 0.25 }]}>★</Text>
          ))}
          <Text style={s.ratingText}>{agentRating.toFixed(1)}/6</Text>
        </View>

        <View style={s.metaRow}>
          <Text style={s.metaText}>📍 {agent.city ?? '—'}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaText}>🕐 {agent.experience ?? 0} years exp.</Text>
          <Text style={s.metaText}>💬 {reviewCount} reviews</Text>
        </View>
        {agent.phone ? (
          <View style={s.metaRow}>
            <Text style={s.metaText}>📞 {agent.phone}</Text>
          </View>
        ) : null}

        {/* Interactive rating widget */}
        {canRate && (
          <View style={s.rateRow}>
            <Text style={s.rateLabel}>{localRating !== null ? 'Your rating:' : 'Rate:'}</Text>
            {[1, 2, 3, 4, 5, 6].map((star) =>
              localRating !== null ? (
                <Text key={star} style={[s.star, { opacity: star <= localRating ? 1 : 0.3 }]}>★</Text>
              ) : (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRate(star)}
                  disabled={ratingLoading}
                  hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                >
                  <Text style={[s.star, { color: '#d1d5db' }]}>★</Text>
                </TouchableOpacity>
              )
            )}
            {localRating !== null && <Text style={s.rateValue}>{localRating}/6</Text>}
          </View>
        )}

        <Text style={s.tapHint}>Tap card to see all reviews</Text>

        {/* Action buttons */}
        <View style={s.cardActions}>
          <TouchableOpacity style={s.emailBtn} onPress={onEmail} activeOpacity={0.7}>
            <Text style={s.emailBtnText}>✉ Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.commentBtn, hasComment && s.commentBtnSaved]}
            onPress={onComment}
            activeOpacity={0.7}
          >
            <Text style={[s.commentBtnText, hasComment && s.commentBtnSavedText]}>
              {hasComment ? '✓ Commented' : '★ Comment'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Filters Section ──────────────────────────────────────────────────────────

function FiltersSection({
  nameQuery, setNameQuery,
  activeSpecialties, toggleSpecialty,
  activeCities, toggleCity,
  specialties, cities,
  onClear,
}: {
  nameQuery: string;
  setNameQuery: (v: string) => void;
  activeSpecialties: string[];
  toggleSpecialty: (v: string) => void;
  activeCities: string[];
  toggleCity: (v: string) => void;
  specialties: string[];
  cities: string[];
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = activeSpecialties.length + activeCities.length + (nameQuery ? 1 : 0);

  return (
    <View style={s.filtersContainer}>
      <TouchableOpacity style={s.filterToggle} onPress={() => setExpanded(!expanded)}>
        <Text style={s.filterToggleText}>Filters</Text>
        <View style={s.filterToggleRight}>
          {activeCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{activeCount}</Text>
            </View>
          )}
          <Text style={s.filterArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={s.filtersBody}>
          {/* Name search */}
          <View style={s.filterSection}>
            <Text style={s.filterLabel}>SEARCH BY NAME</Text>
            <View style={s.searchWrap}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Enter agent name..."
                placeholderTextColor="#9ca3af"
                value={nameQuery}
                onChangeText={setNameQuery}
              />
            </View>
          </View>

          {/* Specialties */}
          {specialties.length > 0 && (
            <View style={s.filterSection}>
              <Text style={s.filterLabel}>SPECIALTY</Text>
              <View style={s.checkGrid}>
                {specialties.map((sp) => {
                  const checked = activeSpecialties.includes(sp);
                  return (
                    <TouchableOpacity key={sp} style={s.checkRow} onPress={() => toggleSpecialty(sp)}>
                      <View style={[s.checkbox, checked && s.checkboxChecked]}>
                        {checked && <Text style={s.checkTick}>✓</Text>}
                      </View>
                      <Text style={s.checkLabel}>{sp}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Cities */}
          {cities.length > 0 && (
            <View style={s.filterSection}>
              <Text style={s.filterLabel}>CITY</Text>
              <View style={s.checkGrid}>
                {cities.map((city) => {
                  const checked = activeCities.includes(city);
                  return (
                    <TouchableOpacity key={city} style={s.checkRow} onPress={() => toggleCity(city)}>
                      <View style={[s.checkbox, checked && s.checkboxCheckedGreen]}>
                        {checked && <Text style={s.checkTick}>✓</Text>}
                      </View>
                      <Text style={s.checkLabel}>{city}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Active pills */}
          {(activeSpecialties.length > 0 || activeCities.length > 0) && (
            <View style={s.activePills}>
              {activeSpecialties.map((sp) => (
                <TouchableOpacity key={sp} style={s.pillBlue} onPress={() => toggleSpecialty(sp)}>
                  <Text style={s.pillBlueText}>{sp} ✕</Text>
                </TouchableOpacity>
              ))}
              {activeCities.map((city) => (
                <TouchableOpacity key={city} style={s.pillGreen} onPress={() => toggleCity(city)}>
                  <Text style={s.pillGreenText}>{city} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeCount > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={onClear}>
              <Text style={s.clearBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FindAgentScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [nameQuery, setNameQuery] = useState('');
  const [activeSpecialties, setActiveSpecialties] = useState<string[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [sort, setSort] = useState<'newest' | 'top-rated'>('newest');

  const [reviewCounts, setReviewCounts] = useState<Record<number, number>>({});
  const [myRatings, setMyRatings] = useState<Record<number, number | null>>({});
  const [myComments, setMyComments] = useState<Record<number, string | null>>({});

  const [reviewsAgent, setReviewsAgent] = useState<Agent | null>(null);
  const [emailAgent, setEmailAgent] = useState<Agent | null>(null);
  const [commentAgent, setCommentAgent] = useState<Agent | null>(null);

  const canRate = user?.role === 'user';

  // Fetch all agents
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);
    agentsApi.list()
      .then((data) => { if (!cancelled) setAgentsList(data); })
      .catch(() => { if (!cancelled) setFetchError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryKey]);

  // Fetch live comment counts for all agents
  useEffect(() => {
    if (agentsList.length === 0) return;
    Promise.all(
      agentsList.map((a) =>
        agentsApi.reviews(a.id, 1)
          .then((d) => [a.id, d.total] as [number, number])
          .catch(() => [a.id, Number(a.reviews ?? 0)] as [number, number])
      )
    ).then((pairs) => setReviewCounts(Object.fromEntries(pairs)));
  }, [agentsList]);

  // Fetch my ratings/comments for each agent (only if user can rate)
  useEffect(() => {
    if (!canRate || agentsList.length === 0) return;
    Promise.all(
      agentsList.map((a) =>
        agentsApi.myRating(a.id)
          .then((d) => [a.id, d] as [number, { rating: number | null; comment: string | null }])
          .catch(() => [a.id, { rating: null, comment: null }] as [number, { rating: number | null; comment: string | null }])
      )
    ).then((pairs) => {
      setMyRatings(Object.fromEntries(pairs.map(([id, d]) => [id, d.rating])));
      setMyComments(Object.fromEntries(pairs.map(([id, d]) => [id, d.comment])));
    });
  }, [canRate, agentsList]);

  // Derive unique specialties and cities from fetched data
  const specialties = useMemo(
    () => [...new Set(agentsList.map((a) => a.specialty).filter(Boolean) as string[])].sort(),
    [agentsList]
  );
  const cities = useMemo(
    () => [...new Set(agentsList.map((a) => a.city).filter(Boolean) as string[])].sort(),
    [agentsList]
  );

  const filtered = useMemo(() => {
    return agentsList
      .filter((a) => !nameQuery || a.name.toLowerCase().includes(nameQuery.toLowerCase()))
      .filter((a) => !activeSpecialties.length || (a.specialty != null && activeSpecialties.includes(a.specialty)))
      .filter((a) => !activeCities.length || (a.city != null && activeCities.includes(a.city)))
      .sort((a, b) => sort === 'top-rated' ? Number(b.rating ?? 0) - Number(a.rating ?? 0) : 0);
  }, [agentsList, nameQuery, activeSpecialties, activeCities, sort]);

  const toggleSpecialty = (sp: string) =>
    setActiveSpecialties((prev) => prev.includes(sp) ? prev.filter((x) => x !== sp) : [...prev, sp]);

  const toggleCity = (city: string) =>
    setActiveCities((prev) => prev.includes(city) ? prev.filter((x) => x !== city) : [...prev, city]);

  const clearAll = () => { setNameQuery(''); setActiveSpecialties([]); setActiveCities([]); };

  const handleEmail = (agent: Agent) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to contact agents.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/(screens)/auth') },
      ]);
      return;
    }
    setEmailAgent(agent);
  };

  const handleComment = (agent: Agent) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to leave a comment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/(screens)/auth') },
      ]);
      return;
    }
    if (!myRatings[agent.id]) {
      Alert.alert('Rate First', 'You need to rate this agent before leaving a comment.');
      return;
    }
    setCommentAgent(agent);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={s.centerText}>Loading agents…</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={s.center}>
        <Text style={s.errorIcon}>⚠️</Text>
        <Text style={s.errorTitle}>Failed to load agents</Text>
        <TouchableOpacity onPress={() => setRetryKey((k) => k + 1)}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.heading}>Find Your Perfect{'\n'}Real Estate Agent</Text>
          <Text style={s.subheading}>Browse our network of top-rated local experts</Text>
        </View>

        {/* Filters */}
        <FiltersSection
          nameQuery={nameQuery}
          setNameQuery={setNameQuery}
          activeSpecialties={activeSpecialties}
          toggleSpecialty={toggleSpecialty}
          activeCities={activeCities}
          toggleCity={toggleCity}
          specialties={specialties}
          cities={cities}
          onClear={clearAll}
        />

        {/* Count + Sort */}
        <View style={s.sortRow}>
          <Text style={s.countText}>{filtered.length} Agents Found</Text>
          <View style={s.sortBtns}>
            <TouchableOpacity
              style={[s.sortBtn, sort === 'newest' && s.sortBtnActive]}
              onPress={() => setSort('newest')}
            >
              <Text style={[s.sortBtnText, sort === 'newest' && s.sortBtnTextActive]}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sortBtn, sort === 'top-rated' && s.sortBtnActive]}
              onPress={() => setSort('top-rated')}
            >
              <Text style={[s.sortBtnText, sort === 'top-rated' && s.sortBtnTextActive]}>Top Rated</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyTitle}>No agents found</Text>
            <Text style={s.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                myRating={myRatings[agent.id] ?? null}
                myComment={myComments[agent.id] ?? null}
                canRate={canRate && agent.userId !== user?.id}
                reviewCount={reviewCounts[agent.id] ?? Number(agent.reviews ?? 0)}
                onPressReviews={() => setReviewsAgent(agent)}
                onEmail={() => handleEmail(agent)}
                onComment={() => handleComment(agent)}
                onRated={(star) => setMyRatings((prev) => ({ ...prev, [agent.id]: star }))}
              />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {reviewsAgent && (
        <ReviewsModal agent={reviewsAgent} onClose={() => setReviewsAgent(null)} />
      )}
      {emailAgent && (
        <EmailModal agent={emailAgent} onClose={() => setEmailAgent(null)} />
      )}
      {commentAgent && (
        <CommentModal
          agent={commentAgent}
          existing={myComments[commentAgent.id] ?? null}
          onClose={() => setCommentAgent(null)}
          onSaved={(c) => setMyComments((prev) => ({ ...prev, [commentAgent!.id]: c }))}
        />
      )}
    </>
  );
}

// ─── Styles: main screen ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff', padding: 32 },
  centerText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  errorIcon: { fontSize: 40 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  retryText: { color: '#2563eb', fontSize: 15, fontWeight: '600', marginTop: 4 },

  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827', lineHeight: 32, marginBottom: 6 },
  subheading: { fontSize: 14, color: '#6b7280' },

  // Filters
  filtersContainer: { marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' },
  filterToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f9fafb' },
  filterToggleText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  filterToggleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterArrow: { fontSize: 11, color: '#6b7280' },
  badge: { backgroundColor: '#2563eb', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  filtersBody: { padding: 16, gap: 16, backgroundColor: '#fff' },
  filterSection: { gap: 8 },
  filterLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkboxCheckedGreen: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkTick: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  checkLabel: { fontSize: 13, color: '#374151' },
  activePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillBlue: { backgroundColor: '#dbeafe', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pillBlueText: { color: '#1d4ed8', fontSize: 12, fontWeight: '500' },
  pillGreen: { backgroundColor: '#d1fae5', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pillGreenText: { color: '#059669', fontSize: 12, fontWeight: '500' },
  clearBtn: { alignItems: 'center', paddingVertical: 8 },
  clearBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

  // Sort row
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  countText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sortBtns: { flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  sortBtnActive: { backgroundColor: '#2563eb' },
  sortBtnText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  sortBtnTextActive: { color: '#fff', fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },

  // Grid
  grid: { paddingHorizontal: 16, gap: 16 },

  // Card
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImage: { height: 160, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardAvatarText: { fontSize: 56, fontWeight: '700' },
  ratingBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  ratingBadgeStar: { fontSize: 12, color: '#f59e0b' },
  ratingBadgeValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardBody: { padding: 16, gap: 6 },
  agentName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  agentSpecialty: { fontSize: 14, color: '#6b7280' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { fontSize: 15, color: '#f59e0b' },
  ratingText: { fontSize: 12, color: '#9ca3af', marginLeft: 4 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 13, color: '#6b7280' },

  // Rating row
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rateLabel: { fontSize: 12, color: '#9ca3af', marginRight: 2 },
  rateValue: { fontSize: 12, color: '#f59e0b', fontWeight: '600', marginLeft: 4 },

  tapHint: { fontSize: 11, color: '#d1d5db', marginTop: 2 },

  // Action buttons
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  emailBtn: { flex: 1, borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  emailBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  commentBtn: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  commentBtnSaved: { backgroundColor: '#ede9fe', borderWidth: 1.5, borderColor: '#7c3aed' },
  commentBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  commentBtnSavedText: { color: '#6d28d9' },
});

// ─── Styles: reviews modal ────────────────────────────────────────────────────

const rm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  agentAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  agentAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerInfo: { flex: 1, marginLeft: 12 },
  agentName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  reviewCount: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 18, color: '#9ca3af', fontWeight: '600' },

  accentLine: { height: 3, backgroundColor: '#f59e0b' },

  list: { flex: 1 },
  listContent: { padding: 16, gap: 12 },

  center: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  centerTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  centerSub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 260 },
  retry: { color: '#f59e0b', fontWeight: '600', fontSize: 14 },

  reviewCard: { flexDirection: 'row', gap: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewBody: { flex: 1, gap: 4 },
  reviewTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  reviewUsername: { fontSize: 14, fontWeight: '700', color: '#111827' },
  reviewDate: { fontSize: 12, color: '#9ca3af' },
  reviewStarRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewStar: { fontSize: 13, color: '#f59e0b' },
  reviewRating: { fontSize: 12, color: '#d97706', fontWeight: '600', marginLeft: 4 },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 20, marginTop: 4 },

  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fafafa' },
  pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  pageInfo: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
});

// ─── Styles: email + comment modals ──────────────────────────────────────────

const em = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
  cancelBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  cancelText: { color: '#6b7280', fontSize: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  actionBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  toRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', width: 60 },
  toValue: { fontSize: 15, color: '#111827', fontWeight: '500' },
  subjectInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 12 },

  bodyInput: { margin: 16, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, minHeight: 140, lineHeight: 22 },

  commentAgent: { fontSize: 14, color: '#6b7280', paddingHorizontal: 16, paddingTop: 12 },
  charCount: { textAlign: 'right', paddingHorizontal: 16, paddingBottom: 8, fontSize: 12, color: '#9ca3af' },
});
