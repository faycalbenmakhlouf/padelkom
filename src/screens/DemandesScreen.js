import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const RAISONS_REFUS = ['Déjà complet', 'Autre raison'];

export default function DemandesScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [demandes, setDemandes] = useState([]);
  const [acceptees, setAcceptees] = useState([]);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [refusModal, setRefusModal] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setUserId(session.user.id);

    const [{ data: m }, { data: toutes }] = await Promise.all([
      supabase.from('matchs').select('*').eq('id', matchId).single(),
      supabase.from('participations').select('*').eq('match_id', matchId).in('statut', ['en_attente', 'confirme']),
    ]);
    setMatch(m);

    if (toutes && toutes.length > 0) {
      const ids = toutes.map(p => p.joueur_id);
      const { data: profils } = await supabase.from('profiles').select('id, prenom, nom, niveau, genre, ville, telephone').in('id', ids);
      const profilsMap = {};
      (profils || []).forEach(p => { profilsMap[p.id] = p; });
      const enrichies = toutes.map(p => ({ ...p, profiles: profilsMap[p.joueur_id] || null }));
      setDemandes(enrichies.filter(p => p.statut === 'en_attente'));
      setAcceptees(enrichies.filter(p => p.statut === 'confirme'));
    } else {
      setDemandes([]);
      setAcceptees([]);
    }
    setLoading(false);
  };

  const traiter = async (participation, action, raison = null) => {
    setRefusModal(null);
    setProcessing(participation.id);
    const newStatut = action === 'accepter' ? 'confirme' : 'refuse';
    await supabase.from('participations').update({ statut: newStatut }).eq('id', participation.id);

    if (action === 'accepter' && match) {
      await supabase.from('matchs').update({ places_libres: Math.max(0, match.places_libres - 1) }).eq('id', matchId);
      await supabase.from('notifications').insert({
        user_id: participation.joueur_id, type: 'match_confirme',
        message: `Ta demande pour le match du ${match.jour} à ${match.heure} — ${match.club} a été acceptée ! 🎾`,
        match_id: matchId,
      });
      setMatch(m => ({ ...m, places_libres: Math.max(0, m.places_libres - 1) }));
      const enriched = { ...participation, statut: 'confirme' };
      setDemandes(d => d.filter(x => x.id !== participation.id));
      setAcceptees(a => [...a, enriched]);
    } else if (action === 'refuser') {
      const msg = raison === 'Déjà complet'
        ? `Ta demande pour le match du ${match.jour} à ${match.heure} — ${match.club} a été refusée. Le match est déjà complet.`
        : `Ta demande pour le match du ${match.jour} à ${match.heure} — ${match.club} n'a pas été retenue.`;
      await supabase.from('notifications').insert({ user_id: participation.joueur_id, type: 'match_annule', message: msg, match_id: matchId });
      setDemandes(d => d.filter(x => x.id !== participation.id));
    }
    setProcessing(null);
  };

  const annulerMatch = async () => {
    if (!window.confirm('Annuler ce match ? Tous les joueurs seront notifiés.')) return;
    await supabase.from('matchs').update({ statut: 'annule' }).eq('id', matchId);
    const joueurs = [...demandes, ...acceptees].map(p => p.joueur_id);
    if (joueurs.length > 0) {
      await supabase.from('notifications').insert(joueurs.map(jid => ({
        user_id: jid, type: 'match_annule',
        message: `Le match du ${match.jour} à ${match.heure} — ${match.club} a été annulé par le créateur.`,
        match_id: matchId,
      })));
    }
    navigation.goBack();
  };

  const ouvrirWhatsApp = (telephone) => {
    const tel = telephone.replace(/\s/g, '').replace(/^0/, '212');
    Linking.openURL(`https://wa.me/${tel}`);
  };

  const NIVEAUX = ['', 'Débutant', 'Perfectionnement', 'Élémentaire', 'Intermédiaire', 'Confirmé', 'Avancé', 'Expert', 'Élite'];

  const renderJoueur = (d, showActions) => {
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
            <Text style={s.meta}>📍 {p?.ville || '—'} · Côté {d.cote || '—'}</Text>
          </View>
          {p?.telephone && (
            <TouchableOpacity style={s.waBtn} onPress={() => ouvrirWhatsApp(p.telephone)} activeOpacity={0.8}>
              <Text style={s.waBtnText}>💬 WA</Text>
            </TouchableOpacity>
          )}
        </View>
        {showActions && (
          <>
            <View style={s.actions}>
              <TouchableOpacity style={[s.btnRefuser, processing === d.id && { opacity: 0.5 }]} onPress={() => setRefusModal(d)} disabled={!!processing} activeOpacity={0.85}>
                {processing === d.id ? <ActivityIndicator color={COLORS.text2} size="small" /> : <Text style={s.btnRefuserText}>✕ Refuser</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnAccepter, processing === d.id && { opacity: 0.5 }]} onPress={() => traiter(d, 'accepter')} disabled={!!processing} activeOpacity={0.85}>
                {processing === d.id ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.btnAccepterText}>✓ Accepter</Text>}
              </TouchableOpacity>
            </View>
            {refusModal?.id === d.id && (
              <View style={s.raisonWrap}>
                <Text style={s.raisonTitle}>Raison du refus :</Text>
                {RAISONS_REFUS.map(r => (
                  <TouchableOpacity key={r} style={s.raisonBtn} onPress={() => traiter(d, 'refuser', r)} activeOpacity={0.8}>
                    <Text style={s.raisonText}>{r}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setRefusModal(null)} style={s.raisonAnnuler}>
                  <Text style={s.raisonAnnulerText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const isCreateur = match?.createur_id === userId;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mon match</Text>
        <View style={{ width: 70 }} />
      </View>

      {match && (
        <View style={s.matchInfo}>
          <Text style={s.matchTitle}>🎾 {match.jour} · {match.heure}</Text>
          <Text style={s.matchSub}>📍 {match.club} · {match.places_libres} place{match.places_libres !== 1 ? 's' : ''} restante{match.places_libres !== 1 ? 's' : ''}</Text>
          {isCreateur && (
            <TouchableOpacity style={s.annulerMatchBtn} onPress={annulerMatch} activeOpacity={0.8}>
              <Text style={s.annulerMatchText}>🚫 Annuler le match</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
          {acceptees.length > 0 && (
            <>
              <Text style={s.sectionTitle}>✅ Joueurs confirmés ({acceptees.length})</Text>
              {acceptees.map(d => renderJoueur(d, false))}
            </>
          )}
          {demandes.length > 0 && (
            <>
              <Text style={s.sectionTitle}>⏳ En attente ({demandes.length})</Text>
              {demandes.map(d => renderJoueur(d, isCreateur))}
            </>
          )}
          {demandes.length === 0 && acceptees.length === 0 && (
            <View style={s.center}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
              <Text style={s.emptyTitle}>Aucune demande</Text>
              <Text style={s.emptySub}>Les nouvelles demandes apparaîtront ici.</Text>
            </View>
          )}
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
  matchSub: { fontSize: 12, color: COLORS.text2, marginBottom: 8 },
  annulerMatchBtn: { marginTop: 4, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,60,60,0.1)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,60,60,0.2)', alignSelf: 'flex-start' },
  annulerMatchText: { fontSize: 12, color: '#ff6b6b', fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text2, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.card2, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  meta: { fontSize: 12, color: COLORS.text2, marginBottom: 2 },
  waBtn: { backgroundColor: '#25D366', borderRadius: RADIUS.md, paddingVertical: 6, paddingHorizontal: 10 },
  waBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  actions: { flexDirection: 'row', gap: 10 },
  btnRefuser: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  btnRefuserText: { fontSize: 14, fontWeight: '700', color: COLORS.text2 },
  btnAccepter: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.green, alignItems: 'center' },
  btnAccepterText: { fontSize: 14, fontWeight: '800', color: '#000' },
  raisonWrap: { marginTop: 10, backgroundColor: COLORS.card2, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  raisonTitle: { fontSize: 12, color: COLORS.text2, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  raisonBtn: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.sm, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  raisonText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  raisonAnnuler: { paddingVertical: 8, alignItems: 'center' },
  raisonAnnulerText: { fontSize: 13, color: COLORS.text2 },
});
