import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function AdminUsersScreen({ route, navigation }) {
  const { filter } = route.params;
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState(filter || 'psychologists');

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    Alert.alert('Aprobado', 'Psicólogo aprobado exitosamente');
    load();
  };

  const deleteUser = (id, name) => {
    Alert.alert('Eliminar cuenta', `¿Eliminar a ${name}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', id));
        load();
      }},
    ]);
  };

  const TABS = [
    { key: 'pending',       label: 'Pendientes'  },
    { key: 'psychologists', label: 'Psicólogos'  },
    { key: 'patients',      label: 'Pacientes'   },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="happy" size={100} />
          <Text style={styles.emptyTitle}>
            {tab === 'pending' ? 'Sin solicitudes pendientes' : 'Sin usuarios aquí'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: u }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.userAvatar}>
                  <MindCharacter mood={u.role === 'psychologist' ? 'happy' : 'calm'} size={52} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  {u.role === 'psychologist' && (
                    <Text style={styles.userSpecialty}>
                      {u.specialty} · Lic. {u.license}
                    </Text>
                  )}
                </View>
                <View style={[styles.badge,
                  { backgroundColor: u.approved ? colors.happyBg : colors.anxiousBg }]}>
                  <Text style={[styles.badgeText,
                    { color: u.approved ? colors.happy : colors.anxious }]}>
                    {u.approved ? 'Activo' : 'Pendiente'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                {tab === 'pending' && (
                  <TouchableOpacity
                    onPress={() => approvePsy(u.id)}
                    style={styles.approveBtn}>
                    <Text style={styles.approveBtnText}>Aprobar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => deleteUser(u.id, u.name)}
                  style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
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

  tabs: {
    flexDirection: 'row', margin: 20,
    backgroundColor: colors.white,
    borderRadius: radius.md, padding: 4,
    ...shadow.card,
  },
  tab: { flex: 1, padding: 9, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.navy },
  tabText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  tabTextActive: { color: '#fff', fontFamily: fonts.bold },

  list: { paddingHorizontal: 20, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16, gap: 12,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: colors.soft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  userName:      { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  userEmail:     { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  userSpecialty: { fontFamily: fonts.medium, fontSize: 11, color: colors.lilac, marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.bold, fontSize: 10 },

  cardActions: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1, backgroundColor: colors.happy,
    borderRadius: radius.full, padding: 10, alignItems: 'center',
  },
  approveBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  deleteBtn: {
    borderWidth: 1.5, borderColor: colors.error,
    borderRadius: radius.full, padding: 10,
    paddingHorizontal: 16, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.error },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.navy, textAlign: 'center' },
});