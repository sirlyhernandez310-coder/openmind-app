import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function PsychologistsScreen({ navigation }) {
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'psychologist'), where('approved', '==', true));
      const snap = await getDocs(q);
      setPsychologists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F0FF' }}>
      <ActivityIndicator size="large" color="#5B2D8E" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F0FF' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Psicólogos disponibles</Text>
      </View>

      {psychologists.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={{ color: '#9B8FAF', fontSize: 16, marginTop: 12 }}>No hay psicólogos disponibles aún</Text>
        </View>
      ) : (
        <FlatList
          data={psychologists}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={{ fontSize: 28 }}>🩺</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.psyName}>{item.name}</Text>
                  <Text style={styles.psySpecialty}>{item.specialty || 'Psicología General'}</Text>
                  <Text style={styles.psyLicense}>Lic. {item.license}</Text>
                </View>
              </View>
              {item.bio ? <Text style={styles.bio}>{item.bio}</Text> : null}
              <View style={styles.infoRow}>
                <View style={styles.infoBadge}>
                  <Text style={styles.infoBadgeText}>⭐ 4.9</Text>
                </View>
                <View style={styles.infoBadge}>
                  <Text style={styles.infoBadgeText}>🕐 {item.experience || '3'} años exp.</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Booking', { psychologist: item })}
                style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Agendar sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, elevation: 4, shadowColor: '#5B2D8E', shadowOpacity: 0.1, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', gap: 14, marginBottom: 12, alignItems: 'center' },
  avatar: { backgroundColor: '#EDE0FF', borderRadius: 20, width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  psyName: { fontSize: 17, fontWeight: '800', color: '#1A0A2E' },
  psySpecialty: { fontSize: 13, color: '#5B2D8E', fontWeight: '600', marginTop: 2 },
  psyLicense: { fontSize: 11, color: '#9B8FAF', marginTop: 2 },
  bio: { fontSize: 13, color: '#5A4A6B', lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  infoBadge: { backgroundColor: '#F7F0FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  infoBadgeText: { fontSize: 12, color: '#5A4A6B', fontWeight: '600' },
  bookBtn: { backgroundColor: '#5B2D8E', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 4 },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});