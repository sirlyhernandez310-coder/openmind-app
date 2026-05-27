import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function PsySessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  const load = async () => {
    setLoading(true);
    const q = query(collection(db, 'sessions'), where('psychologistId', '==', auth.currentUser.uid));
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => new Date(a.date) - new Date(b.date));
    setSessions(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const confirm = async (id) => {
    await updateDoc(doc(db, 'sessions', id), { status: 'confirmed' });
    load();
  };

  const now = new Date();
  const filtered = sessions.filter(s => {
    const d = new Date(s.date);
    if (tab === 'upcoming') return d >= now && s.status !== 'cancelled';
    return d < now || s.status === 'cancelled';
  });

  const statusColors = { confirmed: '#22C55E', pending: '#F59E0B', cancelled: '#EF4444' };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F0FF' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todas mis sesiones</Text>
      </View>

      <View style={styles.tabs}>
        {['upcoming', 'past'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'upcoming' ? 'Próximas' : 'Pasadas'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#5B2D8E" style={{ marginTop: 40 }} /> :
        <FlatList data={filtered} keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={{ color: '#9B8FAF', marginTop: 10 }}>Sin sesiones {tab === 'upcoming' ? 'próximas' : 'pasadas'}</Text>
            </View>
          )}
          renderItem={({ item: s }) => (
            <View style={[styles.card, { borderLeftColor: statusColors[s.status] }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientLabel}>Paciente</Text>
                  <Text style={styles.date}>📅 {new Date(s.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                  <Text style={styles.time}>🕐 {s.time}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColors[s.status] + '22', borderColor: statusColors[s.status] }]}>
                  <Text style={[{ fontSize: 11, fontWeight: '700' }, { color: statusColors[s.status] }]}>{s.status}</Text>
                </View>
              </View>
              {s.videoRoom && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('VideoCall', { room: s.videoRoom })}
                  style={styles.videoBtn}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>🎥 Unirse a videollamada</Text>
                </TouchableOpacity>
              )}
              {s.status === 'pending' && tab === 'upcoming' && (
                <TouchableOpacity onPress={() => confirm(s.id)} style={styles.confirmBtn}>
                  <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 13 }}>✅ Confirmar sesión</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 4, elevation: 2 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#5B2D8E' },
  tabText: { fontWeight: '700', color: '#9B8FAF' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 4, elevation: 2 },
  patientLabel: { fontSize: 11, color: '#9B8FAF', fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 13, color: '#1A0A2E', fontWeight: '600', textTransform: 'capitalize' },
  time: { fontSize: 13, color: '#5A4A6B', marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, height: 28, justifyContent: 'center' },
  videoBtn: { backgroundColor: '#5B2D8E', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 12 },
  confirmBtn: { borderWidth: 1.5, borderColor: '#22C55E', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8 },
});