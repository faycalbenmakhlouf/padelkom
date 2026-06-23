import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const HEURES = ['08h00','10h00','18h30','19h00','19h30','20h00','20h30','21h00','21h30'];
const CLUBS = [{nom:'Club Californie',meta:'2.1 km'},{nom:'Ain Diab Padel',meta:'3.8 km'},{nom:'Maarif Sport',meta:'5.2 km'},{nom:'OCC Padel',meta:'4.5 km'}];
const NIVEAUX = ['1','2','3','4','5','6','7','8','P25','P50','P100','P250','P500','P1000','P1500'];
const JOURS_NOMS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

const getProchainJours = () => {
  const jours = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    jours.push({
      j: JOURS_NOMS[d.getDay()],
      n: String(d.getDate()),
      date: d.toISOString().split('T')[0],
      label: i === 0 ? 'Aujourd\'hui' : i === 1 ? 'Demain' : null,
    });
  }
  return jours;
};

const JOURS = getProchainJours();

const SLOTS_OPTIONS = [
  { id: 'droit', label: 'Joueur Droit', icon: '➡️', type: 'joueur', cote: 'Droit' },
  { id: 'gauche', label: 'Joueur Gauche', icon: '⬅️', type: 'joueur', cote: 'Gauche' },
  { id: 'binome', label: 'Binôme', icon: '🤝', type: 'binome', cote: null },
];

// Types d'annonce
const TYPES_ANNONCE = [
  { id: 'match', label: 'Match', icon: '🎾', desc: 'Cherche des joueurs' },
  { id: 'cession', label: 'Cession', icon: '🏟️', desc: 'Cède une réservation' },
];

export default function CreerMatchScreen({ navigation }) {
  const [typeAnnonce, setTypeAnnonce] = useState('match');
  const [jour, setJour] = useState(1);
  const [heure, setHeure] = useState(5);
  const [club, setClub] = useState(0);
  const [niveau, setNiveau] = useState(null);
  const [genreMatch, setGenreMatch] = useState('Homme');
  const [slots, setSlots] = useState([]);
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [loading, setLoading] = useState(false);

  const ajouterSlot = (option) => {
    const genre = genreMatch === 'Mixte' ? null : genreMatch;
    setSlots(s => [...s, { type: option.type, cote: option.cote, genre, pris: false }]);
  };

  const supprimerSlot = (index) => {
    setSlots(s => s.filter((_, i) => i !== index));
  };

  const setSlotGenre = (index, genre) => {
    setSlots(s => s.map((sl, i) => i === index ? { ...sl, genre } : sl));
  };

  const getMsg = () => {
    const h = HEURES[heure], j = JOURS[jour].label || JOURS[jour].j, c = CLUBS[club].nom;
    if (typeAnnonce === 'cession') {
      let msg = `🏟️ Cession terrain\n${j} · ${h} · ${c}`;
      if (prix) msg += `\n💰 ${prix} DH`;
      if (description) msg += `\n💬 ${description}`;
      return msg || '…remplis le formulaire';
    }
    if (slots.length === 0 || !niveau) return '…remplis le formulaire';
    const desc = slots.map(sl => {
      if (sl.type === 'binome') return '🤝 Binôme';
      const g = sl.genre === 'Homme' ? '👨' : sl.genre === 'Femme' ? '👩' : '👤';
      return `${g} ${sl.cote}`;
    }).join(' · ');
    let msg = `🎾 Cherche : ${desc}\nNiveau ${niveau} · ${j} · ${h}\n📍 ${c}`;
    if (description) msg += `\n💬 ${description}`;
    return msg;
  };

  const publier = async () => {
    if (typeAnnonce === 'cession') {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('matchs').insert({
          createur_id: user?.id,
          jour: JOURS[jour].label || JOURS[jour].j,
          heure: HEURES[heure],
          date_match: JOURS[jour].date,
          club: CLUBS[club].nom,
          type_match: 'cession',
          genre_match: 'Mixte',
          slots: [],
          niveau: '—',
          places_total: 4,
          places_libres: 4,
          statut: 'ouvert',
          ville: 'Casablanca',
          description: description.trim() || null,
          prix: prix ? parseInt(prix) : null,
        });
        setLoading(false);
        if (error) throw error;
        window.alert('Cession publiée !');
        navigation.navigate('Home');
      } catch(e) { setLoading(false); window.alert('Erreur : ' + e.message); }
      return;
    }
    if (slots.length === 0) { window.alert('Ajoute au moins un joueur recherché.'); return; }
    if (!niveau) { window.alert('Choisis le niveau.'); return; }
    const mixteIncomplet = genreMatch === 'Mixte' && slots.some(s => s.type !== 'binome' && !s.genre);
    if (mixteIncomplet) { window.alert('Précise le genre pour chaque joueur.'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nb = slots.reduce((acc, s) => acc + (s.type === 'binome' ? 2 : 1), 0);
      const { error } = await supabase.from('matchs').insert({
        createur_id: user?.id,
        jour: JOURS[jour].label || JOURS[jour].j,
        heure: HEURES[heure],
        date_match: JOURS[jour].date,
        club: CLUBS[club].nom,
        type_match: slots.length === 1 && slots[0].type === 'binome' ? 'binome' : 'custom',
        genre_match: genreMatch,
        slots: slots,
        niveau,
        places_total: nb,
        places_libres: nb,
        statut: 'ouvert',
        ville: 'Casablanca',
        description: description.trim() || null,
      });
      setLoading(false);
      if (error) throw error;
      window.alert('Match publié !');
      navigation.navigate('Home');
    } catch(e) { setLoading(false); window.alert('Erreur : ' + e.message); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.topBar}><View style={{width:36}}/><Text style={s.topTitle}>Créer une annonce</Text><View style={{width:36}}/></View>
        <View style={s.fl}>

          {/* Type d'annonce */}
          <Text style={s.lbl}>📢 Type d'annonce</Text>
          <View style={s.typeRow}>
            {TYPES_ANNONCE.map(t => (
              <TouchableOpacity key={t.id} style={[s.typeCard, typeAnnonce===t.id && s.typeCardA]} onPress={() => setTypeAnnonce(t.id)} activeOpacity={0.8}>
                <Text style={{fontSize:22}}>{t.icon}</Text>
                <Text style={[s.typeLabel, typeAnnonce===t.id && s.typeLabelA]}>{t.label}</Text>
                <Text style={s.typeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date */}
          <Text style={s.lbl}>📅 Date</Text>
          <View style={s.row}>
            {JOURS.map((d,i) => (
              <TouchableOpacity key={i} style={[s.dchip, jour===i && s.dchipA]} onPress={() => setJour(i)} activeOpacity={0.8}>
                <Text style={[s.dday, d.label && {color:COLORS.green}]}>{d.label || d.j}</Text>
                <Text style={[s.dnum, jour===i && {color:COLORS.green}]}>{d.n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Heure */}
          <Text style={s.lbl}>⏰ Heure</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}} contentContainerStyle={{gap:8}}>
            {HEURES.map((h,i) => (
              <TouchableOpacity key={i} style={[s.hchip, heure===i && s.hchipA]} onPress={() => setHeure(i)} activeOpacity={0.8}>
                <Text style={[s.hchipText, heure===i && {color:COLORS.green}]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Club */}
          <Text style={s.lbl}>📍 Club</Text>
          {CLUBS.map((c,i) => (
            <TouchableOpacity key={i} style={[s.clubCard, club===i && s.clubCardA]} onPress={() => setClub(i)} activeOpacity={0.85}>
              <View style={s.clubIcon}><Text style={{fontSize:20}}>🏟️</Text></View>
              <View style={{flex:1}}><Text style={s.clubName}>{c.nom}</Text><Text style={s.clubMeta}>{c.meta}</Text></View>
              {club===i ? <View style={s.check}><Text style={{fontSize:12,color:'#000',fontWeight:'800'}}>✓</Text></View> : <View style={s.radio}/>}
            </TouchableOpacity>
          ))}

          {/* Cession de terrain — formulaire simplifié */}
          {typeAnnonce === 'cession' && (
            <>
              <Text style={s.lbl}>💰 Prix (optionnel)</Text>
              <TextInput
                style={s.textInput}
                value={prix}
                onChangeText={setPrix}
                placeholder="Ex: 150 DH"
                placeholderTextColor={COLORS.text2}
                keyboardType="numeric"
              />
              <Text style={s.lbl}>💬 Message (optionnel)</Text>
              <TextInput
                style={[s.textInput, {minHeight:70}]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Terrain payé, urgent besoin de céder, contactez-moi"
                placeholderTextColor={COLORS.text2}
                multiline
              />
            </>
          )}

          {/* Genre — seulement pour match */}
          {typeAnnonce === 'match' && <Text style={s.lbl}>⚥ Type de match</Text>}
          {typeAnnonce === 'match' && (
            <View style={s.genreRow}>
              {['Homme','Femme','Mixte'].map(g => (
                <TouchableOpacity key={g} style={[s.genreChip, genreMatch===g && s.genreChipA]} onPress={() => setGenreMatch(g)} activeOpacity={0.8}>
                  <Text style={{fontSize:16}}>{g==='Homme'?'👨':g==='Femme'?'👩':'👫'}</Text>
                  <Text style={[s.genreText, genreMatch===g && s.genreTextA]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Joueurs recherchés — seulement pour match */}
          {typeAnnonce === 'match' && <Text style={s.lbl}>👥 Joueurs recherchés</Text>}

          {/* Slots — seulement pour match */}
          {typeAnnonce === 'match' && slots.map((sl, i) => (
            <View key={i} style={s.slotRow}>
              <View style={s.slotIcon}>
                <Text style={{fontSize:18}}>{sl.type === 'binome' ? '🤝' : sl.cote === 'Droit' ? '➡️' : '⬅️'}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={s.slotLabel}>{sl.type === 'binome' ? 'Binôme' : sl.cote}</Text>
                {sl.type !== 'binome' && genreMatch === 'Mixte' && (
                  <View style={s.miniChips}>
                    {['Homme','Femme'].map(g => (
                      <TouchableOpacity key={g} style={[s.miniChip, sl.genre===g && s.miniChipA]} onPress={() => setSlotGenre(i, g)} activeOpacity={0.8}>
                        <Text style={[s.miniChipText, sl.genre===g && s.miniChipTextA]}>{g==='Homme'?'👨':' 👩'} {g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => supprimerSlot(i)} style={s.deleteBtn}>
                <Text style={{fontSize:16,color:COLORS.text2}}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Boutons d'ajout */}
          {typeAnnonce === 'match' && (
            <View style={s.addRow}>
              {SLOTS_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.id} style={s.addBtn} onPress={() => ajouterSlot(opt)} activeOpacity={0.8}>
                  <Text style={{fontSize:16}}>{opt.icon}</Text>
                  <Text style={s.addBtnText}>+ {opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Niveau */}
          {typeAnnonce === 'match' && slots.length > 0 && (
            <>
              <Text style={s.lbl}>📊 Niveau recherché</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}} contentContainerStyle={{gap:8}}>
                {NIVEAUX.map(n => (
                  <TouchableOpacity key={n} style={[s.nvChip, niveau===n && s.nvChipA]} onPress={() => setNiveau(n)} activeOpacity={0.8}>
                    <Text style={[s.nvText, niveau===n && {color:'#000'}]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Message libre pour match */}
          {typeAnnonce === 'match' && slots.length > 0 && (
            <>
              <Text style={s.lbl}>💬 Message (optionnel)</Text>
              <TextInput
                style={[s.textInput, {marginBottom:8}]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Ambiance décontractée, on joue pour le fun 😄"
                placeholderTextColor={COLORS.text2}
                multiline
              />
            </>
          )}

          {/* Aperçu */}
          <View style={s.preview}>
            <Text style={s.previewTitle}>👀 Aperçu de l'annonce</Text>
            <View style={s.bubble}><Text style={s.bubbleText}>{getMsg()}</Text><Text style={s.bubbleTime}>maintenant ✓✓</Text></View>
          </View>

          <TouchableOpacity style={[s.btn, loading && {opacity:0.7}]} onPress={publier} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#000"/> : <Text style={s.btnText}>🚀 Publier le match</Text>}
          </TouchableOpacity>
          <Text style={s.btnSub}>Les joueurs compatibles seront notifiés</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.md},
  topTitle:{fontSize:16,fontWeight:'800',color:COLORS.text},
  fl:{paddingHorizontal:SPACING.md},
  lbl:{fontSize:12,fontWeight:'700',color:COLORS.text2,marginBottom:10,textTransform:'uppercase',letterSpacing:0.5},
  row:{flexDirection:'row',gap:8,marginBottom:16},
  dchip:{flex:1,backgroundColor:COLORS.card,borderRadius:12,paddingVertical:11,alignItems:'center',borderWidth:1,borderColor:COLORS.border},
  dchipA:{backgroundColor:'rgba(200,245,74,0.1)',borderColor:COLORS.green},
  dday:{fontSize:10,color:COLORS.text2,marginBottom:2},
  dnum:{fontSize:18,fontWeight:'900',color:COLORS.text},
  hchip:{backgroundColor:COLORS.card,borderRadius:12,paddingVertical:12,paddingHorizontal:16,borderWidth:1,borderColor:COLORS.border},
  hchipA:{backgroundColor:'rgba(200,245,74,0.1)',borderColor:COLORS.green},
  hchipText:{fontSize:13,fontWeight:'800',color:COLORS.text2},
  clubCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:13,flexDirection:'row',alignItems:'center',gap:11,marginBottom:9,borderWidth:1,borderColor:COLORS.border},
  clubCardA:{backgroundColor:'rgba(200,245,74,0.07)',borderColor:'rgba(200,245,74,0.3)'},
  clubIcon:{width:42,height:42,borderRadius:12,backgroundColor:COLORS.card2,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:COLORS.border},
  clubName:{fontSize:14,fontWeight:'800',color:COLORS.text,marginBottom:2},
  clubMeta:{fontSize:11,color:COLORS.text2},
  check:{width:22,height:22,borderRadius:11,backgroundColor:COLORS.green,alignItems:'center',justifyContent:'center'},
  radio:{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:COLORS.border},
  genreRow:{flexDirection:'row',gap:10,marginBottom:16},
  genreChip:{flex:1,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:12,alignItems:'center',borderWidth:1.5,borderColor:COLORS.border,gap:4},
  genreChipA:{backgroundColor:'rgba(200,245,74,0.07)',borderColor:COLORS.green},
  genreText:{fontSize:12,fontWeight:'700',color:COLORS.text2},
  genreTextA:{color:COLORS.green},
  slotRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:COLORS.card,borderRadius:RADIUS.md,padding:12,marginBottom:8,borderWidth:1,borderColor:COLORS.border},
  slotIcon:{width:36,height:36,backgroundColor:COLORS.card2,borderRadius:10,alignItems:'center',justifyContent:'center'},
  slotLabel:{fontSize:14,fontWeight:'700',color:COLORS.text},
  miniChips:{flexDirection:'row',gap:6,marginTop:6},
  miniChip:{paddingVertical:4,paddingHorizontal:8,borderRadius:RADIUS.full,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.card2},
  miniChipA:{backgroundColor:COLORS.green,borderColor:COLORS.green},
  miniChipText:{fontSize:11,color:COLORS.text2,fontWeight:'600'},
  miniChipTextA:{color:'#000'},
  deleteBtn:{padding:6},
  addRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16},
  addBtn:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:COLORS.card2,borderRadius:RADIUS.md,paddingVertical:8,paddingHorizontal:12,borderWidth:1,borderColor:COLORS.border},
  addBtnText:{fontSize:12,fontWeight:'700',color:COLORS.text2},
  nvChip:{backgroundColor:COLORS.card2,borderRadius:10,paddingVertical:10,paddingHorizontal:16,borderWidth:1,borderColor:COLORS.border,minWidth:48,alignItems:'center'},
  nvChipA:{backgroundColor:COLORS.green,borderColor:COLORS.green},
  nvText:{fontSize:14,fontWeight:'800',color:COLORS.text2},
  preview:{backgroundColor:'#0d1f0d',borderRadius:RADIUS.lg,padding:15,marginBottom:16,borderWidth:1,borderColor:'rgba(200,245,74,0.15)',marginTop:8},
  previewTitle:{fontSize:13,fontWeight:'800',color:COLORS.green,marginBottom:12},
  bubble:{backgroundColor:'#1a3a1a',borderRadius:14,borderTopLeftRadius:2,padding:12,borderWidth:1,borderColor:'rgba(200,245,74,0.2)'},
  bubbleText:{fontSize:14,color:COLORS.text,lineHeight:24},
  bubbleTime:{fontSize:10,color:COLORS.text2,textAlign:'right',marginTop:6},
  btn:{backgroundColor:COLORS.green,borderRadius:RADIUS.lg,paddingVertical:16,alignItems:'center',marginBottom:8},
  btnText:{fontSize:16,fontWeight:'800',color:'#000'},
  btnSub:{textAlign:'center',fontSize:12,color:COLORS.text2,marginBottom:32},
  typeRow:{flexDirection:'row',gap:12,marginBottom:20},
  typeCard:{flex:1,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,alignItems:'center',gap:4,borderWidth:1.5,borderColor:COLORS.border},
  typeCardA:{backgroundColor:'rgba(200,245,74,0.07)',borderColor:COLORS.green},
  typeLabel:{fontSize:14,fontWeight:'800',color:COLORS.text2},
  typeLabelA:{color:COLORS.green},
  typeDesc:{fontSize:10,color:COLORS.text2,textAlign:'center'},
  textInput:{backgroundColor:COLORS.card,borderWidth:1.5,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:13,fontSize:14,color:COLORS.text,marginBottom:16,minHeight:48,textAlignVertical:'top'},
});
