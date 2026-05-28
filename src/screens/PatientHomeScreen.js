import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { LogoIcon } from '../components/Logo';
import { colors, fonts, radius, shadow } from '../theme';
import Svg, { Path, Rect, Circle, Line, Ellipse } from 'react-native-svg';

const { width } = Dimensions.get('window');

function CalendarIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.lilac} strokeWidth="1.8" strokeLinecap="round">
      <Rect x="3" y="4" width="18" height="18" rx="4" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  );
}

function SearchIcon({ color = colors.lilac }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
}

function BrainIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <Path d="M9 3C6 3 4 5 4 8c0 1 .3 2 .8 2.8C3.7 11.7 3 13 3 14.5 3 17 5 19 7.5 19H9v2h6v-2h1.5C19 19 21 17 21 14.5c0-1.5-.7-2.8-1.8-3.7.5-.8.8-1.8.8-2.8 0-3-2-5-5-5-1 0-1.9.3-2.7.7C12.6 3.3 10.9 3 9 3z" />
    </Svg>
  );
}

function FileIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <Path d="M14 2v6h6" />
      <Line x1="16" y1="13" x2="8" y2="13" />
      <Line x1="16" y1="17" x2="8" y2="17" />
    </Svg>
  );
}

const ACTIONS = [
  { key: 'Psychologists', label: 'Psicólogos',      sub: 'Busca tu profesional', bg: colors.soft,       iconColor: colors.lilac,    Icon: SearchIcon },
  { key: 'EmotionalTest', label: 'Test emocional',  sub: 'Evalúa tu estado',     bg: '#E8F0FE',         iconColor: '#7B9FD4',       Icon: BrainIcon  },
  { key: 'Sessions',      label: 'Mis sesiones',    sub: 'Ver historial',        bg: colors.happyBg,    iconColor: colors.happy,    Icon: CalendarIcon},
  { key: 'PatientClinicalHistory', label: 'Historia clínica', sub: 'Mis registros', bg: '#F5EEFB',      iconColor: colors.calm,     Icon: FileIcon   },
];

export default function PatientHomeScreen({ navigation }) {
  const [userData, setUserData]       = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [mood, setMood]               = useState('calm');

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setUserData(snap.data());

      const q = query(
        collection(db, 'sessions'),
        where('patientId', '==', auth.currentUser.uid),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const sessions = await getDocs(q);
      const list = sessions.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (list.length > 0) setNextSession(list[0]);
    };
    load();
  }, []);

  const firstName = userData?.name?.split(' ')[0] || 'Usuario';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const MOODS = [
    { key: 'happy',   label: 'Bien',     color: colors.happy   },
    { key: 'calm',    label: 'Tranquilo',color: colors.calm    },
    { key: 'anxious', label: 'Ansioso',  color: colors.anxious },
    { key: 'sad',     label: 'Triste',   color: colors.sad     },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <TouchableOpacity onPress={() => signOut(auth)} style={styles.avatarBtn}>
              <LogoIcon size={38} dark />
            </TouchableOpacity>
          </View>

          {/* Mood selector */}
          <View style={styles.moodCard}>
            <Text style={styles.moodQuestion}>¿Cómo te sientes hoy?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMood(m.key)}
                  style={[styles.moodBtn, mood === m.key && { backgroundColor: m.color + '30', borderColor: m.color }]}>
                  <MindCharacter mood={m.key} size={36} />
                  <Text style={[styles.moodLabel, mood === m.key && { color: m.color, fontFamily: fonts.bold }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.body}>

          {/* Próxima sesión */}
          {nextSession && (
            <>
              <Text style={styles.sectionTitle}>Próxima sesión</Text>
              <View style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <View style={styles.sessionIconWrap}>
                    <CalendarIcon />
                  </View>
                  <View>
                    <Text style={styles.sessionName}>Psic. {nextSession.psychologistName}</Text>
                    <Text style={styles.sessionDate}>
                      {new Date(nextSession.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })} · {nextSession.time}
                    </Text>
                    <View style={styles.sessionBadge}>
                      <Text style={styles.sessionBadgeText}>
                        {nextSession.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </View>
                {nextSession.videoRoom && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('VideoCall', { room: nextSession.videoRoom })}
                    style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Unirse</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Acciones */}
          <Text style={styles.sectionTitle}>¿Qué necesitas hoy?</Text>
          <View style={styles.actionsGrid}>
            {ACTIONS.map(item => (
              <TouchableOpacity
                key={item.key}
                onPress={() => navigation.navigate(item.key)}
                style={[styles.actionCard, { backgroundColor: item.bg }]}>
                <View style={styles.actionIconWrap}>
                  <item.Icon color={item.iconColor} />
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emergencia */}
          <TouchableOpacity
            onPress={() => navigation.navigate('EmergencyChat')}
            style={styles.emergencyBtn}>
            <View style={styles.emergencyDot} />
            <Text style={styles.emergencyText}>Chat de emergencia con psicólogo</Text>
            <Text style={styles.emergencyArrow}>›</Text>
          </TouchableOpacity>

          {/* Tip del día */}
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>CONSEJO DEL DÍA</Text>
            <Text style={styles.tipText}>
              "Dedica 5 minutos a respirar profundo. Inhala 4 segundos, mantén 4, exhala 4. Tu mente te lo agradecerá."
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'home',    label: 'Inicio',   active: true  },
          { key: 'sessions',label: 'Sesiones', active: false },
          { key: 'center',  label: '',         active: false, isCenter: true },
          { key: 'test',    label: 'Test',     active: false },
          { key: 'profile', label: 'Perfil',   active: false },
        ].map(tab => {
          if (tab.isCenter) return (
            <TouchableOpacity
              key="center"
              onPress={() => navigation.navigate('Psychologists')}
              style={styles.tabCenter}>
              <Text style={styles.tabCenterPlus}>+</Text>
            </TouchableOpacity>
          );
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                if (tab.key === 'sessions') navigation.navigate('Sessions');
                if (tab.key === 'test') navigation.navigate('EmotionalTest');
                if (tab.key === 'profile') navigation.navigate('Profile');
              }}
              style={[styles.tabItem, tab.active && styles.tabItemActive]}>
              <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  userName: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: '#fff',
    marginTop: 2,
  },
  avatarBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  moodCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: 14,
  },
  moodQuestion: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  body: { padding: 20, gap: 16 },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.navy,
    marginBottom: 4,
  },

  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sessionIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionName: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy },
  sessionDate: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  sessionBadge: {
    backgroundColor: colors.soft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  sessionBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.lilac,
    letterSpacing: 0.3,
  },
  joinBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  joinBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  actionIconWrap: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadow.card,
  },
  actionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy },
  actionSub:   { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },

  emergencyBtn: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(224,85,85,0.15)',
  },
  emergencyDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  emergencyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  emergencyArrow: {
    fontSize: 18,
    color: colors.error,
  },

  tipCard: {
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: colors.lilac,
  },
  tipLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.lilac,
    marginBottom: 8,
  },
  tipText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.navy,
    lineHeight: 21,
    fontStyle: 'italic',
  },

  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.navy,
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...shadow.strong,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.4,
  },
  tabItemActive: { opacity: 1 },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#fff',
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: colors.lilac,
  },
  tabCenter: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.lilac,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
    ...shadow.strong,
  },
  tabCenterPlus: {
    fontSize: 26,
    color: colors.navy,
    fontFamily: fonts.bold,
    lineHeight: 30,
  },
});