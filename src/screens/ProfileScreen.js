import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [name, setName]         = useState('');
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(false);

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
    Alert.alert('Perfil actualizado');
  };

  const mood = userData?.role === 'psychologist' ? 'happy' : 'calm';

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editBtn}>{editing ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <MindCharacter mood={mood} size={110} />
        </View>
        <Text style={styles.userName}>{userData?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {userData?.role === 'psychologist' ? 'Psicólogo/a' : 'Paciente'}
          </Text>
        </View>
      </View>

      {/* Datos */}
      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.muted}
            />
          ) : (
            <Text style={styles.fieldValue}>{userData?.name}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
          <Text style={styles.fieldValue}>{userData?.email}</Text>
        </View>
        {userData?.role === 'psychologist' && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ESPECIALIDAD</Text>
              <Text style={styles.fieldValue}>{userData?.specialty || 'No especificada'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>LICENCIA</Text>
              <Text style={styles.fieldValue}>{userData?.license}</Text>
            </View>
          </>
        )}
        <View style={[styles.field, { borderBottomWidth: 0 }]}>
          <Text style={styles.fieldLabel}>MIEMBRO DESDE</Text>
          <Text style={styles.fieldValue}>
            {userData?.createdAt
              ? new Date(userData.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
              : '—'}
          </Text>
        </View>

        {editing && (
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
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
  editBtn: { fontFamily: fonts.bold, fontSize: 14, color: colors.lilac },

  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatarWrap: {
    width: 120, height: 120,
    borderRadius: 40,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  userName: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy },
  roleBadge: {
    backgroundColor: colors.soft,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleBadgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.lilac },

  card: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow.card,
  },
  field: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123,113,153,0.1)',
    gap: 4,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
  },
  fieldValue: { fontFamily: fonts.medium, fontSize: 15, color: colors.navy },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.navy,
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.lilac,
  },
  saveBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 15,
    alignItems: 'center',
    marginTop: 16,
    ...shadow.strong,
  },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },

  logoutBtn: {
    margin: 20,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.full,
    padding: 15,
    alignItems: 'center',
  },
  logoutText: { fontFamily: fonts.bold, fontSize: 15, color: colors.error },
});