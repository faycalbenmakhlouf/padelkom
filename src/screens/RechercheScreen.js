import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';

export default function RechercheScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Chercher <Text style={{color:COLORS.green}}>.</Text></Text></View>
      <View style={s.center}>
        <Text style={{fontSize:40,marginBottom:12}}>🔍</Text>
        <Text style={s.emptyTitle}>Recherche de joueurs</Text>
        <Text style={s.emptySub}>Bientôt disponible !</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  header:{padding:SPACING.md},
  title:{fontSize:22,fontWeight:'900',color:COLORS.text},
  center:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:SPACING.lg},
  emptyTitle:{fontSize:18,fontWeight:'800',color:COLORS.text,marginBottom:8},
  emptySub:{fontSize:14,color:COLORS.text2,textAlign:'center'},
});
