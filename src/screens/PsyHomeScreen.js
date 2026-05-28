import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { LogoIcon } from '../components/Logo';
import { colors, fonts, radius, shadow } from '../theme';

export default function PsyHomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) setUserData(snap.data());
    const q = query(
      collection(db, 'sessions'),
      where('psychologistId', '==', auth.currentUser.uid),
      where('status', 'in', ['pending', 'confirmed'])
    );
    const sSnap = await getDocs(q);
    const list = sSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    setSessions(list);
  };

  useEffect(() => { load(); }, []);

  const confirmSession = async (id) => {
    await updateDoc(doc(db, 'sessions', id), { status: 'confirmed' });
    load();
  };

  const today = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const pending = sessions.filter(s => s.status === 'pending');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Panel profesional</Text>
              <Text style={styles.userName}>
                {userData?.name?.split(' ')[0] || 'Doctor/a'}
              </Text>
              <Text style={styles.specialty}>{userData?.specialty}</Text>
            </View>
            <TouchableOpacity onPress={() => signOut(auth)}>
              <LogoIcon size={42} dark />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Hoy',        value: today.length       },
              { label: 'Pendientes', value: pending.length      },
              { label: 'Total',      value: sessions.length     },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>

          {/* Emergencia */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PsyEmergencyChat')}
            style={styles.emergencyBtn}>
            <View style={styles.emergencyDot} />
            <Text style={styles.emergencyText}>Atender chat de emergencia</Text>
            <Text style={styles.emergencyArrow}>›</Text>
          </TouchableOpacity>

          {/* Acciones rápidas */}
          <View style={styles.actionsRow}>
            {[
              { label: 'Sesiones',   key: 'PsySessions',    bg: colors.soft    },
              { label: 'Historias',  key: 'ClinicalHistory',bg: colors.happyBg },
            ].map(a => (
              <TouchableOpacity
                key={a.key}
                onPress={() => navigation.navigate(a.key)}
                style={[styles.actionCard, { backgroundColor: a.bg }]}>
                <MindCharacter mood={a.key === 'PsySessions' ? 'calm' : 'happy'} size={56} />
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Próximas sesiones */}
          <Text style={styles.sectionTitle}>Próximas sesiones</Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <MindCharacter mood="calm" size={80} />
              <Text style={styles.emptyText}>No tienes sesiones pendientes</Text>
            </View>
          ) : (
            sessions.slice(0, 4).map(s => (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[styles.sessionAccent, {
                  backgroundColor: s.status === 'confirmed' ? colors.happyBg : colors.soft
                }]}>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionPatient}>Paciente</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(s.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.time}
                  </Text>
                  {s.videoRoom && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('VideoCall', { room: s.videoRoom })}
                      style={styles.videoChip}>
                      <Text style={styles.videoChipText}>Unirse al video</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {s.status === 'pending' && (
                  <TouchableOpacity onPress={() => confirmSession(s.id)} style={styles.confirmBtn}>
                    <Text style={styles.confirmBtnText}>Confirmar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('PsySessions')}
            style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Ver todas las sesiones →</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  userName: { fontFamily: fonts.serif, fontSize: 26, color: '#fff', marginTop: 4 },
  specialty: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 28, color: '#fff' },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  body: { padding: 20, gap: 14 },

  emergencyBtn: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(224,85,85,0.15)',
  },
  emergencyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  emergencyText: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, flex: 1 },
  emergencyArrow: { fontSize: 18, color: colors.error },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },

  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  sessionAccent: {
    width: 48, height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionPatient: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy },
  sessionDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  videoChip: {
    backgroundColor: colors.soft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  videoChipText: { fontFamily: fonts.bold, fontSize: 10, color: colors.lilac },
  confirmBtn: {
    backgroundColor: colors.happy,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  confirmBtnText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, textAlign: 'center' },

  seeAllBtn: { alignItems: 'center', paddingVertical: 8 },
  seeAllText: { fontFamily: fonts.medium, fontSize: 13, color: colors.lilac },
});