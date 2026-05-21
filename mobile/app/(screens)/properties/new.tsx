import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';

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

export default function ListPropertyScreen() {
  const [status, setStatus] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [garage, setGarage] = useState(false);
  const [pool, setPool] = useState(false);

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.container}>
        <Text style={s.pageTitle}>Sell Property</Text>

        {/* Basic Information */}
        <View style={s.section}>
          <SectionHeading title="Basic Information" />
          <Field label="Title" required>
            <StyledInput placeholder="e.g. Modern Family Home in Austin" />
          </Field>
          <Field label="Description">
            <TextInput
              style={s.textarea}
              placeholder="Describe the property…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>
        </View>

        {/* Price & Status */}
        <View style={s.section}>
          <SectionHeading title="Price & Status" />
          <View style={s.row}>
            <View style={s.half}>
              <Field label="Price" required>
                <StyledInput placeholder="0" keyboardType="numeric" />
              </Field>
            </View>
            <View style={s.half}>
              <SelectField label="Status" required value={status} options={STATUSES} onSelect={setStatus} />
            </View>
          </View>
        </View>

        {/* Property Type */}
        <View style={s.section}>
          <SectionHeading title="Property Type" />
          <SelectField label="Type" required value={propertyType} options={PROPERTY_TYPES} onSelect={setPropertyType} />
        </View>

        {/* Location */}
        <View style={s.section}>
          <SectionHeading title="Location" />
          <Field label="Address" required>
            <StyledInput placeholder="123 Main St" />
          </Field>
          <View style={s.row}>
            <View style={s.half}>
              <Field label="City" required>
                <StyledInput placeholder="Los Angeles" />
              </Field>
            </View>
            <View style={s.half}>
              <Field label="State" required>
                <StyledInput placeholder="CA" />
              </Field>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.half}>
              <Field label="Zip Code" required>
                <StyledInput placeholder="90001" keyboardType="numeric" />
              </Field>
            </View>
            <View style={s.half}>
              <Field label="Country" required>
                <StyledInput placeholder="US" defaultValue="US" />
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
                <StyledInput placeholder="0" keyboardType="numeric" />
              </Field>
            </View>
            <View style={s.third}>
              <Field label="Bathrooms">
                <StyledInput placeholder="0" keyboardType="numeric" />
              </Field>
            </View>
            <View style={s.third}>
              <Field label="Year Built">
                <StyledInput placeholder="2000" keyboardType="numeric" />
              </Field>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.half}>
              <Field label="Square Feet">
                <StyledInput placeholder="0" keyboardType="numeric" />
              </Field>
            </View>
            <View style={s.half}>
              <Field label="Lot Size (sqft)">
                <StyledInput placeholder="0" keyboardType="numeric" />
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
          <TouchableOpacity style={s.uploadZone}>
            <Text style={s.uploadIcon}>☁️</Text>
            <Text style={s.uploadText}>
              Drop photos here or <Text style={s.uploadBrowse}>browse</Text>
            </Text>
            <Text style={s.uploadHint}>PNG, JPG, WEBP · minimum 2 photos</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.submitBtn}>
          <Text style={s.submitBtnText}>Send to Agent</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
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
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
