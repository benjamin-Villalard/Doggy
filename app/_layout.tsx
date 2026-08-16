import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../lib/store';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTitleStyle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
            headerShadowVisible: false,
            headerTintColor: colors.accent,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: 'Bienvenue', headerShown: false }} />
          <Stack.Screen name="tutos/[code]" options={{ title: 'Tutoriel' }} />
          <Stack.Screen name="aleas/[code]" options={{ title: 'Aléa' }} />
          <Stack.Screen name="programme/[index]" options={{ title: 'Phase' }} />
          <Stack.Screen name="livre/[index]" options={{ title: 'Chapitre' }} />
          <Stack.Screen name="suivi/competences" options={{ title: 'Compétences' }} />
          <Stack.Screen name="suivi/socialisation" options={{ title: 'Socialisation' }} />
          <Stack.Screen name="suivi/proprete" options={{ title: 'Propreté' }} />
          <Stack.Screen name="suivi/poids" options={{ title: 'Poids & croissance' }} />
          <Stack.Screen name="suivi/seances" options={{ title: 'Historique des séances' }} />
          <Stack.Screen name="sante/vaccins" options={{ title: 'Vaccins & vermifuges' }} />
          <Stack.Screen name="sante/nutrition" options={{ title: 'Nutrition & ration' }} />
          <Stack.Screen name="sante/carnet" options={{ title: 'Carnet de santé' }} />
          <Stack.Screen name="sante/urgences" options={{ title: "Gestes d'urgence" }} />
          <Stack.Screen name="sante/signes" options={{ title: 'Signes cliniques' }} />
          <Stack.Screen name="reglages" options={{ title: 'Réglages' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
