import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

function getResultColor(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return { color: '#22C55E', emoji: '🌟' };
  if (pct >= 60) return { color: '#F59E0B', emoji: '🙂' };
  if (pct >= 40) return { color: '#F97316', emoji: '😟' };
  return { color: '#EF4444', emoji: '🆘' };
}

export default function TestHistoryScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'emotional_tests'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F0FF' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Historial Emocional</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5B2D8E" style={{ marginTop: 40 }} />
      ) : tests.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 52 }}>📊</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#1A0A2E', marginTop: 16, textAlign: 'center' }}>Aún no tienes tests</Text>
          <Text style={{ color: '#9B8FAF', textAlign: 'center', marginTop: 8 }}>Completa tu primer test emocional para ver tu historial aquí</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EmotionalTest')} style={styles.startBtn}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>🧠 Hacer mi primer test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          ListHeaderComponent={() => (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📈 Tu evolución</Text>
              <Text style={styles.summaryText}>{tests.length} test{tests.length !== 1 ? 's' : ''} realizados</Text>
              <View style={styles.trendRow}>
                {tests.slice(0, 7).reverse().map((t, i) => {
                  const pct = (t.score / t.maxScore) * 100;
                  const { color } = getResultColor(t.score, t.maxScore);
                  return (
                    <View key={i} style={styles.trendBarWrap}>
                      <View style={[styles.trendBar, { height: Math.max(20, pct * 0.8), backgroundColor: color }]} />
                    </View>
                  );
                })}
              </View>
              <Text style={{ fontSize: 11, color: '#9B8FAF', marginTop: 4 }}>Últimos {Math.min(tests.length, 7)} tests →</Text>
            </View>
          )}
          renderItem={({ item: t, index }) => {
            const { color, emoji } = getResultColor(t.score, t.maxScore);
            const pct = Math.round((t.score / t.maxScore) * 100);
            const date = new Date(t.createdAt);
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[styles.emojiCircle, { backgroundColor: color + '22' }]}>
                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel}>{index === 0 ? '🔵 Más reciente' : `Test #${tests.length - index}`}</Text>
                    <Text style={styles.cardResult}>{t.resultLabel}</Text>
                    <Text style={styles.cardDate}>
                      {date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: color }]}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{pct}%</Text>
                  </View>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.fabWrap}>
        <TouchableOpacity onPress={() => navigation.navigate('EmotionalTest')} style={styles.fab}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>+ Nuevo test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  summaryCard: { backgroundColor: '#5B2D8E', borderRadius: 20, padding: 20, marginBottom: 4 },
  summaryTitle: { color: '#FFD93D', fontWeight: '800', fontSize: 15, marginBottom: 2 },
  summaryText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 16 },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
  trendBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  trendBar: { width: '100%', borderRadius: 4, minHeight: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#5B2D8E', shadowOpacity: 0.08, shadowRadius: 8 },
  emojiCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#9B8FAF', letterSpacing: 0.5 },
  cardResult: { fontSize: 15, fontWeight: '800', color: '#1A0A2E', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#9B8FAF', marginTop: 2, textTransform: 'capitalize' },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  barBg: { height: 6, backgroundColor: '#EDE0FF', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  startBtn: { backgroundColor: '#5B2D8E', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 24, elevation: 4 },
  fabWrap: { position: 'absolute', bottom: 24, right: 24 },
  fab: { backgroundColor: '#5B2D8E', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, elevation: 8, shadowColor: '#5B2D8E', shadowOpacity: 0.4, shadowRadius: 12 },
});
