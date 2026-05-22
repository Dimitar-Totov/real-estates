import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  Modal, TouchableOpacity, Dimensions, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { properties as propertiesApi } from '../../lib/api';
import type { Property } from '../../lib/types';

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

        {/* ── Header bar ── */}
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

        {/* ── Paging image strip ── */}
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

        {/* ── Prev arrow ── */}
        {index > 0 && (
          <TouchableOpacity style={[g.arrow, g.arrowLeft]} onPress={() => goTo(index - 1)} activeOpacity={0.8}>
            <Text style={g.arrowGlyph}>‹</Text>
          </TouchableOpacity>
        )}

        {/* ── Next arrow ── */}
        {index < images.length - 1 && (
          <TouchableOpacity style={[g.arrow, g.arrowRight]} onPress={() => goTo(index + 1)} activeOpacity={0.8}>
            <Text style={g.arrowGlyph}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Dot indicators ── */}
        {images.length > 1 && images.length <= 12 && (
          <View style={g.dots}>
            {images.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                <View style={[g.dot, i === index && g.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Bottom thumbnail strip ── */}
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
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      propertiesApi.get(Number(id)),
      propertiesApi.coverImage(Number(id)).catch(() => ({ coverImage: null })),
    ])
      .then(([p, coverResult]) => {
        setProperty(p);
        navigation.setOptions({ title: p.title });

        // Only use real R2 images — skip picsum placeholder seeds from DB
        const r2FromDb = (p.images ?? []).filter(u => u.includes('.r2.dev/'));

        const seen = new Set<string>();
        const imgs: string[] = [];

        if (coverResult.coverImage) { seen.add(coverResult.coverImage); imgs.push(coverResult.coverImage); }
        for (const url of r2FromDb) {
          if (!seen.has(url)) { seen.add(url); imgs.push(url); }
        }

        // Last resort: nothing from R2 → fall back to whatever DB has
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

          {/* Gradient-like dark overlay at bottom for badges */}
          <View style={s.imageOverlay} />

          <View style={s.imageBadges}>
            <View style={[s.statusBadge, { backgroundColor: status.color }]}>
              <Text style={s.statusBadgeText}>{status.label}</Text>
            </View>
            <View style={s.typeBadge}>
              <Text style={s.typeBadgeText}>{TYPE_LABELS[p.type] ?? p.type}</Text>
            </View>
          </View>

          {/* Photo count pill */}
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
