import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, Toggle } from '../components/Form';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../components/UI';
import { colors } from '../lib/theme';
import { configError, useSync } from '../lib/sync';

const REPO_NEW = 'https://github.com/new';
const TOKEN_NEW = 'https://github.com/settings/personal-access-tokens/new';

export default function Sauvegarde() {
  const { cfg, status, setCfg, saveNow, restoreNow, peek } = useSync();
  const [check, setCheck] = useState<string | null>(null);
  const err = configError(cfg);

  const verify = async () => {
    setCheck('Vérification…');
    try {
      const backup = await peek();
      setCheck(
        backup
          ? `Connexion OK — dernière sauvegarde du ${backup.savedAt.slice(0, 16).replace('T', ' à ')}.`
          : 'Connexion OK — aucune sauvegarde encore, elle sera créée au premier envoi.',
      );
    } catch (e) {
      setCheck(e instanceof Error ? e.message : 'Échec de la vérification.');
    }
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Card style={{ backgroundColor: colors.amberSoft }}>
        <Text style={s.h}>Sauvegarde chiffrée ? Non : dépôt privé obligatoire</Text>
        <Sub>
          Les données partent en clair dans un fichier JSON. Utilise un dépôt GitHub <Text style={s.b}>privé</Text> et
          dédié (jamais le dépôt public de l'app). Le token reste stocké sur cet appareil : si tu le perds, révoque-le
          sur GitHub.
        </Sub>
      </Card>

      <SectionTitle icon="shield">Dépôt de sauvegarde</SectionTitle>
      <Card>
        <Field
          label="Dépôt (pseudo/nom)"
          value={cfg.repo}
          onChangeText={(v) => setCfg({ repo: v.trim() })}
          placeholder="benjamin-Villalard/Doggy-data"
          hint="Dépôt privé dédié, créé exprès pour tes données."
        />
        <Field
          label="Fichier de sauvegarde"
          value={cfg.path}
          onChangeText={(v) => setCfg({ path: v.trim() })}
          placeholder="sauvegardes/mon-yorkshire.json"
        />
        <Field
          label="Branche"
          value={cfg.branch}
          onChangeText={(v) => setCfg({ branch: v.trim() })}
          placeholder="main"
        />
        <Field
          label="Token GitHub"
          value={cfg.token}
          onChangeText={(v) => setCfg({ token: v.trim() })}
          placeholder="github_pat_…"
          secure
          hint="Token « fine-grained » limité à ce dépôt, permission Contents : Read and write. Rien d'autre."
        />
        <Row>
          <View style={{ flex: 1 }}>
            <Button small tone="ghost" title="Créer le dépôt privé" onPress={() => void Linking.openURL(REPO_NEW)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button small tone="ghost" title="Créer un token" onPress={() => void Linking.openURL(TOKEN_NEW)} />
          </View>
        </Row>
      </Card>

      <SectionTitle icon="refresh">Synchronisation</SectionTitle>
      <Card>
        <Toggle
          label="Sauvegarde automatique"
          value={cfg.enabled}
          onChange={(v) => setCfg({ enabled: v })}
          hint="Envoie tes données quelques secondes après chaque modification. L'app continue de fonctionner hors ligne : l'envoi reprend au prochain changement une fois le réseau revenu."
        />
        {err ? <Sub style={{ color: colors.red }}>{err}</Sub> : null}
        <Row>
          <Pill tone={status.phase === 'error' ? 'red' : status.phase === 'ok' ? 'green' : 'grey'}>
            {status.phase === 'saving'
              ? 'Envoi…'
              : status.phase === 'loading'
                ? 'Lecture…'
                : status.phase === 'ok'
                  ? 'À jour'
                  : status.phase === 'error'
                    ? 'Erreur'
                    : 'En attente'}
          </Pill>
          <Sub style={{ flex: 1 }}>
            {status.lastSavedAt
              ? `Dernier envoi : ${status.lastSavedAt.slice(0, 16).replace('T', ' à ')}`
              : 'Aucun envoi depuis cet appareil.'}
          </Sub>
        </Row>
        {status.message ? (
          <Sub style={status.phase === 'error' ? { color: colors.red } : undefined}>{status.message}</Sub>
        ) : null}
        <Row>
          <View style={{ flex: 1 }}>
            <Button small title="Sauvegarder maintenant" disabled={!!err} onPress={() => void saveNow()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button small tone="ghost" title="Vérifier" disabled={!!err} onPress={() => void verify()} />
          </View>
        </Row>
        <Button
          small
          tone="amber"
          title="Restaurer depuis GitHub (écrase les données locales)"
          disabled={!!err}
          onPress={() => void restoreNow()}
        />
        {check ? <Sub>{check}</Sub> : null}
      </Card>

      <SectionTitle icon="book">Mode d'emploi</SectionTitle>
      <Card>
        <Text style={s.step}>1. Crée un dépôt GitHub privé, par exemple « Doggy-data », vide.</Text>
        <Text style={s.step}>
          2. Crée un token fine-grained : Repository access → Only select repositories → ce dépôt ; Permissions →
          Repository → Contents → Read and write.
        </Text>
        <Text style={s.step}>3. Colle le dépôt et le token ci-dessus, puis « Vérifier ».</Text>
        <Text style={s.step}>4. Active la sauvegarde automatique.</Text>
        <Text style={s.step}>
          5. Sur un autre appareil : renseigne le même dépôt et un token, puis « Restaurer depuis GitHub ».
        </Text>
        <Sub>
          La restauration remplace tout l'état local : fais-la avant de saisir des données sur le nouvel appareil, sinon
          la dernière sauvegarde écrase l'autre (il n'y a pas de fusion).
        </Sub>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 2 },
  b: { fontWeight: '800' },
  step: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
});
