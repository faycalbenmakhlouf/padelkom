import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Modal, TextInput, Linking } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const CATEGORIES = ['P25','P50','P100','P250','P500','P1000','P1500'];
const CLUBS = ['Club Californie','Ain Diab Padel','Maarif Sport','OCC Padel','Padel 4','Padel Indoor','Autre'];
const COTES = ['Droit','Gauche','Les deux'];
const JOURS_NOMS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

const getProchainJours = () => {
  const jours = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    jours.push({
      j: JOURS_NOMS[d.getDay()],
      n: String(d.getDate()),
      mois: d.toLocaleDateString('fr-FR', { month: 'short' }),
      date: d.toISOString().split('T')[0],
      label: i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : null,
    });
  }
  return jours;
};

export default function TournoisScreen({ navigation }) {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [monProfil, setMonProfil] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categorie, setCategorie] = useState(null);
  const [coteCherche, setCoteCherche] = useState(null);
  const [clubSelec, setClubSelec] = useState(null);
  const [jourSelec, setJourSelec] = useState(0);
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const JOURS = getProchainJours();

  useEffect(() => { init(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { charger(); chargerMonProfil(); });
    return unsub;
  }, [navigation]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      const { data } = await supabase.from('profiles')
        .select('prenom, nom, niveau, telephone, genre')
        .eq('id', session.user.id).single();
      setMonProfil(data);
    }
    await charger();
  };

  const chargerMonProfil = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase.from('profiles')
      .select('prenom, nom, niveau, telephone, genre')
      .eq('id', session.user.id).single();
    if (data) setMonProfil(data);
  };

  const charger = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('tournois_annonces')
      .select('*').eq('statut', 'ouvert').gte('date_tournoi', today)
      .order('date_tournoi', { ascending: true });
    setAnnonces(data || []);
    setLoading(false);
  };

  const publier = async () => {
    if (!categorie) { window.alert('Choisis la catégorie du tournoi.'); return; }
    if (!coteCherche) { window.alert('Précise le côté recherché.'); return; }
    if (!clubSelec) { window.alert('Choisis le club / lieu.'); return; }
    setPublishing(true);
    const { error } = await supabase.from('tournois_annonces').insert({
      createur_id: userId, categorie, cote_cherche: coteCherche, club: clubSelec,
      date_tournoi: JOURS[jourSelec].date,
      date_label: JOURS[jourSelec].n + ' ' + JOURS[jourSelec].mois,
      description: description.trim() || null, statut: 'ouvert',
    });
    setPublishing(false);
    if (error) { window.alert('Erreur : ' + error.message); return; }
    setShowForm(false); resetForm();
    window.alert('Annonce publiée !'); charger();
  };

  const annulerAnnonce = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    await supabase.from('tournois_annonces').update({ statut: 'ferme' }).eq('id', id);
    charger();
  };

  const contacter = async (annonce) => {
    const { data: pc } = await supabase.from('profiles')
      .select('prenom, nom, telephone').eq('id', annonce.createur_id).single();
    if (pc?.telephone) {
      const tel = pc.telephone.replace(/\s/g, '').replace(/^0/, '212');
      const nom = monProfil?.prenom || 'Joueur';
      const msg = 'Bonjour, je réponds à ton annonce tournoi ' + annonce.categorie + ' du ' + annonce.date_label + ' à ' + annonce.club + '. Cordialement, ' + nom;
      Linking.openURL('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg));
    } else {
      const nom = pc ? ((pc.prenom || '') + ' ' + (pc.nom ? pc.nom[0] + '.' : '')).trim() : 'Joueur';
      navigation.navigate('Chat', { destinataireId: annonce.createur_id, destinataireNom: nom, matchId: null });
    }
  };

  const resetForm = () => {
    setCategorie(null); setCoteCherche(null); setClubSelec(null);
    setJourSelec(0); setDescription('');
  };

  const getApercu = () => {
    if (!categorie || !coteCherche || !clubSelec) return '…remplis le formulaire';
    const d = JOURS[jourSelec].n + ' ' + JOURS[jourSelec].mois;
    let msg = '🏆 Bonjour, je cherche un partenaire côté ' + coteCherche + ' pour le tournoi ' + categorie + ' à ' + clubSelec + ' le ' + d + '.';
    if (description) msg += '\n💬 ' + description;
    return msg;
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Tournois <Text style={{ color: COLORS.green }}>.</Text></Text>
            <Text style={s.subtitle}>Trouve un partenaire FRMT</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
            <Text style={s.addBtnText}>+ Annonce</Text>
          </TouchableOpacity>
        </View>

        <View style={s.banner}>
          <Text style={s.bannerIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Tournois FRMT</Text>
            <Text style={s.bannerSub}>Licence + classement obligatoires pour publier ou contacter</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: SPACING.md }}>
          <Text style={s.sectionTitle}>
            {loading ? 'Chargement…' : annonces.length + ' annonce' + (annonces.length !== 1 ? 's' : '')}
          </Text>
          {loading ? (
            <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
          ) : annonces.length === 0 ? (
            <View style={s.center}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🏆</Text>
              <Text style={s.emptyTitle}>Aucune annonce</Text>
              <Text style={s.emptySub}>Sois le premier à chercher un partenaire de tournoi !</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
                <Text style={s.emptyBtnText}>+ Publier une annonce</Text>
              </TouchableOpacity>
            </View>
          ) : (
            annonces.map(a => (
              <AnnonceCard key={a.id} annonce={a} isOwn={a.createur_id === userId}
                onContacter={() => contacter(a)} onAnnuler={() => annulerAnnonce(a.id)} />
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal formulaire */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nouvelle annonce tournoi</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Text style={{ fontSize: 18, color: COLORS.text2 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.lbl}>🏆 Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[s.chip, categorie === c && s.chipA]} onPress={() => setCategorie(c)} activeOpacity={0.8}>
                    <Text style={[s.chipText, categorie === c && s.chipTextA]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.lbl}>🎾 Côté recherché</Text>
              <View style={s.row3}>
                {COTES.map(c => (
                  <TouchableOpacity key={c} style={[s.chip3, coteCherche === c && s.chip3A]} onPress={() => setCoteCherche(c)} activeOpacity={0.8}>
                    <Text style={{ fontSize: 16 }}>{c === 'Droit' ? '➡️' : c === 'Gauche' ? '⬅️' : '↔️'}</Text>
                    <Text style={[s.chip3Text, coteCherche === c && s.chip3TextA]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.lbl}>📍 Club / Lieu</Text>
              <View style={s.clubsWrap}>
                {CLUBS.map(c => (
                  <TouchableOpacity key={c} style={[s.clubChip, clubSelec === c && s.clubChipA]} onPress={() => setClubSelec(c)} activeOpacity={0.8}>
                    <Text style={[s.clubText, clubSelec === c && s.clubTextA]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.lbl}>📅 Date du tournoi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                {JOURS.map((d, i) => (
                  <TouchableOpacity key={i} style={[s.dateChip, jourSelec === i && s.dateChipA]} onPress={() => setJourSelec(i)} activeOpacity={0.8}>
                    <Text style={[s.dateDay, jourSelec === i && { color: COLORS.green }]}>{d.label || d.j}</Text>
                    <Text style={[s.dateNum, jourSelec === i && { color: COLORS.green }]}>{d.n}</Text>
                    <Text style={s.dateMois}>{d.mois}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.lbl}>💬 Message (optionnel)</Text>
              <TextInput style={s.textInput} value={description} onChangeText={setDescription}
                placeholder="Ex: Sérieux et régulier, disponible les weekends" placeholderTextColor={COLORS.text2} multiline numberOfLines={3} />

              <View style={s.preview}>
                <Text style={s.previewTitle}>👀 Aperçu</Text>
                <View style={s.bubble}>
                  <Text style={s.bubbleText}>{getApercu()}</Text>
                  <Text style={s.bubbleTime}>maintenant ✓✓</Text>
                </View>
              </View>

              <TouchableOpacity style={[s.publishBtn, publishing && { opacity: 0.7 }]} onPress={publier} disabled={publishing} activeOpacity={0.85}>
                {publishing ? <ActivityIndicator color="#000" /> : <Text style={s.publishBtnText}>🚀 Publier l'annonce</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AnnonceCard({ annonce: a, isOwn, onContacter, onAnnuler }) {
  const [p, setP] = useState(null);
  useEffect(() => {
    supabase.from('profiles').select('prenom, nom, niveau, genre')
      .eq('id', a.createur_id).single().then(({ data }) => { if (data) setP(data); });
  }, []);
  const nom = p ? ((p.prenom || 'Joueur') + ' ' + (p.nom ? p.nom[0] + '.' : '')).trim() : 'Joueur';
  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={s.catBadge}><Text style={s.catText}>🏆 {a.categorie}</Text></View>
        <Text style={s.cardDate}>{a.date_label}</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.avatarWrap}>
          <Text style={{ fontSize: 22 }}>{p?.genre === 'Joueuse' ? '👩' : '👨'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardNom}>{nom}{isOwn ? ' (moi)' : ''}</Text>
          {p?.niveau && <Text style={s.cardMeta}>Niveau {p.niveau}</Text>}
          <View style={s.coteBadge}>
            <Text style={s.coteIcon}>{a.cote_cherche === 'Droit' ? '➡️' : a.cote_cherche === 'Gauche' ? '⬅️' : '↔️'}</Text>
            <Text style={s.coteText}>Cherche côté {a.cote_cherche}</Text>
          </View>
        </View>
      </View>
      <Text style={s.cardLieu}>📍 {a.club}</Text>
      {a.description && <Text style={s.cardDesc}>💬 {a.description}</Text>}
      {isOwn ? (
        <TouchableOpacity style={s.annulerBtn} onPress={onAnnuler} activeOpacity={0.8}>
          <Text style={s.annulerText}>🗑 Supprimer mon annonce</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.contacterBtn} onPress={onContacter} activeOpacity={0.85}>
          <Text style={s.contacterText}>💬 Contacter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.text2, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: SPACING.md, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  bannerIcon: { fontSize: 32 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  bannerSub: { fontSize: 12, color: COLORS.text2, lineHeight: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  center: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text2, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catBadge: { backgroundColor: 'rgba(200,245,74,0.12)', borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(200,245,74,0.25)' },
  catText: { fontSize: 12, color: COLORS.green, fontWeight: '800' },
  cardDate: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cardNom: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  licenceRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  licenceText: { fontSize: 11, color: COLORS.text2, fontWeight: '600' },
  classementText: { fontSize: 11, color: COLORS.green, fontWeight: '700' },
  coteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.card2, borderRadius: RADIUS.full, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  coteIcon: { fontSize: 12 },
  coteText: { fontSize: 11, color: COLORS.text, fontWeight: '700' },
  cardLieu: { fontSize: 12, color: COLORS.text2, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.text2, fontStyle: 'italic', marginBottom: 10, lineHeight: 18 },
  contacterBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  contacterText: { fontSize: 13, fontWeight: '800', color: '#000' },
  annulerBtn: { borderRadius: RADIUS.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,60,60,0.2)', backgroundColor: 'rgba(255,60,60,0.05)' },
  annulerText: { fontSize: 13, color: '#ff6b6b', fontWeight: '700' },
  // Modal contact
  overlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  contactBox: { backgroundColor: COLORS.dark, borderRadius: 20, padding: 20, width: '88%', borderWidth: 1, borderColor: COLORS.border },
  contactTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 4 },
  contactSub: { fontSize: 12, color: COLORS.text2, textAlign: 'center', marginBottom: 16 },
  profilsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  profilCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  profilLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text2, textTransform: 'uppercase', marginBottom: 6 },
  profilNom: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  profilInfo: { fontSize: 12, color: COLORS.text2, marginBottom: 3 },
  contactBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  contactBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  contactAnnuler: { alignItems: 'center', paddingVertical: 8 },
  contactAnnulerText: { fontSize: 13, color: COLORS.text2 },
  // Modal formulaire
  alertBanner: { backgroundColor: 'rgba(255,200,50,0.1)', borderRadius: RADIUS.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,200,50,0.3)' },
  alertText: { fontSize: 12, color: '#ffc832', fontWeight: '600', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.md, maxHeight: '92%', borderTopWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  lbl: { fontSize: 11, fontWeight: '700', color: COLORS.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: { backgroundColor: COLORS.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  chipA: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  chipText: { fontSize: 13, fontWeight: '800', color: COLORS.text2 },
  chipTextA: { color: '#000' },
  row3: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip3: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, paddingVertical: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.border },
  chip3A: { backgroundColor: 'rgba(200,245,74,0.07)', borderColor: COLORS.green },
  chip3Text: { fontSize: 12, fontWeight: '700', color: COLORS.text2 },
  chip3TextA: { color: COLORS.green },
  clubsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  clubChip: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  clubChipA: { backgroundColor: 'rgba(200,245,74,0.07)', borderColor: COLORS.green },
  clubText: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },
  clubTextA: { color: COLORS.green },
  dateChip: { backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, minWidth: 56 },
  dateChipA: { backgroundColor: 'rgba(200,245,74,0.1)', borderColor: COLORS.green },
  dateDay: { fontSize: 9, color: COLORS.text2, marginBottom: 2, fontWeight: '600' },
  dateNum: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  dateMois: { fontSize: 9, color: COLORS.text2, marginTop: 1 },
  textInput: { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: 14, color: COLORS.text, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  preview: { backgroundColor: '#0d1f0d', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(200,245,74,0.15)' },
  previewTitle: { fontSize: 12, fontWeight: '800', color: COLORS.green, marginBottom: 10 },
  bubble: { backgroundColor: '#1a3a1a', borderRadius: 14, borderTopLeftRadius: 2, padding: 12, borderWidth: 1, borderColor: 'rgba(200,245,74,0.2)' },
  bubbleText: { fontSize: 13, color: COLORS.text, lineHeight: 22 },
  bubbleTime: { fontSize: 10, color: COLORS.text2, textAlign: 'right', marginTop: 6 },
  publishBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', marginBottom: 32 },
  publishBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
});
