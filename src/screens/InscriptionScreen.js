import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { inscrire } from '../services/auth';

const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger'];

export default function InscriptionScreen({ navigation }) {
  const [genre, setGenre] = useState('Joueur');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [naissance, setNaissance] = useState('');
  const [ville, setVille] = useState('Casablanca');
  const [quartier, setQuartier] = useState('');
  const [licence, setLicence] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuivant = async () => {
    if (!prenom || !nom || !email || !mdp) { Alert.alert('⚠️', 'Remplis au moins prénom, nom, email et mot de passe.'); return; }
    setLoading(true);
    const result = await inscrire({ email, motDePasse: mdp, prenom, nom, genre, dateNaissance: naissance, ville, quartier, licenceFRMT: licence });
    setLoading(false);
    if (result.success) { navigation.navigate('Niveau'); }
    else { Alert.alert('❌ Erreur', result.error); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.progWrap}>
            <View style={s.progLabels}><Text style={s.progLabel}>Étape 1 sur 3</Text><Text style={[s.progLabel,{color:COLORS.green}]}>33%</Text></View>
            <View style={s.progTrack}><View style={[s.progFill,{width:'33%'}]}/></View>
          </View>
          <View style={s.form}>
            <Text style={s.title}>Ton profil 👤</Text>
            <View style={s.rowChips}>
              {['Joueur','Joueuse'].map(g => (
                <TouchableOpacity key={g} style={[s.chip,{flex:1},genre===g&&s.chipA]} onPress={()=>setGenre(g)} activeOpacity={0.8}>
                  <Text style={[s.chipText,genre===g&&{color:COLORS.green}]}>{g==='Joueur'?'👨 Joueur':'👩 Joueuse'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.row}>
              <View style={[s.ig,{flex:1}]}><Text style={s.label}>Prénom</Text><TextInput style={s.input} placeholder="Yassine" placeholderTextColor={COLORS.text2} value={prenom} onChangeText={setPrenom}/></View>
              <View style={[s.ig,{flex:1}]}><Text style={s.label}>Nom</Text><TextInput style={s.input} placeholder="Benali" placeholderTextColor={COLORS.text2} value={nom} onChangeText={setNom}/></View>
            </View>
            <Text style={s.hint}>Seule l'initiale du nom sera affichée</Text>
            <View style={s.ig}><Text style={s.label}>Email</Text><TextInput style={s.input} placeholder="ton@email.com" placeholderTextColor={COLORS.text2} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}/></View>
            <View style={s.ig}><Text style={s.label}>Mot de passe</Text><TextInput style={s.input} placeholder="Minimum 6 caractères" placeholderTextColor={COLORS.text2} secureTextEntry value={mdp} onChangeText={setMdp}/></View>
            <View style={s.ig}><Text style={s.label}>Date de naissance</Text><TextInput style={s.input} placeholder="JJ/MM/AAAA" placeholderTextColor={COLORS.text2} value={naissance} onChangeText={setNaissance}/></View>
            <View style={s.ig}>
              <Text style={s.label}>Ville</Text>
              <View style={s.chipRow}>
                {VILLES.map(v => (
                  <TouchableOpacity key={v} style={[s.chip,ville===v&&s.chipA]} onPress={()=>setVille(v)} activeOpacity={0.8}>
                    <Text style={[s.chipText,ville===v&&{color:COLORS.green}]}>{ville===v?'📍 ':''}{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.ig}><Text style={s.label}>Quartier</Text><TextInput style={s.input} placeholder="Californie, Maarif…" placeholderTextColor={COLORS.text2} value={quartier} onChangeText={setQuartier}/></View>
            <View style={s.ig}><Text style={s.label}>Licence FRMT <Text style={{fontStyle:'italic',fontWeight:'400'}}>(optionnel)</Text></Text><TextInput style={s.input} placeholder="Ex: 12345" placeholderTextColor={COLORS.text2} keyboardType="number-pad" value={licence} onChangeText={setLicence}/></View>
          </View>
          <View style={{paddingHorizontal:SPACING.md,paddingBottom:32}}>
            <TouchableOpacity style={[s.btn,loading&&{opacity:0.7}]} onPress={handleSuivant} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#000"/> : <Text style={s.btnText}>Suivant →</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  title:{fontSize:22,fontWeight:'900',color:COLORS.text,marginBottom:16},
  row:{flexDirection:'row',gap:10},
  rowChips:{flexDirection:'row',gap:10,marginBottom:16},
  ig:{marginBottom:14},
  label:{fontSize:12,color:COLORS.text2,fontWeight:'600',marginBottom:6},
  input:{backgroundColor:COLORS.card,borderWidth:1.5,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:13,fontSize:14,color:COLORS.text},
  hint:{fontSize:11,color:COLORS.text2,marginBottom:14},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  chip:{backgroundColor:COLORS.card,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.full,paddingVertical:9,paddingHorizontal:14,alignItems:'center'},
  chipA:{backgroundColor:'rgba(200,245,74,0.1)',borderColor:'rgba(200,245,74,0.3)'},
  chipText:{fontSize:13,color:COLORS.text2,fontWeight:'500'},
  btn:{backgroundColor:COLORS.green,borderRadius:RADIUS.lg,paddingVertical:16,alignItems:'center'},
  btnText:{fontSize:16,fontWeight:'800',color:'#000'},
});
