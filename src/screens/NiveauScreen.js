import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

const NIVEAUX = [
  {num:1,label:'Débutant',desc:'Découverte du jeu. Apprentissage des règles fondamentales. Échanges très courts sans utiliser les vitres.'},
  {num:2,label:'Perfectionnement',desc:'Premières notions de volées. Développement des trajectoires de base depuis le fond du court.'},
  {num:3,label:'Élémentaire',desc:'Début des matchs en loisir. Compréhension et intégration des rebonds simples sur les vitres.'},
  {num:4,label:'Intermédiaire',desc:'Maîtrise de la montée au filet. Gestion des échanges longs et participation aux tournois loisirs ou P25.'},
  {num:5,label:'Confirmé',desc:'Maîtrise des lobs et des effets. Défense solide après vitre et début des tournois homologués P50 / P100.'},
  {num:6,label:'Avancé',desc:'Lecture tactique du jeu. Maîtrise des doubles vitres et coups d\'attaque complexes (Bandeja, Vibora). Tournois P100 / P250.'},
  {num:7,label:'Expert',desc:'Joueur de niveau régional supérieur. Capacité à terminer les points avec puissance et précision. Tournois P250 / P500.'},
  {num:8,label:'Élite',desc:'Joueurs du Top 1000 national. Participation aux circuits professionnels majeurs. Tournois P1000 et plus.'},
];

export default function NiveauScreen({ navigation }) {
  const [niveau, setNiveau] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCommencer = async () => {
    if (!niveau) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from('profiles').update({ niveau }).eq('id', session.user.id);
    }
    setLoading(false);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.progWrap}>
          <View style={s.progLabels}><Text style={s.progLabel}>Étape 2 sur 3 — Niveau</Text><Text style={[s.progLabel,{color:COLORS.green}]}>66%</Text></View>
          <View style={s.progTrack}><View style={[s.progFill,{width:'66%'}]}/></View>
        </View>
        <View style={s.form}>
          <Text style={s.title}>Ton niveau 🎾</Text>
          <Text style={s.sub}>Choisis honnêtement. La communauté le vérifiera après ton premier match.</Text>
          {NIVEAUX.map(n => (
            <TouchableOpacity key={n.num} style={[s.card,niveau===n.num&&s.cardA]} onPress={()=>setNiveau(n.num)} activeOpacity={0.8}>
              <View style={s.cardHeader}>
                <View style={[s.numBox,niveau===n.num&&s.numBoxA]}><Text style={[s.numText,niveau===n.num&&{color:'#000'}]}>{n.num}</Text></View>
                <Text style={[s.cardLabel,niveau===n.num&&{color:COLORS.green}]}>{n.label}</Text>
                {niveau===n.num&&<Text style={{fontSize:16,color:COLORS.green}}>✓</Text>}
              </View>
              <Text style={s.cardDesc}>{n.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{paddingHorizontal:SPACING.md,paddingBottom:32,flexDirection:'row',gap:10}}>
          <TouchableOpacity style={s.btnBack} onPress={()=>navigation.goBack()} activeOpacity={0.8}><Text style={{fontSize:20,color:COLORS.text}}>←</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn,{flex:1,opacity:niveau?1:0.5}]} onPress={handleCommencer} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Commencer 🚀</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  progWrap:{padding:SPACING.md,paddingBottom:0},
  progLabels:{flexDirection:'row',justifyContent:'space-between',marginBottom:6},
  progLabel:{fontSize:11,color:COLORS.text2},
  progTrack:{height:4,backgroundColor:COLORS.card2,borderRadius:2},
  progFill:{height:'100%',backgroundColor:COLORS.green,borderRadius:2},
  form:{padding:SPACING.md},
  title:{fontSize:22,fontWeight:'900',color:COLORS.text,marginBottom:4},
  sub:{fontSize:13,color:COLORS.text2,marginBottom:20,lineHeight:20},
  card:{backgroundColor:COLORS.card,borderWidth:1.5,borderColor:COLORS.border,borderRadius:RADIUS.lg,padding:14,marginBottom:10},
  cardA:{backgroundColor:'rgba(200,245,74,0.07)',borderColor:'rgba(200,245,74,0.35)'},
  cardHeader:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},
  numBox:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.card2,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},
  numBoxA:{backgroundColor:COLORS.green,borderColor:COLORS.green},
  numText:{fontSize:15,fontWeight:'900',color:COLORS.text2},
  cardLabel:{fontSize:15,fontWeight:'800',color:COLORS.text,flex:1},
  cardDesc:{fontSize:12,color:COLORS.text2,lineHeight:18,marginLeft:42},
  btnBack:{width:50,height:50,backgroundColor:COLORS.card,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,alignItems:'center',justifyContent:'center'},
  btn:{backgroundColor:COLORS.green,borderRadius:RADIUS.lg,paddingVertical:15,alignItems:'center'},
  btnText:{fontSize:15,fontWeight:'800',color:'#000'},
});
