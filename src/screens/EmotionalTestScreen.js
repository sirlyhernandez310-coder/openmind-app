import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const QUESTIONS = [
  {
    id: 'mood',
    emoji: '😊',
    question: '¿Cómo describirías tu estado de ánimo general hoy?',
    options: [
      { label: 'Muy bien, me siento feliz',     value: 5, emoji: '😄' },
      { label: 'Bien, todo normal',              value: 4, emoji: '🙂' },
      { label: 'Regular, ni bien ni mal',        value: 3, emoji: '😐' },
      { label: 'Mal, me siento bajo',            value: 2, emoji: '😟' },
      { label: 'Muy mal, me siento terrible',    value: 1, emoji: '😢' },
    ],
  },
  {
    id: 'anxiety',
    emoji: '😰',
    question: '¿Has sentido ansiedad o preocupación excesiva esta semana?',
    options: [
      { label: 'Para nada',                      value: 5, emoji: '✅' },
      { label: 'Un poco, pero manejable',        value: 4, emoji: '🟡' },
      { label: 'Sí, me ha costado concentrarme', value: 3, emoji: '🟠' },
      { label: 'Bastante, afecta mi día a día',  value: 2, emoji: '🔴' },
      { label: 'Mucho, casi todo el tiempo',     value: 1, emoji: '🆘' },
    ],
  },
  {
    id: 'sleep',
    emoji: '😴',
    question: '¿Cómo ha sido tu sueño últimamente?',
    options: [
      { label: 'Excelente, duermo bien',         value: 5, emoji: '😴' },
      { label: 'Bien, aunque con variaciones',   value: 4, emoji: '🌙' },
      { label: 'Regular, a veces no puedo',      value: 3, emoji: '😑' },
      { label: 'Mal, me cuesta dormir',          value: 2, emoji: '😩' },
      { label: 'Muy mal, casi no duermo',        value: 1, emoji: '🥱' },
    ],
  },
  {
    id: 'social',
    emoji: '👥',
    question: '¿Cómo te sientes en tus relaciones sociales?',
    options: [
      { label: 'Muy conectado con los demás',    value: 5, emoji: '🤝' },
      { label: 'Bien, tengo apoyo',              value: 4, emoji: '😊' },
      { label: 'Un poco distante a veces',       value: 3, emoji: '🤔' },
      { label: 'Me siento solo bastante',        value: 2, emoji: '😔' },
      { label: 'Completamente aislado',          value: 1, emoji: '🏝️' },
    ],
  },
  {
    id: 'motivation',
    emoji: '🔥',
    question: '¿Cómo está tu motivación y energía para hacer cosas?',
    options: [
      { label: 'Con mucha energía y ganas',      value: 5, emoji: '🚀' },
      { label: 'Bien, puedo con mis cosas',      value: 4, emoji: '💪' },
      { label: 'Regular, me cuesta arrancar',    value: 3, emoji: '🐢' },
      { label: 'Poca energía, casi no hago nada',value: 2, emoji: '😓' },
      { label: 'Sin energía ni motivación',      value: 1, emoji: '🪫' },
    ],
  },
  {
    id: 'selfesteem',
    emoji: '💛',
    question: '¿Cómo te sientes contigo mismo/a?',
    options: [
      { label: 'Me acepto y valoro mucho',       value: 5, emoji: '🌟' },
      { label: 'Bien, con confianza',            value: 4, emoji: '😌' },
      { label: 'Con altibajos',                  value: 3, emoji: '🎢' },
      { label: 'Mal, me critico mucho',          value: 2, emoji: '😞' },
      { label: 'Muy mal conmigo mismo/a',        value: 1, emoji: '💔' },
    ],
  },
  {
    id: 'stress',
    emoji: '😤',
    question: '¿Cuánto estrés has sentido esta semana?',
    options: [
      { label: 'Sin estrés, tranquilo/a',        value: 5, emoji: '🧘' },
      { label: 'Algo de estrés, normal',         value: 4, emoji: '😅' },
      { label: 'Estrés moderado',                value: 3, emoji: '😬' },
      { label: 'Mucho estrés',                   value: 2, emoji: '😰' },
      { label: 'Estrés extremo, al límite',      value: 1, emoji: '🤯' },
    ],
  },
];

function getResult(score) {
  const pct = (score / (QUESTIONS.length * 5)) * 100;
  if (pct >= 80) return { label: 'Excelente bienestar',     emoji: '🌟', color: '#22C55E', bg: '#D1FAE5', advice: 'Tu salud mental está en un gran momento. ¡Sigue así! Mantén tus hábitos saludables y celebra cómo te sientes.' };
  if (pct >= 60) return { label: 'Bienestar moderado',      emoji: '🙂', color: '#F59E0B', bg: '#FEF3C7', advice: 'Vas bien, pero hay áreas donde puedes mejorar. Considera pequeñas rutinas de autocuidado: ejercicio, descanso, conexión social.' };
  if (pct >= 40) return { label: 'Necesitas apoyo',         emoji: '😟', color: '#F97316', bg: '#FFEDD5', advice: 'Estás pasando por un momento difícil. Hablar con alguien de confianza o un psicólogo puede ayudarte mucho. No estás solo/a.' };
  return         { label: 'Atención prioritaria',           emoji: '🆘', color: '#EF4444', bg: '#FEE2E2', advice: 'Tus respuestas indican que estás en un momento muy difícil. Te recomendamos hablar con un psicólogo lo antes posible. Usa el chat de emergencia.' };
}

export default function EmotionalTestScreen({ navigation }) {
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [finished, setFinished] = useState(false);
  const [result, setResult]     = useState(null);
  const [saving, setSaving]     = useState(false);

  const question = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  const handleAnswer = async (value) => {
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      // Calcular resultado
      const total = Object.values(newAnswers).reduce((a, b) => a + b, 0);
      const res = getResult(total);
      setResult({ ...res, score: total, maxScore: QUESTIONS.length * 5 });
      setFinished(true);

      // Guardar en Firestore
      setSaving(true);
      try {
        await addDoc(collection(db, 'emotional_tests'), {
          userId: auth.currentUser.uid,
          answers: newAnswers,
          score: total,
          maxScore: QUESTIONS.length * 5,
          resultLabel: res.label,
          resultEmoji: res.emoji,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.log('Error guardando test:', e);
      }
      setSaving(false);
    }
  };

  if (finished && result) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F7F0FF' }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View style={[styles.resultHeader, { backgroundColor: result.bg }]}>
          <Text style={{ fontSize: 72 }}>{result.emoji}</Text>
          <Text style={[styles.resultLabel, { color: result.color }]}>{result.label}</Text>
          <Text style={styles.resultScore}>{result.score} / {result.maxScore} puntos</Text>
        </View>

        {/* Barra de puntaje */}
        <View style={styles.scoreBarBg}>
          <View style={[styles.scoreBarFill, {
            width: `${(result.score / result.maxScore) * 100}%`,
            backgroundColor: result.color,
          }]} />
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>💡 Nuestro consejo</Text>
          <Text style={styles.adviceText}>{result.advice}</Text>
        </View>

        {/* Desglose por categoría */}
        <Text style={styles.sectionTitle}>Tu resultado por área</Text>
        {QUESTIONS.map(q => {
          const val = answers[q.id] || 0;
          const pct = (val / 5) * 100;
          return (
            <View key={q.id} style={styles.categoryRow}>
              <Text style={styles.categoryEmoji}>{q.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{q.id === 'mood' ? 'Estado de ánimo' : q.id === 'anxiety' ? 'Ansiedad' : q.id === 'sleep' ? 'Sueño' : q.id === 'social' ? 'Social' : q.id === 'motivation' ? 'Motivación' : q.id === 'selfesteem' ? 'Autoestima' : 'Estrés'}</Text>
                <View style={styles.miniBarBg}>
                  <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: pct >= 60 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#EF4444' }]} />
                </View>
              </View>
              <Text style={{ fontWeight: '700', color: '#5A4A6B', fontSize: 13 }}>{val}/5</Text>
            </View>
          );
        })}

        <View style={{ gap: 12, marginTop: 24 }}>
          {result.color === '#EF4444' && (
            <TouchableOpacity onPress={() => navigation.navigate('EmergencyChat')} style={[styles.btn, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.btnText}>🆘 Ir al chat de emergencia</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Psychologists')} style={styles.btn}>
            <Text style={styles.btnText}>🔍 Buscar un psicólogo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TestHistory')} style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>📊 Ver mi historial</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F0FF' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Test Emocional</Text>
          <Text style={styles.headerSub}>Pregunta {current + 1} de {QUESTIONS.length}</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* Pregunta */}
        <View style={styles.questionCard}>
          <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 16 }}>{question.emoji}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Opciones */}
        <View style={{ gap: 12, marginTop: 8 }}>
          {question.options.map((opt, i) => (
            <TouchableOpacity key={i} onPress={() => handleAnswer(opt.value)} style={styles.optionCard}>
              <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#5B2D8E', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  progressBg: { height: 6, backgroundColor: '#DDD0F0' },
  progressFill: { height: 6, backgroundColor: '#FFD93D', borderRadius: 3 },
  questionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 16, elevation: 4, shadowColor: '#5B2D8E', shadowOpacity: 0.1, shadowRadius: 12 },
  questionText: { fontSize: 18, fontWeight: '800', color: '#1A0A2E', textAlign: 'center', lineHeight: 26 },
  optionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 2, borderWidth: 1.5, borderColor: '#EDE0FF' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#1A0A2E', flex: 1 },
  resultHeader: { borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 16 },
  resultLabel: { fontSize: 22, fontWeight: '900', marginTop: 12 },
  resultScore: { fontSize: 14, color: '#5A4A6B', marginTop: 4, fontWeight: '600' },
  scoreBarBg: { height: 12, backgroundColor: '#EDE0FF', borderRadius: 6, marginBottom: 20, overflow: 'hidden' },
  scoreBarFill: { height: 12, borderRadius: 6 },
  adviceCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#5B2D8E', elevation: 2 },
  adviceTitle: { fontSize: 14, fontWeight: '800', color: '#5B2D8E', marginBottom: 6 },
  adviceText: { fontSize: 14, color: '#5A4A6B', lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A0A2E', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryEmoji: { fontSize: 20, width: 28 },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#5A4A6B', marginBottom: 4 },
  miniBarBg: { height: 8, backgroundColor: '#EDE0FF', borderRadius: 4, overflow: 'hidden' },
  miniBarFill: { height: 8, borderRadius: 4 },
  btn: { backgroundColor: '#5B2D8E', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnOutline: { borderWidth: 2, borderColor: '#5B2D8E', borderRadius: 14, padding: 14, alignItems: 'center' },
  btnOutlineText: { color: '#5B2D8E', fontWeight: '700', fontSize: 14 },
});