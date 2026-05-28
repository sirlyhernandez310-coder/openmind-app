import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

function getResultInfo(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return { mood: 'happy',   color: colors.happy,   label: 'Excelente' };
  if (pct >= 60) return { mood: 'calm',    color: colors.calm,    label: 'Moderado'  };
  if (pct >= 40) return { mood: 'sad',     color: colors.sad,     label: 'Necesita apoyo' };
  return           { mood: 'anxious', color: colors.anxious, label: 'Prioritario' };
}

export default function TestHistoryScreen({ navigation }) {
  const [tests, setTests]   = useState([]);
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
      } catch (e) { console.log(e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial emocional</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : tests.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="calm" size={110} />
          <Text style={styles.emptyTitle}>Aún no tienes tests</Text>
          <Text style={styles.emptySub}>Completa tu primer test emocional para ver tu evolución aquí</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('EmotionalTest')}
            style={styles.startBtn}>
            <Text style={styles.startBtnText}>Hacer mi primer test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>Tu evolución</Text>
              <Text style={styles.trendSub}>{tests.length} test{tests.length !== 1 ? 's' : ''} realizados</Text>
              <View style={styles.trendBars}>
                {tests.slice(0, 7).reverse().map((t, i) => {
                  const pct = (t.score / t.maxScore) * 100;
                  const { color } = getResultInfo(t.score, t.maxScore);
                  return (
                    <View key={i} style={styles.trendBarWrap}>
                      <View style={[styles.trendBar, {
                        height: Math.max(16, pct * 0.7),
                        backgroundColor: color,
                      }]} />
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          renderItem={({ item: t, index }) => {
            const { mood, color, label } = getResultInfo(t.score, t.maxScore);
            const pct = Math.round((t.score / t.maxScore) * 100);
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <MindCharacter mood={mood} size={56} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardIndex}>
                    {index === 0 ? 'Más reciente' : `Test #${tests.length - index}`}
                  </Text>
                  <Text style={[styles.cardLabel, { color }]}>{label}</Text>
                  <Text style={styles.cardDate}>
                    {new Date(t.createdAt).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </Text>
                  <View style={styles.cardBarBg}>
                    <View style={[styles.cardBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.scoreText, { color }]}>{pct}%</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('EmotionalTest')}
        style={styles.fab}>
        <Text style={styles.fabText}>+ Nuevo test</Text>
      </TouchableOpacity>
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
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#fff' },

  list: { padding: 20, gap: 12, paddingBottom: 100 },

  trendCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 8,
  },
  trendTitle: { fontFamily: fonts.serif, fontSize: 18, color: '#fff', marginBottom: 2 },
  trendSub:   { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16 },
  trendBars:  { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
  trendBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  trendBar:   { width: '100%', borderRadius: 4, minHeight: 8 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  cardLeft: {
    width: 60, height: 60,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardIndex: { fontFamily: fonts.bold, fontSize: 10, color: colors.muted, letterSpacing: 0.5, marginBottom: 2 },
  cardLabel: { fontFamily: fonts.bold, fontSize: 15 },
  cardDate:  { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  cardBarBg: { height: 6, backgroundColor: colors.soft, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  cardBarFill: { height: 6, borderRadius: 3 },
  scoreBadge: { borderRadius: radius.md, padding: 10, alignItems: 'center', justifyContent: 'center' },
  scoreText:  { fontFamily: fonts.bold, fontSize: 16 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  emptySub:   { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  startBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 28,
    paddingVertical: 15,
    marginTop: 8,
    ...shadow.strong,
  },
  startBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },

  fab: {
    position: 'absolute',
    bottom: 24, right: 24,
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...shadow.strong,
  },
  fabText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
});