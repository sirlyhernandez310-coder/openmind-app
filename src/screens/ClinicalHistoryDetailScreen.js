import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator, Linking
} from 'react-native';
import {
  collection, query, where, getDocs,
  addDoc, orderBy, doc, deleteDoc
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { auth, db, storage } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';

const ENTRY_TYPES = [
  { key: 'nota',          label: 'Nota',          color: colors.soft,      text: colors.lilac,   mood: 'calm'    },
  { key: 'diagnostico',   label: 'Diagnóstico',   color: '#E0F2FF',        text: '#0369A1',      mood: 'calm'    },
  { key: 'medicamento',   label: 'Medicamento',   color: colors.happyBg,   text: colors.happy,   mood: 'happy'   },
  { key: 'tratamiento',   label: 'Tratamiento',   color: colors.anxiousBg, text: colors.anxious, mood: 'anxious' },
  { key: 'recomendacion', label: 'Recomendación', color: colors.calmBg,    text: colors.calm,    mood: 'calm'    },
];

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

export default function ClinicalHistoryDetailScreen({ route, navigation }) {
  const { patient } = route.params;
  const [entries, setEntries]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType]       = useState('nota');
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [medication, setMedication]     = useState('');
  const [dosage, setDosage]             = useState('');
  const [frequency, setFrequency]       = useState('');
  const [duration, setDuration]         = useState('');
  const [diagnosis, setDiagnosis]       = useState('');
  const [icd, setIcd]                   = useState('');
  const [treatmentPlan, setTreatmentPlan]   = useState('');
  const [treatmentGoals, setTreatmentGoals] = useState('');
  const [treatmentFreq, setTreatmentFreq]   = useState('');
  const [attachments, setAttachments]   = useState([]);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving]             = useState(false);
  const [focused, setFocused]           = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'clinical_history'),
        where('patientId', '==', patient.id),
        where('psychologistId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setMedication('');
    setDosage(''); setFrequency(''); setDuration('');
    setDiagnosis(''); setIcd(''); setTreatmentPlan('');
    setTreatmentGoals(''); setTreatmentFreq('');
    setAttachments([]); setEntryType('nota'); setUploadProgress(0);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('Archivo muy grande', 'Máximo 10 MB'); return;
      }
      setUploading(true);
      setUploadProgress(0);
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `clinical_files/${patient.id}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTask.on('state_changed',
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err  => { Alert.alert('Error al subir', err.message); setUploading(false); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setAttachments(prev => [...prev, {
            name: file.name, url, mimeType: file.mimeType,
            size: file.size, storagePath: `clinical_files/${patient.id}/${fileName}`,
          }]);
          setUploading(false); setUploadProgress(0);
        }
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo adjuntar el archivo');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Campos requeridos', 'El título y la descripción son obligatorios'); return;
    }
    if (entryType === 'medicamento' && !medication.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del medicamento'); return;
    }
    if (entryType === 'diagnostico' && !diagnosis.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el diagnóstico'); return;
    }
    if (entryType === 'tratamiento' && !treatmentPlan.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el plan de tratamiento'); return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'clinical_history'), {
        patientId: patient.id, patientName: patient.name,
        psychologistId: auth.currentUser.uid,
        type: entryType, title: title.trim(), description: description.trim(),
        attachments,
        ...(entryType === 'medicamento'  ? { medication, dosage, frequency, duration } : {}),
        ...(entryType === 'diagnostico'  ? { diagnosis, icd } : {}),
        ...(entryType === 'tratamiento'  ? { treatmentPlan, treatmentGoals, treatmentFreq } : {}),
        createdAt: new Date().toISOString(),
      });
      resetForm(); setModalVisible(false); load();
    } catch (e) { Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'); }
    setSaving(false);
  };

  const handleDelete = (entry) => {
    Alert.alert('Eliminar entrada', '¿Seguro que quieres eliminar esta entrada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        for (const att of (entry.attachments || [])) {
          try { await deleteObject(ref(storage, att.storagePath)); } catch (_) {}
        }
        await deleteDoc(doc(db, 'clinical_history', entry.id));
        load();
      }},
    ]);
  };

  const typeInfo = (key) => ENTRY_TYPES.find(t => t.key === key) || ENTRY_TYPES[0];

  const inputStyle = (key) => [
    styles.input,
    focused === key && { borderColor: colors.lilac, ...shadow.card },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{patient.name}</Text>
          <Text style={styles.headerSub}>{entries.length} entrada{entries.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="calm" size={100} />
          <Text style={styles.emptyTitle}>Sin entradas aún</Text>
          <Text style={styles.emptySub}>
            Toca el botón + para agregar la primera entrada clínica
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.startBtn}>
            <Text style={styles.startBtnText}>+ Nueva entrada</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {entries.map(entry => {
            const t = typeInfo(entry.type);
            return (
              <View key={entry.id} style={styles.entryCard}>
                {/* Tipo + fecha */}
                <View style={styles.entryTop}>
                  <View style={[styles.typeBadge, { backgroundColor: t.color }]}>
                    <MindCharacter mood={t.mood} size={20} />
                    <Text style={[styles.typeText, { color: t.text }]}>{t.label}</Text>
                  </View>
                  <View style={styles.entryActions}>
                    <Text style={styles.entryDate}>
                      {new Date(entry.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(entry)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryDesc}>{entry.description}</Text>

                {/* Medicamento */}
                {entry.type === 'medicamento' && (
                  <View style={styles.extraBox}>
                    <Text style={styles.extraTitle}>Detalles del medicamento</Text>
                    <View style={styles.extraGrid}>
                      {[
                        ['Medicamento', entry.medication],
                        ['Dosis',       entry.dosage],
                        ['Frecuencia',  entry.frequency],
                        ['Duración',    entry.duration],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <View key={label} style={styles.extraItem}>
                          <Text style={styles.extraLabel}>{label.toUpperCase()}</Text>
                          <Text style={styles.extraValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Diagnóstico */}
                {entry.type === 'diagnostico' && (
                  <View style={styles.extraBox}>
                    <Text style={styles.extraTitle}>Diagnóstico</Text>
                    <Text style={styles.extraLabel}>DIAGNÓSTICO</Text>
                    <Text style={styles.extraValue}>{entry.diagnosis}</Text>
                    {entry.icd && (
                      <>
                        <Text style={[styles.extraLabel, { marginTop: 8 }]}>CÓDIGO CIE-10</Text>
                        <Text style={styles.extraValue}>{entry.icd}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Tratamiento */}
                {entry.type === 'tratamiento' && (
                  <View style={styles.extraBox}>
                    <Text style={styles.extraTitle}>Plan de tratamiento</Text>
                    <Text style={styles.extraLabel}>PLAN</Text>
                    <Text style={styles.extraValue}>{entry.treatmentPlan}</Text>
                    {entry.treatmentGoals && (
                      <>
                        <Text style={[styles.extraLabel, { marginTop: 8 }]}>OBJETIVOS</Text>
                        <Text style={styles.extraValue}>{entry.treatmentGoals}</Text>
                      </>
                    )}
                    {entry.treatmentFreq && (
                      <>
                        <Text style={[styles.extraLabel, { marginTop: 8 }]}>FRECUENCIA</Text>
                        <Text style={styles.extraValue}>{entry.treatmentFreq}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Adjuntos */}
                {entry.attachments?.length > 0 && (
                  <View style={[styles.extraBox, { backgroundColor: '#F0F7FF' }]}>
                    <Text style={[styles.extraTitle, { color: '#0369A1' }]}>
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
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      {entries.length > 0 && (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.cream }}
            contentContainerStyle={{ paddingBottom: 60 }}>

            {/* Header modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva entrada clínica</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.error }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 14 }}>

              {/* Selector tipo */}
              <Text style={styles.fieldLabel}>TIPO DE ENTRADA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ENTRY_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setEntryType(t.key)}
                      style={[styles.typeChip,
                        entryType === t.key && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
                      <MindCharacter mood={t.mood} size={28} />
                      <Text style={[styles.typeChipText,
                        entryType === t.key && { color: '#fff' }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Campos comunes */}
              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>TÍTULO *</Text>
                <TextInput
                  style={inputStyle('title')}
                  value={title} onChangeText={setTitle}
                  placeholder="Título de la entrada"
                  placeholderTextColor={colors.muted}
                  onFocus={() => setFocused('title')}
                  onBlur={() => setFocused(null)}
                />

                <Text style={styles.fieldLabel}>OBSERVACIONES *</Text>
                <TextInput
                  style={[inputStyle('desc'), styles.textArea]}
                  value={description} onChangeText={setDescription}
                  placeholder="Escribe tus observaciones clínicas..."
                  placeholderTextColor={colors.muted}
                  multiline numberOfLines={5}
                  textAlignVertical="top"
                  onFocus={() => setFocused('desc')}
                  onBlur={() => setFocused(null)}
                />

                {/* Medicamento */}
                {entryType === 'medicamento' && (
                  <>
                    <View style={styles.divider}>
                      <Text style={styles.dividerText}>Detalles del medicamento</Text>
                    </View>
                    <Text style={styles.fieldLabel}>MEDICAMENTO *</Text>
                    <TextInput style={inputStyle('med')} value={medication}
                      onChangeText={setMedication} placeholder="Nombre del medicamento"
                      placeholderTextColor={colors.muted}
                      onFocus={() => setFocused('med')} onBlur={() => setFocused(null)} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>DOSIS</Text>
                        <TextInput style={inputStyle('dos')} value={dosage}
                          onChangeText={setDosage} placeholder="Ej: 10mg"
                          placeholderTextColor={colors.muted}
                          onFocus={() => setFocused('dos')} onBlur={() => setFocused(null)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>FRECUENCIA</Text>
                        <TextInput style={inputStyle('frq')} value={frequency}
                          onChangeText={setFrequency} placeholder="Ej: 1/día"
                          placeholderTextColor={colors.muted}
                          onFocus={() => setFocused('frq')} onBlur={() => setFocused(null)} />
                      </View>
                    </View>
                    <Text style={styles.fieldLabel}>DURACIÓN</Text>
                    <TextInput style={inputStyle('dur')} value={duration}
                      onChangeText={setDuration} placeholder="Ej: 3 meses"
                      placeholderTextColor={colors.muted}
                      onFocus={() => setFocused('dur')} onBlur={() => setFocused(null)} />
                  </>
                )}

                {/* Diagnóstico */}
                {entryType === 'diagnostico' && (
                  <>
                    <View style={styles.divider}>
                      <Text style={styles.dividerText}>Datos del diagnóstico</Text>
                    </View>
                    <Text style={styles.fieldLabel}>DIAGNÓSTICO *</Text>
                    <TextInput style={[inputStyle('diag'), { minHeight: 60 }]}
                      value={diagnosis} onChangeText={setDiagnosis}
                      placeholder="Describe el diagnóstico" multiline
                      placeholderTextColor={colors.muted}
                      onFocus={() => setFocused('diag')} onBlur={() => setFocused(null)} />
                    <Text style={styles.fieldLabel}>CÓDIGO CIE-10 (opcional)</Text>
                    <TextInput style={inputStyle('icd')} value={icd}
                      onChangeText={setIcd} placeholder="Ej: F41.1"
                      placeholderTextColor={colors.muted} autoCapitalize="characters"
                      onFocus={() => setFocused('icd')} onBlur={() => setFocused(null)} />
                  </>
                )}

                {/* Tratamiento */}
                {entryType === 'tratamiento' && (
                  <>
                    <View style={styles.divider}>
                      <Text style={styles.dividerText}>Plan de tratamiento</Text>
                    </View>
                    <Text style={styles.fieldLabel}>PLAN *</Text>
                    <TextInput style={[inputStyle('plan'), styles.textArea]}
                      value={treatmentPlan} onChangeText={setTreatmentPlan}
                      placeholder="Describe el plan terapéutico" multiline numberOfLines={4}
                      textAlignVertical="top" placeholderTextColor={colors.muted}
                      onFocus={() => setFocused('plan')} onBlur={() => setFocused(null)} />
                    <Text style={styles.fieldLabel}>OBJETIVOS</Text>
                    <TextInput style={[inputStyle('goals'), { minHeight: 60 }]}
                      value={treatmentGoals} onChangeText={setTreatmentGoals}
                      placeholder="Objetivos terapéuticos" multiline
                      placeholderTextColor={colors.muted}
                      onFocus={() => setFocused('goals')} onBlur={() => setFocused(null)} />
                    <Text style={styles.fieldLabel}>FRECUENCIA DE SESIONES</Text>
                    <TextInput style={inputStyle('tfreq')} value={treatmentFreq}
                      onChangeText={setTreatmentFreq} placeholder="Ej: 1 sesión semanal"
                      placeholderTextColor={colors.muted}
                      onFocus={() => setFocused('tfreq')} onBlur={() => setFocused(null)} />
                  </>
                )}
              </View>

              {/* Adjuntos */}
              <View style={styles.formCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.fieldLabel}>ARCHIVOS ADJUNTOS</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.muted }}>
                    PDF o imagen · máx. 10MB
                  </Text>
                </View>

                {attachments.map((att, i) => (
                  <View key={i} style={styles.attachPreview}>
                    <Text style={{ fontSize: 18 }}>{fileIcon(att.mimeType)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attachName} numberOfLines={1}>{att.name}</Text>
                      <Text style={styles.attachSize}>{fileSize(att.size)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                      style={styles.removeBtn}>
                      <Text style={{ color: colors.error, fontFamily: fonts.bold, fontSize: 12 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {uploading && (
                  <View style={styles.progressWrap}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.lilac }}>
                        Subiendo...
                      </Text>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.lilac }}>
                        {uploadProgress}%
                      </Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handlePickFile}
                  disabled={uploading}
                  style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}>
                  <Text style={styles.uploadBtnText}>
                    {uploading ? 'Subiendo archivo...' : 'Adjuntar archivo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Guardar */}
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, (saving || uploading) && { opacity: 0.6 }]}
                disabled={saving || uploading}
                activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>
                  {saving ? 'Guardando...' : 'Guardar entrada'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 20, color: '#fff' },
  headerSub:   { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.lilac,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: colors.navy, fontSize: 24, fontFamily: fonts.bold, lineHeight: 28 },

  list: { padding: 20, gap: 14, paddingBottom: 100 },

  entryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg, padding: 16, gap: 10,
    ...shadow.card,
  },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  typeText:    { fontFamily: fonts.bold, fontSize: 12 },
  entryActions:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryDate:   { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  deleteBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 8,
    padding: 5, paddingHorizontal: 8,
  },
  deleteBtnText: { color: colors.error, fontFamily: fonts.bold, fontSize: 12 },
  entryTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  entryDesc:  { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 20 },

  extraBox: {
    backgroundColor: colors.soft, borderRadius: radius.md,
    padding: 12, gap: 4,
  },
  extraTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.lilac, marginBottom: 6 },
  extraGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  extraItem:  { minWidth: '45%', flex: 1 },
  extraLabel: { fontFamily: fonts.bold, fontSize: 9, color: colors.muted, letterSpacing: 0.8 },
  extraValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.navy, marginTop: 2 },

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

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.strong,
  },
  fabText: { color: '#fff', fontSize: 26, fontFamily: fonts.bold, lineHeight: 30 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.navy },
  emptySub:   { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
  startBtn: {
    backgroundColor: colors.navy, borderRadius: radius.full,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 8, ...shadow.strong,
  },
  startBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },

  modalHeader: {
    backgroundColor: colors.white,
    padding: 20, paddingTop: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.soft,
  },
  modalTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy },

  fieldLabel: {
    fontFamily: fonts.bold, fontSize: 10,
    letterSpacing: 1.2, color: colors.muted, marginBottom: 8,
  },
  typeChip: {
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.soft,
    backgroundColor: colors.white, minWidth: 88,
  },
  typeChipText: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },

  formCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 18, gap: 4, ...shadow.card,
  },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: 'rgba(123,113,153,0.15)',
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: fonts.regular, fontSize: 14,
    color: colors.navy, marginBottom: 12,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  divider: {
    backgroundColor: colors.soft, borderRadius: radius.sm,
    padding: 10, marginBottom: 4, marginTop: 4,
  },
  dividerText: { fontFamily: fonts.bold, fontSize: 12, color: colors.lilac },

  uploadBtn: {
    backgroundColor: colors.cream, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.soft, borderStyle: 'dashed',
    padding: 16, alignItems: 'center',
  },
  uploadBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.lilac },
  attachPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.soft, borderRadius: radius.md,
    padding: 10, marginBottom: 8,
  },
  removeBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 6 },
  progressWrap: { backgroundColor: colors.soft, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  progressBg:   { height: 8, backgroundColor: 'rgba(123,113,153,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.lilac, borderRadius: 4 },

  saveBtn: {
    backgroundColor: colors.navy, borderRadius: radius.full,
    padding: 17, alignItems: 'center', ...shadow.strong,
  },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff', letterSpacing: 0.3 },
});