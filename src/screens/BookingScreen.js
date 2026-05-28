import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00'];

function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

export default function BookingScreen({ route, navigation }) {
  const { psychologist }    = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading]           = useState(false);
  const days = getNext7Days();

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Selecciona fecha y hora', 'Elige un día y una hora para tu sesión');
      return;
    }
    setLoading(true);
    try {
      const roomName = 'OpenMind_' + auth.currentUser.uid + '_' + Date.now();
      await addDoc(collection(db, 'sessions'), {
        patientId:         auth.currentUser.uid,
        psychologistId:    psychologist.id,
        psychologistName:  psychologist.name,
        date:              selectedDate.toISOString(),
        time:              selectedTime,
        status:            'pending',
        videoRoom:         roomName,
        createdAt:         new Date().toISOString(),
      });
      Alert.alert(
        '¡Sesión agendada!',
        `Tu sesión con ${psychologist.name} el ${selectedDate.toLocaleDateString('es-CO')} a las ${selectedTime} está confirmada.`,
        [{ text: 'Ver mis sesiones', onPress: () => navigation.navigate('Sessions') }]
      );
    } catch {
      Alert.alert('Error', 'No se pudo agendar. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Agendar sesión</Text>
          <Text style={styles.headerSub}>Psic. {psychologist.name}</Text>
        </View>
        <MindCharacter mood="happy" size={52} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Días */}
        <Text style={styles.sectionTitle}>Selecciona el día</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
          <View style={styles.daysRow}>
            {days.map((d, i) => {
              const isSelected = selectedDate?.toDateString() === d.toDateString();
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedDate(d)}
                  style={[styles.dayCard, isSelected && styles.dayCardActive]}>
                  <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>
                    {d.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayTextActive]}>
                    {d.getDate()}
                  </Text>
                  <Text style={[styles.dayMonth, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                    {d.toLocaleDateString('es-CO', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Horas */}
        <Text style={styles.sectionTitle}>Selecciona la hora</Text>
        <View style={styles.timesGrid}>
          {TIME_SLOTS.map(t => {
            const isSelected = selectedTime === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedTime(t)}
                style={[styles.timeChip, isSelected && styles.timeChipActive]}>
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Resumen */}
        {selectedDate && selectedTime && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen de tu sesión</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Psicólogo</Text>
              <Text style={styles.summaryValue}>{psychologist.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha</Text>
              <Text style={[styles.summaryValue, { textTransform: 'capitalize' }]}>
                {selectedDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hora</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Videollamada</Text>
              <Text style={[styles.summaryValue, { color: colors.lilac }]}>Incluida</Text>
            </View>
          </View>
        )}

        {/* Botón */}
        <TouchableOpacity
          onPress={handleBook}
          style={[styles.btn, (!selectedDate || !selectedTime || loading) && { opacity: 0.4 }]}
          disabled={!selectedDate || !selectedTime || loading}
          activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {loading ? 'Agendando...' : 'Confirmar sesión'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
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
    gap: 14,
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
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  body: { padding: 20, gap: 16, paddingBottom: 60 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },

  daysRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 4 },
  dayCard: {
    width: 64,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    ...shadow.card,
  },
  dayCardActive: { backgroundColor: colors.navy },
  dayName: { fontFamily: fonts.bold, fontSize: 10, color: colors.muted, letterSpacing: 0.5 },
  dayNum:  { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  dayMonth:{ fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
  dayTextActive: { color: '#fff' },

  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.12)',
    ...shadow.card,
  },
  timeChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  timeChipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.navy },
  timeChipTextActive: { color: '#fff' },

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow.card,
  },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123,113,153,0.1)',
  },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  summaryValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy },

  btn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 17,
    alignItems: 'center',
    ...shadow.strong,
  },
  btnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff', letterSpacing: 0.3 },
});