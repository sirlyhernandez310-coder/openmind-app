import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { serverTimestamp } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [specialty, setSpecialty] = useState('');
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);

  

const handleRegister = async () => {
  if (!name || !email || !password) {
    Alert.alert('Error', 'Completa todos los campos');
    return;
  }

  if (password.length < 6) {
    Alert.alert('Error', 'La contraseña debe tener mínimo 6 caracteres');
    return;
  }

  if (role === 'psychologist' && (!specialty || !license)) {
    Alert.alert('Error', 'Completa los datos profesionales');
    return;
  }

  setLoading(true);

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    // 🔥 GUARDAR USUARIO CORRECTAMENTE
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: name.trim(),
      email: email.trim(),
      role: role, // 👈 IMPORTANTE
      approved: role !== 'psychologist',
      specialty: role === 'psychologist' ? specialty : null,
      license: role === 'psychologist' ? license : null,
      bio: '',
      experience: '',
      availableSlots: [],
      createdAt: serverTimestamp(), // 👈 mejor que Date()
    });

    // ✅ OPCIONAL (mejora UX)
    Alert.alert('Éxito', 'Cuenta creada correctamente');

    // ❌ NO navegar manualmente
    // navigation.navigate("Login");

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      Alert.alert('Error', '❌ Este correo ya está registrado');
    } else {
      Alert.alert('Error', 'No se pudo crear la cuenta');
    }
  }

  setLoading(false);
};
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', marginBottom: 24, paddingTop: 40 }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>Crea tu cuenta</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        {['patient', 'psychologist'].map(r => (
          <TouchableOpacity key={r} onPress={() => setRole(r)}
            style={{ flex: 1, backgroundColor: role === r ? '#EDE0FF' : '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: role === r ? '#5B2D8E' : 'transparent' }}>
            <Text style={{ fontSize: 28 }}>{r === 'patient' ? '🧑' : '🩺'}</Text>
            <Text style={{ fontWeight: '700', fontSize: 13, marginTop: 4, color: '#1A0A2E' }}>{r === 'patient' ? 'Soy Paciente' : 'Soy Psicólogo'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.card}>
        {[['Nombre completo', name, setName, 'Tu nombre', false], ['Correo electrónico', email, setEmail, 'tu@correo.com', false, 'email-address'], ['Contraseña', password, setPassword, 'Mínimo 6 caracteres', true]].map(([label, val, setter, ph, secure, kb]) => (
          <View key={label}>
            <Text style={styles.label}>{label.toUpperCase()}</Text>
            <TextInput style={styles.input} value={val} onChangeText={setter} placeholder={ph} secureTextEntry={secure} keyboardType={kb || 'default'} autoCapitalize="none" />
          </View>
        ))}
        {role === 'psychologist' && (
          <>
            <Text style={styles.label}>ESPECIALIDAD</Text>
            <TextInput style={styles.input} value={specialty} onChangeText={setSpecialty} placeholder="Ej: Psicología clínica" />
            <Text style={styles.label}>NÚMERO DE LICENCIA</Text>
            <TextInput style={styles.input} value={license} onChangeText={setLicense} placeholder="Ej: COL-12345" />
          </>
        )}
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creando cuenta...' : 'Registrarme'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={{ color: '#5B2D8E', fontWeight: '800', fontSize: 15 }}>Ya tengo cuenta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 4 },
  label: { fontSize: 11, fontWeight: '700', color: '#5A4A6B', letterSpacing: 0.8, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#F7F0FF', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#DDD0F0' },
  btn: { backgroundColor: '#5B2D8E', borderRadius: 30, padding: 16, alignItems: 'center', marginTop: 24, elevation: 6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});