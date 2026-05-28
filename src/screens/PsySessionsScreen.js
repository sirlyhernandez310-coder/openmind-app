import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

const STATUS = {
  confirmed: { label: 'Confirmada', color: colors.happy   },
  pending:   { label: 'Pendiente',  color: colors.anxious },
  cancelled: { label: 'Cancelada',  color: colors.error   },
};

export default function PsySessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('upcoming');

  const load = async () => {
    setLoading(true);
    const q = query(
      collection(db, 'sessions'),
      where('psychologistId', '==', auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis sesiones</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {[['upcoming','Próximas'],['past','Pasadas']].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="calm" size={100} />
          <Text style={styles.emptyTitle}>
            Sin sesiones {tab === 'upcoming' ? 'próximas' : 'pasadas'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: s }) => {
            const st = STATUS[s.status] || STATUS.pending;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                  <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
                </View>
                <Text style={styles.patientLabel}>Paciente</Text>
                <Text style={styles.sessionDate}>
                  {new Date(s.date).toLocaleDateString('es-CO', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </Text>
                <Text style={styles.sessionTime}>{s.time}</Text>

                {s.videoRoom && s.status !== 'cancelled' && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('VideoCall', { room: s.videoRoom })}
                    style={styles.videoBtn}>
                    <Text style={styles.videoBtnText}>Unirse a videollamada</Text>
                  </TouchableOpacity>
                )}
                {s.status === 'pending' && tab === 'upcoming' && (
                  <TouchableOpacity onPress={() => confirm(s.id)} style={styles.confirmBtn}>
                    <Text style={styles.confirmBtnText}>Confirmar sesión</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#fff' },

  tabs: {
    flexDirection: 'row', margin: 20,
    backgroundColor: colors.white,
    borderRadius: radius.md, padding: 4,
    ...shadow.card,
  },
  tab: { flex: 1, padding: 10, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.navy },
  tabText: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  tabTextActive: { color: '#fff', fontFamily: fonts.bold },

  list: { paddingHorizontal: 20, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 18, gap: 6,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.5 },
  patientLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  sessionDate: {
    fontFamily: fonts.regular, fontSize: 13,
    color: colors.muted, textTransform: 'capitalize',
  },
  sessionTime: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  videoBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 12, alignItems: 'center', marginTop: 8,
  },
  videoBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  confirmBtn: {
    borderWidth: 2, borderColor: colors.happy,
    borderRadius: radius.full,
    padding: 12, alignItems: 'center', marginTop: 6,
  },
  confirmBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.happy },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.navy, textAlign: 'center' },
});