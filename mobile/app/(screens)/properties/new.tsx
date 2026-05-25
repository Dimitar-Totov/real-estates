import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Redirect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/auth-context';
import { agents as agentsApi, properties as propertiesApi } from '../../../lib/api';
import type { Agent } from '../../../lib/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type PreviewImage = { id: string; uri: string; mimeType: string };

const PROPERTY_TYPES = ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'];
const STATUSES = ['for_sale', 'for_rent', 'sold', 'rented'];

function SectionHeading({ title }: { title: string }) {
  return <Text style={s.sectionHeading}>{title}</Text>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label}{required && <Text style={s.required}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput style={s.input} placeholderTextColor="#9ca3af" {...props} />;
}

function SelectField({ label, required, value, options, onSelect }: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = value ? value.replace(/_/g, ' ') : 'Select…';

  return (
    <Field label={label} required={required}>
      <TouchableOpacity style={s.select} onPress={() => setOpen(!open)}>
        <Text style={[s.selectText, !value && s.selectPlaceholder]}>{display}</Text>
        <Text style={s.selectArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.dropdownItem, value === opt && s.dropdownItemActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[s.dropdownItemText, value === opt && s.dropdownItemTextActive]}>
                {opt.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Field>
  );
}

function Checkbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={s.checkboxRow} onPress={onToggle}>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <Text style={s.checkboxTick}>✓</Text>}
      </View>
      <Text style={s.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function AgentCarousel({
  agents,
  agentIndex,
  onPrev,
  onNext,
  onDotPress,
}: {
  agents: Agent[];
  agentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onDotPress: (i: number) => void;
}) {
  const agent = agents[agentIndex];
  if (!agent) return null;

  return (
    <View>
      <View style={s.carouselRow}>
        {/* Left arrow */}
        <TouchableOpacity style={s.arrowBtn} onPress={onPrev}>
          <Text style={s.arrowText}>‹</Text>
        </TouchableOpacity>

        {/* Agent card */}
        <View style={s.agentCard}>
          {/* Avatar + rating badge */}
          <View style={s.avatarWrapper}>
            {agent.image ? (
              <Image source={{ uri: agent.image }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitial}>{agent.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {agent.rating !== null && (
              <View style={s.ratingBadge}>
                <Text style={s.ratingBadgeStar}>★</Text>
                <Text style={s.ratingBadgeText}>
                  {typeof agent.rating === 'number' ? agent.rating.toFixed(1) : agent.rating}
                </Text>
              </View>
            )}
          </View>

          {/* Name + experience */}
          <Text style={s.agentName}>{agent.name}</Text>
          {agent.experience !== null && agent.experience > 0 && (
            <Text style={s.agentExperience}>
              {agent.experience} yr{agent.experience !== 1 ? 's' : ''} experience
            </Text>
          )}

          {/* Specialty pill */}
          {agent.specialty && (
            <View style={s.specialtyPill}>
              <Text style={s.specialtyText}>{agent.specialty}</Text>
            </View>
          )}

          {/* City */}
          {agent.city && (
            <View style={s.cityRow}>
              <Text style={s.cityPin}>📍</Text>
              <Text style={s.cityText}>{agent.city}</Text>
            </View>
          )}

          {/* Reviews */}
          {agent.reviews !== null && agent.reviews > 0 && (
            <Text style={s.reviewsText}>
              {agent.reviews} review{agent.reviews !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Right arrow */}
        <TouchableOpacity style={s.arrowBtn} onPress={onNext}>
          <Text style={s.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Dot indicators */}
      {agents.length > 1 && (
        <View style={s.dotsRow}>
          {agents.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onDotPress(i)}
              style={[s.dot, i === agentIndex ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ListPropertyScreen() {
  const { user, loading } = useAuth();

  const scrollRef = useRef<import('react-native').ScrollView>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [garage, setGarage] = useState(false);
  const [pool, setPool] = useState(false);

  const [photos, setPhotos] = useState<PreviewImage[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentIndex, setAgentIndex] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const isAgent = user?.role === 'agent';

  useEffect(() => {
    agentsApi.list()
      .then((data) => {
        setAgents(data);
        if (data.length > 0) setSelectedAgentId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setAgentsLoading(false));
  }, []);

  function prevAgent() {
    setAgentIndex((i) => {
      const next = (i - 1 + agents.length) % agents.length;
      setSelectedAgentId(agents[next].id);
      return next;
    });
  }

  function nextAgent() {
    setAgentIndex((i) => {
      const next = (i + 1) % agents.length;
      setSelectedAgentId(agents[next].id);
      return next;
    });
  }

  function selectAgentByIndex(i: number) {
    setAgentIndex(i);
    setSelectedAgentId(agents[i].id);
  }

  async function pickPhotos() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const picked: PreviewImage[] = result.assets.map((a) => ({
      id: `${a.uri}-${Date.now()}-${Math.random()}`,
      uri: a.uri,
      mimeType: a.mimeType ?? 'image/jpeg',
    }));
    setPhotos((prev) => [...prev, ...picked]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function showError(msg: string) {
    setError(msg);
    // scroll to bottom so the error banner is visible
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function handleSubmit() {
    setError(null);

    if (!title.trim())            return showError('Title is required.');
    if (!price.trim())            return showError('Price is required.');
    if (!status)                  return showError('Please select a status.');
    if (!propertyType)            return showError('Please select a property type.');
    if (!address.trim())          return showError('Address is required.');
    if (!city.trim())             return showError('City is required.');
    if (!stateVal.trim())         return showError('State is required.');
    if (!zipCode.trim())          return showError('Zip code is required.');
    if (!country.trim())          return showError('Country is required.');
    if (photos.length < 2)        return showError('Please upload at least 2 photos.');
    if (!isAgent && !selectedAgentId) return showError('Please select an agent.');

    setSubmitting(true);
    try {
      // Upload images via presigned URLs
      const presignRes = await fetch(`${BASE_URL}/api/upload/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          files: photos.map((p) => ({ name: p.id, contentType: p.mimeType })),
        }),
      });
      if (!presignRes.ok) throw new Error('Failed to get upload URLs.');
      const { uploads } = await presignRes.json() as {
        uploads: { presignedUrl: string; publicUrl: string }[];
      };

      await Promise.all(
        uploads.map(async (upload, i) => {
          const photo = photos[i];
          const blob = await fetch(photo.uri).then((r) => r.blob());
          const r = await fetch(upload.presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': photo.mimeType },
            body: blob,
          });
          if (!r.ok) throw new Error(`Image ${i + 1} upload failed.`);
        })
      );

      const imageUrls = uploads.map((u) => u.publicUrl);

      await propertiesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        type: propertyType,
        status,
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        zipCode: zipCode.trim(),
        country: country.trim(),
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        squareFeet: squareFeet ? Number(squareFeet) : undefined,
        lotSize: lotSize ? Number(lotSize) : undefined,
        garage,
        pool,
        images: imageUrls,
        agentId: isAgent ? undefined : selectedAgentId ?? undefined,
      });

      setSubmitted(true);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(screens)/auth" />;
  }

  if (submitted) {
    return (
      <View style={s.successContainer}>
        <View style={s.successIcon}>
          <Text style={s.successIconText}>✓</Text>
        </View>
        <Text style={s.successTitle}>Listing submitted!</Text>
        <Text style={s.successBody}>
          Your property has been sent to the agent for review. You'll receive a reply once it's approved.
        </Text>
        <TouchableOpacity style={s.successBtn} onPress={() => setSubmitted(false)}>
          <Text style={s.successBtnText}>Submit another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.container}>
        <Text style={s.pageTitle}>Sell Property</Text>

        {/* Choose an Agent */}
        {!isAgent && (
          <View style={s.section}>
            <Text style={s.agentSectionTitle}>Choose an agent</Text>
            <Text style={s.agentSectionSubtitle}>
              Choose one of our agents to help you sell your property.
            </Text>

            {agentsLoading ? (
              <View style={s.agentPlaceholder}>
                <ActivityIndicator color="#2563eb" />
                <Text style={s.agentPlaceholderText}>Loading agents…</Text>
              </View>
            ) : agents.length === 0 ? (
              <View style={s.agentPlaceholder}>
                <Text style={s.agentPlaceholderText}>No agents available at the moment.</Text>
              </View>
            ) : (
              <AgentCarousel
                agents={agents}
                agentIndex={agentIndex}
                onPrev={prevAgent}
                onNext={nextAgent}
                onDotPress={selectAgentByIndex}
              />
            )}
          </View>
        )}

        {/* Basic Information */}
        <View style={s.section}>
          <SectionHeading title="Basic Information" />
          <Field label="Title" required>
            <StyledInput
              placeholder="e.g. Modern Family Home in Austin"
              value={title}
              onChangeText={(v) => { setTitle(v); setError(null); }}
            />
          </Field>
          <Field label="Description">
            <TextInput
              style={s.textarea}
              placeholder="Describe the property…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </Field>
        </View>

        {/* Price & Status */}
        <View style={s.section}>
          <SectionHeading title="Price & Status" />
          <View style={s.row}>
            <View style={s.half}>
              <Field label="Price" required>
                <StyledInput
                  placeholder="0"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={(v) => { setPrice(v); setError(null); }}
                />
              </Field>
            </View>
            <View style={s.half}>
              <SelectField label="Status" required value={status} options={STATUSES} onSelect={(v) => { setStatus(v); setError(null); }} />
            </View>
          </View>
        </View>

        {/* Property Type */}
        <View style={s.section}>
          <SectionHeading title="Property Type" />
          <SelectField label="Type" required value={propertyType} options={PROPERTY_TYPES} onSelect={(v) => { setPropertyType(v); setError(null); }} />
        </View>

        {/* Location */}
        <View style={s.section}>
          <SectionHeading title="Location" />
          <Field label="Address" required>
            <StyledInput
              placeholder="123 Main St"
              value={address}
              onChangeText={(v) => { setAddress(v); setError(null); }}
            />
          </Field>
          <View style={s.row}>
            <View style={s.half}>
              <Field label="City" required>
                <StyledInput
                  placeholder="Los Angeles"
                  value={city}
                  onChangeText={(v) => { setCity(v); setError(null); }}
                />
              </Field>
            </View>
            <View style={s.half}>
              <Field label="State" required>
                <StyledInput
                  placeholder="CA"
                  value={stateVal}
                  onChangeText={(v) => { setStateVal(v); setError(null); }}
                />
              </Field>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.half}>
              <Field label="Zip Code" required>
                <StyledInput
                  placeholder="90001"
                  keyboardType="numeric"
                  value={zipCode}
                  onChangeText={(v) => { setZipCode(v); setError(null); }}
                />
              </Field>
            </View>
            <View style={s.half}>
              <Field label="Country" required>
                <StyledInput
                  placeholder="US"
                  value={country}
                  onChangeText={(v) => { setCountry(v); setError(null); }}
                />
              </Field>
            </View>
          </View>
        </View>

        {/* Property Details */}
        <View style={s.section}>
          <SectionHeading title="Property Details" />
          <View style={s.row3}>
            <View style={s.third}>
              <Field label="Bedrooms">
                <StyledInput placeholder="0" keyboardType="numeric" value={bedrooms} onChangeText={setBedrooms} />
              </Field>
            </View>
            <View style={s.third}>
              <Field label="Bathrooms">
                <StyledInput placeholder="0" keyboardType="numeric" value={bathrooms} onChangeText={setBathrooms} />
              </Field>
            </View>
            <View style={s.third}>
              <Field label="Year Built">
                <StyledInput placeholder="2000" keyboardType="numeric" value={yearBuilt} onChangeText={setYearBuilt} />
              </Field>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.half}>
              <Field label="Square Feet">
                <StyledInput placeholder="0" keyboardType="numeric" value={squareFeet} onChangeText={setSquareFeet} />
              </Field>
            </View>
            <View style={s.half}>
              <Field label="Lot Size (sqft)">
                <StyledInput placeholder="0" keyboardType="numeric" value={lotSize} onChangeText={setLotSize} />
              </Field>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={s.section}>
          <SectionHeading title="Amenities" />
          <View style={s.checkboxes}>
            <Checkbox label="Garage" checked={garage} onToggle={() => setGarage(!garage)} />
            <Checkbox label="Pool" checked={pool} onToggle={() => setPool(!pool)} />
          </View>
        </View>

        {/* Photos */}
        <View style={s.section}>
          <SectionHeading title="Photos" />
          {photos.length === 0 ? (
            <TouchableOpacity style={s.uploadZone} onPress={pickPhotos}>
              <Text style={s.uploadIcon}>☁️</Text>
              <Text style={s.uploadText}>
                Tap to browse <Text style={s.uploadBrowse}>photos</Text>
              </Text>
              <Text style={s.uploadHint}>PNG, JPG, WEBP · minimum 2 photos</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={s.photoThumb}>
                  <Image source={{ uri: photo.uri }} style={s.photoImg} />
                  <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(photo.id)}>
                    <Text style={s.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.photoAdd} onPress={pickPhotos}>
                <Text style={s.photoAddIcon}>+</Text>
                <Text style={s.photoAddText}>Add more</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Error banner */}
        {error && (
          <View style={s.errorBanner}>
            <View style={s.errorAccent} />
            <Text style={s.errorIcon}>⚠</Text>
            <Text style={s.errorMsg}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, submitting && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitBtnText}>{isAgent ? 'Sell the Property' : 'Send to Agent'}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 24 },

  section: { marginBottom: 28 },
  sectionHeading: { fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },

  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#ef4444' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  textarea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#fff', minHeight: 100 },

  select: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
  selectText: { fontSize: 14, color: '#111827', textTransform: 'capitalize' },
  selectPlaceholder: { color: '#9ca3af' },
  selectArrow: { fontSize: 11, color: '#9ca3af' },
  dropdown: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginTop: 4, overflow: 'hidden', backgroundColor: '#fff' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 14, color: '#374151', textTransform: 'capitalize' },
  dropdownItemTextActive: { color: '#2563eb', fontWeight: '600' },

  row: { flexDirection: 'row', gap: 12 },
  row3: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  third: { flex: 1 },

  checkboxes: { gap: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkboxTick: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },

  uploadZone: { borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 36, alignItems: 'center', gap: 8, backgroundColor: '#f9fafb' },
  uploadIcon: { fontSize: 36 },
  uploadText: { fontSize: 15, color: '#6b7280' },
  uploadBrowse: { color: '#2563eb', fontWeight: '600' },
  uploadHint: { fontSize: 12, color: '#9ca3af' },

  submitBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fef2f2', borderRadius: 12,
    borderWidth: 1, borderColor: '#fecaca',
    marginBottom: 12, overflow: 'hidden',
  },
  errorAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#ef4444' },
  errorIcon: { fontSize: 16, color: '#ef4444', marginLeft: 12, marginRight: 8 },
  errorMsg: { flex: 1, fontSize: 14, color: '#991b1b', paddingVertical: 14, lineHeight: 20 },
  errorDismiss: { fontSize: 14, color: '#ef4444', paddingHorizontal: 14, paddingVertical: 14 },

  // Success screen
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successIconText: { fontSize: 40, color: '#16a34a' },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 10, textAlign: 'center' },
  successBody: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successBtn: { paddingVertical: 13, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' },
  successBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: '31%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 13 },
  photoAdd: {
    width: '31%', aspectRatio: 1, borderRadius: 10,
    borderWidth: 2, borderColor: '#d1d5db', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#f9fafb',
  },
  photoAddIcon: { fontSize: 22, color: '#9ca3af' },
  photoAddText: { fontSize: 11, color: '#9ca3af' },

  // Agent section
  agentSectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  agentSectionSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 18 },
  agentPlaceholder: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingVertical: 48, alignItems: 'center', gap: 12 },
  agentPlaceholderText: { fontSize: 14, color: '#9ca3af', marginTop: 4 },

  // Carousel
  carouselRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  arrowText: { fontSize: 24, color: '#6b7280', lineHeight: 28 },

  // Agent card
  agentCard: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 24,
    paddingVertical: 28, paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  avatarFallback: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#bfdbfe',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#fff',
  },
  avatarInitial: { fontSize: 40, fontWeight: '600', color: '#2563eb' },
  ratingBadge: {
    position: 'absolute', bottom: -4, right: -4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  ratingBadgeStar: { color: '#fff', fontSize: 11 },
  ratingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  agentName: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  agentExperience: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  specialtyPill: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  specialtyText: { fontSize: 13, fontWeight: '600', color: '#1d4ed8' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cityPin: { fontSize: 14 },
  cityText: { fontSize: 14, color: '#6b7280' },
  reviewsText: { fontSize: 13, color: '#9ca3af' },

  // Dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 20, backgroundColor: '#2563eb' },
  dotInactive: { width: 8, backgroundColor: '#d1d5db' },
});
