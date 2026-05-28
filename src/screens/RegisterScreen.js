import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LogoIcon } from '../components/Logo';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('patient');
  const [specialty, setSpecialty] = useState('');
  const [license, setLicense]   = useState('');
  const [focused, setFocused]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos'); return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Debe tener mínimo 6 caracteres'); return;
    }
    if (role === 'psychologist' && (!specialty || !license)) {
      Alert.alert('Datos incompletos', 'Completa tu especialidad y número de licencia'); return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name, email: email.trim(), role,
        approved: role !== 'psychologist',
        ...(role === 'psychologist' ? { specialty, license, bio: '', experience: '' } : {}),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Correo en uso', 'Ya existe una cuenta con este correo');
      } else {
        Alert.alert('Error', 'No se pudo crear la cuenta. Intenta de nuevo.');
      }
    }
    setLoading(false);
  };

  const inputProps = (key) => ({
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
    style:   [styles.input, focused === key && styles.inputFocused],
    placeholderTextColor: colors.muted,
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <LogoIcon size={42} dark />
        </View>

        {/* Personaje + título */}
        <View style={styles.heroWrap}>
          <MindCharacter mood={role === 'psychologist' ? 'happy' : 'calm'} size={100} />
          <Text style={styles.heroTitle}>Crea tu cuenta</Text>
          <Text style={styles.heroSub}>Únete a la comunidad OpenMind</Text>
        </View>

        {/* Selector de rol */}
        <View style={styles.roleRow}>
          {[
            { key: 'patient',       label: 'Soy Paciente',    icon: '🧑' },
            { key: 'psychologist',  label: 'Soy Psicólogo/a', icon: '🩺' },
          ].map(r => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRole(r.key)}
              style={[styles.roleCard, role === r.key && styles.roleCardActive]}>
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulario */}
        <View style={styles.form}>

          <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
          <TextInput
            {...inputProps('name')}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre completo"
          />

          <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
          <TextInput
            {...inputProps('email')}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
          <TextInput
            {...inputProps('pass')}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />

          {role === 'psychologist' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Datos profesionales</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.fieldLabel}>ESPECIALIDAD</Text>
              <TextInput
                {...inputProps('specialty')}
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="Ej: Psicología clínica"
              />

              <Text style={styles.fieldLabel}>NÚMERO DE LICENCIA</Text>
              <TextInput
                {...inputProps('license')}
                value={license}
                onChangeText={setLicense}
                placeholder="Ej: COL-12345"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.btnText}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#fff',
    fontSize: 20,
    fontFamily: fonts.regular,
  },

  heroWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: '#fff',
    marginTop: 4,
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },

  roleRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  roleCardActive: {
    backgroundColor: 'rgba(204,169,232,0.15)',
    borderColor: colors.lilac,
  },
  roleIcon: { fontSize: 28 },
  roleLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  roleLabelActive: {
    color: colors.lilac,
    fontFamily: fonts.bold,
  },

  form: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    paddingTop: 32,
    marginTop: 16,
    gap: 4,
    flexGrow: 1,
  },

  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.muted,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.navy,
  },
  inputFocused: {
    borderColor: colors.lilac,
    ...shadow.card,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(123,113,153,0.15)',
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.muted,
  },

  btn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 17,
    alignItems: 'center',
    marginTop: 24,
    ...shadow.strong,
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loginText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
  loginLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.navy,
  },
});