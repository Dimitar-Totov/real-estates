import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { properties as propertiesApi, agents as agentsApi } from '../../lib/api';
import type { Property, Agent, AgentReview } from '../../lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 6;

const FILTERS = [
  { id: 'all',      label: 'All Activity' },
  { id: 'listings', label: 'New Listings' },
  { id: 'agents',   label: 'Agent Activity' },
  { id: 'reviews',  label: 'Reviews' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

// ─── Feed item types ──────────────────────────────────────────────────────────

type FeedItem =
  | { id: number; type: 'listing';        content: ListingContent;        createdAt: string }
  | { id: number; type: 'agent_activity'; content: AgentActivityContent;  createdAt: string }
  | { id: number; type: 'review';         content: ReviewContent;         createdAt: string };

interface ListingContent {
  title: string;
  price: string;
  location: string;
  beds: number | null;
  baths: number | null;
  sqft: string | null;
  image: string | null;
  propertyType: string;
  status: string;
  agent: string | null;
  agentImage: string | null;
}

interface AgentActivityContent {
  agent: string;
  agentImage: string | null;
  action: string;
  property: string | null;
  price: string | null;
  location: string | null;
  buyer?: string;
  isSale?: boolean;
  isNewAgent?: boolean;
}

interface ReviewContent {
  reviewer: string;
  reviewerImage: string | null;
  agent: string;
  agentImage: string | null;
  rating: number;
  text: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Avatar({
  uri,
  name,
  size,
  bgColor,
  textColor,
}: {
  uri?: string | null;
  name?: string | null;
  size: number;
  bgColor: string;
  textColor: string;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: textColor }}>
        {(name?.[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────

function ListingCard({ item }: { item: FeedItem & { type: 'listing' } }) {
  const c = item.content;
  return (
    <View style={s.card}>
      <View style={s.listingImgWrap}>
        {c.image ? (
          <Image source={{ uri: c.image }} style={s.listingImg} resizeMode="cover" />
        ) : (
          <View style={s.listingImgPlaceholder}>
            <Text style={{ fontSize: 40 }}>🏠</Text>
          </View>
        )}
        <View
          style={[
            s.statusBadge,
            { backgroundColor: c.status === 'for_rent' ? '#3b82f6' : '#10b981' },
          ]}
        >
          <Text style={s.statusBadgeText}>
            {c.status === 'for_rent' ? 'For Rent' : 'For Sale'}
          </Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <View style={s.rowBetween}>
          <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
          <Text style={s.typeLabel}>{c.propertyType}</Text>
        </View>

        <Text style={s.listingTitle} numberOfLines={1}>{c.title}</Text>

        <Text style={s.listingPrice}>
          ${Number(c.price).toLocaleString()}
          {c.status === 'for_rent' && (
            <Text style={s.priceSuffix}>/mo</Text>
          )}
        </Text>

        <Text style={s.locationText} numberOfLines={1}>📍 {c.location}</Text>

        <View style={s.statsRow}>
          {c.beds  != null && <View style={s.statPill}><Text style={s.statText}>{c.beds} beds</Text></View>}
          {c.baths != null && <View style={s.statPill}><Text style={s.statText}>{c.baths} baths</Text></View>}
          {c.sqft  != null && (
            <View style={s.statPill}>
              <Text style={s.statText}>{Number(c.sqft).toLocaleString()} sqft</Text>
            </View>
          )}
        </View>

        {c.agent && (
          <View style={s.agentRow}>
            <Avatar uri={c.agentImage} name={c.agent} size={28} bgColor="#dbeafe" textColor="#1d4ed8" />
            <View style={{ marginLeft: 8 }}>
              <Text style={s.agentName}>{c.agent}</Text>
              <Text style={s.agentLabel}>Listing agent</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function AgentActivityCard({ item }: { item: FeedItem & { type: 'agent_activity' } }) {
  const c = item.content;
  const isSale = !!c.isSale;
  return (
    <View style={[s.card, s.cardPadded, isSale ? s.saleCardBorder : undefined]}>
      <View style={s.rowBetween}>
        <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
        <View style={[s.tag, isSale ? s.tagSale : s.tagAgent]}>
          <Text style={[s.tagText, isSale ? s.tagSaleText : s.tagAgentText]}>
            {isSale ? 'Property Sold' : 'Agent Activity'}
          </Text>
        </View>
      </View>

      <View style={s.activityRow}>
        <Avatar
          uri={c.agentImage}
          name={c.agent}
          size={44}
          bgColor={isSale ? '#d1fae5' : '#ede9fe'}
          textColor={isSale ? '#065f46' : '#5b21b6'}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.activityText}>
            <Text style={s.activityName}>{c.agent}</Text>
            <Text style={s.activityAction}> {c.action}</Text>
          </Text>
          {c.property != null && (
            <Text style={s.activityProperty} numberOfLines={1}>{c.property}</Text>
          )}
          {isSale ? (
            <Text style={s.buyerText}>Buyer: {c.buyer}</Text>
          ) : (
            <Text style={s.activityMeta}>
              {[c.price, c.location ? `📍 ${c.location}` : null].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ReviewCard({ item }: { item: FeedItem & { type: 'review' } }) {
  const c = item.content;
  return (
    <View style={[s.card, s.cardPadded]}>
      <View style={s.rowBetween}>
        <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
        <View style={[s.tag, s.tagReview]}>
          <Text style={[s.tagText, s.tagReviewText]}>Review</Text>
        </View>
      </View>

      <View style={s.reviewRow}>
        <Avatar
          uri={c.reviewerImage}
          name={c.reviewer}
          size={40}
          bgColor="#fef3c7"
          textColor="#92400e"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.reviewerLine}>
            <Text style={s.reviewerName}>{c.reviewer}</Text>
            <Text style={s.reviewedWord}> reviewed </Text>
            <Text style={s.reviewerName}>{c.agent}</Text>
          </Text>
          <View style={s.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={{ fontSize: 15, color: i < c.rating ? '#f59e0b' : '#d1d5db' }}>
                ★
              </Text>
            ))}
            <Text style={s.ratingLabel}> {c.rating}/5</Text>
          </View>
          <Text style={s.reviewText}>"{c.text}"</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Data assembly ────────────────────────────────────────────────────────────

async function buildFeedItems(allProperties: Property[], allAgents: Agent[]): Promise<FeedItem[]> {
  const agentById = new Map(allAgents.map((a) => [a.id, a]));
  const items: FeedItem[] = [];

  // Top 10 most recent properties → listing or agent_activity
  const sortedProps = [...allProperties]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  for (const p of sortedProps) {
    const agent = p.listedByAgentId != null ? agentById.get(p.listedByAgentId) : undefined;

    if (p.status === 'for_sale' || p.status === 'for_rent') {
      items.push({
        id: p.id,
        type: 'listing',
        content: {
          title: p.title,
          price: p.price,
          location: `${p.city}, ${p.state}`,
          beds: p.bedrooms,
          baths: p.bathrooms,
          sqft: p.squareFeet,
          image: p.images?.[0] ?? null,
          propertyType: p.type,
          status: p.status,
          agent: agent?.name ?? null,
          agentImage: agent?.image ?? null,
        },
        createdAt: p.createdAt,
      });
    } else {
      items.push({
        id: p.id * 10000,
        type: 'agent_activity',
        content: {
          agent: agent?.name ?? 'Unknown Agent',
          agentImage: agent?.image ?? null,
          action: p.status === 'sold' ? 'sold' : 'rented out',
          property: p.title,
          price: `$${Number(p.price).toLocaleString()}`,
          location: `${p.city}, ${p.state}`,
        },
        createdAt: p.createdAt,
      });
    }
  }

  // 5 most recently joined agents (API returns oldest→newest, so take last 5)
  const recentAgents = allAgents.slice(-5).reverse();
  recentAgents.forEach((a, i) => {
    items.push({
      id: a.id + 200000,
      type: 'agent_activity',
      content: {
        agent: a.name,
        agentImage: a.image,
        action: 'joined as a new agent specializing in',
        property: a.specialty,
        price: null,
        location: a.city,
        isNewAgent: true,
      },
      // spread them 1 day apart so they sort distinctly
      createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Reviews — fetch page 1 for every agent that has at least one review
  const agentsWithReviews = allAgents.filter((a) => (a.reviews ?? 0) > 0);
  const reviewResults = await Promise.all(
    agentsWithReviews.map((a) =>
      agentsApi
        .reviews(a.id, 1)
        .catch(() => ({ reviews: [] as AgentReview[], total: 0, pages: 0 }))
    )
  );

  for (let i = 0; i < agentsWithReviews.length; i++) {
    const agent = agentsWithReviews[i];
    for (const r of reviewResults[i].reviews) {
      if (!r.comment) continue;
      items.push({
        id: r.id + 100000,
        type: 'review',
        content: {
          reviewer: r.username,
          reviewerImage: null,
          agent: agent.name,
          agentImage: agent.image,
          rating: r.rating,
          text: r.comment,
        },
        createdAt: r.createdAt,
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const [items, setItems]           = useState<FeedItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState<FilterId>('all');
  const [page, setPage]             = useState(1);

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [allProperties, allAgents] = await Promise.all([
        propertiesApi.list(),
        agentsApi.list(),
      ]);
      const built = await buildFeedItems(allProperties, allAgents);
      setItems(built);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed(true);
  }, [fetchFeed]);

  const filtered = useMemo(() => {
    if (filter === 'all')      return items;
    if (filter === 'listings') return items.filter((i) => i.type === 'listing');
    if (filter === 'agents')   return items.filter((i) => i.type === 'agent_activity');
    if (filter === 'reviews')  return items.filter((i) => i.type === 'review');
    return items;
  }, [items, filter]);

  const pageItems = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore   = pageItems.length < filtered.length;

  function handleFilter(id: FilterId) {
    setFilter(id);
    setPage(1);
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => fetchFeed()}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Real Estate Feed</Text>
        <Text style={s.subheading}>
          Latest listings, agent activity, and community reviews
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsBar}
        contentContainerStyle={s.tabsContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[s.tab, filter === f.id && s.tabActive]}
            onPress={() => handleFilter(f.id)}
          >
            <Text style={[s.tabText, filter === f.id && s.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result count */}
      {filtered.length > 0 && (
        <Text style={s.countText}>
          Showing {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} items
        </Text>
      )}

      {/* Feed list */}
      <View style={s.list}>
        {pageItems.map((item) => (
          <View key={item.id}>
            {item.type === 'listing' && (
              <ListingCard item={item as FeedItem & { type: 'listing' }} />
            )}
            {item.type === 'agent_activity' && (
              <AgentActivityCard item={item as FeedItem & { type: 'agent_activity' }} />
            )}
            {item.type === 'review' && (
              <ReviewCard item={item as FeedItem & { type: 'review' }} />
            )}
          </View>
        ))}
      </View>

      {/* Empty state */}
      {filtered.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>😶</Text>
          <Text style={s.emptyTitle}>No items to display</Text>
          <Text style={s.emptySubtitle}>Try a different filter</Text>
        </View>
      )}

      {/* Load more */}
      {hasMore && (
        <TouchableOpacity style={s.loadMoreBtn} onPress={() => setPage((p) => p + 1)}>
          <Text style={s.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#f9fafb' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryBtn:      { backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText:  { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Header
  header:     { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', alignItems: 'center' },
  heading:    { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subheading: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  // Filter tabs
  tabsBar:     { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  tab:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  tabActive:   { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  tabText:     { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  countText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12, marginBottom: 4 },

  list: { paddingHorizontal: 16, paddingTop: 12, gap: 12, paddingBottom: 4 },

  // Card base
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPadded: { padding: 16 },
  cardBody:   { padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  // Listing card
  listingImgWrap:        { height: 160, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  listingImg:            { width: '100%', height: 160 },
  listingImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBadge:     { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dateText:     { fontSize: 11, color: '#9ca3af' },
  typeLabel:    { fontSize: 11, fontWeight: '500', color: '#3b82f6', textTransform: 'capitalize' },
  listingTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  listingPrice: { fontSize: 20, fontWeight: 'bold', color: '#2563eb', marginBottom: 6 },
  priceSuffix:  { fontSize: 13, fontWeight: '400', color: '#9ca3af' },
  locationText: { fontSize: 12, color: '#9ca3af', marginBottom: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  statPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f9fafb', borderRadius: 8 },
  statText: { fontSize: 11, color: '#6b7280' },
  agentRow:   { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  agentName:  { fontSize: 12, fontWeight: '600', color: '#111827' },
  agentLabel: { fontSize: 11, color: '#9ca3af' },

  // Agent activity card
  saleCardBorder: { borderColor: '#a7f3d0' },
  tag:           { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  tagSale:       { backgroundColor: '#d1fae5' },
  tagAgent:      { backgroundColor: '#ede9fe' },
  tagReview:     { backgroundColor: '#fef3c7' },
  tagText:       { fontSize: 11, fontWeight: '600' },
  tagSaleText:   { color: '#065f46' },
  tagAgentText:  { color: '#5b21b6' },
  tagReviewText: { color: '#92400e' },
  activityRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  activityText:     { fontSize: 13, color: '#374151', marginBottom: 2 },
  activityName:     { fontWeight: '700', color: '#111827' },
  activityAction:   { color: '#6b7280' },
  activityProperty: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  buyerText:        { fontSize: 12, color: '#059669', fontWeight: '500' },
  activityMeta:     { fontSize: 12, color: '#9ca3af' },

  // Review card
  reviewRow:    { flexDirection: 'row', alignItems: 'flex-start' },
  reviewerLine: { fontSize: 13, color: '#374151', marginBottom: 4 },
  reviewerName: { fontWeight: '700', color: '#111827' },
  reviewedWord: { color: '#6b7280' },
  starsRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingLabel:  { fontSize: 11, color: '#9ca3af' },
  reviewText:   { fontSize: 13, color: '#4b5563', fontStyle: 'italic', lineHeight: 19 },

  // Empty state
  empty:         { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af' },

  // Load more
  loadMoreBtn:  { marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#fff' },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
