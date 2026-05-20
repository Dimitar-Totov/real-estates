import { View, Text, StyleSheet } from 'react-native';

export default function TopRatedAgentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top-Rated Agents</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', color: '#1a1a2e' },
});
