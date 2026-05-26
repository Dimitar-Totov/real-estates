import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useFocusEffect(useCallback(() => {
    setMode('login');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirm('');
  }, []));

  const isLogin = mode === 'login';

  const themeColor = isLogin ? '#8bb4e0' : '#7ec9b8';
  const gradientTop = isLogin ? '#8bb4e0' : '#7ec9b8';

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (!isLogin && !username) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }
    if (!isLogin && password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      router.replace('/');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      {/* Left / Top panel */}
      <View style={[s.panel, { backgroundColor: gradientTop }]}>
        <Text style={s.panelIcon}>{isLogin ? '🏢' : '🏠'}</Text>
        <Text style={s.panelTitle}>{isLogin ? 'Welcome Back' : 'Join Us Today'}</Text>
        <Text style={s.panelSubtitle}>
          {isLogin
            ? 'Sign in to access your saved homes and personalized property alerts.'
            : 'Create an account to track favorites and get tailored home recommendations.'}
        </Text>
      </View>

      {/* Form panel */}
      <View style={s.formPanel}>
        <Text style={s.formTitle}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
        <Text style={s.formSubtitle}>
          {isLogin ? 'Enter your credentials to continue' : 'Fill in your details to get started'}
        </Text>

        {/* Username — register only */}
        {!isLogin && (
          <View style={s.fieldWrap}>
            <Text style={s.label}>USERNAME</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput
                style={s.input}
                placeholder="johndoe"
                placeholderTextColor="#c0c0c0"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>
        )}

        {/* Email */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>EMAIL ADDRESS</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>✉️</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#c0c0c0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        {/* Password */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>PASSWORD</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>🔒</Text>
            <TextInput
              style={[s.input, s.inputWithToggle]}
              placeholder="••••••••"
              placeholderTextColor="#c0c0c0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={s.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password — register only */}
        {!isLogin && (
          <View style={s.fieldWrap}>
            <Text style={s.label}>CONFIRM PASSWORD</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={[s.input, s.inputWithToggle]}
                placeholder="••••••••"
                placeholderTextColor="#c0c0c0"
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={s.eyeIcon}>{showConfirm ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: themeColor }, submitting && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={s.submitBtnText}>{submitting ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}</Text>
        </TouchableOpacity>

        {/* Toggle mode */}
        <View style={s.toggleRow}>
          <Text style={s.toggleText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => { setMode(isLogin ? 'register' : 'login'); setUsername(''); setEmail(''); setPassword(''); setConfirm(''); }}>
            <Text style={[s.toggleLink, { color: themeColor }]}>
              {isLogin ? 'Create one' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },

  // Panel
  panel: { paddingVertical: 48, paddingHorizontal: 28, alignItems: 'center', gap: 12 },
  panelIcon: { fontSize: 56, marginBottom: 8 },
  panelTitle: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center' },
  panelSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  // Form
  formPanel: { flex: 1, padding: 28, backgroundColor: '#fff' },
  formTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: '#888', marginBottom: 28 },

  // Fields
  fieldWrap: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#555', letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, backgroundColor: '#fff' },
  inputIcon: { fontSize: 14, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 12, paddingRight: 14, fontSize: 14, color: '#111' },
  inputWithToggle: { paddingRight: 0 },
  eyeBtn: { paddingHorizontal: 12 },
  eyeIcon: { fontSize: 16 },

  // Submit
  submitBtn: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Toggle
  toggleRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  toggleText: { fontSize: 14, color: '#555' },
  toggleLink: { fontSize: 14, fontWeight: '600' },
});
