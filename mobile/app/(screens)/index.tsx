import { View, Text, ScrollView, TextInput, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';

const HERO = require('../../assets/hero.webp');
const SKYVIEW = require('../../assets/skyview-apartment.jpg');

function HeroSection() {
  return (
    <ImageBackground source={HERO} style={s.heroImage} resizeMode="cover">
      <View style={s.heroOverlay}>
        <Text style={s.heroTitle}>Find the right home</Text>
        <Text style={[s.heroTitle, s.heroTitleBottom]}>at the right price</Text>

        <View style={s.tabs}>
          <TouchableOpacity style={s.tabActive}>
            <Text style={s.tabActiveText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tab}>
            <Text style={s.tabText}>Rent</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchBar}>
          <TextInput
            style={s.searchInput}
            placeholder="City, Address, School, Agent, ZIP"
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
          <TouchableOpacity style={s.searchBtn}>
            <Text style={s.searchBtnText}>⌕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={s.featureCard}>
      <Text style={s.featureIcon}>{icon}</Text>
      <Text style={s.featureTitle}>{title}</Text>
      <Text style={s.featureDesc}>{description}</Text>
    </View>
  );
}

function WhyUsSection() {
  const features = [
    { icon: '🏠', title: 'Biggest Selection', description: 'We show all the listings other sites hide — even new listings hitting the market today.' },
    { icon: '💰', title: 'Best Price', description: 'Our agents charge half the typical fee — so you save thousands on every transaction.' },
    { icon: '⭐', title: 'Top-Rated Agents', description: 'Work with the best agents in your area, backed by thousands of verified reviews.' },
  ];

  return (
    <View style={s.whySection}>
      <Text style={s.whyTitle}>Why buyers and sellers choose us</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </ScrollView>
    </View>
  );
}

function TouringSection() {
  return (
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
      <TouchableOpacity style={s.touringBtn}>
        <Text style={s.touringBtnText}>Search for homes</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScrollView style={s.screen} bounces={false} showsVerticalScrollIndicator={false}>
      <HeroSection />
      <TouringSection />
      <WhyUsSection />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  // Hero
  heroImage: { height: 420 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingTop: 64, paddingHorizontal: 20, justifyContent: 'center' },
  heroTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', lineHeight: 44 },
  heroTitleBottom: { marginBottom: 32 },
  tabs: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#fff', paddingBottom: 4 },
  tabActiveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tab: { borderBottomWidth: 2, borderBottomColor: 'transparent', paddingBottom: 4 },
  tabText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  searchBar: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 14 },
  searchBtn: { backgroundColor: '#CC0000', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // Touring
  touringSection: { paddingVertical: 56, paddingHorizontal: 20, backgroundColor: '#fff' },
  touringImageWrap: { borderRadius: 16, overflow: 'hidden', height: 220, marginBottom: 32 },
  touringImage: { flex: 1 },
  touringImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  touringTitle: { fontSize: 32, fontWeight: 'bold', color: '#111827', lineHeight: 42, marginBottom: 16 },
  touringDesc: { fontSize: 17, color: '#6b7280', lineHeight: 26, marginBottom: 32 },
  touringBtn: { alignSelf: 'flex-start', backgroundColor: '#CC0000', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  touringBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  // Why Us
  whySection: { backgroundColor: '#f9fafb', paddingVertical: 56, paddingHorizontal: 20 },
  whyTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 32 },
  featureCard: { width: 256, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f3f4f6', marginRight: 16 },
  featureIcon: { fontSize: 30, marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  featureDesc: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
});
