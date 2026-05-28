import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Animated, Alert
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { LogoFull } from '../components/Logo';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) { shake(); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      shake();
      Alert.alert('Acceso denegado', 'Correo o contraseña incorrectos');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header navy */}
        <View style={styles.header}>
          <LogoFull dark />
        </View>

        {/* Personaje */}
        <View style={styles.charWrap}>
          <MindCharacter mood={loading ? 'anxious' : 'calm'} size={110} />
        </View>

        {/* Card formulario */}
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.cardTitle}>Bienvenido de vuelta</Text>
          <Text style={styles.cardSub}>Inicia sesión para continuar</Text>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
            <View style={[styles.inputWrap, focused === 'email' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
            <View style={[styles.inputWrap, focused === 'pass' && styles.inputFocused]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPass}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Olvidé */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.btnText}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Registro */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: colors.navy,
    paddingTop: 64,
    paddingBottom: 0,
    alignItems: 'center',
  },

  charWrap: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    paddingVertical: 16,
  },

  card: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    flex: 1,
    padding: 28,
    paddingTop: 32,
    minHeight: 460,
  },

  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.navy,
    marginBottom: 4,
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    marginBottom: 28,
  },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.muted,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: colors.lilac,
    ...shadow.card,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.navy,
    paddingVertical: 14,
    flex: 1,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },

  forgotWrap: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 4 },
  forgotText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.lilac,
  },

  btn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 17,
    alignItems: 'center',
    ...shadow.strong,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },

  registerRow: {
    backgroundColor: colors.cream,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  registerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
  registerLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.navy,
  },
});