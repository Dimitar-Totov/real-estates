import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';

const STATUSES = ['For Sale', 'For Rent', 'Sold', 'Rented'];
const TYPES = ['House', 'Apartment', 'Condo', 'Townhouse', 'Land', 'Commercial'];
const BEDS = ['Any', '1+', '2+', '3+', '4+'];
const BATHS = ['Any', '1+', '2+', '3+'];

const MOCK_PROPERTIES = [
  { id: '1', title: 'Modern Family Home', address: '123 Oak St', city: 'Los Angeles', state: 'CA', price: 850000, status: 'For Sale', type: 'House', beds: 4, baths: 3, sqft: 2400 },
  { id: '2', title: 'Downtown Apartment', address: '456 Main Ave', city: 'New York', state: 'NY', price: 3200, status: 'For Rent', type: 'Apartment', beds: 2, baths: 1, sqft: 980 },
  { id: '3', title: 'Luxury Condo', address: '789 Sunset Blvd', city: 'Miami', state: 'FL', price: 1250000, status: 'For Sale', type: 'Condo', beds: 3, baths: 2, sqft: 1800 },
  { id: '4', title: 'Cozy Townhouse', address: '321 Elm Rd', city: 'Chicago', state: 'IL', price: 4500, status: 'For Rent', type: 'Townhouse', beds: 3, baths: 2, sqft: 1600 },
  { id: '5', title: 'Suburban Ranch', address: '654 Pine Ln', city: 'Austin', state: 'TX', price: 620000, status: 'For Sale', type: 'House', beds: 3, baths: 2, sqft: 2100 },
  { id: '6', title: 'City Studio', address: '987 Broadway', city: 'Seattle', state: 'WA', price: 1800, status: 'For Rent', type: 'Apartment', beds: 1, baths: 1, sqft: 520 },
];

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.pill, active && s.pillActive]}>
      <Text style={[s.pillText, active && s.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FiltersSection() {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeBeds, setActiveBeds] = useState('Any');
  const [activeBaths, setActiveBaths] = useState('Any');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [expanded, setExpanded] = useState(false);

  const activeCount = [
    activeStatus,
    activeType,
    activeBeds !== 'Any' ? activeBeds : null,
    activeBaths !== 'Any' ? activeBaths : null,
    minPrice || null,
    maxPrice || null,
  ].filter(Boolean).length;

  const clearAll = () => {
    setActiveStatus(null);
    setActiveType(null);
    setActiveBeds('Any');
    setActiveBaths('Any');
    setMinPrice('');
    setMaxPrice('');
  };

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
          <Text style={s.filterToggleArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={s.filtersBody}>
          <View style={s.filterSection}>
            <Text style={s.filterLabel}>LOCATION</Text>
            <TextInput style={s.filterInput} placeholder="City or neighbourhood…" placeholderTextColor="#9ca3af" />
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>LISTING TYPE</Text>
            <View style={s.pillGrid}>
              {STATUSES.map((st) => (
                <FilterPill key={st} label={st} active={activeStatus === st} onPress={() => setActiveStatus(activeStatus === st ? null : st)} />
              ))}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>PROPERTY TYPE</Text>
            <View style={s.pillGrid}>
              {TYPES.map((t) => (
                <FilterPill key={t} label={t} active={activeType === t} onPress={() => setActiveType(activeType === t ? null : t)} />
              ))}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>PRICE RANGE</Text>
            <View style={s.priceRow}>
              <TextInput style={[s.filterInput, s.priceInput]} placeholder="Min $" placeholderTextColor="#9ca3af" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
              <TextInput style={[s.filterInput, s.priceInput]} placeholder="Max $" placeholderTextColor="#9ca3af" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
            </View>
            <TouchableOpacity style={s.applyBtn}>
              <Text style={s.applyBtnText}>Apply Price</Text>
            </TouchableOpacity>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>BEDROOMS</Text>
            <View style={s.pillRow}>
              {BEDS.map((b) => (
                <FilterPill key={b} label={b} active={activeBeds === b} onPress={() => setActiveBeds(b)} />
              ))}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterLabel}>BATHROOMS</Text>
            <View style={s.pillRow}>
              {BATHS.map((b) => (
                <FilterPill key={b} label={b} active={activeBaths === b} onPress={() => setActiveBaths(b)} />
              ))}
            </View>
          </View>

          {activeCount > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll}>
              <Text style={s.clearBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function PropertyCard({ property }: { property: typeof MOCK_PROPERTIES[0] }) {
  const isRent = property.status === 'For Rent';
  const statusColor = property.status === 'For Sale' ? '#10b981' : property.status === 'For Rent' ? '#3b82f6' : '#9ca3af';

  return (
    <View style={s.card}>
      <View style={s.cardImage}>
        <Text style={s.cardImageIcon}>🏠</Text>
        <View style={s.cardBadges}>
          <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={s.statusBadgeText}>{property.status}</Text>
          </View>
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>{property.type}</Text>
          </View>
        </View>
      </View>
      <View style={s.cardContent}>
        <Text style={s.cardPrice}>
          ${property.price.toLocaleString()}
          {isRent && <Text style={s.cardPriceSuffix}>/mo</Text>}
        </Text>
        <Text style={s.cardTitle} numberOfLines={1}>{property.title}</Text>
        <Text style={s.cardAddress}>📍 {property.address}, {property.city}, {property.state}</Text>
        <View style={s.cardStats}>
          <Text style={s.cardStat}>{property.beds} bd</Text>
          <Text style={s.cardStat}>{property.baths} ba</Text>
          <Text style={s.cardSqft}>{property.sqft.toLocaleString()} sqft</Text>
        </View>
      </View>
    </View>
  );
}

export default function AllPropertiesScreen() {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.heading}>Property Listings</Text>
        <Text style={s.subheading}>Browse thousands of homes for sale and rent</Text>
        <Text style={s.count}>{MOCK_PROPERTIES.length} properties found</Text>
      </View>

      <FiltersSection />

      <View style={s.grid}>
        {MOCK_PROPERTIES.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  heading: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 6 },
  count: { fontSize: 13, color: '#9ca3af' },

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
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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

  grid: { paddingHorizontal: 16, gap: 16, paddingBottom: 24 },

  card: { borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImage: { height: 180, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
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
