import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function NotationScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [joueurs, setJoueurs] = useState([]); // autres joueurs du match
  const [userId, setUserId] = useState(null);
  const [notes, setNotes] = useState({}); // { joueurId: { note, commentaire } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dejaNote, setDejaNote] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigation.goBack(); return; }
    const uid = session.user.id;
    setUserId(uid);

    const { data: m } = await supabase.from('matchs').select('*').eq('id', matchId).single();
    setMatch(m);

    // Tous les participants confirmés + créateur
    const { data: parts } = await supabase.from('participations')
      .select('joueur_id').eq('match_id', matchId).eq('statut', 'confirme');

    const ids = new Set((parts || []).map(p => p.joueur_id));
    if (m?.createur_id) ids.add(m.createur_id);
    ids.delete(uid); // on enlève soi-même

    if (ids.size === 0) { setLoading(false); return; }

    // Vérifier si déjà noté
    const { data: existing } = await supabase.from('notations')
      .select('id').eq('match_id', matchId).eq('noteur_id', uid);
    if (existing && existing.length > 0) { setDejaNote(true); setLoading(false); return; }

    const { data: profils } = await supabase.from('profiles')
      .select('id, prenom, nom, genre, niveau').in('id', [...ids]);

    setJoueurs(profils || []);

    // Init notes
    const initNotes = {};
    (profils || []).forEach(p => { initNotes[p.id] = { note: 0, commentaire: '' }; });
    setNotes(initNotes);
    setLoading(false);
  };

  const setNote = (joueurId, note) => {
    setNotes(n => ({ ...n, [joueurId]: { ...n[joueurId], note } }));
  };

  const setCommentaire = (joueurId, commentaire) => {
    setNotes(n => ({ ...n, [joueurId]: { ...n[joueurId], commentaire } }));
  };

  const soumettre = async () => {
    const aNoter = joueurs.filter(j => notes[j.id]?.note > 0);
    if (aNoter.length === 0) { window.alert('Note au moins un joueur avant de valider.'); return; }
    setSaving(true);

    const rows = aNoter.map(j => ({
      match_id: matchId,
      noteur_id: userId,
      note_joueur_id: j.id,
      note: notes[j.id].note,
      commentaire: notes[j.id].commentaire.trim() || null,
    }));

    const { error } = await supabase.from('notations').insert(rows);
    if (error) { setSaving(false); window.alert('Erreur : ' + error.message); return; }

    // Recalculer note_moyenne pour chaque joueur noté
    for (const j of aNoter) {
      const { data: toutesNotes } = await supabase.from('notations')
        .select('note').eq('note_joueur_id', j.id);
      if (toutesNotes && toutesNotes.length > 0) {
        const moy = toutesNotes.reduce((acc, n) => acc + n.note, 0) / toutesNotes.length;
        await supabase.from('profiles').update({
          note_moyenne: Math.round(moy * 10) / 10,
          matchs_joues: toutesNotes.length,
        }).eq('id', j.id);
      }
    }

    setSaving(false);
    window.alert('Merci pour tes notes ! ⭐');
    navigation.goBack();
  };

  const Etoiles = ({ joueurId }) => (
    <View style={s.etoilesRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => setNote(joueurId, i)} activeOpacity={0.7} style={s.etoileBtn}>
          <Text style={[s.etoile, notes[joueurId]?.note >= i && s.etoileActive]}>★</Text>
        </TouchableOpacity>
      ))}
      {notes[joueurId]?.note > 0 && (
        <Text style={s.noteLabel}>
          {['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent !'][notes[joueurId].note]}
        </Text>
      )}
    </View>
  );

  if (loading) return (
    <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Noter les joueurs</Text>
        <View style={{ width: 70 }} />
      </View>

      {dejaNote ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
          <Text style={s.emptyTitle}>Tu as déjà noté ce match</Text>
          <Text style={s.emptySub}>Merci pour ta contribution !</Text>
        </View>
      ) : joueurs.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🎾</Text>
          <Text style={s.emptyTitle}>Aucun joueur à noter</Text>
          <Text style={s.emptySub}>Personne n'a rejoint ce match.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.infoCard}>
            <Text style={s.infoText}>🎾 {match?.jour} · {match?.heure}</Text>
            <Text style={s.infoText}>📍 {match?.club}</Text>
            <Text style={s.infoSub}>Note les joueurs avec qui tu as joué</Text>
          </View>

          <View style={{ paddingHorizontal: SPACING.md }}>
            {joueurs.map(j => (
              <View key={j.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.avatar}>
                    <Text style={{ fontSize: 24 }}>{j.genre === 'Joueuse' ? '👩' : '👨'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nom}>{j.prenom || 'Joueur'} {j.nom ? j.nom[0] + '.' : ''}</Text>
                    <Text style={s.meta}>Niveau {j.niveau || '—'}</Text>
                  </View>
                </View>

                <Etoiles joueurId={j.id} />

                {notes[j.id]?.note > 0 && (
                  <TextInput
                    style={s.commentInput}
                    value={notes[j.id]?.commentaire}
                    onChangeText={v => setCommentaire(j.id, v)}
                    placeholder="Commentaire (optionnel)"
                    placeholderTextColor={COLORS.text2}
                    multiline
                  />
                )}
              </View>
            ))}

            <TouchableOpacity style={[s.btn, saving && { opacity: 0.7 }]} onPress={soumettre} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>✅ Valider mes notes</Text>}
            </TouchableOpacity>
            <Text style={s.btnSub}>Les notes sont anonymes</Text>
            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  backBtn: { width: 70 },
  backText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  infoCard: { marginHorizontal: SPACING.md, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  infoText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  infoSub: { fontSize: 12, color: COLORS.text2, marginTop: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text2, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  meta: { fontSize: 12, color: COLORS.text2 },
  etoilesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  etoileBtn: { padding: 4 },
  etoile: { fontSize: 28, color: COLORS.border },
  etoileActive: { color: '#FFD700' },
  noteLabel: { fontSize: 12, color: COLORS.text2, fontWeight: '600', marginLeft: 6 },
  commentInput: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 10, fontSize: 13, color: COLORS.text, minHeight: 50, textAlignVertical: 'top' },
  btn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  btnText: { fontSize: 15, fontWeight: '800', color: '#000' },
  btnSub: { textAlign: 'center', fontSize: 11, color: COLORS.text2 },
});
