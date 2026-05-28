import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

const TYPE_INFO = {
  nota:          { label: 'Nota de sesión',   color: colors.soft,      text: colors.lilac,   mood: 'calm'    },
  diagnostico:   { label: 'Diagnóstico',      color: '#E0F2FF',        text: '#0369A1',      mood: 'calm'    },
  medicamento:   { label: 'Medicamento',      color: colors.happyBg,   text: colors.happy,   mood: 'happy'   },
  tratamiento:   { label: 'Tratamiento',      color: colors.anxiousBg, text: colors.anxious, mood: 'anxious' },
  recomendacion: { label: 'Recomendación',    color: colors.calmBg,    text: colors.calm,    mood: 'calm'    },
};

function fileIcon(mimeType) {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType?.startsWith('image/')) return '🖼️';
  return '📎';
}

function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const FILTERS = [
  { key: 'all',          label: 'Todo'            },
  { key: 'diagnostico',  label: 'Diagnósticos'    },
  { key: 'medicamento',  label: 'Medicamentos'    },
  { key: 'tratamiento',  label: 'Tratamientos'    },
  { key: 'nota',         label: 'Notas'           },
  { key: 'recomendacion',label: 'Recomendaciones' },
];

export default function PatientClinicalHistoryScreen({ navigation }) {
  const [entries, setEntries]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'clinical_history'),
          where('patientId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.log(e); }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = activeFilter === 'all'
    ? entries
    : entries.filter(e => e.type === activeFilter);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mi Historia Clínica</Text>
          <Text style={styles.headerSub}>{entries.length} entrada{entries.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Aviso privacidad */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyText}>
          Información confidencial — solo visible para ti y tu psicólogo
        </Text>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}>
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="calm" size={100} />
          <Text style={styles.emptyTitle}>
            {activeFilter === 'all'
              ? 'Tu psicólogo aún no ha agregado entradas'
              : `Sin entradas de tipo "${TYPE_INFO[activeFilter]?.label}"`}
          </Text>
          <Text style={styles.emptySub}>
            Las entradas aparecerán aquí después de tus sesiones
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.map(entry => {
            const t = TYPE_INFO[entry.type] || TYPE_INFO.nota;
            return (
              <View key={entry.id} style={styles.entryCard}>
                {/* Cabecera */}
                <View style={styles.entryTop}>
                  <View style={[styles.typeBadge, { backgroundColor: t.color }]}>
                    <MindCharacter mood={t.mood} size={20} />
                    <Text style={[styles.typeText, { color: t.text }]}>{t.label}</Text>
                  </View>
                  <Text style={styles.entryDate}>
                    {new Date(entry.createdAt).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </Text>
                </View>

                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryDesc}>{entry.description}</Text>

                {/* Medicamento */}
                {entry.type === 'medicamento' && (
                  <View style={styles.detailBox}>
                    <Text style={styles.detailTitle}>Medicamento recetado</Text>
                    <View style={styles.detailGrid}>
                      {[
                        ['Medicamento', entry.medication],
                        ['Dosis',       entry.dosage],
                        ['Frecuencia',  entry.frequency],
                        ['Duración',    entry.duration],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <View key={label} style={styles.detailItem}>
                          <Text style={styles.detailLabel}>{label.toUpperCase()}</Text>
                          <Text style={styles.detailValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        Sigue las instrucciones de tu psicólogo. No modifiques la dosis sin consultarlo.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Diagnóstico */}
                {entry.type === 'diagnostico' && (
                  <View style={styles.detailBox}>
                    <Text style={styles.detailTitle}>Tu diagnóstico</Text>
                    <Text style={styles.detailLabel}>DIAGNÓSTICO</Text>
                    <Text style={styles.detailValue}>{entry.diagnosis}</Text>
                    {entry.icd && (
                      <>
                        <Text style={[styles.detailLabel, { marginTop: 8 }]}>CÓDIGO CIE-10</Text>
                        <Text style={styles.detailValue}>{entry.icd}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Tratamiento */}
                {entry.type === 'tratamiento' && (
                  <View style={styles.detailBox}>
                    <Text style={styles.detailTitle}>Plan de tratamiento</Text>
                    <Text style={styles.detailLabel}>PLAN</Text>
                    <Text style={styles.detailValue}>{entry.treatmentPlan}</Text>
                    {entry.treatmentGoals && (
                      <>
                        <Text style={[styles.detailLabel, { marginTop: 8 }]}>OBJETIVOS</Text>
                        <Text style={styles.detailValue}>{entry.treatmentGoals}</Text>
                      </>
                    )}
                    {entry.treatmentFreq && (
                      <>
                        <Text style={[styles.detailLabel, { marginTop: 8 }]}>FRECUENCIA</Text>
                        <Text style={styles.detailValue}>{entry.treatmentFreq}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Adjuntos */}
                {entry.attachments?.length > 0 && (
                  <View style={[styles.detailBox, { backgroundColor: '#F0F7FF' }]}>
                    <Text style={[styles.detailTitle, { color: '#0369A1' }]}>
                      Archivos adjuntos ({entry.attachments.length})
                    </Text>
                    {entry.attachments.map((att, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => Linking.openURL(att.url)}
                        style={styles.attachRow}>
                        <View style={styles.attachIcon}>
                          <Text style={{ fontSize: 20 }}>{fileIcon(att.mimeType)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.attachName} numberOfLines={1}>{att.name}</Text>
                          <Text style={styles.attachSize}>{fileSize(att.size)}</Text>
                        </View>
                        <Text style={{ color: '#0369A1', fontFamily: fonts.bold, fontSize: 12 }}>
                          Abrir
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <MindCharacter mood="calm" size={20} />
                  <Text style={styles.footerText}>Registrado por tu psicólogo</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { color: '#fff', fontSize: 20 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 20, color: '#fff', textAlign: 'center' },
  headerSub:   { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 2 },

  privacyBanner: {
    backgroundColor: colors.navy,
    paddingVertical: 8, paddingHorizontal: 20,
  },
  privacyText: {
    fontFamily: fonts.medium, fontSize: 11,
    color: 'rgba(255,255,255,0.45)', textAlign: 'center',
  },

  filtersScroll:  { maxHeight: 56 },
  filtersContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterChip: {
    backgroundColor: colors.white, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1.5, borderColor: 'rgba(123,113,153,0.12)',
  },
  filterChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText:       { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  filterTextActive: { color: '#fff', fontFamily: fonts.bold },

  list: { padding: 20, gap: 14, paddingBottom: 40 },

  entryCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 16, gap: 10, ...shadow.card,
  },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  typeText:  { fontFamily: fonts.bold, fontSize: 12 },
  entryDate: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  entryTitle:{ fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  entryDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 20 },

  detailBox: {
    backgroundColor: colors.soft, borderRadius: radius.md,
    padding: 14, gap: 4,
  },
  detailTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.lilac, marginBottom: 6 },
  detailGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  detailItem:  { minWidth: '45%', flex: 1 },
  detailLabel: { fontFamily: fonts.bold, fontSize: 9, color: colors.muted, letterSpacing: 0.8 },
  detailValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.navy, marginTop: 2 },

  warningBox: {
    backgroundColor: '#FEF3C7', borderRadius: radius.sm,
    padding: 10, marginTop: 6,
  },
  warningText: { fontFamily: fonts.regular, fontSize: 11, color: '#92400E', lineHeight: 16 },

  attachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: 10, marginTop: 6,
  },
  attachIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  attachName: { fontFamily: fonts.medium, fontSize: 12, color: colors.navy },
  attachSize: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, marginTop: 1 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: colors.soft, paddingTop: 10,
  },
  footerText: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.navy, textAlign: 'center' },
  emptySub:   { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});