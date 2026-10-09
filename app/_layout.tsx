import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../lib/store';
import { SyncProvider } from '../lib/sync';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SyncProvider>
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
            <Stack.Screen name="carnet/poids" options={{ title: 'Poids & croissance' }} />
            <Stack.Screen name="carnet/selle" options={{ title: 'Noter une selle' }} />
            <Stack.Screen name="carnet/journal" options={{ title: 'Journal quotidien' }} />
            <Stack.Screen name="sante/soins" options={{ title: 'Soins & toilettage' }} />
            <Stack.Screen name="sante/vaccins" options={{ title: 'Vaccins & vermifuges' }} />
            <Stack.Screen name="sante/nutrition" options={{ title: 'Nutrition & ration' }} />
            <Stack.Screen name="sante/carnet" options={{ title: 'Carnet de santé' }} />
            <Stack.Screen name="sante/urgences" options={{ title: "Gestes d'urgence" }} />
            <Stack.Screen name="sante/signes" options={{ title: 'Signes cliniques' }} />
            <Stack.Screen name="reglages" options={{ title: 'Réglages' }} />
            <Stack.Screen name="sauvegarde" options={{ title: 'Sauvegarde GitHub' }} />
          </Stack>
        </SyncProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
