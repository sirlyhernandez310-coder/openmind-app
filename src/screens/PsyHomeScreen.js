import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function PsyHomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) setUserData(snap.data());

    const q = query(collection(db, 'sessions'), where('psychologistId', '==', auth.currentUser.uid), where('status', 'in', ['pending', 'confirmed']));
    const sSnap = await getDocs(q);
    const list = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
    setSessions(list.slice(0, 3));
  };

  useEffect(() => { load(); }, []);

  const confirmSession = async (id) => {
    await updateDoc(doc(db, 'sessions', id), { status: 'confirmed' });
    Alert.alert('✅ Sesión confirmada');
    load();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel del Profesional 🩺</Text>
          <Text style={styles.name}>Dr(a). {userData?.name?.split(' ')[0]}</Text>
          <Text style={styles.specialty}>{userData?.specialty}</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[{ label: 'Sesiones hoy', value: sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length, emoji: '📅' },
          { label: 'Pendientes', value: sessions.filter(s => s.status === 'pending').length, emoji: '⏳' },
          { label: 'Confirmadas', value: sessions.filter(s => s.status === 'confirmed').length, emoji: '✅' }
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={{ fontSize: 24 }}>{stat.emoji}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Botón emergencia */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PsyEmergencyChat')}
        style={styles.emergencyBtn}>
        <Text style={styles.emergencyBtnText}>🆘 Atender Chat de Emergencia</Text>
      </TouchableOpacity>

      {/* Próximas sesiones */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8 }}>
        <Text style={styles.sectionTitle}>Próximas sesiones</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PsySessions')}>
          <Text style={{ color: '#5B2D8E', fontWeight: '700', fontSize: 13 }}>Ver todas →</Text>
        </TouchableOpacity>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40 }}>🎉</Text>
          <Text style={{ color: '#9B8FAF', marginTop: 8 }}>No tienes sesiones pendientes</Text>
        </View>
      ) : sessions.map(s => (
        <View key={s.id} style={styles.sessionCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>Paciente registrado</Text>
            <Text style={styles.sessionDate}>
              📅 {new Date(s.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} — 🕐 {s.time}
            </Text>
            {s.videoRoom && (
              <TouchableOpacity
                onPress={() => navigation.navigate('VideoCall', { room: s.videoRoom })}
                style={styles.videoChip}>
                <Text style={{ color: '#5B2D8E', fontSize: 11, fontWeight: '700' }}>🎥 Unirse al video</Text>
              </TouchableOpacity>
            )}
          </View>
          {s.status === 'pending' && (
            <TouchableOpacity onPress={() => confirmSession(s.id)} style={styles.confirmBtn}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', padding: 24, paddingTop: 56, paddingBottom: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
  specialty: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 },
  statsRow: { flexDirection: 'row', gap: 10, margin: 16, marginTop: -16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, elevation: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1A0A2E' },
  statLabel: { fontSize: 10, color: '#9B8FAF', fontWeight: '600', textAlign: 'center' },
  emergencyBtn: { backgroundColor: '#FF5252', marginHorizontal: 16, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 5, shadowColor: '#FF5252', shadowOpacity: 0.4, shadowRadius: 10 },
  emergencyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A0A2E', marginVertical: 8 },
  sessionCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#5B2D8E', elevation: 2 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1A0A2E' },
  sessionDate: { fontSize: 12, color: '#5A4A6B', marginTop: 3, textTransform: 'capitalize' },
  videoChip: { backgroundColor: '#EDE0FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start' },
  confirmBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  emptyCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 30, alignItems: 'center', elevation: 2 },
});