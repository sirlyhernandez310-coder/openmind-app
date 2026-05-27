import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';

export default function AdminHomeScreen({ navigation }) {
  const [stats, setStats] = useState({ patients: 0, psychologists: 0, pendingPsy: 0, sessions: 0, tests: 0 });

  useEffect(() => {
    const load = async () => {
      const users = await getDocs(collection(db, 'users'));
      const allUsers = users.docs.map(d => d.data());
      const sessions = await getDocs(collection(db, 'sessions'));
      const tests = await getDocs(collection(db, 'emotional_tests'));
      setStats({
        patients:     allUsers.filter(u => u.role === 'patient').length,
        psychologists: allUsers.filter(u => u.role === 'psychologist' && u.approved).length,
        pendingPsy:   allUsers.filter(u => u.role === 'psychologist' && !u.approved).length,
        sessions:     sessions.size,
        tests:        tests.size,
      });
    };
    load();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de Control 🛡️</Text>
          <Text style={styles.name}>Administrador</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Alerta de psicólogos pendientes */}
      {stats.pendingPsy > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminUsers', { filter: 'pending' })}
          style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {stats.pendingPsy} psicólogo{stats.pendingPsy > 1 ? 's' : ''} esperando aprobación</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Revisar →</Text>
        </TouchableOpacity>
      )}

      {/* Stats grid */}
      <Text style={styles.sectionTitle}>Resumen general</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Pacientes',       value: stats.patients,       emoji: '🧑', color: '#EDE0FF' },
          { label: 'Psicólogos',      value: stats.psychologists,  emoji: '🩺', color: '#D1FAE5' },
          { label: 'Pendientes',      value: stats.pendingPsy,     emoji: '⏳', color: '#FEF3C7' },
          { label: 'Sesiones',        value: stats.sessions,       emoji: '📅', color: '#E0F2FF' },
          { label: 'Tests hechos',    value: stats.tests,          emoji: '🧠', color: '#FFE0E8' },
          { label: 'Total usuarios',  value: stats.patients + stats.psychologists + stats.pendingPsy, emoji: '👥', color: '#F0F0FF' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.color }]}>
            <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Acciones */}
      <Text style={styles.sectionTitle}>Gestión</Text>
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {[
          { emoji: '🩺', title: 'Gestionar psicólogos',    sub: 'Aprobar, ver y eliminar cuentas',          screen: 'AdminUsers',  params: { filter: 'psychologists' } },
          { emoji: '🧑', title: 'Ver pacientes',           sub: 'Lista completa de pacientes',               screen: 'AdminUsers',  params: { filter: 'patients' } },
          { emoji: '📊', title: 'Estadísticas',            sub: 'Reportes de uso de la plataforma',          screen: 'AdminStats',  params: {} },
          { emoji: '⏳', title: 'Aprobar psicólogos',      sub: `${stats.pendingPsy} solicitudes pendientes`, screen: 'AdminUsers', params: { filter: 'pending' } },
        ].map(item => (
          <TouchableOpacity key={item.title}
            onPress={() => navigation.navigate(item.screen, item.params)}
            style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSub}>{item.sub}</Text>
            </View>
            <Text style={{ color: '#9B8FAF', fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#1A0A2E', padding: 24, paddingTop: 56, paddingBottom: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  name: { color: '#FFD93D', fontSize: 26, fontWeight: '900', marginTop: 4 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 },
  alertBanner: { backgroundColor: '#F59E0B', margin: 16, marginTop: -16, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A0A2E', margin: 16, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginHorizontal: 6 },
  statCard: { width: '30%', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, elevation: 2, flex: 1, minWidth: '28%' },
  statValue: { fontSize: 26, fontWeight: '900', color: '#1A0A2E' },
  statLabel: { fontSize: 10, color: '#5A4A6B', fontWeight: '600', textAlign: 'center' },
  actionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 3 },
  actionIcon: { backgroundColor: '#F7F0FF', borderRadius: 14, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '800', color: '#1A0A2E' },
  actionSub: { fontSize: 12, color: '#9B8FAF', marginTop: 2 },
});