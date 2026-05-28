import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import MindCharacter from '../components/MindCharacter';
import { colors, fonts, radius, shadow } from '../theme';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

function StarIcon({ filled }) {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24"
      fill={filled ? colors.anxious : 'none'}
      stroke={colors.anxious} strokeWidth="2">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={colors.muted} strokeWidth="1.8" strokeLinecap="round">
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
}

const SPECIALTIES = ['Todos', 'Clínica', 'Infantil', 'Ansiedad', 'Pareja', 'Trauma'];

export default function PsychologistsScreen({ navigation }) {
  const [psychologists, setPsychologists] = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [activeFilter, setActiveFilter]   = useState('Todos');

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'psychologist'),
        where('approved', '==', true)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPsychologists(data);
      setFiltered(data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let result = psychologists;
    if (search.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.specialty || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (activeFilter !== 'Todos') {
      result = result.filter(p =>
        (p.specialty || '').toLowerCase().includes(activeFilter.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, activeFilter, psychologists]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Psicólogos</Text>
          <Text style={styles.headerSub}>{filtered.length} disponibles</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Buscador */}
      <View style={styles.searchWrap}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o especialidad..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtros */}
      <FlatList
        horizontal
        data={SPECIALTIES}
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveFilter(item)}
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}>
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.lilac} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MindCharacter mood="sad" size={100} />
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptySub}>Intenta con otro filtro o búsqueda</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                {/* Avatar con personaje */}
                <View style={styles.avatarWrap}>
                  <MindCharacter mood="happy" size={64} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.psyName}>{p.name}</Text>
                  <Text style={styles.psySpecialty}>{p.specialty || 'Psicología General'}</Text>
                  <Text style={styles.psyLicense}>Lic. {p.license}</Text>
                  {/* Estrellas */}
                  <View style={styles.starsRow}>
                    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= 5} />)}
                    <Text style={styles.ratingText}>5.0</Text>
                  </View>
                </View>
              </View>

              {p.bio ? (
                <Text style={styles.bio} numberOfLines={2}>{p.bio}</Text>
              ) : (
                <Text style={styles.bio} numberOfLines={2}>
                  Profesional comprometido con el bienestar mental y emocional de sus pacientes.
                </Text>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.expBadge}>
                  <Text style={styles.expText}>{p.experience || '3'} años de exp.</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Booking', { psychologist: p })}
                  style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Agendar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#fff', textAlign: 'center' },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.12)',
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.navy,
    paddingVertical: 13,
  },

  filtersRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(123,113,153,0.12)',
  },
  filterChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  filterTextActive: { color: '#fff' },

  list: { padding: 20, gap: 14, paddingBottom: 40 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarWrap: {
    width: 72, height: 72,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  psyName: { fontFamily: fonts.bold, fontSize: 16, color: colors.navy },
  psySpecialty: { fontFamily: fonts.medium, fontSize: 13, color: colors.lilac, marginTop: 2 },
  psyLicense: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 },
  ratingText: { fontFamily: fonts.bold, fontSize: 11, color: colors.anxious, marginLeft: 4 },

  bio: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 20 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expBadge: {
    backgroundColor: colors.soft,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expText: { fontFamily: fonts.medium, fontSize: 12, color: colors.lilac },
  bookBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    ...shadow.card,
  },
  bookBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.navy },
  emptySub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
});