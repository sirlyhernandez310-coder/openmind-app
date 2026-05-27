import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function AdminStatsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersSnap, sessionsSnap, testsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'emotional_tests')),
      ]);
      const users    = usersSnap.docs.map(d => d.data());
      const sessions = sessionsSnap.docs.map(d => d.data());
      const tests    = testsSnap.docs.map(d => d.data());

      const avgScore = tests.length > 0
        ? Math.round(tests.reduce((a, t) => a + (t.score / t.maxScore) * 100, 0) / tests.length)
        : 0;

      const sessionsByStatus = {
        confirmed: sessions.filter(s => s.status === 'confirmed').length,
        pending:   sessions.filter(s => s.status === 'pending').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length,
      };

      const resultDistribution = {
        excelente: tests.filter(t => (t.score / t.maxScore) >= 0.8).length,
        moderado:  tests.filter(t => (t.score / t.maxScore) >= 0.6 && (t.score / t.maxScore) < 0.8).length,
        necesita:  tests.filter(t => (t.score / t.maxScore) >= 0.4 && (t.score / t.maxScore) < 0.6).length,
        critico:   tests.filter(t => (t.score / t.maxScore) < 0.4).length,
      };

      setData({ users, sessions, tests, avgScore, sessionsByStatus, resultDistribution });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F0FF' }}><ActivityIndicator size="large" color="#5B2D8E" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#FFD93D', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
      </View>

      {/* Usuarios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Usuarios</Text>
        <View style={styles.row}>
          {[
            { label: 'Pacientes',    value: data.users.filter(u => u.role === 'patient').length,                  color: '#EDE0FF' },
            { label: 'Psicólogos',  value: data.users.filter(u => u.role === 'psychologist' && u.approved).length, color: '#D1FAE5' },
            { label: 'Pendientes',  value: data.users.filter(u => u.role === 'psychologist' && !u.approved).length, color: '#FEF3C7' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.color }]}>
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sesiones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Sesiones ({data.sessions.length} total)</Text>
        {[
          { label: 'Confirmadas', value: data.sessionsByStatus.confirmed, color: '#22C55E', max: data.sessions.length },
          { label: 'Pendientes',  value: data.sessionsByStatus.pending,   color: '#F59E0B', max: data.sessions.length },
          { label: 'Canceladas',  value: data.sessionsByStatus.cancelled, color: '#EF4444', max: data.sessions.length },
        ].map(s => (
          <View key={s.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{s.label}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: s.max > 0 ? `${(s.value / s.max) * 100}%` : '0%', backgroundColor: s.color }]} />
            </View>
            <Text style={[styles.barValue, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Tests emocionales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Tests emocionales ({data.tests.length} total)</Text>
        <View style={[styles.avgCard, { backgroundColor: data.avgScore >= 80 ? '#D1FAE5' : data.avgScore >= 60 ? '#FEF3C7' : data.avgScore >= 40 ? '#FFEDD5' : '#FEE2E2' }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A4A6B', letterSpacing: 1 }}>PROMEDIO GENERAL</Text>
          <Text style={{ fontSize: 48, fontWeight: '900', color: '#1A0A2E', marginTop: 4 }}>{data.avgScore}%</Text>
          <Text style={{ fontSize: 13, color: '#5A4A6B' }}>Bienestar promedio de los pacientes</Text>
        </View>
        {[
          { label: '🌟 Excelente bienestar',  value: data.resultDistribution.excelente, color: '#22C55E' },
          { label: '🙂 Bienestar moderado',   value: data.resultDistribution.moderado,  color: '#F59E0B' },
          { label: '😟 Necesita apoyo',       value: data.resultDistribution.necesita,  color: '#F97316' },
          { label: '🆘 Atención prioritaria', value: data.resultDistribution.critico,   color: '#EF4444' },
        ].map(s => (
          <View key={s.label} style={styles.barRow}>
            <Text style={[styles.barLabel, { width: 170 }]}>{s.label}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: data.tests.length > 0 ? `${(s.value / data.tests.length) * 100}%` : '0%', backgroundColor: s.color }]} />
            </View>
            <Text style={[styles.barValue, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#1A0A2E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,0,0.15)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFD93D', fontSize: 17, fontWeight: '800' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 18, elevation: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A0A2E', marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '900', color: '#1A0A2E' },
  statLabel: { fontSize: 11, color: '#5A4A6B', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  barLabel: { fontSize: 12, color: '#5A4A6B', fontWeight: '600', width: 90 },
  barBg: { flex: 1, height: 10, backgroundColor: '#F7F0FF', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  barValue: { fontSize: 13, fontWeight: '800', width: 24, textAlign: 'right' },
  avgCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
});