import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const JOURS = [{j:'Lun',n:'5'},{j:'Mar',n:'6'},{j:'Mer',n:'7'},{j:'Jeu',n:'8'},{j:'Ven',n:'9'}];
const HEURES = ['08h00','10h00','18h30','19h30','21h00'];
const CLUBS = [{nom:'Club Californie',meta:'2.1 km'},{nom:'Ain Diab Padel',meta:'3.8 km'},{nom:'Maarif Sport',meta:'5.2 km'}];
const NIVEAUX = ['1','2','3','4','5','6','7','8','P25','P50','P100','P250','P500','P1000','P1500'];

export default function CreerMatchScreen({ navigation }) {
  const [jour, setJour] = useState(1);
  const [heure, setHeure] = useState(3);
  const [club, setClub] = useState(0);
  const [niveau, setNiveau] = useState(null);
  const [loading, setLoading] = useState(false);

  const [genreMatch, setGenreMatch] = useState(null); // 'Homme' | 'Femme' | 'Mixte' | 'Binome'
  const [nbJoueurs, setNbJoueurs] = useState(null);   // 1 | 2 | 3
  const [slots, setSlots] = useState([]);              // [{cote, genre}]

  const isBinome = nbJoueurs === 'binome';

  const handleGenreMatch = (g) => {
    setGenreMatch(g);
    setNbJoueurs(null);
    setSlots([]);
  };

  const handleNbJoueurs = (nb) => {
    setNbJoueurs(nb);
    if (nb === 'binome') {
      setSlots([]);
    } else {
      setSlots(Array.from({ length: nb }, () => ({ cote: null, genre: genreMatch === 'Mixte' ? null : genreMatch })));
    }
  };

  const setSlotCote = (i, cote) => {
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, cote } : slot));
  };

  const setSlotGenre = (i, genre) => {
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, genre } : slot));
  };

  const slotsValides = isBinome || (slots.length > 0 && slots.every(s => s.cote && s.genre));

  const getMsg = () => {
    if (!genreMatch || !nbJoueurs || !niveau) return '…remplis le formulaire';
    const h = HEURES[heure], j = JOURS[jour].j, c = CLUBS[club].nom;
    if (isBinome) return `🎾 Cherche un binôme ${genreMatch} · Niveau ${niveau}\n📅 ${j} · ${h}\n📍 ${c}`;
    if (!slotsValides) return '…choisis le côté pour chaque joueur';
    const details = slots.map(sl => `${sl.genre === 'Homme' ? '👨' : '👩'} ${sl.cote}`).join(' · ');
    return `🎾 ${genreMatch} · Cherche ${nbJoueurs} joueur${nbJoueurs > 1 ? 's' : ''}\n${details} · Niveau ${niveau}\n📅 ${j} · ${h}\n📍 ${c}`;
  };

  const publier = async () => {
    if (!genreMatch) { window.alert('Choisis le type de match.'); return; }
    if (!isBinome && !nbJoueurs) { window.alert('Choisis le nombre de joueurs.'); return; }
    if (!isBinome && !slotsValides) { window.alert('Complète les infos pour chaque joueur (côté et genre).'); return; }
    if (!niveau) { window.alert('Choisis le niveau.'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nb = isBinome ? 2 : Number(nbJoueurs);
      const { error } = await supabase.from('matchs').insert({
        createur_id: user?.id, jour: JOURS[jour].j, heure: HEURES[heure],
        club: CLUBS[club].nom, type_match: isBinome ? 'binome' : `${nbJoueurs}j`,
        genre_match: genreMatch, joueurs_details: isBinome ? null : slots,
        niveau, places_total: nb, places_libres: nb, statut: 'ouvert', ville: 'Casablanca',
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
        <View style={s.topBar}><View style={{width:36}}/><Text style={s.topTitle}>Créer un match</Text><View style={{width:36}}/></View>
        <View style={s.fl}>

          {/* Date */}
          <Text style={s.lbl}>📅 Date</Text>
          <View style={s.row}>
            {JOURS.map((d,i) => (
              <TouchableOpacity key={i} style={[s.dchip, jour===i && s.dchipA]} onPress={() => setJour(i)} activeOpacity={0.8}>
                <Text style={s.dday}>{d.j}</Text>
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
              <View style={{flex:1}}><Text style={s.clubName}>{c.nom}</Text><Text style={s.clubMeta}>{c.meta} · Réservation prochainement</Text></View>
              {club===i ? <View style={s.check}><Text style={{fontSize:12,color:'#000',fontWeight:'800'}}>✓</Text></View> : <View style={s.radio}/>}
            </TouchableOpacity>
          ))}

          {/* Type de match */}
          <Text style={s.lbl}>⚥ Type de match</Text>
          <View style={s.chips4}>
            {['Homme','Femme','Mixte'].map(g => (
              <TouchableOpacity key={g} style={[s.chip4, genreMatch===g && s.chip4A]} onPress={() => handleGenreMatch(g)} activeOpacity={0.8}>
                <Text style={{fontSize:18}}>{g==='Homme'?'👨':g==='Femme'?'👩':'👫'}</Text>
                <Text style={[s.chip4Text, genreMatch===g && s.chip4TextA]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nombre de joueurs */}
          {genreMatch && (
            <>
              <Text style={s.lbl}>👥 Tu cherches</Text>
              <View style={s.row}>
                {[1,2,3].map(n => (
                  <TouchableOpacity key={n} style={[s.nbChip, nbJoueurs===n && s.nbChipA]} onPress={() => handleNbJoueurs(n)} activeOpacity={0.8}>
                    <Text style={[s.nbText, nbJoueurs===n && {color:COLORS.green}]}>{n} joueur{n>1?'s':''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[s.binomeBtn, nbJoueurs==='binome' && s.binomeBtnA]} onPress={() => handleNbJoueurs('binome')} activeOpacity={0.8}>
                <Text style={{fontSize:20}}>🤝</Text>
                <View style={{flex:1}}>
                  <Text style={[s.binomeTitle, nbJoueurs==='binome' && {color:COLORS.green}]}>Binôme</Text>
                  <Text style={s.binomeSub}>Une équipe de 2 joueurs déjà constituée</Text>
                </View>
                {nbJoueurs==='binome' && <Text style={{color:COLORS.green,fontSize:16}}>✓</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Slots joueurs */}
          {!isBinome && slots.map((slot, i) => (
            <View key={i} style={s.slotCard}>
              <Text style={s.slotTitle}>Joueur {i+1}</Text>
              {genreMatch === 'Mixte' && (
                <>
                  <Text style={s.slotLabel}>Genre</Text>
                  <View style={s.slotRow}>
                    {['Homme','Femme'].map(g => (
                      <TouchableOpacity key={g} style={[s.slotChip, slot.genre===g && s.slotChipA]} onPress={() => setSlotGenre(i, g)} activeOpacity={0.8}>
                        <Text style={[s.slotChipText, slot.genre===g && s.slotChipTextA]}>{g==='Homme'?'👨 Homme':'👩 Femme'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <Text style={s.slotLabel}>Côté</Text>
              <View style={s.slotRow}>
                {['Droit','Gauche'].map(c => (
                  <TouchableOpacity key={c} style={[s.slotChip, slot.cote===c && s.slotChipA]} onPress={() => setSlotCote(i, c)} activeOpacity={0.8}>
                    <Text style={[s.slotChipText, slot.cote===c && s.slotChipTextA]}>{c==='Droit'?'➡️ Droit':'⬅️ Gauche'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Niveau */}
          {(isBinome || slotsValides) && (
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

          {/* Aperçu */}
          <View style={s.preview}>
            <Text style={s.previewTitle}>👀 Aperçu</Text>
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
  chips4:{flexDirection:'row',gap:10,marginBottom:16},
  chip4:{flex:1,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,borderWidth:1.5,borderColor:COLORS.border,alignItems:'center',gap:6},
  chip4A:{backgroundColor:'rgba(200,245,74,0.07)',borderColor:COLORS.green},
  chip4Text:{fontSize:13,fontWeight:'800',color:COLORS.text2},
  chip4TextA:{color:COLORS.green},
  nbChip:{flex:1,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,paddingVertical:14,alignItems:'center',borderWidth:1.5,borderColor:COLORS.border},
  nbChipA:{backgroundColor:'rgba(200,245,74,0.1)',borderColor:COLORS.green},
  nbText:{fontSize:13,fontWeight:'800',color:COLORS.text2,textAlign:'center'},
  binomeBtn:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,borderWidth:1.5,borderColor:COLORS.border,marginBottom:16},
  binomeBtnA:{backgroundColor:'rgba(200,245,74,0.07)',borderColor:COLORS.green},
  binomeTitle:{fontSize:14,fontWeight:'800',color:COLORS.text,marginBottom:2},
  binomeSub:{fontSize:11,color:COLORS.text2},
  slotCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,marginBottom:12,borderWidth:1,borderColor:COLORS.border},
  slotTitle:{fontSize:14,fontWeight:'800',color:COLORS.green,marginBottom:10},
  slotLabel:{fontSize:11,fontWeight:'700',color:COLORS.text2,marginBottom:6,textTransform:'uppercase'},
  slotRow:{flexDirection:'row',gap:8,marginBottom:10},
  slotChip:{flex:1,backgroundColor:COLORS.card2,borderRadius:RADIUS.md,paddingVertical:10,alignItems:'center',borderWidth:1.5,borderColor:COLORS.border},
  slotChipA:{backgroundColor:'rgba(200,245,74,0.1)',borderColor:COLORS.green},
  slotChipText:{fontSize:13,fontWeight:'700',color:COLORS.text2},
  slotChipTextA:{color:COLORS.green},
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
});
