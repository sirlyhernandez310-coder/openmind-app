import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

export default function BookingScreen({ route, navigation }) {
  const { psychologist } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const days = getNext7Days();

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) { Alert.alert('Error', 'Selecciona fecha y hora'); return; }
    setLoading(true);
    try {
      const roomName = 'OpenMind_' + auth.currentUser.uid + '_' + Date.now();
      await addDoc(collection(db, 'sessions'), {
        patientId: auth.currentUser.uid,
        psychologistId: psychologist.id,
        psychologistName: psychologist.name,
        date: selectedDate.toISOString(),
        time: selectedTime,
        status: 'pending',
        videoRoom: roomName,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('✅ Sesión agendada', `Tu sesión con ${psychologist.name} quedó agendada para el ${selectedDate.toLocaleDateString('es-CO')} a las ${selectedTime}.`, [{ text: 'Ver mis sesiones', onPress: () => navigation.navigate('Sessions') }]);
    } catch {
      Alert.alert('Error', 'No se pudo agendar. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Agendar sesión</Text>
          <Text style={styles.headerSub}>Psic. {psychologist.name}</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Selecciona el día</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 10, paddingRight: 16 }}>
            {days.map((d, i) => {
              const isSelected = selectedDate?.toDateString() === d.toDateString();
              return (
                <TouchableOpacity key={i} onPress={() => setSelectedDate(d)}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}>
                  <Text style={[styles.dayName, isSelected && { color: '#fff' }]}>
                    {d.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dayNum, isSelected && { color: '#fff' }]}>{d.getDate()}</Text>
                  <Text style={[styles.dayMonth, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>
                    {d.toLocaleDateString('es-CO', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>Selecciona la hora</Text>
        <View style={styles.timesGrid}>
          {TIME_SLOTS.map(t => {
            const isSelected = selectedTime === t;
            return (
              <TouchableOpacity key={t} onPress={() => setSelectedTime(t)}
                style={[styles.timeChip, isSelected && styles.timeChipSelected]}>
                <Text style={[styles.timeChipText, isSelected && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && selectedTime && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Resumen de tu sesión</Text>
            <Text style={styles.confirmLine}>👤 {psychologist.name}</Text>
            <Text style={styles.confirmLine}>📅 {selectedDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            <Text style={styles.confirmLine}>🕐 {selectedTime}</Text>
            <Text style={styles.confirmLine}>🎥 Videollamada incluida</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleBook}
          style={[styles.bookBtn, (!selectedDate || !selectedTime || loading) && { opacity: 0.5 }]}
          disabled={!selectedDate || !selectedTime || loading}>
          <Text style={styles.bookBtnText}>{loading ? 'Agendando...' : 'Confirmar sesión'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A0A2E', marginBottom: 12, marginTop: 8 },
  dayCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', width: 64, elevation: 2 },
  dayCardSelected: { backgroundColor: '#5B2D8E', elevation: 6 },
  dayName: { fontSize: 10, fontWeight: '700', color: '#9B8FAF' },
  dayNum: { fontSize: 22, fontWeight: '900', color: '#1A0A2E', marginVertical: 2 },
  dayMonth: { fontSize: 10, color: '#9B8FAF', fontWeight: '600' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  timeChip: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1.5, borderColor: '#DDD0F0', elevation: 2 },
  timeChipSelected: { backgroundColor: '#5B2D8E', borderColor: '#5B2D8E', elevation: 4 },
  timeChipText: { fontWeight: '700', color: '#1A0A2E', fontSize: 14 },
  confirmCard: { backgroundColor: '#EDE0FF', borderRadius: 16, padding: 16, marginBottom: 20, gap: 6 },
  confirmTitle: { fontWeight: '800', color: '#5B2D8E', fontSize: 15, marginBottom: 4 },
  confirmLine: { fontSize: 14, color: '#1A0A2E', fontWeight: '500' },
  bookBtn: { backgroundColor: '#5B2D8E', borderRadius: 16, padding: 18, alignItems: 'center', elevation: 6, shadowColor: '#5B2D8E', shadowOpacity: 0.4, shadowRadius: 12 },
  bookBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});