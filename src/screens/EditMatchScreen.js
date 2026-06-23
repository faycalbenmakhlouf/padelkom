import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const SLOTS_OPTIONS = [
  { id: 'droit', label: 'Joueur Droit', icon: '➡️', type: 'joueur', cote: 'Droit' },
  { id: 'gauche', label: 'Joueur Gauche', icon: '⬅️', type: 'joueur', cote: 'Gauche' },
  { id: 'binome', label: 'Binôme', icon: '🤝', type: 'binome', cote: null },
];

export default function EditMatchScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [slots, setSlots] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    const { data } = await supabase.from('matchs').select('*').eq('id', matchId).single();
    if (data) {
      setMatch(data);
      setSlots(data.slots || []);
      setDescription(data.description || '');
    }
    setLoading(false);
  };

  const ajouterSlot = (option) => {
    setSlots(s => [...s, { type: option.type, cote: option.cote, pris: false }]);
  };

  const togglePris = (index) => {
    setSlots(s => s.map((sl, i) => i === index ? { ...sl, pris: !sl.pris } : sl));
  };

  const supprimerSlot = (index) => {
    setSlots(s => s.filter((_, i) => i !== index));
  };

  const sauvegarder = async () => {
    setSaving(true);
    const libres = slots.filter(s => !s.pris).length;
    const total = slots.reduce((acc, s) => acc + (s.type === 'binome' ? 2 : 1), 0);
    const libresPlaces = slots.filter(s => !s.pris).reduce((acc, s) => acc + (s.type === 'binome' ? 2 : 1), 0);

    const updates = {
      slots,
      description: description.trim() || null,
      places_libres: libresPlaces,
      places_total: total,
    };

    if (libres === 0) updates.statut = 'complet';
    else updates.statut = 'ouvert';

    const { error } = await supabase.from('matchs').update(updates).eq('id', matchId);
    setSaving(false);
    if (error) { window.alert('Erreur : ' + error.message); return; }
    window.alert('Annonce mise à jour !');
    navigation.goBack();
  };

  const marquerComplet = async () => {
    if (!window.confirm('Marquer ce match comme complet ?')) return;
    await supabase.from('matchs').update({ statut: 'complet', places_libres: 0 }).eq('id', matchId);
    navigation.goBack();
  };

  const getApercu = () => {
    if (!match) return '';
    const libres = slots.filter(s => !s.pris);
    if (libres.length === 0) return `🎾 Match complet ✅\n${match.jour} · ${match.heure} · ${match.club}`;
    const desc = libres.map(s => s.type === 'binome' ? '🤝 Binôme' : `${s.cote === 'Droit' ? '➡️' : '⬅️'} ${s.cote}`).join(' · ');
    let msg = `🎾 Cherche : ${desc}\nNiveau ${match.niveau} · ${match.jour} · ${match.heure}\n📍 ${match.club}`;
    if (description.trim()) msg += `\n\n💬 ${description.trim()}`;
    return msg;
  };

  if (loading) return (
    <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Modifier l'annonce</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={s.fl}>
          {/* Infos match (non modifiables) */}
          <View style={s.infoCard}>
            <Text style={s.infoText}>🗓 {match?.jour} · {match?.heure}</Text>
            <Text style={s.infoText}>📍 {match?.club}</Text>
            <Text style={s.infoText}>📊 Niveau {match?.niveau}</Text>
          </View>

          {/* Slots */}
          <Text style={s.lbl}>👥 Joueurs recherchés</Text>
          <Text style={s.sublbl}>Coche les slots déjà pris, supprime ceux qui ne sont plus valables</Text>

          {slots.map((sl, i) => (
            <View key={i} style={[s.slotRow, sl.pris && s.slotRowPris]}>
              <TouchableOpacity style={[s.checkbox, sl.pris && s.checkboxPris]} onPress={() => togglePris(i)} activeOpacity={0.7}>
                {sl.pris && <Text style={{ fontSize: 12, color: '#000', fontWeight: '800' }}>✓</Text>}
              </TouchableOpacity>
              <View style={s.slotIcon}>
                <Text style={{ fontSize: 18 }}>{sl.type === 'binome' ? '🤝' : sl.cote === 'Droit' ? '➡️' : '⬅️'}</Text>
              </View>
              <Text style={[s.slotLabel, sl.pris && s.slotLabelPris]}>
                {sl.type === 'binome' ? 'Binôme' : sl.cote}
                {sl.pris ? '  —  Pris ✓' : '  —  Disponible'}
              </Text>
              <TouchableOpacity onPress={() => supprimerSlot(i)} style={s.deleteBtn}>
                <Text style={{ fontSize: 14, color: COLORS.text2 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={s.addRow}>
            {SLOTS_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.id} style={s.addBtn} onPress={() => ajouterSlot(opt)} activeOpacity={0.8}>
                <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                <Text style={s.addBtnText}>+ {opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message libre */}
          <Text style={s.lbl}>💬 Message (optionnel)</Text>
          <TextInput
            style={s.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Suite à désistement, reste 1 côté D..."
            placeholderTextColor={COLORS.text2}
            multiline
            numberOfLines={3}
          />

          {/* Aperçu */}
          <View style={s.preview}>
            <Text style={s.previewTitle}>👀 Aperçu de l'annonce mise à jour</Text>
            <View style={s.bubble}>
              <Text style={s.bubbleText}>{getApercu()}</Text>
              <Text style={s.bubbleTime}>maintenant ✓✓</Text>
            </View>
          </View>

          <TouchableOpacity style={[s.btn, saving && { opacity: 0.7 }]} onPress={sauvegarder} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>💾 Mettre à jour l'annonce</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.btnComplet} onPress={marquerComplet} activeOpacity={0.85}>
            <Text style={s.btnCompletText}>✅ Marquer comme complet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  backBtn: { width: 70 },
  backText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  fl: { paddingHorizontal: SPACING.md },
  lbl: { fontSize: 12, fontWeight: '700', color: COLORS.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sublbl: { fontSize: 11, color: COLORS.text2, marginBottom: 12, lineHeight: 16 },
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  infoText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  slotRowPris: { backgroundColor: 'rgba(200,245,74,0.05)', borderColor: 'rgba(200,245,74,0.2)' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxPris: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  slotIcon: { width: 32, height: 32, backgroundColor: COLORS.card2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  slotLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  slotLabelPris: { color: COLORS.text2, textDecorationLine: 'line-through' },
  deleteBtn: { padding: 6 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card2, borderRadius: RADIUS.md, paddingVertical: 7, paddingHorizontal: 11, borderWidth: 1, borderColor: COLORS.border },
  addBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.text2 },
  textInput: { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: 14, color: COLORS.text, marginBottom: 20, minHeight: 80, textAlignVertical: 'top' },
  preview: { backgroundColor: '#0d1f0d', borderRadius: RADIUS.lg, padding: 15, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(200,245,74,0.15)' },
  previewTitle: { fontSize: 13, fontWeight: '800', color: COLORS.green, marginBottom: 12 },
  bubble: { backgroundColor: '#1a3a1a', borderRadius: 14, borderTopLeftRadius: 2, padding: 12, borderWidth: 1, borderColor: 'rgba(200,245,74,0.2)' },
  bubbleText: { fontSize: 14, color: COLORS.text, lineHeight: 24 },
  bubbleTime: { fontSize: 10, color: COLORS.text2, textAlign: 'right', marginTop: 6 },
  btn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  btnText: { fontSize: 15, fontWeight: '800', color: '#000' },
  btnComplet: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: COLORS.border },
  btnCompletText: { fontSize: 14, fontWeight: '700', color: COLORS.text2 },
});
