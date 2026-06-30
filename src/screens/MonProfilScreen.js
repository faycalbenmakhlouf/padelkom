import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function MonProfilScreen({ navigation, route }) {
  const [profil, setProfil]   = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesMatchs, setMesMatchs] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    chargerProfil();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', chargerProfil);
    return unsubscribe;
  }, [navigation]);

  const chargerProfil = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id;
      if (session?.user?.email) setUserEmail(session.user.email);
      if (!id) { setLoading(false); return; }
      setUserId(id);
      const [{ data }, { data: parts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('participations').select('*').eq('joueur_id', id).in('statut', ['en_attente', 'confirme']),
      ]);
      if (data) setProfil(data);
      if (parts && parts.length > 0) {
        const matchIds = parts.map(p => p.match_id);
        const { data: matchsData } = await supabase.from('matchs').select('*').in('id', matchIds);
        const matchsMap = {};
        (matchsData || []).forEach(m => { matchsMap[m.id] = m; });
        setMesMatchs(parts.map(p => ({ ...p, matchs: matchsMap[p.match_id] || null })));
      } else {
        setMesMatchs([]);
      }
    } catch(e) { console.error('Exception:', e); }
    setLoading(false);
  };

  const annulerParticipation = async (participation) => {
    if (!window.confirm('Annuler ta participation à ce match ?')) return;
    await supabase.from('participations').update({ statut: 'annule' }).eq('id', participation.id);
    const m = participation.matchs;
    if (participation.statut === 'confirme' && m) {
      await supabase.from('matchs').update({ places_libres: (m.places_libres || 0) + 1 }).eq('id', m.id);
      if (m.createur_id) {
        const { data: profil } = await supabase.from('profiles').select('prenom').eq('id', userId).single();
        await supabase.from('notifications').insert({
          user_id: m.createur_id, type: 'match_annule',
          message: `${profil?.prenom || 'Un joueur'} a annulé sa participation au match du ${m.jour} à ${m.heure} — ${m.club}.`,
          match_id: m.id,
        });
      }
    }
    setMesMatchs(p => p.filter(x => x.id !== participation.id));
  };

  const deconnecter = async () => {
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  const NIVEAUX = ['','Débutant','Perfectionnement','Élémentaire','Intermédiaire','Confirmé','Avancé','Expert','Élite'];

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large"/></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Mon Profil</Text>
          <TouchableOpacity style={s.editBtn} activeOpacity={0.8} onPress={() => navigation.navigate('EditProfil')}>
            <Text style={s.editBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>
        </View>
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={{fontSize:36}}>{profil?.genre === 'Joueuse' ? '👩' : '👨'}</Text>
            </View>
            {profil?.licence_frmt && (
              <View style={s.frmtBadge}><Text style={s.frmtText}>🇲🇦 FRMT</Text></View>
            )}
          </View>
          <View style={{flex:1}}>
            <Text style={s.name}>
              {profil?.prenom || userEmail?.split('@')[0] || 'Joueur'} {profil?.nom ? profil.nom[0] + '.' : ''}
            </Text>
            <Text style={s.meta}>{profil?.genre || 'Joueur'}</Text>
            <Text style={s.meta}>📍 {profil?.ville || 'Casablanca'}{profil?.quartier ? ` · ${profil.quartier}` : ''}</Text>
            <Text style={{fontSize:10,color:COLORS.text2,marginTop:2}}>{userEmail}</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{profil?.niveau ?? '—'}</Text>
            <Text style={s.statLabel}>Niveau</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{profil?.note_moyenne?.toFixed(1) || '—'}</Text>
            <Text style={s.statLabel}>Note moy.</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{profil?.matchs_joues ?? 0}</Text>
            <Text style={s.statLabel}>Matchs</Text>
          </View>
        </View>
        {profil?.niveau && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🎾 Niveau certifié</Text>
            <View style={s.niveauCard}>
              <View style={s.niveauNum}>
                <Text style={s.niveauNumText}>{profil.niveau}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={s.niveauLabel}>{NIVEAUX[profil.niveau] || 'Joueur'}</Text>
                <Text style={s.niveauSub}>Certifié par la communauté après chaque match</Text>
              </View>
            </View>
          </View>
        )}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📋 Informations</Text>
          <View style={s.infoCard}>
            {[
              ['Genre', profil?.genre || '—'],
              ['Ville', profil?.ville || '—'],
              ['Quartier', profil?.quartier || '—'],
            ].map(([k,v]) => (
              <View key={k} style={s.infoRow}>
                <Text style={s.infoKey}>{k}</Text>
                <Text style={s.infoVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        {mesMatchs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🎾 Mes participations</Text>
            {mesMatchs.map(p => {
              const m = p.matchs;
              if (!m) return null;
              return (
                <View key={p.id} style={s.matchCard}>
                  <View style={{flex:1}}>
                    <Text style={s.matchTitre}>{m.jour} · {m.heure}</Text>
                    <Text style={s.matchMeta}>📍 {m.club}</Text>
                    <View style={[s.statutBadge, p.statut === 'confirme' && s.statutConfirme]}>
                      <Text style={[s.statutText, p.statut === 'confirme' && s.statutTextConfirme]}>
                        {p.statut === 'confirme' ? '✅ Confirmé' : '⏳ En attente'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {p.statut === 'confirme' && m.statut === 'complet' && (
                      <TouchableOpacity style={s.noterBtn} onPress={() => navigation.navigate('Notation', { matchId: m.id })} activeOpacity={0.8}>
                        <Text style={s.noterBtnText}>⭐ Noter</Text>
                      </TouchableOpacity>
                    )}
                    {p.statut !== 'confirme' || m.statut !== 'complet' ? (
                      <TouchableOpacity style={s.annulerBtn} onPress={() => annulerParticipation(p)} activeOpacity={0.8}>
                        <Text style={s.annulerBtnText}>Annuler</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{paddingHorizontal:SPACING.md, paddingBottom:32}}>
          <TouchableOpacity style={s.btnLogout} onPress={deconnecter} activeOpacity={0.85}>
            <Text style={s.btnLogoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.md},
  title:{fontSize:22,fontWeight:'900',color:COLORS.text},
  editBtn:{backgroundColor:COLORS.card,borderRadius:RADIUS.md,paddingVertical:7,paddingHorizontal:12,borderWidth:1,borderColor:COLORS.border},
  editBtnText:{fontSize:12,color:COLORS.text2,fontWeight:'600'},
  profileCard:{flexDirection:'row',alignItems:'center',gap:16,marginHorizontal:SPACING.md,marginBottom:16,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:16,borderWidth:1,borderColor:COLORS.border},
  avatarWrap:{position:'relative'},
  avatar:{width:72,height:72,borderRadius:22,backgroundColor:COLORS.card2,borderWidth:3,borderColor:COLORS.green,alignItems:'center',justifyContent:'center'},
  frmtBadge:{position:'absolute',bottom:-6,right:-6,backgroundColor:COLORS.green,borderRadius:8,paddingHorizontal:5,paddingVertical:2},
  frmtText:{fontSize:9,fontWeight:'800',color:'#000'},
  name:{fontSize:18,fontWeight:'900',color:COLORS.text,marginBottom:4},
  meta:{fontSize:12,color:COLORS.text2,marginBottom:2},
  statsRow:{flexDirection:'row',gap:10,marginHorizontal:SPACING.md,marginBottom:16},
  statCard:{flex:1,backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,alignItems:'center',borderWidth:1,borderColor:COLORS.border},
  statNum:{fontSize:22,fontWeight:'900',color:COLORS.green,marginBottom:4},
  statLabel:{fontSize:11,color:COLORS.text2,fontWeight:'600'},
  section:{marginHorizontal:SPACING.md,marginBottom:16},
  sectionTitle:{fontSize:13,fontWeight:'700',color:COLORS.text2,marginBottom:10,textTransform:'uppercase',letterSpacing:0.5},
  niveauCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:COLORS.border},
  niveauNum:{width:48,height:48,borderRadius:14,backgroundColor:COLORS.green,alignItems:'center',justifyContent:'center'},
  niveauNumText:{fontSize:20,fontWeight:'900',color:'#000'},
  niveauLabel:{fontSize:15,fontWeight:'800',color:COLORS.text,marginBottom:4},
  niveauSub:{fontSize:11,color:COLORS.text2},
  infoCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,overflow:'hidden',borderWidth:1,borderColor:COLORS.border},
  infoRow:{flexDirection:'row',justifyContent:'space-between',padding:13,borderBottomWidth:1,borderBottomColor:COLORS.border},
  infoKey:{fontSize:13,color:COLORS.text2},
  infoVal:{fontSize:13,color:COLORS.text,fontWeight:'600'},
  btnLogout:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:COLORS.border},
  btnLogoutText:{fontSize:14,fontWeight:'700',color:COLORS.text2},
  matchCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:14,marginBottom:10,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',gap:12},
  matchTitre:{fontSize:14,fontWeight:'800',color:COLORS.text,marginBottom:3},
  matchMeta:{fontSize:12,color:COLORS.text2,marginBottom:6},
  statutBadge:{alignSelf:'flex-start',backgroundColor:'rgba(200,245,74,0.1)',borderRadius:RADIUS.full,paddingVertical:3,paddingHorizontal:8,borderWidth:1,borderColor:'rgba(200,245,74,0.2)'},
  statutConfirme:{backgroundColor:'rgba(200,245,74,0.15)',borderColor:COLORS.green},
  statutText:{fontSize:11,color:COLORS.text2,fontWeight:'600'},
  statutTextConfirme:{color:COLORS.green},
  annulerBtn:{paddingVertical:8,paddingHorizontal:12,borderRadius:RADIUS.md,borderWidth:1,borderColor:'rgba(255,100,100,0.3)',backgroundColor:'rgba(255,60,60,0.05)'},
  annulerBtnText:{fontSize:12,color:'#ff6b6b',fontWeight:'700'},
  noterBtn:{paddingVertical:8,paddingHorizontal:12,borderRadius:RADIUS.md,borderWidth:1,borderColor:'rgba(255,215,0,0.3)',backgroundColor:'rgba(255,215,0,0.08)'},
  noterBtnText:{fontSize:12,color:'#FFD700',fontWeight:'700'},
});
