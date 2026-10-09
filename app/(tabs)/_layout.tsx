import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import Icon from '../../components/Icon';
import { useStore } from '../../lib/store';
import { colors, shadow } from '../../lib/theme';

function TabIcon({ name, color, focused }: { name: string; color: ColorValue; focused: boolean }) {
  return (
    <View style={[s.tabIcon, focused && s.tabIconActive]}>
      <Icon name={name} color={color} size={21} />
    </View>
  );
}

const tab = (name: string) => ({ color, focused }: { color: ColorValue; focused: boolean }) => (
  <TabIcon name={name} color={color} focused={focused} />
);

export default function TabsLayout() {
  const { state, ready } = useStore();
  if (!ready) return null;
  if (!state.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink3,
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: Platform.OS === 'web' ? 68 : undefined,
          paddingTop: 6,
          ...shadow.card,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', letterSpacing: -0.2 },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Carnet', tabBarIcon: tab('heart') }} />
      <Tabs.Screen name="sante" options={{ title: 'Santé', tabBarIcon: tab('stethoscope') }} />
      <Tabs.Screen name="tutos" options={{ title: 'Éducation', tabBarIcon: tab('clicker') }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabIcon: {
    width: 38,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: { backgroundColor: colors.accentSoft },
});
