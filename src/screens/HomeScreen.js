import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function HomeScreen({ navigation }) {
  const [matchs, setMatchs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nbNotifs, setNbNotifs] = useState(0);
  const [userId, setUserId] = useState(null);

  const chargerMatchs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('matchs').select('*')
        .in('statut', ['ouvert', 'complet'])
        .or(`date_match.is.null,date_match.gte.${today}`)
        .order('date_match', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      setMatchs(data || []);
    } catch(e) { setMatchs([]); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    chargerMatchs();
    chargerNotifs();
  }, []);

  const chargerNotifs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setUserId(session.user.id);
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('lu', false);
    setNbNotifs(count || 0);
  };

  const ouvrirChat = async (match) => {
    if (!userId) return;
    if (match.createur_id === userId) {
      window.alert('Tu es le créateur de ce match.');
      return;
    }
    const { data: profil } = await supabase.from('profiles').select('prenom, nom').eq('id', match.createur_id).single();
    const nom = profil ? `${profil.prenom || ''} ${profil.nom ? profil.nom[0] + '.' : ''}`.trim() : 'Joueur';
    navigation.navigate('Chat', { destinataireId: match.createur_id, destinataireNom: nom, matchId: match.id });
  };

  const onRefresh = () => { setRefreshing(true); chargerMatchs(); };

  const [slotModal, setSlotModal] = useState(null);

  const rejoindre = async (match) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.alert('Tu dois être connecté.'); return; }
    if (match.createur_id === user.id) { window.alert('Tu es le créateur de ce match.'); return; }
    if (match.slots && match.slots.length > 0) {
      const libres = match.slots.filter(s => !s.pris);
      if (libres.length === 0) { window.alert('Ce match est complet.'); return; }
      setSlotModal({ match, user, slots: libres });
    } else {
      envoyerDemande(match, user, 'Libre', null);
    }
  };

  const envoyerDemande = async (match, user, cote, slotIndex) => {
    setSlotModal(null);
    try {
      // Vérifier doublon
      const { data: existant } = await supabase.from('participations')
        .select('id').eq('match_id', match.id).eq('joueur_id', user.id)
        .in('statut', ['en_attente', 'confirme']).maybeSingle();
      if (existant) { window.alert('Tu as déjà une demande en cours pour ce match.'); return; }

      const { error } = await supabase.from('participations').insert({ match_id: match.id, joueur_id: user.id, statut: 'en_attente', cote });
      if (error) throw error;
      const { data: profil } = await supabase.from('profiles').select('prenom, nom').eq('id', user.id).single();
      const nomJoueur = profil ? `${profil.prenom} ${profil.nom ? profil.nom[0] + '.' : ''}`.trim() : 'Un joueur';
      const slotLabel = cote === 'Binôme' ? 'en binôme' : `côté ${cote}`;
      if (match.createur_id && match.createur_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: match.createur_id, type: 'nouveau_joueur', message: `${nomJoueur} (${slotLabel}) veut rejoindre ton match du ${match.jour} à ${match.heure} — ${match.club}`, match_id: match.id });
      }
      window.alert('Demande envoyée !');
    } catch(e) { window.alert('Erreur : ' + e.message); }
  };

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
      const desc = libres.map(s => {
        if (s.type === 'binome') return '🤝 Binôme';
        let txt = `${s.cote === 'Droit' ? '➡️' : '⬅️'} ${s.cote}`;
        if (s.classement_min && s.classement_max) txt += ` FRMT ${s.classement_min}–${s.classement_max}`;
        else if (s.classement_min) txt += ` FRMT min. ${s.classement_min}`;
        else if (s.classement_max) txt += ` FRMT max. ${s.classement_max}`;
        return txt;
      }).join(' · ');
      let msg = `🎾 Cherche : ${desc}\nNiveau ${m.niveau}`;
      if (m.description) msg += `\n💬 ${m.description}`;
      return msg;
    }
    if (m.type_match==='binome') return `🎾 Cherche binôme · Niveau ${m.niveau}`;
    return `🎾 Match · Niveau ${m.niveau}`;
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green}/>}>
        <View style={s.header}>
          <View>
            <Text style={s.greet}>Bonjour 👋</Text>
            <Text style={s.uname}>PadelKom <Text style={{color:COLORS.green}}>.</Text></Text>
          </View>
          <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={{fontSize:20}}>🔔</Text>
            {nbNotifs > 0 && <View style={s.notifDot}><Text style={{fontSize:8,color:'#000',fontWeight:'900'}}>{nbNotifs > 9 ? '9+' : nbNotifs}</Text></View>}
          </TouchableOpacity>
        </View>
        <View style={s.banner}>
          <View><Text style={s.bannerTitle}>Trouve ton match 🎾</Text><Text style={s.bannerSub}>Casablanca · Niveau certifié</Text></View>
          <Text style={{fontSize:30}}>🎾</Text>
        </View>
        <View style={s.secHeader}>
          <Text style={s.secTitle}>Matchs disponibles</Text>
          <TouchableOpacity onPress={onRefresh}><Text style={s.secLink}>Actualiser</Text></TouchableOpacity>
        </View>
        {loading ? (
          <View style={s.center}><ActivityIndicator color={COLORS.green} size="large"/><Text style={s.loadText}>Chargement…</Text></View>
        ) : matchs.length === 0 ? (
          <View style={s.center}>
            <Text style={{fontSize:40,marginBottom:12}}>🎾</Text>
            <Text style={s.emptyTitle}>Aucun match disponible</Text>
            <Text style={s.emptySub}>Sois le premier à créer un match !</Text>
            <TouchableOpacity style={s.btnCreer} onPress={()=>navigation.navigate('Creer')} activeOpacity={0.85}>
              <Text style={s.btnCreerText}>+ Créer un match</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:SPACING.md,gap:12}}>
            {matchs.map((m,i) => (
              <View key={m.id} style={[s.card,i===0&&s.cardFeat]}>
                <View style={s.cardTime}>{i===0&&<View style={s.dot}/>}<Text style={s.cardTimeText}>{m.jour} · {m.heure}</Text></View>
                <Text style={s.cardMsg}>{formatMsg(m)}</Text>
                <Text style={s.cardLieu}>📍 {m.club}</Text>
                <View style={s.cardFoot}>
                  <View style={s.pill}><Text style={s.pillText}>Niveau {m.niveau}</Text></View>
                  <Text style={s.spots}><Text style={{color:COLORS.text,fontWeight:'700'}}>{m.places_libres}</Text> place{m.places_libres>1?'s':''}</Text>
                </View>
                <View style={{flexDirection:'row',gap:8}}>
                  {m.createur_id === userId ? (
                    <>
                      <TouchableOpacity style={[s.joinBtn,{flex:1,backgroundColor:COLORS.card2}]} onPress={()=>navigation.navigate('EditMatch',{matchId:m.id})} activeOpacity={0.85}>
                        <Text style={[s.joinBtnText,{color:COLORS.text}]}>✏️ Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chatBtn} onPress={()=>navigation.navigate('Demandes',{matchId:m.id})} activeOpacity={0.85}>
                        <Text style={{fontSize:16}}>👥</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={[s.joinBtn,{flex:1}]} onPress={()=>rejoindre(m)} activeOpacity={0.85}>
                        <Text style={s.joinBtnText}>{m.type_match==='cession' ? '🏟️ Contacter' : '🎾 Rejoindre'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chatBtn} onPress={()=>ouvrirChat(m)} activeOpacity={0.85}>
                        <Text style={{fontSize:16}}>💬</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={{height:32}}/>
      </ScrollView>

      <Modal visible={!!slotModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Choisis ton slot</Text>
            <Text style={s.modalSub}>Sélectionne le poste disponible</Text>
            <View style={s.modalBtns}>
              {slotModal?.slots.map((sl, i) => (
                <TouchableOpacity key={i} style={s.modalBtn} onPress={() => envoyerDemande(slotModal.match, slotModal.user, sl.type === 'binome' ? 'Binôme' : sl.cote, i)} activeOpacity={0.85}>
                  <Text style={s.modalBtnIcon}>{sl.type === 'binome' ? '🤝' : sl.cote === 'Droit' ? '➡️' : '⬅️'}</Text>
                  <Text style={s.modalBtnText}>{sl.type === 'binome' ? 'Binôme' : sl.cote}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setSlotModal(null)} style={s.modalAnnuler}>
              <Text style={s.modalAnnulerText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:SPACING.md,paddingTop:SPACING.md,paddingBottom:SPACING.sm},
  greet:{fontSize:13,color:COLORS.text2},
  uname:{fontSize:24,fontWeight:'900',color:COLORS.text},
  notifBtn:{width:44,height:44,backgroundColor:COLORS.card,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center',position:'relative'},
  notifDot:{position:'absolute',top:6,right:6,minWidth:16,height:16,backgroundColor:COLORS.green,borderRadius:8,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  banner:{marginHorizontal:SPACING.md,marginBottom:SPACING.md,backgroundColor:COLORS.green,borderRadius:RADIUS.lg,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  bannerTitle:{fontSize:16,fontWeight:'900',color:'#0A0A0A',marginBottom:4},
  bannerSub:{fontSize:12,color:'rgba(0,0,0,0.6)'},
  secHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:SPACING.md,marginBottom:12},
  secTitle:{fontSize:16,fontWeight:'800',color:COLORS.text},
  secLink:{fontSize:12,color:COLORS.green,fontWeight:'600'},
  center:{alignItems:'center',paddingVertical:40,paddingHorizontal:SPACING.lg},
  loadText:{fontSize:14,color:COLORS.text2,marginTop:12},
  emptyTitle:{fontSize:18,fontWeight:'800',color:COLORS.text,marginBottom:8},
  emptySub:{fontSize:14,color:COLORS.text2,textAlign:'center',marginBottom:20},
  btnCreer:{backgroundColor:COLORS.green,borderRadius:RADIUS.lg,paddingVertical:13,paddingHorizontal:24},
  btnCreerText:{fontSize:14,fontWeight:'800',color:'#000'},
  card:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:16,minWidth:220,borderWidth:1,borderColor:COLORS.border},
  cardFeat:{backgroundColor:'#1E2A0E',borderColor:'rgba(200,245,74,0.2)'},
  cardTime:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8},
  dot:{width:7,height:7,backgroundColor:COLORS.green,borderRadius:4},
  cardTimeText:{fontSize:11,color:COLORS.green,fontWeight:'600'},
  cardMsg:{fontSize:14,color:COLORS.text,lineHeight:22,marginBottom:8,fontWeight:'600'},
  cardLieu:{fontSize:12,color:COLORS.text2,marginBottom:10},
  cardFoot:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  pill:{backgroundColor:'rgba(200,245,74,0.12)',borderRadius:RADIUS.full,paddingVertical:4,paddingHorizontal:10,borderWidth:1,borderColor:'rgba(200,245,74,0.2)'},
  pillText:{fontSize:11,color:COLORS.green,fontWeight:'600'},
  spots:{fontSize:11,color:COLORS.text2},
  joinBtn:{backgroundColor:COLORS.green,borderRadius:RADIUS.md,paddingVertical:10,alignItems:'center'},
  joinBtnText:{fontSize:13,fontWeight:'800',color:'#000'},
  chatBtn:{width:40,height:40,backgroundColor:COLORS.card2,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',alignItems:'center',justifyContent:'center'},
  modalBox:{backgroundColor:COLORS.card,borderRadius:RADIUS.xl,padding:24,width:'80%',borderWidth:1,borderColor:COLORS.border},
  modalTitle:{fontSize:18,fontWeight:'900',color:COLORS.text,textAlign:'center',marginBottom:6},
  modalSub:{fontSize:13,color:COLORS.text2,textAlign:'center',marginBottom:20},
  modalBtns:{flexDirection:'row',gap:12,marginBottom:12},
  modalBtn:{flex:1,backgroundColor:COLORS.green,borderRadius:RADIUS.lg,paddingVertical:14,alignItems:'center',gap:4},
  modalBtnIcon:{fontSize:24},
  modalBtnText:{fontSize:14,fontWeight:'800',color:'#000'},
  modalAnnuler:{alignItems:'center',paddingVertical:8},
  modalAnnulerText:{fontSize:14,color:COLORS.text2},
});
