import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function AdminStatsScreen({ navigation }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [uSnap, sSnap, tSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'emotional_tests')),
      ]);
      const users    = uSnap.docs.map(d => d.data());
      const sessions = sSnap.docs.map(d => d.data());
      const tests    = tSnap.docs.map(d => d.data());
      const avgScore = tests.length > 0
        ? Math.round(tests.reduce((a, t) => a + (t.score / t.maxScore) * 100, 0) / tests.length)
        : 0;
      setData({
        users, sessions, tests, avgScore,
        sessionsByStatus: {
          confirmed: sessions.filter(s => s.status === 'confirmed').length,
          pending:   sessions.filter(s => s.status === 'pending').length,
          cancelled: sessions.filter(s => s.status === 'cancelled').length,
        },
        resultDist: {
          excelente: tests.filter(t => (t.score / t.maxScore) >= 0.8).length,
          moderado:  tests.filter(t => (t.score / t.maxScore) >= 0.6 && (t.score / t.maxScore) < 0.8).length,
          necesita:  tests.filter(t => (t.score / t.maxScore) >= 0.4 && (t.score / t.maxScore) < 0.6).length,
          critico:   tests.filter(t => (t.score / t.maxScore) < 0.4).length,
        },
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.lilac} />
    </View>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>

        {/* Usuarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuarios</Text>
          <View style={styles.row}>
            {[
              { label: 'Pacientes',  value: data.users.filter(u => u.role === 'patient').length,                   color: colors.soft      },
              { label: 'Psicólogos', value: data.users.filter(u => u.role === 'psychologist' && u.approved).length, color: colors.happyBg  },
              { label: 'Pendientes', value: data.users.filter(u => u.role === 'psychologist' && !u.approved).length,color: colors.anxiousBg },
            ].map(s => (
              <View key={s.label} style={[styles.miniStat, { backgroundColor: s.color }]}>
                <Text style={styles.miniStatValue}>{s.value}</Text>
                <Text style={styles.miniStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sesiones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sesiones — {data.sessions.length} total</Text>
          {[
            { label: 'Confirmadas', value: data.sessionsByStatus.confirmed, color: colors.happy   },
            { label: 'Pendientes',  value: data.sessionsByStatus.pending,   color: colors.anxious },
            { label: 'Canceladas',  value: data.sessionsByStatus.cancelled, color: colors.error   },
          ].map(s => (
            <View key={s.label} style={styles.barRow}>
              <Text style={styles.barLabel}>{s.label}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: data.sessions.length > 0
                    ? `${(s.value / data.sessions.length) * 100}%`
                    : '0%',
                  backgroundColor: s.color,
                }]} />
              </View>
              <Text style={[styles.barValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests emocionales — {data.tests.length} total</Text>

          <View style={styles.avgWrap}>
            <MindCharacter
              mood={data.avgScore >= 80 ? 'happy' : data.avgScore >= 60 ? 'calm' : data.avgScore >= 40 ? 'sad' : 'anxious'}
              size={80}
            />
            <Text style={styles.avgValue}>{data.avgScore}%</Text>
            <Text style={styles.avgLabel}>Bienestar promedio de pacientes</Text>
          </View>

          {[
            { label: 'Excelente',       value: data.resultDist.excelente, color: colors.happy   },
            { label: 'Moderado',        value: data.resultDist.moderado,  color: colors.calm    },
            { label: 'Necesita apoyo',  value: data.resultDist.necesita,  color: colors.sad     },
            { label: 'Prioritario',     value: data.resultDist.critico,   color: colors.anxious },
          ].map(s => (
            <View key={s.label} style={styles.barRow}>
              <Text style={[styles.barLabel, { width: 120 }]}>{s.label}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: data.tests.length > 0
                    ? `${(s.value / data.tests.length) * 100}%`
                    : '0%',
                  backgroundColor: s.color,
                }]} />
              </View>
              <Text style={[styles.barValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

      </View>
    </ScrollView>
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
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#fff' },

  body: { padding: 20, gap: 16 },

  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 18, gap: 12,
    ...shadow.card,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy },

  row: { flexDirection: 'row', gap: 10 },
  miniStat: { flex: 1, borderRadius: radius.md, padding: 14, alignItems: 'center', gap: 4 },
  miniStatValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  miniStatLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: 'center' },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, width: 90 },
  barBg: { flex: 1, height: 10, backgroundColor: colors.soft, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  barValue: { fontFamily: fonts.bold, fontSize: 13, width: 28, textAlign: 'right' },

  avgWrap: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  avgValue: { fontFamily: fonts.serif, fontSize: 48, color: colors.navy },
  avgLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center' },
});