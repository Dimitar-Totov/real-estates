import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { properties as propertiesApi } from '../../../lib/api';
import type { Property } from '../../../lib/types';

// ─── Options (aligned with web PropertyFilters) ───────────────────────────────

const STATUS_OPTIONS = [
  { label: 'For Sale', value: 'for_sale' },
  { label: 'For Rent', value: 'for_rent' },
  { label: 'Sold',     value: 'sold' },
  { label: 'Rented',   value: 'rented' },
];

const TYPE_OPTIONS = [
  { label: 'House',      value: 'house' },
  { label: 'Apartment',  value: 'apartment' },
  { label: 'Condo',      value: 'condo' },
  { label: 'Townhouse',  value: 'townhouse' },
  { label: 'Land',       value: 'land' },
  { label: 'Commercial', value: 'commercial' },
];

const BED_OPTIONS  = [{ label: 'Any', value: '' }, { label: '1+', value: '1' }, { label: '2+', value: '2' }, { label: '3+', value: '3' }, { label: '4+', value: '4' }];
const BATH_OPTIONS = [{ label: 'Any', value: '' }, { label: '1+', value: '1' }, { label: '2+', value: '2' }, { label: '3+', value: '3' }];

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
  city: string;
  status: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
}

const DEFAULT_FILTERS: Filters = { city: '', status: '', type: '', minPrice: '', maxPrice: '', minBeds: '', minBaths: '' };

function applyFilters(all: Property[], f: Filters): Property[] {
  return all.filter(p => {
    if (f.city    && !p.city.toLowerCase().includes(f.city.toLowerCase())) return false;
    if (f.status  && p.status !== f.status) return false;
    if (f.type    && p.type   !== f.type)   return false;
    if (f.minPrice && parseFloat(p.price) < parseFloat(f.minPrice)) return false;
    if (f.maxPrice && parseFloat(p.price) > parseFloat(f.maxPrice)) return false;
    if (f.minBeds  && (p.bedrooms  === null || p.bedrooms  < parseInt(f.minBeds)))  return false;
    if (f.minBaths && (p.bathrooms === null || p.bathrooms < parseInt(f.minBaths))) return false;
    return true;
  });
}

// ─── Shared pill component ────────────────────────────────────────────────────

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.pill, active && s.pillActive]}>
      <Text style={[s.pillText, active && s.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Filters panel ────────────────────────────────────────────────────────────

interface FiltersSectionProps {
  filters: Filters;
  onUpdate: (patch: Partial<Filters>) => void;
  onClearAll: () => void;
}

function FiltersSection({ filters, onUpdate, onClearAll }: FiltersSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [cityInput, setCityInput]       = useState(filters.city);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice);

  const activeCount = Object.values(filters).filter(Boolean).length;

  function applyCity()  { onUpdate({ city: cityInput }); }
  function applyPrice() { onUpdate({ minPrice: minPriceInput, maxPrice: maxPriceInput }); }

  function handleClearAll() {
    setCityInput(''); setMinPriceInput(''); setMaxPriceInput('');
    onClearAll();
  }

  return (
    <View style={s.filtersContainer}>
      <TouchableOpacity style={s.filterToggle} onPress={() => setExpanded(!expanded)}>
        <Text style={s.filterToggleText}>Filters</Text>
        <View style={s.filterToggleRight}>
          {activeCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{activeCount}</Text></View>}
          <Text style={s.filterToggleArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={s.filtersBody}>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>LOCATION</Text>
            <TextInput
              style={s.filterInput}
              placeholder="City or neighbourhood…"
              placeholderTextColor="#9ca3af"
              value={cityInput}
              onChangeText={setCityInput}
              onSubmitEditing={applyCity}
              onBlur={applyCity}
              returnKeyType="search"
            />
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>LISTING TYPE</Text>
            <View style={s.pillGrid}>
              {STATUS_OPTIONS.map(o => (
                <Pill key={o.value} label={o.label} active={filters.status === o.value}
                  onPress={() => onUpdate({ status: filters.status === o.value ? '' : o.value })} />
              ))}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>PROPERTY TYPE</Text>
            <View style={s.pillGrid}>
              {TYPE_OPTIONS.map(o => (
                <Pill key={o.value} label={o.label} active={filters.type === o.value}
                  onPress={() => onUpdate({ type: filters.type === o.value ? '' : o.value })} />
              ))}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>PRICE RANGE</Text>
            <View style={s.priceRow}>
              <TextInput style={[s.filterInput, s.priceInput]} placeholder="Min $" placeholderTextColor="#9ca3af"
                keyboardType="numeric" value={minPriceInput} onChangeText={setMinPriceInput} />
              <TextInput style={[s.filterInput, s.priceInput]} placeholder="Max $" placeholderTextColor="#9ca3af"
                keyboardType="numeric" value={maxPriceInput} onChangeText={setMaxPriceInput} />
            </View>
            <TouchableOpacity style={s.applyBtn} onPress={applyPrice}>
              <Text style={s.applyBtnText}>Apply Price</Text>
            </TouchableOpacity>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>BEDROOMS</Text>
            <View style={s.pillRow}>
              {BED_OPTIONS.map(o => (
                <Pill key={o.value} label={o.label} active={filters.minBeds === o.value}
                  onPress={() => onUpdate({ minBeds: o.value })} />
              ))}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>BATHROOMS</Text>
            <View style={s.pillRow}>
              {BATH_OPTIONS.map(o => (
                <Pill key={o.value} label={o.label} active={filters.minBaths === o.value}
                  onPress={() => onUpdate({ minBaths: o.value })} />
              ))}
            </View>
          </View>

          {activeCount > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={handleClearAll}>
              <Text style={s.clearBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Property card ────────────────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'for_sale') return '#10b981';
  if (status === 'for_rent') return '#3b82f6';
  return '#9ca3af';
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function PropertyCard({ property: p, coverUrl }: { property: Property; coverUrl: string | null }) {
  const router = useRouter();
  const price = parseFloat(p.price);
  const sqft  = p.squareFeet ? Math.round(parseFloat(p.squareFeet)) : null;
  const cover = coverUrl;
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => router.push(`/property/${p.id}`)}>

      <View style={s.cardImage}>
        {cover
          ? <Image source={{ uri: cover }} style={s.cardImg} resizeMode="cover" />
          : <Text style={s.cardImageIcon}>🏠</Text>
        }
        <View style={s.cardBadges}>
          <View style={[s.statusBadge, { backgroundColor: statusColor(p.status) }]}>
            <Text style={s.statusBadgeText}>{statusLabel(p.status)}</Text>
          </View>
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>{p.type}</Text>
          </View>
        </View>
      </View>
      <View style={s.cardContent}>
        <Text style={s.cardPrice}>
          ${price.toLocaleString()}
          {p.status === 'for_rent' && <Text style={s.cardPriceSuffix}>/mo</Text>}
        </Text>
        <Text style={s.cardTitle} numberOfLines={1}>{p.title}</Text>
        <Text style={s.cardAddress} numberOfLines={1}>📍 {p.address}, {p.city}, {p.state}</Text>
        <View style={s.cardStats}>
          {p.bedrooms  != null && <Text style={s.cardStat}>{p.bedrooms} bd</Text>}
          {p.bathrooms != null && <Text style={s.cardStat}>{p.bathrooms} ba</Text>}
          {sqft        != null && <Text style={s.cardSqft}>{sqft.toLocaleString()} sqft</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AllPropertiesScreen() {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [coverImages, setCoverImages] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const fetchProperties = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const data = await propertiesApi.list();
      setAllProperties(data);
      const pairs = await Promise.all(
        data.map(p =>
          propertiesApi.coverImage(p.id)
            .then(r => [p.id, r.coverImage] as const)
            .catch(() => [p.id, null] as const)
        )
      );
      setCoverImages(Object.fromEntries(pairs));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties({ silent: true });
  }, [fetchProperties]);

  const filtered = useMemo(() => applyFilters(allProperties, filters), [allProperties, filters]);

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#CC0000" /></View>;
  }

  if (error) {
    return <View style={s.centered}><Text style={s.errorText}>{error}</Text></View>;
  }

  return (
    <ScrollView
      style={s.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={s.header}>
        <Text style={s.heading}>Property Listings</Text>
        <Text style={s.subheading}>Browse thousands of homes for sale and rent</Text>
        <Text style={s.count}>
          <Text style={s.countBold}>{filtered.length}</Text>
          {' '}propert{filtered.length !== 1 ? 'ies' : 'y'} found
        </Text>
      </View>

      <FiltersSection
        filters={filters}
        onUpdate={patch => setFilters(prev => ({ ...prev, ...patch }))}
        onClearAll={() => setFilters(DEFAULT_FILTERS)}
      />

      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🏠</Text>
          <Text style={s.emptyTitle}>No properties found</Text>
          <Text style={s.emptySubtitle}>Try adjusting your filters or search area</Text>
          <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
            <Text style={s.emptyLink}>Clear all filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.grid}>
          {filtered.map(p => <PropertyCard key={p.id} property={p} coverUrl={coverImages[p.id] ?? null} />)}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center' },

  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  heading: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 6 },
  count: { fontSize: 13, color: '#9ca3af' },
  countBold: { fontWeight: '600', color: '#111827' },

  filtersContainer: { marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, overflow: 'hidden' },
  filterToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f9fafb' },
  filterToggleText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  filterToggleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterToggleArrow: { fontSize: 12, color: '#6b7280' },
  badge: { backgroundColor: '#CC0000', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  filtersBody: { padding: 16, gap: 20, backgroundColor: '#fff' },
  filterSection: { gap: 8 },
  filterLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2 },
  filterInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb' },
  pillActive: { backgroundColor: '#CC0000', borderColor: '#CC0000' },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pillTextActive: { color: '#fff' },
  priceRow: { flexDirection: 'row', gap: 8 },
  priceInput: { flex: 1 },
  applyBtn: { backgroundColor: '#374151', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  clearBtn: { alignItems: 'center', paddingVertical: 10 },
  clearBtnText: { color: '#CC0000', fontWeight: '600', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 16, textAlign: 'center' },
  emptyLink: { fontSize: 14, fontWeight: '600', color: '#CC0000' },

  grid: { paddingHorizontal: 16, gap: 16, paddingBottom: 24 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImage: { height: 180, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: '100%', height: 180, position: 'absolute', top: 0, left: 0 },
  cardImageIcon: { fontSize: 48 },
  cardBadges: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  typeBadge: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  typeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  cardContent: { padding: 14 },
  cardPrice: { fontSize: 22, fontWeight: 'bold', color: '#CC0000', marginBottom: 4 },
  cardPriceSuffix: { fontSize: 14, fontWeight: '400', color: '#9ca3af' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  cardStats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, gap: 16 },
  cardStat: { fontSize: 14, color: '#6b7280' },
  cardSqft: { fontSize: 13, color: '#9ca3af', marginLeft: 'auto' },
});
