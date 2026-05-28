import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, Linking
} from 'react-native';
import { ref, push, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db, auth } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

export default function EmergencyChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [psyName, setPsyName]   = useState('Psicólogo disponible');
  const [videoRoom]             = useState('Emergency_' + auth.currentUser.uid);
  const flatRef = useRef();

  useEffect(() => {
    const chatRef = ref(rtdb, 'emergency_chats/' + auth.currentUser.uid);
    const unsub = onValue(chatRef, snap => {
      const data = snap.val();
      if (data) {
        setMessages(Object.values(data).sort((a, b) => a.timestamp - b.timestamp));
      }
    });
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const chatRef = ref(rtdb, 'emergency_chats/' + auth.currentUser.uid);
    await push(chatRef, {
      text:      text.trim(),
      senderId:  auth.currentUser.uid,
      role:      'patient',
      timestamp: Date.now(),
    });
    setText('');
  };

  const openVideo = () => Linking.openURL('https://meet.jit.si/' + videoRoom);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.psyAvatar}>
            <MindCharacter mood="calm" size={36} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Chat de Emergencia</Text>
            <Text style={styles.headerSub}>{psyName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openVideo} style={styles.videoBtn}>
          <Text style={styles.videoBtnText}>Video</Text>
        </TouchableOpacity>
      </View>

      {/* Video banner */}
      <View style={styles.videoBanner}>
        <Text style={styles.videoBannerText} numberOfLines={1}>
          meet.jit.si/{videoRoom}
        </Text>
        <TouchableOpacity onPress={openVideo} style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>Unirse</Text>
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <MindCharacter mood="calm" size={90} />
          <Text style={styles.emptyChatTitle}>Estamos aquí para ayudarte</Text>
          <Text style={styles.emptyChatSub}>
            Escribe cómo te sientes. Un psicólogo te responderá pronto.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd()}
          renderItem={({ item }) => {
            const isMe = item.role === 'patient';
            return (
              <View style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
                {!isMe && (
                  <View style={styles.msgAvatar}>
                    <MindCharacter mood="calm" size={28} />
                  </View>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{item.text}</Text>
                </View>
                <Text style={styles.msgTime}>{formatTime(item.timestamp)}</Text>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor={colors.muted}
          multiline
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>›</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.error,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 18 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  psyAvatar: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerTitle: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  headerSub:   { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  videoBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  videoBtnText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },

  videoBanner: {
    backgroundColor: colors.soft,
    padding: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoBannerText: { flex: 1, fontFamily: fonts.medium, fontSize: 11, color: colors.lilac },
  joinBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  joinBtnText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },

  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
    backgroundColor: colors.cream,
  },
  emptyChatTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, textAlign: 'center' },
  emptyChatSub:   { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },

  messagesList: { padding: 16, gap: 12, flexGrow: 1, backgroundColor: colors.cream },

  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  msgWrapMe: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: colors.soft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    ...shadow.card,
  },
  bubbleMe: {
    backgroundColor: colors.navy,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: fonts.regular, fontSize: 14, color: colors.navy, lineHeight: 20 },
  msgTime: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },

  inputRow: {
    backgroundColor: colors.white,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.soft,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    borderWidth: 1.5,
    borderColor: colors.soft,
    color: colors.navy,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    width: 44, height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 24, fontFamily: fonts.bold, lineHeight: 28 },
});