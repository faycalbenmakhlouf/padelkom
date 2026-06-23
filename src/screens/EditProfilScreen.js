import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Autres'];
const GENRES = ['Joueur', 'Joueuse'];
const NIVEAUX = [1, 2, 3, 4, 5, 6, 7, 8];
const NIVEAUX_LABELS = ['', 'Débutant', 'Perfectionnement', 'Élémentaire', 'Intermédiaire', 'Confirmé', 'Avancé', 'Expert', 'Élite'];

export default function EditProfilScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({
    prenom: '', nom: '', genre: 'Joueur', ville: 'Casablanca',
    quartier: '', licence_frmt: '', classement_frmt: '', niveau: 1, telephone: '',
  });

  useEffect(() => {
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigation.goBack(); return; }
    setUserId(session.user.id);
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setForm({
        prenom: data.prenom || '',
        nom: data.nom || '',
        genre: data.genre || 'Joueur',
        ville: data.ville || 'Casablanca',
        quartier: data.quartier || '',
        licence_frmt: data.licence_frmt || '',
        classement_frmt: data.classement_frmt || '',
        niveau: data.niveau || 1,
        telephone: data.telephone || '',
      });
    }
    setLoading(false);
  };

  const sauvegarder = async () => {
    if (!form.prenom.trim()) { window.alert('Le prénom est obligatoire.'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const id = userId || session?.user?.id;
    if (!id) { window.alert('Session expirée, reconnecte-toi.'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      genre: form.genre,
      ville: form.ville,
      quartier: form.quartier.trim(),
      licence_frmt: form.licence_frmt.trim() || null,
      classement_frmt: form.classement_frmt.trim() || null,
      niveau: form.niveau,
      telephone: form.telephone.trim() || null,
    }).eq('id', id);
    setSaving(false);
    if (error) { window.alert('Erreur : ' + error.message); return; }
    window.alert('Profil mis à jour !');
    navigation.goBack();
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Modifier le profil</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Identité</Text>
          <Field label="Prénom" value={form.prenom} onChangeText={v => set('prenom', v)} placeholder="Ton prénom" />
          <Field label="Nom" value={form.nom} onChangeText={v => set('nom', v)} placeholder="Ton nom" />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Genre</Text>
          <View style={s.chips}>
            {GENRES.map(g => (
              <TouchableOpacity key={g} style={[s.chip, form.genre === g && s.chipActive]} onPress={() => set('genre', g)}>
                <Text style={[s.chipText, form.genre === g && s.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Localisation</Text>
          <Text style={s.label}>Ville</Text>
          <View style={s.chips}>
            {VILLES.map(v => (
              <TouchableOpacity key={v} style={[s.chip, form.ville === v && s.chipActive]} onPress={() => set('ville', v)}>
                <Text style={[s.chipText, form.ville === v && s.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Field label="Quartier" value={form.quartier} onChangeText={v => set('quartier', v)} placeholder="Ex: Maarif, Guéliz…" />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Niveau de jeu</Text>
          <View style={s.niveauxGrid}>
            {NIVEAUX.map(n => (
              <TouchableOpacity key={n} style={[s.niveauBtn, form.niveau === n && s.niveauBtnActive]} onPress={() => set('niveau', n)}>
                <Text style={[s.niveauNum, form.niveau === n && s.niveauNumActive]}>{n}</Text>
                <Text style={[s.niveauLabel, form.niveau === n && s.niveauLabelActive]}>{NIVEAUX_LABELS[n]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>FRMT & Contact</Text>
          <Field label="N° Licence FRMT" value={form.licence_frmt} onChangeText={v => set('licence_frmt', v)} placeholder="Ex: 12345" keyboardType="numeric" />
          <Field label="Classement FRMT" value={form.classement_frmt} onChangeText={v => set('classement_frmt', v)} placeholder="Ex: P100, P250…" />
          <Field label="WhatsApp" value={form.telephone} onChangeText={v => set('telephone', v)} placeholder="Ex: 0661234567" keyboardType="phone-pad" />
        </View>

        <View style={{ paddingHorizontal: SPACING.md }}>
          <TouchableOpacity style={[s.btnSave, saving && { opacity: 0.7 }]} onPress={sauvegarder} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={s.btnSaveText}>Sauvegarder ✅</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text2}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="words"
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  backBtn: { width: 70 },
  backText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  section: { marginHorizontal: SPACING.md, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  label: { fontSize: 12, color: COLORS.text2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: 14, color: COLORS.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  chipText: { fontSize: 13, color: COLORS.text2, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  niveauxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  niveauBtn: { width: '22%', aspectRatio: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  niveauBtnActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  niveauNum: { fontSize: 20, fontWeight: '900', color: COLORS.text2 },
  niveauNumActive: { color: '#000' },
  niveauLabel: { fontSize: 8, color: COLORS.text2, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  niveauLabelActive: { color: '#000' },
  btnSave: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  btnSaveText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
