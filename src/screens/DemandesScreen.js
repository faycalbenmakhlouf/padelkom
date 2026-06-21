import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function DemandesScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [demandes, setDemandes] = useState([]);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    const [{ data: m }, { data: d }] = await Promise.all([
      supabase.from('matchs').select('*').eq('id', matchId).single(),
      supabase.from('participations').select('*').eq('match_id', matchId).eq('statut', 'en_attente'),
    ]);
    setMatch(m);
    if (d && d.length > 0) {
      const ids = d.map(p => p.joueur_id);
      const { data: profils } = await supabase.from('profiles').select('id, prenom, nom, niveau, genre, ville').in('id', ids);
      const profilsMap = {};
      (profils || []).forEach(p => { profilsMap[p.id] = p; });
      setDemandes(d.map(p => ({ ...p, profiles: profilsMap[p.joueur_id] || null })));
    } else {
      setDemandes([]);
    }
    setLoading(false);
  };

  const traiter = async (participation, action) => {
    setProcessing(participation.id);
    const newStatut = action === 'accepter' ? 'confirme' : 'refuse';

    await supabase.from('participations').update({ statut: newStatut }).eq('id', participation.id);

    if (action === 'accepter' && match) {
      await supabase.from('matchs').update({ places_libres: Math.max(0, match.places_libres - 1) }).eq('id', matchId);
      await supabase.from('notifications').insert({
        user_id: participation.joueur_id,
        type: 'match_confirme',
        message: `Ta demande pour le match du ${match.jour} à ${match.heure} — ${match.club} a été acceptée ! 🎾`,
        match_id: matchId,
      });
      setMatch(m => ({ ...m, places_libres: Math.max(0, m.places_libres - 1) }));
    } else if (action === 'refuser') {
      await supabase.from('notifications').insert({
        user_id: participation.joueur_id,
        type: 'match_annule',
        message: `Ta demande pour le match du ${match.jour} à ${match.heure} — ${match.club} n'a pas été retenue.`,
        match_id: matchId,
      });
    }

    setDemandes(d => d.filter(x => x.id !== participation.id));
    setProcessing(null);
  };

  const NIVEAUX = ['', 'Débutant', 'Perfectionnement', 'Élémentaire', 'Intermédiaire', 'Confirmé', 'Avancé', 'Expert', 'Élite'];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Demandes</Text>
        <View style={{ width: 70 }} />
      </View>

      {match && (
        <View style={s.matchInfo}>
          <Text style={s.matchTitle}>🎾 {match.jour} · {match.heure}</Text>
          <Text style={s.matchSub}>📍 {match.club} · {match.places_libres} place{match.places_libres !== 1 ? 's' : ''} restante{match.places_libres !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
      ) : demandes.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
          <Text style={s.emptyTitle}>Aucune demande en attente</Text>
          <Text style={s.emptySub}>Les nouvelles demandes apparaîtront ici.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
          {demandes.map(d => {
            const p = d.profiles;
            return (
              <View key={d.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.avatar}>
                    <Text style={{ fontSize: 24 }}>{p?.genre === 'Joueuse' ? '👩' : '👨'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nom}>{p?.prenom || 'Joueur'} {p?.nom ? p.nom[0] + '.' : ''}</Text>
                    <Text style={s.meta}>Niveau {p?.niveau || '—'} · {NIVEAUX[p?.niveau] || ''}</Text>
                    <Text style={s.meta}>📍 {p?.ville || '—'}</Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.btnRefuser, processing === d.id && { opacity: 0.5 }]}
                    onPress={() => traiter(d, 'refuser')}
                    disabled={!!processing}
                    activeOpacity={0.85}
                  >
                    {processing === d.id ? <ActivityIndicator color={COLORS.text2} size="small" /> : <Text style={s.btnRefuserText}>✕ Refuser</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btnAccepter, processing === d.id && { opacity: 0.5 }]}
                    onPress={() => traiter(d, 'accepter')}
                    disabled={!!processing}
                    activeOpacity={0.85}
                  >
                    {processing === d.id ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.btnAccepterText}>✓ Accepter</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  backBtn: { width: 70 },
  backText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  matchInfo: { marginHorizontal: SPACING.md, marginBottom: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  matchTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  matchSub: { fontSize: 12, color: COLORS.text2 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text2, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.card2, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  meta: { fontSize: 12, color: COLORS.text2, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  btnRefuser: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  btnRefuserText: { fontSize: 14, fontWeight: '700', color: COLORS.text2 },
  btnAccepter: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.green, alignItems: 'center' },
  btnAccepterText: { fontSize: 14, fontWeight: '800', color: '#000' },
});
