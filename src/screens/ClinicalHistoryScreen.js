import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function ClinicalHistoryScreen({ navigation }) {
  const [patients, setPatients]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      const sessSnap = await getDocs(
        query(collection(db, 'sessions'),
          where('psychologistId', '==', auth.currentUser.uid))
      );
      const patientIds = [...new Set(sessSnap.docs.map(d => d.data().patientId))];
      const patientData = [];

      for (const pid of patientIds) {
        const userSnap = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', pid))
        );
        if (!userSnap.empty) {
          const u = userSnap.docs[0];
          const histSnap = await getDocs(
            query(collection(db, 'clinical_history'),
              where('patientId', '==', pid),
              where('psychologistId', '==', auth.currentUser.uid))
          );
          const patientSessions = sessSnap.docs
            .filter(d => d.data().patientId === pid)
            .map(d => d.data())
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          patientData.push({
            id: u.id,
            ...u.data(),
            historyCount:  histSnap.size,
            lastSession:   patientSessions[0] || null,
            totalSessions: patientSessions.length,
          });
        }
      }
      setPatients(patientData);
      setFiltered(patientData);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    setFiltered(patients.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, patients]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Historias clínicas</Text>
          <Text style={styles.headerSub}>{patients.length} paciente{patients.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Buscador */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar paciente..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="calm" size={100} />
          <Text style={styles.emptyTitle}>
            {search ? 'Sin resultados' : 'Aún no tienes pacientes'}
          </Text>
          <Text style={styles.emptySub}>
            {search
              ? 'Intenta con otro nombre o correo'
              : 'Los pacientes aparecerán cuando tengas sesiones agendadas'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClinicalHistoryDetail', { patient: p })}
              style={styles.card}
              activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={styles.avatarWrap}>
                  <MindCharacter mood="calm" size={56} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientEmail}>{p.email}</Text>
                  <View style={styles.chipsRow}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {p.totalSessions} sesión{p.totalSessions !== 1 ? 'es' : ''}
                      </Text>
                    </View>
                    <View style={[styles.chip,
                      { backgroundColor: p.historyCount > 0 ? colors.happyBg : colors.soft }]}>
                      <Text style={[styles.chipText,
                        { color: p.historyCount > 0 ? colors.happy : colors.muted }]}>
                        {p.historyCount} entrada{p.historyCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
              {p.lastSession && (
                <Text style={styles.lastSession}>
                  Última sesión: {new Date(p.lastSession.date).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#fff', textAlign: 'center' },
  headerSub:   { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white,
    marginHorizontal: 20, marginTop: 16,
    borderRadius: radius.md, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: 'rgba(123,113,153,0.12)',
    ...shadow.card,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex: 1, fontFamily: fonts.regular,
    fontSize: 14, color: colors.navy, paddingVertical: 13,
  },

  list: { padding: 20, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg, padding: 16,
    gap: 10, ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  patientName:  { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  patientEmail: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  chipsRow:     { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.soft,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 11, color: colors.lilac },
  arrow: { fontSize: 22, color: colors.muted },
  lastSession: {
    fontFamily: fonts.regular, fontSize: 11, color: colors.muted,
    borderTopWidth: 1, borderTopColor: colors.soft,
    paddingTop: 8, textTransform: 'capitalize',
  },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.navy, textAlign: 'center' },
  emptySub:   { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});