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

  useEffect(() => {
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id;
      if (session?.user?.email) setUserEmail(session.user.email);
      if (!id) { setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) setProfil(data);
    } catch(e) { console.error('Exception:', e); }
    setLoading(false);
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
          <TouchableOpacity style={s.editBtn} activeOpacity={0.8}>
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
              ['Licence FRMT', profil?.licence_frmt || 'Non renseignée'],
            ].map(([k,v]) => (
              <View key={k} style={s.infoRow}>
                <Text style={s.infoKey}>{k}</Text>
                <Text style={s.infoVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
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
});
