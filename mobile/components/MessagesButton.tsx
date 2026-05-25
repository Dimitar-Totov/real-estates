import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export function MessagesButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(screens)/messages')}
      style={s.btn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={s.icon}>✉</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { marginRight: 16 },
  icon: { fontSize: 20, color: '#fff' },
});
