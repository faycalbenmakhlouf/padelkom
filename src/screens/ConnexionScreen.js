import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { connecter } from '../services/auth';

export default function ConnexionScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnexion = async () => {
    if (!email || !mdp) { window.alert('Remplis ton email et mot de passe.'); return; }
    setLoading(true);
    const result = await connecter({ email, motDePasse: mdp });
    setLoading(false);
    if (result.success) {
navigation.reset({ 
  index: 0, 
  routes: [{ name: 'Main', params: { userId: result.user.id } }] 
});  
    } else {
      window.alert('Erreur : ' + result.error);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.logo}><Text style={{fontSize:40}}>🎾</Text></View>
        <Text style={s.title}>Content de te revoir !</Text>
        <Text style={s.sub}>Connecte-toi pour rejoindre tes matchs</Text>
        <View style={s.inputGroup}>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} placeholder="ton@email.com" placeholderTextColor={COLORS.text2} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>
        <View style={s.inputGroup}>
          <Text style={s.label}>Mot de passe</Text>
          <TextInput style={s.input} placeholder="Ton mot de passe" placeholderTextColor={COLORS.text2} secureTextEntry value={mdp} onChangeText={setMdp} />
        </View>
        <TouchableOpacity style={[s.btn, loading && {opacity:0.7}]} onPress={handleConnexion} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Se connecter 🎾</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.btnBack} onPress={() => navigation.navigate('Inscription')} activeOpacity={0.8}>
          <Text style={s.btnBackText}>Pas de compte ? <Text style={{color:COLORS.green}}>S'inscrire</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  container: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  logo: { width: 80, height: 80, backgroundColor: COLORS.green, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: COLORS.text2, textAlign: 'center', marginBottom: 32 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: COLORS.text2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: 14, color: COLORS.text },
  btn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  btnBack: { marginTop: 20, alignItems: 'center' },
  btnBackText: { fontSize: 14, color: COLORS.text2 },
});
