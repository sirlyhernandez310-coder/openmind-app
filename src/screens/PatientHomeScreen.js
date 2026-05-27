import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function PatientHomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [nextSession, setNextSession] = useState(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setUserData(snap.data());

      const q = query(
        collection(db, 'sessions'),
        where('patientId', '==', auth.currentUser.uid),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const sessions = await getDocs(q);
      const list = sessions.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (list.length > 0) setNextSession(list[0]);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.name}>{userData?.name?.split(' ')[0] || 'Usuario'}</Text>
          <Text style={styles.subtitle}>¿Cómo te sientes hoy?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Próxima sesión */}
      {nextSession && (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionCardTitle}>📅 Próxima sesión</Text>
          <Text style={styles.sessionCardPsy}>Psic. {nextSession.psychologistName}</Text>
          <Text style={styles.sessionCardDate}>
            {new Date(nextSession.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })} — {nextSession.time}
          </Text>
          {nextSession.videoRoom && (
            <TouchableOpacity
              onPress={() => navigation.navigate('VideoCall', { room: nextSession.videoRoom })}
              style={styles.joinVideoBtn}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>🎥 Unirse a videollamada</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botón emergencia */}
      <TouchableOpacity
        onPress={() => navigation.navigate('EmergencyChat')}
        style={styles.emergencyBtn}>
        <Text style={styles.emergencyBtnText}>🆘  Chat de Emergencia con Psicólogo</Text>
      </TouchableOpacity>

      {/* Acciones */}
      <Text style={styles.sectionTitle}>¿Qué necesitas hoy?</Text>
      <View style={styles.grid}>
       {[
  { emoji: '🔍', label: 'Buscar\nPsicólogo', screen: 'Psychologists', color: '#EDE0FF' },
  { emoji: '📅', label: 'Mis\nSesiones',    screen: 'Sessions',       color: '#E0F2FF' },
  { emoji: '🧠', label: 'Test\nEmocional',  screen: 'EmotionalTest',  color: '#FFF0D6' },
  { emoji: '📊', label: 'Mi\nHistorial',    screen: 'TestHistory',    color: '#E0FFE8' },
  { emoji: '💬', label: 'Emergencia',       screen: 'EmergencyChat',  color: '#FFE0E0' },
  { emoji: '👤', label: 'Mi\nPerfil',       screen: 'Profile',        color: '#F0E0FF' },
].map(item => (
  <TouchableOpacity key={item.screen}
    onPress={() => navigation.navigate(item.screen)}
    style={[styles.actionCard, { backgroundColor: item.color }]}>
    <Text style={{ fontSize: 34 }}>{item.emoji}</Text>
    <Text style={styles.actionLabel}>{item.label}</Text>
  </TouchableOpacity>
))}
      </View>

      {/* Tips de bienestar */}
      <Text style={styles.sectionTitle}>💡 Tip del día</Text>
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          "Dedica 5 minutos a respirar profundo hoy. Inhala 4 segundos, mantén 4, exhala 4. Tu mente te lo agradecerá."
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F0FF' },
  header: { backgroundColor: '#5B2D8E', padding: 24, paddingTop: 56, paddingBottom: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  name: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 },
  sessionCard: { backgroundColor: '#fff', margin: 16, marginTop: -16, borderRadius: 20, padding: 20, elevation: 6, shadowColor: '#5B2D8E', shadowOpacity: 0.15, shadowRadius: 12 },
  sessionCardTitle: { fontSize: 12, fontWeight: '700', color: '#9B8FAF', marginBottom: 6 },
  sessionCardPsy: { fontSize: 18, fontWeight: '900', color: '#1A0A2E' },
  sessionCardDate: { fontSize: 13, color: '#5A4A6B', marginTop: 4, textTransform: 'capitalize' },
  joinVideoBtn: { backgroundColor: '#5B2D8E', borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 12 },
  emergencyBtn: { backgroundColor: '#FF5252', marginHorizontal: 16, marginBottom: 8, borderRadius: 16, padding: 18, alignItems: 'center', elevation: 6, shadowColor: '#FF5252', shadowOpacity: 0.4, shadowRadius: 12 },
  emergencyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A0A2E', margin: 16, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginHorizontal: 6 },
  actionCard: { width: '47%', borderRadius: 18, padding: 18, alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#1A0A2E', textAlign: 'center' },
  tipCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 18, borderLeftWidth: 4, borderLeftColor: '#5B2D8E' },
  tipText: { fontSize: 14, color: '#5A4A6B', lineHeight: 22, fontStyle: 'italic' },
});
