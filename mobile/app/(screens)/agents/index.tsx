import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';

const SPECIALTIES = ['Residential', 'Commercial', 'Luxury', 'Investment', 'Rental', 'New Developments'];
const CITIES = ['Los Angeles', 'New York', 'Miami', 'Chicago', 'Austin', 'Seattle'];

const MOCK_AGENTS = [
  { id: '1', name: 'Sarah Johnson', specialty: 'Luxury', city: 'Los Angeles', experience: 12, rating: 5.2, reviews: 48, phone: '+1 (310) 555-0192' },
  { id: '2', name: 'Marcus Williams', specialty: 'Residential', city: 'New York', experience: 8, rating: 4.8, reviews: 32, phone: '+1 (212) 555-0184' },
  { id: '3', name: 'Elena Rodriguez', specialty: 'Commercial', city: 'Miami', experience: 15, rating: 5.6, reviews: 61, phone: '+1 (305) 555-0147' },
  { id: '4', name: 'David Chen', specialty: 'Investment', city: 'Austin', experience: 6, rating: 4.4, reviews: 19, phone: '+1 (512) 555-0163' },
  { id: '5', name: 'Priya Patel', specialty: 'New Developments', city: 'Seattle', experience: 10, rating: 5.0, reviews: 37, phone: '+1 (206) 555-0129' },
  { id: '6', name: 'James Thompson', specialty: 'Rental', city: 'Chicago', experience: 4, rating: 4.2, reviews: 14, phone: '+1 (773) 555-0158' },
];

function StarRating({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4, 5, 6];
  return (
    <View style={s.stars}>
      {stars.map((star) => (
        <Text key={star} style={[s.star, { opacity: rating >= star ? 1 : 0.25 }]}>★</Text>
      ))}
      <Text style={s.ratingText}>{rating.toFixed(1)}/6</Text>
    </View>
  );
}

function AgentCard({ agent }: { agent: typeof MOCK_AGENTS[0] }) {
  return (
    <View style={s.card}>
      {/* Image */}
      <View style={s.cardImage}>
        <Text style={s.cardAvatarText}>{agent.name.charAt(0)}</Text>
        <View style={s.ratingBadge}>
          <Text style={s.ratingBadgeStar}>★</Text>
          <Text style={s.ratingBadgeValue}>{agent.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={s.cardBody}>
        <Text style={s.agentName}>{agent.name}</Text>
        <Text style={s.agentSpecialty}>{agent.specialty}</Text>

        <StarRating rating={agent.rating} />

        <View style={s.metaRow}>
          <Text style={s.metaText}>📍 {agent.city}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaText}>🕐 {agent.experience} years exp.</Text>
          <Text style={s.metaText}>💬 {agent.reviews} reviews</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaText}>📞 {agent.phone}</Text>
        </View>

        {/* Actions */}
        <View style={s.cardActions}>
          <TouchableOpacity style={s.emailBtn}>
            <Text style={s.emailBtnText}>✉ Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.commentBtn}>
            <Text style={s.commentBtnText}>★ Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function FiltersSection({
  nameQuery, setNameQuery,
  activeSpecialties, toggleSpecialty,
  activeCities, toggleCity,
  onClear,
}: {
  nameQuery: string;
  setNameQuery: (v: string) => void;
  activeSpecialties: string[];
  toggleSpecialty: (v: string) => void;
  activeCities: string[];
  toggleCity: (v: string) => void;
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
          {/* Name Search */}
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
          <View style={s.filterSection}>
            <Text style={s.filterLabel}>SPECIALTY</Text>
            <View style={s.checkGrid}>
              {SPECIALTIES.map((sp) => {
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

          {/* Cities */}
          <View style={s.filterSection}>
            <Text style={s.filterLabel}>CITY</Text>
            <View style={s.checkGrid}>
              {CITIES.map((city) => {
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

          {/* Active filter pills */}
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

export default function FindAgentScreen() {
  const [nameQuery, setNameQuery] = useState('');
  const [activeSpecialties, setActiveSpecialties] = useState<string[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [sort, setSort] = useState<'newest' | 'top-rated'>('newest');

  const toggleSpecialty = (sp: string) =>
    setActiveSpecialties((prev) => prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp]);

  const toggleCity = (city: string) =>
    setActiveCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);

  const clearAll = () => {
    setNameQuery('');
    setActiveSpecialties([]);
    setActiveCities([]);
  };

  const filtered = MOCK_AGENTS
    .filter((a) => !nameQuery || a.name.toLowerCase().includes(nameQuery.toLowerCase()))
    .filter((a) => !activeSpecialties.length || activeSpecialties.includes(a.specialty))
    .filter((a) => !activeCities.length || activeCities.includes(a.city))
    .sort((a, b) => sort === 'top-rated' ? b.rating - a.rating : 0);

  return (
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
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

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
  grid: { paddingHorizontal: 16, gap: 16, paddingBottom: 24 },

  // Card
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImage: { height: 160, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: 56, fontWeight: '700', color: '#4338ca' },
  ratingBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  ratingBadgeStar: { fontSize: 12, color: '#f59e0b' },
  ratingBadgeValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardBody: { padding: 16 },
  agentName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 2 },
  agentSpecialty: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  star: { fontSize: 16, color: '#f59e0b' },
  ratingText: { fontSize: 12, color: '#9ca3af', marginLeft: 4 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  metaText: { fontSize: 13, color: '#6b7280' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  emailBtn: { flex: 1, borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  emailBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  commentBtn: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  commentBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
