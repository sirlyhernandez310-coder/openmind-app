import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) { setUserData(snap.data()); setName(snap.data().name); }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre no puede estar vacío'); return; }
    setLoading(true);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { name: name.trim() });
    setUserData(prev => ({ ...prev, name: name.trim() }));
    setEditing(false);
    setLoading(false);
    Alert.alert('✅ Perfil actualizado');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={{ color: '#FFD93D', fontWeight: '700' }}>{editing ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 50 }}>{userData?.role === 'psychologist' ? '🩺' : '🧑'}</Text>
        </View>
        <Text style={styles.avatarName}>{userData?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{userData?.role === 'psychologist' ? '🩺 Psicólogo/a' : '🧑 Paciente'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        {editing ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        ) : (
          <Text style={styles.value}>{userData?.name}</Text>
        )}

        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <Text style={styles.value}>{userData?.email}</Text>

        {userData?.role === 'psychologist' && (
          <>
            <Text style={styles.label}>ESPECIALIDAD</Text>
            <Text style={styles.value}>{userData?.specialty || 'No especificada'}</Text>
            <Text style={styles.label}>LICENCIA</Text>
            <Text style={styles.value}>{userData?.license}</Text>
          </>
        )}

        <Text style={styles.label}>MIEMBRO DESDE</Text>
        <Text style={styles.value}>
          {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </Text>

        {editing && (
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, loading && { opacity: 0.6 }]} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
        <Text style={styles.logoutBtnText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  avatarSection: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  avatar: { backgroundColor: '#EDE0FF', borderRadius: 50, width: 100, height: 100, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  avatarName: { fontSize: 22, fontWeight: '900', color: '#1A0A2E', marginTop: 14 },
  roleBadge: { backgroundColor: '#EDE0FF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 8 },
  roleBadgeText: { color: '#5B2D8E', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 20, elevation: 3 },
  label: { fontSize: 10, fontWeight: '700', color: '#9B8FAF', letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '600', color: '#1A0A2E' },
  input: { backgroundColor: '#F7F0FF', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1.5, borderColor: '#DDD0F0', color: '#1A0A2E' },
  saveBtn: { backgroundColor: '#5B2D8E', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 20, elevation: 4 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  logoutBtn: { margin: 16, borderWidth: 2, borderColor: '#EF4444', borderRadius: 14, padding: 14, alignItems: 'center' },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});