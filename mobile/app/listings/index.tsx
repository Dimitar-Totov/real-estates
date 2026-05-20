import { View, Text, StyleSheet } from 'react-native';

export default function AllPropertiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Properties</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', color: '#1a1a2e' },
});
