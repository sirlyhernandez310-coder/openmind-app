import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Linking, Share
} from 'react-native';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function VideoCallScreen({ route, navigation }) {
  const { room } = route.params;
  const url = 'https://meet.jit.si/' + room;

  const openVideo = () => Linking.openURL(url);
  const shareLink = () => Share.share({
    message: 'Únete a nuestra sesión de OpenMind: ' + url,
    title: 'Link de videollamada OpenMind',
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videollamada</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <MindCharacter mood="happy" size={130} />
        <Text style={styles.title}>Tu sala está lista</Text>
        <Text style={styles.subtitle}>
          Usa el botón para unirte desde el navegador o comparte el link con tu psicólogo
        </Text>

        <View style={styles.linkCard}>
          <Text style={styles.linkLabel}>LINK DE LA SESIÓN</Text>
          <Text style={styles.linkText} numberOfLines={2}>{url}</Text>
        </View>

        <TouchableOpacity onPress={openVideo} style={styles.joinBtn} activeOpacity={0.85}>
          <Text style={styles.joinBtnText}>Unirse ahora</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={shareLink} style={styles.shareBtn} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>Compartir link</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          {[
            'Se abre Jitsi Meet en tu navegador',
            'No necesitas crear cuenta',
            'El mismo link lo usa el psicólogo',
            'La sala es privada y segura',
          ].map((t, i) => (
            <Text key={i} style={styles.infoItem}>· {t}</Text>
          ))}
        </View>
      </View>
    </View>
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

  body: { flex: 1, alignItems: 'center', padding: 24, gap: 16 },

  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, textAlign: 'center' },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  linkCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    width: '100%',
    ...shadow.card,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.12)',
  },
  linkLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 6,
  },
  linkText: { fontFamily: fonts.medium, fontSize: 13, color: colors.lilac },

  joinBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 17,
    width: '100%',
    alignItems: 'center',
    ...shadow.strong,
  },
  joinBtnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff', letterSpacing: 0.3 },

  shareBtn: {
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radius.full,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },

  infoCard: {
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    padding: 16,
    width: '100%',
    gap: 6,
  },
  infoTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, marginBottom: 4 },
  infoItem: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 20 },
});