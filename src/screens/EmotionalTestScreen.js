import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

const { width } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 'mood',
    question: '¿Cómo describirías tu estado de ánimo hoy?',
    mood: 'calm',
    options: [
      { label: 'Muy bien, me siento feliz',        value: 5 },
      { label: 'Bien, todo normal',                value: 4 },
      { label: 'Regular, ni bien ni mal',          value: 3 },
      { label: 'Mal, me siento bajo',              value: 2 },
      { label: 'Muy mal, me siento terrible',      value: 1 },
    ],
  },
  {
    id: 'anxiety',
    question: '¿Has sentido ansiedad o preocupación excesiva esta semana?',
    mood: 'anxious',
    options: [
      { label: 'Para nada',                        value: 5 },
      { label: 'Un poco, pero manejable',          value: 4 },
      { label: 'Sí, me ha costado concentrarme',  value: 3 },
      { label: 'Bastante, afecta mi día a día',    value: 2 },
      { label: 'Mucho, casi todo el tiempo',       value: 1 },
    ],
  },
  {
    id: 'sleep',
    question: '¿Cómo ha sido tu sueño últimamente?',
    mood: 'calm',
    options: [
      { label: 'Excelente, duermo muy bien',       value: 5 },
      { label: 'Bien, aunque con variaciones',     value: 4 },
      { label: 'Regular, a veces no puedo',        value: 3 },
      { label: 'Mal, me cuesta dormir',            value: 2 },
      { label: 'Muy mal, casi no duermo',          value: 1 },
    ],
  },
  {
    id: 'social',
    question: '¿Cómo te sientes en tus relaciones sociales?',
    mood: 'happy',
    options: [
      { label: 'Muy conectado con los demás',      value: 5 },
      { label: 'Bien, tengo apoyo',                value: 4 },
      { label: 'Un poco distante a veces',         value: 3 },
      { label: 'Me siento solo bastante',          value: 2 },
      { label: 'Completamente aislado',            value: 1 },
    ],
  },
  {
    id: 'motivation',
    question: '¿Cómo está tu motivación y energía?',
    mood: 'happy',
    options: [
      { label: 'Con mucha energía y ganas',        value: 5 },
      { label: 'Bien, puedo con mis cosas',        value: 4 },
      { label: 'Regular, me cuesta arrancar',      value: 3 },
      { label: 'Poca energía, casi no hago nada',  value: 2 },
      { label: 'Sin energía ni motivación',        value: 1 },
    ],
  },
  {
    id: 'selfesteem',
    question: '¿Cómo te sientes contigo mismo/a?',
    mood: 'calm',
    options: [
      { label: 'Me acepto y valoro mucho',         value: 5 },
      { label: 'Bien, con confianza',              value: 4 },
      { label: 'Con altibajos',                    value: 3 },
      { label: 'Mal, me critico mucho',            value: 2 },
      { label: 'Muy mal conmigo mismo/a',          value: 1 },
    ],
  },
  {
    id: 'stress',
    question: '¿Cuánto estrés has sentido esta semana?',
    mood: 'anxious',
    options: [
      { label: 'Sin estrés, muy tranquilo/a',      value: 5 },
      { label: 'Algo de estrés, normal',           value: 4 },
      { label: 'Estrés moderado',                  value: 3 },
      { label: 'Mucho estrés',                     value: 2 },
      { label: 'Estrés extremo, al límite',        value: 1 },
    ],
  },
];

function getResult(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return {
    label: 'Excelente bienestar',
    mood:  'happy',
    color: colors.happy,
    bg:    colors.happyBg,
    advice: 'Tu salud mental está en un gran momento. Sigue manteniendo tus hábitos saludables y celebra cómo te sientes hoy.',
  };
  if (pct >= 60) return {
    label: 'Bienestar moderado',
    mood:  'calm',
    color: colors.calm,
    bg:    colors.calmBg,
    advice: 'Vas bien, pero hay áreas donde puedes mejorar. Considera pequeñas rutinas de autocuidado: ejercicio, descanso y conexión social.',
  };
  if (pct >= 40) return {
    label: 'Necesitas apoyo',
    mood:  'sad',
    color: colors.sad,
    bg:    colors.sadBg,
    advice: 'Estás pasando por un momento difícil. Hablar con un psicólogo puede ayudarte mucho. No estás solo/a en esto.',
  };
  return {
    label: 'Atención prioritaria',
    mood:  'anxious',
    color: colors.anxious,
    bg:    colors.anxiousBg,
    advice: 'Tus respuestas indican que estás en un momento muy difícil. Te recomendamos hablar con un psicólogo lo antes posible.',
  };
}

const CATEGORY_NAMES = {
  mood:       'Estado de ánimo',
  anxiety:    'Ansiedad',
  sleep:      'Sueño',
  social:     'Vida social',
  motivation: 'Motivación',
  selfesteem: 'Autoestima',
  stress:     'Estrés',
};

export default function EmotionalTestScreen({ navigation }) {
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [finished, setFinished] = useState(false);
  const [result, setResult]     = useState(null);
  const [saving, setSaving]     = useState(false);

  const question = QUESTIONS[current];
  const progress = current / QUESTIONS.length;

  const handleAnswer = async (value) => {
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      const total = Object.values(newAnswers).reduce((a, b) => a + b, 0);
      const res   = getResult(total, QUESTIONS.length * 5);
      setResult({ ...res, score: total, maxScore: QUESTIONS.length * 5 });
      setFinished(true);
      setSaving(true);
      try {
        await addDoc(collection(db, 'emotional_tests'), {
          userId:      auth.currentUser.uid,
          answers:     newAnswers,
          score:       total,
          maxScore:    QUESTIONS.length * 5,
          resultLabel: res.label,
          createdAt:   new Date().toISOString(),
        });
      } catch (e) { console.log(e); }
      setSaving(false);
    }
  };

  // ── RESULTADO ────────────────────────────────────
  if (finished && result) {
    const pct = Math.round((result.score / result.maxScore) * 100);
    return (
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tu resultado</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          {/* Personaje resultado */}
          <View style={[styles.resultHero, { backgroundColor: result.bg }]}>
            <MindCharacter mood={result.mood} size={120} />
            <Text style={[styles.resultLabel, { color: result.color }]}>{result.label}</Text>
            <Text style={[styles.resultPct, { color: result.color }]}>{pct}%</Text>
          </View>

          {/* Barra de puntaje */}
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, {
              width: `${pct}%`,
              backgroundColor: result.color,
            }]} />
          </View>

          {/* Consejo */}
          <View style={[styles.adviceCard, { borderLeftColor: result.color }]}>
            <Text style={[styles.adviceTitle, { color: result.color }]}>Nuestro consejo</Text>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>

          {/* Desglose */}
          <Text style={styles.sectionTitle}>Resultado por área</Text>
          {QUESTIONS.map(q => {
            const val = answers[q.id] || 0;
            const pctQ = (val / 5) * 100;
            const barColor = pctQ >= 60 ? colors.happy : pctQ >= 40 ? colors.anxious : colors.sad;
            return (
              <View key={q.id} style={styles.categoryRow}>
                <MindCharacter mood={q.mood} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryName}>{CATEGORY_NAMES[q.id]}</Text>
                  <View style={styles.miniBarBg}>
                    <View style={[styles.miniBarFill, { width: `${pctQ}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
                <Text style={[styles.categoryScore, { color: barColor }]}>{val}/5</Text>
              </View>
            );
          })}

          {/* Botones */}
          {result.color === colors.anxious && (
            <TouchableOpacity
              onPress={() => navigation.navigate('EmergencyChat')}
              style={[styles.btn, { backgroundColor: colors.error }]}>
              <Text style={styles.btnText}>Ir al chat de emergencia</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Psychologists')}
            style={styles.btn}>
            <Text style={styles.btnText}>Buscar un psicólogo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('TestHistory')}
            style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>Ver mi historial</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── PREGUNTA ─────────────────────────────────────
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test emocional</Text>
        <Text style={styles.headerCount}>{current + 1}/{QUESTIONS.length}</Text>
      </View>

      {/* Barra progreso */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Personaje */}
        <View style={styles.charWrap}>
          <MindCharacter mood={question.mood} size={110} />
        </View>

        {/* Pregunta */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Opciones */}
        <View style={styles.optionsWrap}>
          {question.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleAnswer(opt.value)}
              style={styles.optionCard}
              activeOpacity={0.75}>
              <View style={[styles.optionNum, { backgroundColor: colors.soft }]}>
                <Text style={styles.optionNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  headerTitle: { fontFamily: fonts.serif, fontSize: 20, color: '#fff' },
  headerCount: { fontFamily: fonts.bold, fontSize: 14, color: colors.lilac },

  progressBg: { height: 4, backgroundColor: colors.soft },
  progressFill: { height: 4, backgroundColor: colors.lilac, borderRadius: 2 },

  body: { padding: 20, gap: 16, paddingBottom: 40 },

  charWrap: { alignItems: 'center', paddingVertical: 8 },

  questionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow.card,
  },
  questionText: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.navy,
    textAlign: 'center',
    lineHeight: 30,
  },

  optionsWrap: { gap: 10 },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadow.card,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.1)',
  },
  optionNum: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionNumText: { fontFamily: fonts.bold, fontSize: 13, color: colors.lilac },
  optionText: { fontFamily: fonts.medium, fontSize: 14, color: colors.navy, flex: 1, lineHeight: 20 },

  resultHero: {
    borderRadius: radius.xl,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  resultLabel: { fontFamily: fonts.serif, fontSize: 24, textAlign: 'center' },
  resultPct:   { fontFamily: fonts.bold, fontSize: 40 },

  scoreBarBg: {
    height: 12,
    backgroundColor: colors.soft,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBarFill: { height: 12, borderRadius: 6 },

  adviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 18,
    borderLeftWidth: 4,
    ...shadow.card,
  },
  adviceTitle: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 6 },
  adviceText:  { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 22 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    ...shadow.card,
  },
  categoryName:  { fontFamily: fonts.medium, fontSize: 12, color: colors.navy, marginBottom: 4 },
  miniBarBg:     { height: 6, backgroundColor: colors.soft, borderRadius: 3, overflow: 'hidden' },
  miniBarFill:   { height: 6, borderRadius: 3 },
  categoryScore: { fontFamily: fonts.bold, fontSize: 13, width: 30, textAlign: 'right' },

  btn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    padding: 17,
    alignItems: 'center',
    ...shadow.strong,
  },
  btnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff', letterSpacing: 0.3 },
  btnOutline: {
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radius.full,
    padding: 15,
    alignItems: 'center',
  },
  btnOutlineText: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
});