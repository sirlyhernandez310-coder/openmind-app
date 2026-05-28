import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { LogoIcon } from '../components/Logo';
import { colors, fonts, radius, shadow } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Ingresa tu correo', 'Escribe el correo con el que te registraste'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch {
      Alert.alert('Correo no encontrado', 'No existe una cuenta con ese correo');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header navy */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <LogoIcon size={42} dark />
      </View>

      {/* Personaje */}
      <View style={styles.heroWrap}>
        <MindCharacter mood={sent ? 'happy' : 'calm'} size={110} />
        <Text style={styles.heroTitle}>
          {sent ? '¡Revisa tu correo!' : 'Recupera tu acceso'}
        </Text>
        <Text style={styles.heroSub}>
          {sent
            ? 'Te enviamos un enlace para\nrestablecer tu contraseña'
            : 'Te enviaremos un enlace\npara restablecer tu contraseña'}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {!sent ? (
          <>
            <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
            <View style={[styles.inputWrap, focused && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={styles.btnText}>
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Estado enviado */}
            <View style={styles.sentBox}>
              <View style={styles.sentIconWrap}>
                <Text style={styles.sentIcon}>✉️</Text>
              </View>
              <Text style={styles.sentTitle}>Enlace enviado a:</Text>
              <Text style={styles.sentEmail}>{email}</Text>
              <Text style={styles.sentHint}>
                Revisa también tu carpeta de spam si no lo ves en unos minutos.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}>
              <Text style={styles.btnText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSent(false); setEmail(''); }}
              style={styles.retryBtn}>
              <Text style={styles.retryText}>Enviar a otro correo</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}>
          <Text style={styles.backLinkText}>← Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>

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
  backArrow: { color: '#fff', fontSize: 20 },

  heroWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
  },

  card: {
    flex: 1,
    backgroundColor: colors.cream,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    paddingTop: 32,
    gap: 4,
  },

  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.muted,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.15)',
    paddingHorizontal: 16,
    marginBottom: 8,
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
  },

  btn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 17,
    alignItems: 'center',
    marginTop: 20,
    ...shadow.strong,
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },

  sentBox: {
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sentIconWrap: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadow.card,
  },
  sentIcon: { fontSize: 30 },
  sentTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
  sentEmail: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.navy,
  },
  sentHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },

  retryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  retryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.lilac,
  },

  backLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backLinkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
});