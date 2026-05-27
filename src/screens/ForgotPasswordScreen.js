import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Error', 'Ingresa tu correo'); return; }
    setLoading(true);
    try {
      // Firebase envía el correo real de recuperación automáticamente
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('✅ Correo enviado', 'Revisa tu bandeja de entrada y sigue las instrucciones para recuperar tu contraseña.', [{ text: 'Volver al login', onPress: () => navigation.navigate('Login') }]);
    } catch {
      Alert.alert('Error', 'No encontramos una cuenta con ese correo');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 60 }}>🔐</Text>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>Te enviaremos un correo con instrucciones</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleReset} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Enviando...' : 'Enviar correo de recuperación'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 24, alignItems: 'center' }}>
        <Text style={{ color: '#5B2D8E', fontWeight: '800' }}>← Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F0FF', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '900', color: '#5B2D8E', marginTop: 12 },
  subtitle: { color: '#9B8FAF', fontSize: 14, marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 4 },
  label: { fontSize: 11, fontWeight: '700', color: '#5A4A6B', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#F7F0FF', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#DDD0F0' },
  btn: { backgroundColor: '#5B2D8E', borderRadius: 30, padding: 16, alignItems: 'center', marginTop: 20, elevation: 6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});