import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const NIVEAUX = ['1','2','3','4','5','6','7','8','P25','P50','P100','P250','P500','P1000','P1500'];
const CLUBS = ['Club Californie','Ain Diab Padel','Maarif Sport','OCC Padel'];
const TYPES = [
  { id: null, label: 'Tout', icon: '🎯' },
  { id: 'custom', label: 'Match', icon: '🎾' },
  { id: 'cession', label: 'Cession', icon: '🏟️' },
];

export default function RechercheScreen({ navigation }) {
  const [matchs, setMatchs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [filtreNiveau, setFiltreNiveau] = useState(null);
  const [filtreClub, setFiltreClub] = useState(null);
  const [filtreType, setFiltreType] = useState(null);
  const [rechercheFaite, setRechercheFaite] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
    chercher();
  }, []);

  const chercher = async (niveau = filtreNiveau, club = filtreClub, type = filtreType) => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    let query = supabase.from('matchs').select('*')
      .in('statut', ['ouvert'])
      .or(`date_match.is.null,date_match.gte.${today}`)
      .order('date_match', { ascending: true, nullsFirst: false });

    if (niveau) query = query.eq('niveau', niveau);
    if (club) query = query.eq('club', club);
    if (type) query = query.eq('type_match', type);

    const { data } = await query;
    setMatchs(data || []);
    setLoading(false);
    setRechercheFaite(true);
  };

  const setFiltre = (key, value, current) => {
    const val = current === value ? null : value;
    if (key === 'niveau') { setFiltreNiveau(val); chercher(val, filtreClub, filtreType); }
    if (key === 'club') { setFiltreClub(val); chercher(filtreNiveau, val, filtreType); }
    if (key === 'type') { setFiltreType(val); chercher(filtreNiveau, filtreClub, val); }
  };

  const resetFiltres = () => {
    setFiltreNiveau(null);
    setFiltreClub(null);
    setFiltreType(null);
    chercher(null, null, null);
  };

  const actifCount = [filtreNiveau, filtreClub, filtreType].filter(Boolean).length;

  const formatMsg = (m) => {
    if (m.type_match === 'cession') {
      let msg = `🏟️ Cession terrain`;
      if (m.prix) msg += ` · ${m.prix} DH`;
      if (m.description) msg += `\n💬 ${m.description}`;
      return msg;
    }
    if (m.slots && m.slots.length > 0) {
      const libres = m.slots.filter(s => !s.pris);
      if (libres.length === 0) return `🎾 Match complet ✅`;
      const desc = libres.map(s => s.type === 'binome' ? '🤝 Binôme' : `${s.cote === 'Droit' ? '➡️' : '⬅️'} ${s.cote}`).join(' · ');
      return `🎾 Cherche : ${desc} · Niveau ${m.niveau}`;
    }
    return `🎾 Match · Niveau ${m.niveau}`;
  };

  const rejoindre = (m) => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Recherche <Text style={{ color: COLORS.green }}>.</Text></Text>
          {actifCount > 0 && (
            <TouchableOpacity onPress={resetFiltres} style={s.resetBtn}>
              <Text style={s.resetText}>Réinitialiser ({actifCount})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Type */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Type d'annonce</Text>
          <View style={s.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={String(t.id)}
                style={[s.typeChip, filtreType === t.id && t.id !== null && s.typeChipA, t.id === null && filtreType === null && s.typeChipA]}
                onPress={() => setFiltre('type', t.id, filtreType)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                <Text style={[s.typeText, (filtreType === t.id || (t.id === null && filtreType === null)) && s.typeTextA]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Niveau */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Niveau</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {NIVEAUX.map(n => (
              <TouchableOpacity
                key={n}
                style={[s.nvChip, filtreNiveau === n && s.nvChipA]}
                onPress={() => setFiltre('niveau', n, filtreNiveau)}
                activeOpacity={0.8}
              >
                <Text style={[s.nvText, filtreNiveau === n && s.nvTextA]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Club */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Club</Text>
          <View style={s.clubsGrid}>
            {CLUBS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.clubChip, filtreClub === c && s.clubChipA]}
                onPress={() => setFiltre('club', c, filtreClub)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>🏟️</Text>
                <Text style={[s.clubText, filtreClub === c && s.clubTextA]} numberOfLines={1}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Résultats */}
        <View style={s.section}>
          <View style={s.resultsHeader}>
            <Text style={s.sectionTitle}>
              {loading ? 'Recherche…' : `${matchs.length} annonce${matchs.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {loading ? (
            <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
          ) : matchs.length === 0 ? (
            <View style={s.center}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
              <Text style={s.emptyTitle}>Aucun match trouvé</Text>
              <Text style={s.emptySub}>Essaie d'autres filtres ou crée le tien !</Text>
            </View>
          ) : (
            matchs.map(m => (
              <View key={m.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardTime}>
                    <Text style={s.cardTimeText}>{m.jour} · {m.heure}</Text>
                    {m.type_match === 'cession' && <View style={s.cessionBadge}><Text style={s.cessionText}>Cession</Text></View>}
                  </View>
                  {m.niveau && m.niveau !== '—' && (
                    <View style={s.pill}><Text style={s.pillText}>Niv. {m.niveau}</Text></View>
                  )}
                </View>
                <Text style={s.cardMsg}>{formatMsg(m)}</Text>
                <Text style={s.cardLieu}>📍 {m.club}</Text>
                {m.createur_id !== userId && (
                  <TouchableOpacity
                    style={s.joinBtn}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.85}
                  >
                    <Text style={s.joinBtnText}>
                      {m.type_match === 'cession' ? '🏟️ Voir la cession' : '🎾 Rejoindre'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  resetBtn: { backgroundColor: 'rgba(200,245,74,0.1)', borderRadius: RADIUS.full, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(200,245,74,0.3)' },
  resetText: { fontSize: 12, color: COLORS.green, fontWeight: '700' },
  section: { paddingHorizontal: SPACING.md, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, paddingVertical: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.border },
  typeChipA: { backgroundColor: 'rgba(200,245,74,0.07)', borderColor: COLORS.green },
  typeText: { fontSize: 12, fontWeight: '700', color: COLORS.text2 },
  typeTextA: { color: COLORS.green },
  nvChip: { backgroundColor: COLORS.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border, minWidth: 48, alignItems: 'center' },
  nvChipA: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  nvText: { fontSize: 13, fontWeight: '800', color: COLORS.text2 },
  nvTextA: { color: '#000' },
  clubsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clubChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card, borderRadius: RADIUS.md, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  clubChipA: { backgroundColor: 'rgba(200,245,74,0.07)', borderColor: COLORS.green },
  clubText: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },
  clubTextA: { color: COLORS.green },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { alignItems: 'center', paddingVertical: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.text2, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTime: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTimeText: { fontSize: 12, color: COLORS.green, fontWeight: '700' },
  cessionBadge: { backgroundColor: 'rgba(255,200,50,0.15)', borderRadius: RADIUS.full, paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,200,50,0.3)' },
  cessionText: { fontSize: 10, color: '#ffc832', fontWeight: '700' },
  cardMsg: { fontSize: 13, color: COLORS.text, lineHeight: 20, marginBottom: 6, fontWeight: '600' },
  cardLieu: { fontSize: 12, color: COLORS.text2, marginBottom: 10 },
  pill: { backgroundColor: 'rgba(200,245,74,0.12)', borderRadius: RADIUS.full, paddingVertical: 3, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(200,245,74,0.2)' },
  pillText: { fontSize: 11, color: COLORS.green, fontWeight: '600' },
  joinBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  joinBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
});
