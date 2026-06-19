import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    });
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.logo}><Text style={{fontSize:44}}>🎾</Text></View>
        <Text style={s.title}>Trouve ton <Text style={{color:COLORS.green}}>match</Text></Text>
        <Text style={s.city}>CASABLANCA · MAROC</Text>
        <Text style={s.sub}>Le réseau social des joueurs de padel.{'\n'}Niveau certifié par la communauté.</Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Inscription')} activeOpacity={0.85}>
          <Text style={s.btnPrimaryText}>🚀 Créer un compte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('Connexion')} activeOpacity={0.85}>
          <Text style={s.btnSecondaryText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  logo: { width: 90, height: 90, backgroundColor: COLORS.green, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  city: { fontSize: 12, fontWeight: '600', color: COLORS.text2, letterSpacing: 2, marginBottom: 16 },
  sub: { fontSize: 14, color: COLORS.text2, textAlign: 'center', lineHeight: 22, marginBottom: 44, maxWidth: 280 },
  btnPrimary: { width: '100%', backgroundColor: COLORS.green, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#000' },
  btnSecondary: { width: '100%', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
});
