import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { ref, push, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db, auth } from '../config/firebase';

export default function EmergencyChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [psyName, setPsyName] = useState('Psicólogo disponible');
  const [videoRoom] = useState('Emergency_' + auth.currentUser.uid);
  const flatRef = useRef();

  useEffect(() => {
    // Escuchar mensajes en tiempo real
    const chatRef = ref(rtdb, 'emergency_chats/' + auth.currentUser.uid);
    const unsub = onValue(chatRef, snap => {
      const data = snap.val();
      if (data) setMessages(Object.values(data).sort((a, b) => a.timestamp - b.timestamp));
    });

    // Cargar nombre del psicólogo disponible
    const loadPsy = async () => {
      const snap = await getDoc(doc(db, 'system', 'config'));
      if (snap.exists() && snap.data().onDutyPsyName) setPsyName(snap.data().onDutyPsyName);
    };
    loadPsy();

    return () => unsub();
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const chatRef = ref(rtdb, 'emergency_chats/' + auth.currentUser.uid);
    await push(chatRef, { text: text.trim(), senderId: auth.currentUser.uid, role: 'patient', timestamp: Date.now() });
    setText('');
  };

  const openVideo = () => {
    Linking.openURL('https://meet.jit.si/' + videoRoom);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🆘 Chat de Emergencia</Text>
          <Text style={styles.headerSub}>{psyName}</Text>
        </View>
        <TouchableOpacity onPress={openVideo} style={styles.videoBtn}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>🎥 Video</Text>
        </TouchableOpacity>
      </View>

      {/* Video link banner */}
      <View style={styles.videoBanner}>
        <Text style={styles.videoBannerText}>🎥 meet.jit.si/{videoRoom}</Text>
        <TouchableOpacity onPress={openVideo} style={styles.joinBtn}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Unirse</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList ref={flatRef} data={messages} keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isMe = item.role === 'patient';
          return (
            <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.bubble, { backgroundColor: isMe ? '#5B2D8E' : '#fff' }]}>
                <Text style={{ color: isMe ? '#fff' : '#1A0A2E', fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#9B8FAF', marginTop: 3 }}>
                {new Date(item.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={text} onChangeText={setText}
          placeholder="Escribe tu mensaje..." multiline
          onSubmitEditing={sendMessage} />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#FF5252', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  videoBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  videoBanner: { backgroundColor: '#EDE0FF', padding: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  videoBannerText: { flex: 1, fontSize: 11, color: '#5B2D8E', fontWeight: '600' },
  joinBtn: { backgroundColor: '#5B2D8E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  inputRow: { backgroundColor: '#fff', padding: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: '#EDE0FF' },
  input: { flex: 1, backgroundColor: '#F7F0FF', borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1.5, borderColor: '#DDD0F0', maxHeight: 100 },
  sendBtn: { backgroundColor: '#FF5252', borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});