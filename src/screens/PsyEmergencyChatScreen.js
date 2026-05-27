import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { ref, push, onValue, get } from 'firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';

export default function PsyEmergencyChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [patientId, setPatientId] = useState(null);
  const [patientName, setPatientName] = useState('Paciente');
  const [videoRoom, setVideoRoom] = useState('');
  const flatRef = useRef();

  useEffect(() => {
    const findPatient = async () => {
      // Buscar el chat de emergencia más reciente
      const q = query(collection(db, 'users'), where('role', '==', 'patient'));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const chatRef = ref(rtdb, 'emergency_chats/' + d.id);
        const chatSnap = await get(chatRef);
        if (chatSnap.exists()) {
          setPatientId(d.id);
          setPatientName(d.data().name);
          setVideoRoom('Emergency_' + d.id);
          break;
        }
      }
    };
    findPatient();
  }, []);

  useEffect(() => {
    if (!patientId) return;
    const chatRef = ref(rtdb, 'emergency_chats/' + patientId);
    const unsub = onValue(chatRef, snap => {
      const data = snap.val();
      if (data) setMessages(Object.values(data).sort((a, b) => a.timestamp - b.timestamp));
    });
    return () => unsub();
  }, [patientId]);

  const sendMessage = async () => {
    if (!text.trim() || !patientId) return;
    const chatRef = ref(rtdb, 'emergency_chats/' + patientId);
    await push(chatRef, { text: text.trim(), role: 'psy', timestamp: Date.now() });
    setText('');
  };

  const openVideo = () => videoRoom && Linking.openURL('https://meet.jit.si/' + videoRoom);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🆘 Chat de Emergencia</Text>
          <Text style={styles.headerSub}>{patientName} — Necesita apoyo</Text>
        </View>
        <TouchableOpacity onPress={openVideo} style={styles.videoBtn}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>🎥 Video</Text>
        </TouchableOpacity>
      </View>

      {videoRoom ? (
        <View style={styles.videoBanner}>
          <Text style={styles.videoBannerText} numberOfLines={1}>🎥 meet.jit.si/{videoRoom}</Text>
          <TouchableOpacity onPress={openVideo} style={styles.joinBtn}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Unirse</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!patientId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={{ color: '#9B8FAF', fontSize: 15, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }}>
            No hay pacientes en emergencia en este momento
          </Text>
        </View>
      ) : (
        <FlatList ref={flatRef} data={messages} keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd()}
          renderItem={({ item }) => {
            const isMe = item.role === 'psy';
            return (
              <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, { backgroundColor: isMe ? '#5B2D8E' : '#fff' }]}>
                  <Text style={{ color: isMe ? '#fff' : '#1A0A2E', fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#9B8FAF', marginTop: 2 }}>
                  {new Date(item.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={text} onChangeText={setText}
          placeholder="Responde al paciente..." multiline
          onSubmitEditing={sendMessage} />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  videoBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  videoBanner: { backgroundColor: '#EDE0FF', padding: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  videoBannerText: { flex: 1, fontSize: 11, color: '#5B2D8E', fontWeight: '600' },
  joinBtn: { backgroundColor: '#5B2D8E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, elevation: 1 },
  inputRow: { backgroundColor: '#fff', padding: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: '#EDE0FF' },
  input: { flex: 1, backgroundColor: '#F7F0FF', borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1.5, borderColor: '#DDD0F0', maxHeight: 100 },
  sendBtn: { backgroundColor: '#5B2D8E', borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});