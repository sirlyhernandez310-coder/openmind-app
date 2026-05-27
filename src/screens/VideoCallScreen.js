import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Share } from 'react-native';

export default function VideoCallScreen({ route, navigation }) {
  const { room } = route.params;
  const url = 'https://meet.jit.si/' + room;

  const openVideo = () => Linking.openURL(url);

  const shareLink = () => Share.share({ message: '🎥 Únete a nuestra sesión de OpenMind: ' + url, title: 'Link de videollamada OpenMind' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videollamada</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 60 }}>🎥</Text>
        </View>
        <Text style={styles.title}>Tu sala está lista</Text>
        <Text style={styles.subtitle}>Usa el link para unirte desde el navegador o compártelo</Text>

        <View style={styles.linkBox}>
          <Text style={styles.linkLabel}>LINK DE LA SESIÓN</Text>
          <Text style={styles.linkText} numberOfLines={2}>{url}</Text>
        </View>

        <TouchableOpacity onPress={openVideo} style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>🚀 Unirse ahora</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={shareLink} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>📤 Compartir link</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          <Text style={styles.infoText}>• Al tocar "Unirse" se abrirá Jitsi Meet en el navegador</Text>
          <Text style={styles.infoText}>• No necesitas crear cuenta</Text>
          <Text style={styles.infoText}>• El psicólogo y paciente usan el mismo link</Text>
          <Text style={styles.infoText}>• La sala es privada y segura</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F0FF' },
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  iconCircle: { backgroundColor: '#EDE0FF', borderRadius: 60, width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#1A0A2E', textAlign: 'center' },
  subtitle: { color: '#9B8FAF', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  linkBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginTop: 24, elevation: 3, borderWidth: 2, borderColor: '#DDD0F0' },
  linkLabel: { fontSize: 10, fontWeight: '700', color: '#9B8FAF', letterSpacing: 1, marginBottom: 6 },
  linkText: { fontSize: 13, color: '#5B2D8E', fontWeight: '700' },
  joinBtn: { backgroundColor: '#5B2D8E', borderRadius: 16, padding: 18, width: '100%', alignItems: 'center', marginTop: 16, elevation: 6, shadowColor: '#5B2D8E', shadowOpacity: 0.4, shadowRadius: 12 },
  joinBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  shareBtn: { borderWidth: 2, borderColor: '#5B2D8E', borderRadius: 16, padding: 14, width: '100%', alignItems: 'center', marginTop: 10 },
  shareBtnText: { color: '#5B2D8E', fontWeight: '700', fontSize: 15 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginTop: 20, gap: 6 },
  infoTitle: { fontWeight: '800', color: '#1A0A2E', marginBottom: 4, fontSize: 14 },
  infoText: { fontSize: 13, color: '#5A4A6B', lineHeight: 20 },
});