import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function AdminUsersScreen({ route, navigation }) {
  const { filter } = route.params;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(filter || 'psychologists');

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'users'));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setUsers(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    if (tab === 'pending')       return u.role === 'psychologist' && !u.approved;
    if (tab === 'psychologists') return u.role === 'psychologist' && u.approved;
    if (tab === 'patients')      return u.role === 'patient';
    return true;
  });

  const approvePsy = async (id) => {
    await updateDoc(doc(db, 'users', id), { approved: true });
    Alert.alert('✅ Psicólogo aprobado');
    load();
  };

  const deleteUser = (id, name) => {
    Alert.alert('Eliminar cuenta', `¿Seguro que quieres eliminar a ${name}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', id));
        load();
      }},
    ]);
  };

  const TABS = [
    { key: 'pending',        label: '⏳ Pendientes' },
    { key: 'psychologists',  label: '🩺 Psicólogos' },
    { key: 'patients',       label: '🧑 Pacientes' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F0FF' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#FFD93D', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de usuarios</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5B2D8E" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={{ color: '#9B8FAF', marginTop: 12, fontSize: 15 }}>
            {tab === 'pending' ? 'No hay psicólogos pendientes' : 'Sin usuarios en esta categoría'}
          </Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item: u }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <View style={styles.avatar}>
                  <Text style={{ fontSize: 24 }}>{u.role === 'psychologist' ? '🩺' : '🧑'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  {u.role === 'psychologist' && (
                    <Text style={styles.userSpecialty}>{u.specialty} · Lic. {u.license}</Text>
                  )}
                </View>
                <View style={[styles.roleBadge, { backgroundColor: u.role === 'psychologist' ? '#EDE0FF' : '#E0F2FF' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#5B2D8E' }}>
                    {u.approved ? '✅ Activo' : '⏳ Pendiente'}
                  </Text>
                </View>
              </View>

              <Text style={styles.infoLine}>
                📅 Registrado: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}
              </Text>

              <View style={styles.actionRow}>
                {tab === 'pending' && (
                  <TouchableOpacity onPress={() => approvePsy(u.id)} style={styles.approveBtn}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>✅ Aprobar psicólogo</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteUser(u.id, u.name)} style={styles.deleteBtn}>
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#1A0A2E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,0,0.15)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFD93D', fontSize: 17, fontWeight: '800' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 4, elevation: 2 },
  tab: { flex: 1, padding: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#1A0A2E' },
  tabText: { fontWeight: '700', color: '#9B8FAF', fontSize: 11 },
  tabTextActive: { color: '#FFD93D', fontSize: 11 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3 },
  avatar: { backgroundColor: '#F7F0FF', borderRadius: 20, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 15, fontWeight: '800', color: '#1A0A2E' },
  userEmail: { fontSize: 12, color: '#9B8FAF', marginTop: 2 },
  userSpecialty: { fontSize: 11, color: '#5B2D8E', fontWeight: '600', marginTop: 2 },
  roleBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  infoLine: { fontSize: 12, color: '#9B8FAF', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#22C55E', borderRadius: 10, padding: 10, alignItems: 'center' },
  deleteBtn: { borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 10, padding: 10, paddingHorizontal: 16, alignItems: 'center' },
});