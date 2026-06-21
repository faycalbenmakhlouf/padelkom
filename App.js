import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { COLORS } from './src/theme/colors';

import SplashScreen from './src/screens/SplashScreen';
import InscriptionScreen from './src/screens/InscriptionScreen';
import ConnexionScreen from './src/screens/ConnexionScreen';
import NiveauScreen from './src/screens/NiveauScreen';
import HomeScreen from './src/screens/HomeScreen';
import RechercheScreen from './src/screens/RechercheScreen';
import CreerMatchScreen from './src/screens/CreerMatchScreen';
import TournoisScreen from './src/screens/TournoisScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import MonProfilScreen from './src/screens/MonProfilScreen';
import EditProfilScreen from './src/screens/EditProfilScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, borderTopWidth: 1, paddingBottom: 20, paddingTop: 10, height: 80 },
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.text2,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused }) => {
          const icons = { Home: '🏠', Recherche: '🔍', Creer: '➕', Tournois: '🏆', Messages: '💬', Profil: '👤' };
          return <Text style={{ fontSize: focused && route.name === 'Creer' ? 22 : 20 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Recherche" component={RechercheScreen} options={{ tabBarLabel: 'Chercher' }} />
      <Tab.Screen
        name="Creer"
        component={CreerMatchScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={{ width:52,height:52,backgroundColor:COLORS.green,borderRadius:16,alignItems:'center',justifyContent:'center',marginBottom:20 }}>
              <Text style={{ fontSize: 26, color: '#000' }}>➕</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen name="Tournois" component={TournoisScreen} options={{ tabBarLabel: 'Tournois' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen name="Profil" component={MonProfilScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Inscription" component={InscriptionScreen} />
        <Stack.Screen name="Connexion" component={ConnexionScreen} />
        <Stack.Screen name="Niveau" component={NiveauScreen} />
        <Stack.Screen name="Main" component={MainTabs} initialParams={{userId: null}} />
        <Stack.Screen name="EditProfil" component={EditProfilScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


