import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, StyleSheet
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { LogoIcon } from '../components/Logo';
import { colors, fonts, radius, shadow } from '../theme';

export default function AdminHomeScreen({ navigation }) {
  const [stats, setStats] = useState({
    patients: 0, psychologists: 0,
    pendingPsy: 0, sessions: 0, tests: 0,
  });

  useEffect(() => {
    const load = async () => {
      const users    = await getDocs(collection(db, 'users'));
      const sessions = await getDocs(collection(db, 'sessions'));
      const tests    = await getDocs(collection(db, 'emotional_tests'));
      const all = users.docs.map(d => d.data());
      setStats({
        patients:      all.filter(u => u.role === 'patient').length,
        psychologists: all.filter(u => u.role === 'psychologist' && u.approved).length,
        pendingPsy:    all.filter(u => u.role === 'psychologist' && !u.approved).length,
        sessions:      sessions.size,
        tests:         tests.size,
      });
    };
    load();
  }, []);

  const ACTIONS = [
    { label: 'Psicólogos',       sub: 'Ver y aprobar',           key: 'AdminUsers', params: { filter: 'psychologists' }, mood: 'happy'   },
    { label: 'Pacientes',        sub: 'Ver todos',               key: 'AdminUsers', params: { filter: 'patients'      }, mood: 'calm'    },
    { label: 'Pendientes',       sub: `${stats.pendingPsy} por aprobar`, key: 'AdminUsers', params: { filter: 'pending' }, mood: 'anxious' },
    { label: 'Estadísticas',     sub: 'Reportes de uso',         key: 'AdminStats', params: {},                           mood: 'calm'    },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de control</Text>
          <Text style={styles.title}>Administrador</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <LogoIcon size={42} dark />
        </TouchableOpacity>
      </View>

      {/* Alerta pendientes */}
      {stats.pendingPsy > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminUsers', { filter: 'pending' })}
          style={styles.alertBanner}>
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>
            {stats.pendingPsy} psicólogo{stats.pendingPsy > 1 ? 's' : ''} esperando aprobación
          </Text>
          <Text style={styles.alertArrow}>›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.body}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Pacientes',   value: stats.patients,      bg: colors.soft      },
            { label: 'Psicólogos',  value: stats.psychologists, bg: colors.happyBg   },
            { label: 'Pendientes',  value: stats.pendingPsy,    bg: colors.anxiousBg },
            { label: 'Sesiones',    value: stats.sessions,      bg: '#E8F0FE'        },
            { label: 'Tests',       value: stats.tests,         bg: colors.calmBg    },
            { label: 'Total',       value: stats.patients + stats.psychologists + stats.pendingPsy, bg: colors.soft },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Acciones */}
        <Text style={styles.sectionTitle}>Gestión</Text>
        {ACTIONS.map(a => (
          <TouchableOpacity
            key={a.label}
            onPress={() => navigation.navigate(a.key, a.params)}
            style={styles.actionCard}>
            <View style={styles.actionAvatar}>
              <MindCharacter mood={a.mood} size={48} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.lilac, marginTop: 4 },

  alertBanner: {
    backgroundColor: colors.anxiousBg,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(244,166,66,0.3)',
  },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.anxious },
  alertText: { fontFamily: fonts.medium, fontSize: 13, color: colors.anxious, flex: 1 },
  alertArrow: { fontSize: 18, color: colors.anxious },

  body: { padding: 20, gap: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', flex: 1, minWidth: '28%',
    borderRadius: radius.md,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy },
  statLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: 'center' },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },

  actionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadow.card,
  },
  actionAvatar: {
    width: 56, height: 56,
    borderRadius: 18,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  actionSub:   { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  actionArrow: { fontSize: 22, color: colors.muted },
});