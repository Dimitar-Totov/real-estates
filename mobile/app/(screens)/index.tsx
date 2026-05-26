import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ImageBackground, StyleSheet, ActivityIndicator, Image,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { properties as propertiesApi } from '../../lib/api';
import type { Property } from '../../lib/types';

const HERO    = require('../../assets/hero.webp');
const SKYVIEW = require('../../assets/skyview-apartment.jpg');

const CARD_GAP = 12;
const CARD_W   = Dimensions.get('window').width - 56; // 16px left padding + 28px right peek

const TABS       = ['Buy', 'Rent'] as const;
const TAB_STATUS = ['for_sale', 'for_rent'] as const;

const FEATURES = [
  { icon: '🏠', title: 'Biggest Selection', description: 'We show all the listings other sites hide — even new listings hitting the market today.' },
  { icon: '💰', title: 'Best Price',        description: 'Our agents charge half the typical fee — so you save thousands on every transaction.' },
  { icon: '⭐', title: 'Top-Rated Agents',  description: 'Work with the best agents in your area, backed by thousands of verified reviews.' },
];

// ─── Search result card ───────────────────────────────────────────────────────

function SearchResultCard({ property: p, coverUrl, width }: { property: Property; coverUrl: string | null; width: number }) {
  const router = useRouter();
  const price = parseFloat(p.price);
  const sqft  = p.squareFeet ? Math.round(parseFloat(p.squareFeet)) : null;

  return (
    <TouchableOpacity
      style={[s.card, { width }]}
      activeOpacity={0.85}
      onPress={() => router.push(`/property/${p.id}` as any)}
    >
      <View style={s.cardImageWrap}>
        {coverUrl
          ? <Image source={{ uri: coverUrl }} style={s.cardImage} resizeMode="cover" />
          : <View style={s.cardImagePlaceholder}><Text style={s.cardImagePlaceholderIcon}>🏠</Text></View>
        }
        <View style={[s.statusBadge, { backgroundColor: p.status === 'for_rent' ? '#3b82f6' : '#10b981' }]}>
          <Text style={s.statusBadgeText}>{p.status === 'for_rent' ? 'For Rent' : 'For Sale'}</Text>
        </View>
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardPrice}>
          ${price.toLocaleString()}
          {p.status === 'for_rent' && <Text style={s.cardPriceSuffix}>/mo</Text>}
        </Text>
        <Text style={s.cardTitle} numberOfLines={1}>{p.title}</Text>
        <Text style={s.cardAddress} numberOfLines={1}>📍 {p.address}, {p.city}</Text>
        {(p.bedrooms != null || p.bathrooms != null || sqft != null) && (
          <View style={s.cardStats}>
            {p.bedrooms  != null && <Text style={s.cardStat}>{p.bedrooms} bd</Text>}
            {p.bathrooms != null && <Text style={s.cardStat}>{p.bathrooms} ba</Text>}
            {sqft        != null && <Text style={s.cardSqft}>{sqft.toLocaleString()} sqft</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [query,      setQuery]      = useState('');
  const [activeTab,  setActiveTab]  = useState(0);
  const [results,    setResults]    = useState<Property[]>([]);
  const [covers,     setCovers]     = useState<Record<number, string | null>>({});
  const [loading,    setLoading]    = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  async function runSearch(q: string, tabIdx: number) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setHasSearched(true);
    setCurrentIdx(0);
    setCovers({});
    try {
      const data = await propertiesApi.list({ q: trimmed, status: TAB_STATUS[tabIdx] });
      setResults(data);
      const pairs = await Promise.all(
        data.map(p =>
          propertiesApi.coverImage(p.id)
            .then(r => [p.id, r.coverImage] as const)
            .catch(() => [p.id, null] as const)
        )
      );
      setCovers(Object.fromEntries(pairs));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    runSearch(query, activeTab);
  }

  function handleTabChange(i: number) {
    setActiveTab(i);
    if (hasSearched && query.trim()) {
      runSearch(query, i);
    }
  }

  function handleClear() {
    setHasSearched(false);
    setResults([]);
    setCovers({});
    setCurrentIdx(0);
  }

  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / (CARD_W + CARD_GAP));
    setCurrentIdx(Math.max(0, Math.min(idx, results.length - 1)));
  }

  return (
    <ScrollView
      style={s.screen}
      bounces={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Hero ── */}
      <ImageBackground source={HERO} style={s.heroImage} resizeMode="cover">
        <View style={s.heroOverlay}>
          <Text style={s.heroTitle}>Find the right home</Text>
          <Text style={[s.heroTitle, s.heroTitleBottom]}>at the right price</Text>

          {/* Buy / Rent tabs */}
          <View style={s.tabs}>
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabChange(i)}
                style={i === activeTab ? s.tabActive : s.tab}
              >
                <Text style={i === activeTab ? s.tabActiveText : s.tabText}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search bar */}
          <View style={s.searchBar}>
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholder="City, Address, School, Agent, ZIP"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearch} disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.searchBtnText}>⌕</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* ── Search Results ── */}
      {hasSearched && (
        <View style={s.resultsSection}>

          {/* Header row */}
          <View style={s.resultsHeader}>
            <View style={s.resultsHeaderLeft}>
              <Text style={s.resultsLabel}>Search results</Text>
              <Text style={s.resultsTitle} numberOfLines={2}>
                Properties matching "{query}"
              </Text>
              {!loading && (
                <Text style={s.resultsCount}>
                  {results.length === 0
                    ? 'No properties found — try a different search'
                    : `${results.length} propert${results.length !== 1 ? 'ies' : 'y'} found`}
                </Text>
              )}
            </View>
            <View style={s.resultsHeaderRight}>
              <TouchableOpacity onPress={() => router.push('/(screens)/listings')}>
                <Text style={s.viewAllLink}>View all →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear}>
                <Text style={s.clearLink}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          {loading ? (
            <ActivityIndicator size="large" color="#CC0000" style={{ marginVertical: 40 }} />
          ) : results.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyTitle}>No results for "{query}"</Text>
              <Text style={s.emptySubtitle}>
                Try searching by city, ZIP code, or address.
              </Text>
              <TouchableOpacity
                style={s.browseBtn}
                onPress={() => router.push('/(screens)/listings')}
              >
                <Text style={s.browseBtnText}>Browse all listings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.carousel}
                snapToInterval={CARD_W + CARD_GAP}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={handleCarouselScroll}
              >
                {results.map(p => (
                  <SearchResultCard
                    key={p.id}
                    property={p}
                    coverUrl={covers[p.id] ?? null}
                    width={CARD_W}
                  />
                ))}
              </ScrollView>

              {results.length > 1 && (
                <View style={s.dots}>
                  {results.map((_, i) => (
                    <View key={i} style={[s.dot, i === currentIdx && s.dotActive]} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* ── Touring Section ── */}
      <View style={s.touringSection}>
        <View style={s.touringImageWrap}>
          <ImageBackground source={SKYVIEW} style={s.touringImage} resizeMode="cover">
            <View style={s.touringImageOverlay} />
          </ImageBackground>
        </View>
        <Text style={s.touringTitle}>Start touring homes,{'\n'}no strings attached</Text>
        <Text style={s.touringDesc}>
          Schedule tours on your time. No pressure, no obligation — just find the home you love.
        </Text>
        <TouchableOpacity
          style={s.touringBtn}
          onPress={() => router.push('/(screens)/listings')}
        >
          <Text style={s.touringBtnText}>Search for homes</Text>
        </TouchableOpacity>
      </View>

      {/* ── Why Us ── */}
      <View style={s.whySection}>
        <Text style={s.whyTitle}>Why buyers and sellers choose us</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FEATURES.map(f => (
            <View key={f.title} style={s.featureCard}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  // Hero
  heroImage:       { height: 420 },
  heroOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingTop: 64, paddingHorizontal: 20, justifyContent: 'center' },
  heroTitle:       { fontSize: 36, fontWeight: 'bold', color: '#fff', lineHeight: 44 },
  heroTitleBottom: { marginBottom: 32 },
  tabs:            { flexDirection: 'row', gap: 20, marginBottom: 12 },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: '#fff', paddingBottom: 4 },
  tabActiveText:   { color: '#fff', fontWeight: '600', fontSize: 14 },
  tab:             { borderBottomWidth: 2, borderBottomColor: 'transparent', paddingBottom: 4 },
  tabText:         { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  searchBar:       { flexDirection: 'row', borderRadius: 12, overflow: 'hidden' },
  searchInput:     { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 14 },
  searchBtn:       { backgroundColor: '#CC0000', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  searchBtnText:   { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // Search results section
  resultsSection:    { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8 },
  resultsHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  resultsHeaderLeft: { flex: 1 },
  resultsHeaderRight:{ alignItems: 'flex-end', gap: 8 },
  resultsLabel:      { fontSize: 11, fontWeight: '600', color: '#CC0000', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 },
  resultsTitle:      { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  resultsCount:      { fontSize: 13, color: '#9ca3af' },
  viewAllLink:       { fontSize: 13, fontWeight: '600', color: '#CC0000' },
  clearLink:         { fontSize: 13, color: '#9ca3af' },

  // Empty state
  emptyState:    { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '600', color: '#374151', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  browseBtn:     { backgroundColor: '#CC0000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Carousel
  carousel:  { paddingLeft: 16, paddingRight: 4, paddingBottom: 8, gap: CARD_GAP },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: 4 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db' },
  dotActive: { width: 18, backgroundColor: '#CC0000' },

  // Search result card
  card:                    { borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImageWrap:           { height: 180, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  cardImage:               { width: '100%', height: 180 },
  cardImagePlaceholder:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardImagePlaceholderIcon:{ fontSize: 48 },
  statusBadge:             { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusBadgeText:         { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardInfo:                { padding: 14 },
  cardPrice:               { fontSize: 22, fontWeight: 'bold', color: '#CC0000', marginBottom: 4 },
  cardPriceSuffix:         { fontSize: 14, fontWeight: '400', color: '#9ca3af' },
  cardTitle:               { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardAddress:             { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  cardStats:               { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, gap: 16 },
  cardStat:                { fontSize: 14, color: '#6b7280' },
  cardSqft:                { fontSize: 13, color: '#9ca3af', marginLeft: 'auto' },

  // Touring
  touringSection:      { paddingVertical: 56, paddingHorizontal: 20, backgroundColor: '#fff' },
  touringImageWrap:    { borderRadius: 16, overflow: 'hidden', height: 220, marginBottom: 32 },
  touringImage:        { flex: 1 },
  touringImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  touringTitle:        { fontSize: 32, fontWeight: 'bold', color: '#111827', lineHeight: 42, marginBottom: 16 },
  touringDesc:         { fontSize: 17, color: '#6b7280', lineHeight: 26, marginBottom: 32 },
  touringBtn:          { alignSelf: 'flex-start', backgroundColor: '#CC0000', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  touringBtnText:      { color: '#fff', fontWeight: '600', fontSize: 16 },

  // Why Us
  whySection:   { backgroundColor: '#f9fafb', paddingVertical: 56, paddingHorizontal: 20 },
  whyTitle:     { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 32 },
  featureCard:  { width: 256, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f3f4f6', marginRight: 16 },
  featureIcon:  { fontSize: 30, marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  featureDesc:  { fontSize: 14, color: '#6b7280', lineHeight: 22 },
});
