import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useActions, useStore } from '../lib/store';
import { colors, type } from '../lib/theme';
import { useVoice } from '../lib/voice';
import { Button, Card, Pill, Ring, Row, Sub } from './UI';

export default function SessionRunner({ code }: { code: string }) {
  const { state } = useStore();
  const DURATION = state.prefs.sessionSeconds;
  const { addSession } = useActions();
  const voice = useVoice();
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(DURATION);
  const [ok, setOk] = useState(0);
  const [ko, setKo] = useState(0);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => {
        setLeft((l) => {
          if (l <= 1) {
            setRunning(false);
            return 0;
          }
          return l - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    setRunning(false);
    setLeft(DURATION);
  }, [DURATION]);

  const attempts = ok + ko;
  const rate = attempts > 0 ? Math.round((ok / attempts) * 100) : 0;
  const history = state.sessions.filter((s) => s.code === code).slice(0, 5);
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  const save = () => {
    addSession({ code, ok, ko, seconds: DURATION - left, note: note.trim() || undefined });
    setSaved(true);
    setOk(0);
    setKo(0);
    setNote('');
    setLeft(DURATION);
    setRunning(false);
  };

  return (
    <Card>
      <Row>
        <Text style={s.h}>Séance minutée ({Math.round(DURATION / 60) || 1} min)</Text>
        <Pill tone={rate >= 80 ? 'green' : attempts ? 'orange' : 'grey'}>
          {attempts ? `${ok}/${attempts} · ${rate}%` : '—'}
        </Pill>
      </Row>
      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
        <Ring
          value={DURATION - left}
          max={DURATION}
          size={126}
          stroke={11}
          color={running ? colors.accent : left === 0 ? colors.green : colors.ink3}
          center={`${mm}:${ss}`}
          caption={running ? 'EN COURS' : left === DURATION ? 'PRÊT' : left === 0 ? 'TERMINÉ' : 'EN PAUSE'}
        />
      </View>
      <Sub>
        Règle du livre : 8 à 12 répétitions, on complexifie seulement à partir de 8/10 réussites. On termine toujours sur
        une réussite.
      </Sub>
      <Row>
        <View style={{ flex: 1 }}>
          <Button
            small
            tone={running ? 'ghost' : 'accent'}
            title={running ? 'Pause' : left === DURATION ? 'Démarrer' : 'Reprendre'}
            onPress={() => setRunning((r) => !r)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            small
            tone="ghost"
            title="Remettre à zéro"
            onPress={() => {
              setRunning(false);
              setLeft(DURATION);
            }}
          />
        </View>
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Button small tone="green" title={`Réussi (${ok})`} onPress={() => setOk((v) => v + 1)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button small tone="red" title={`Raté (${ko})`} onPress={() => setKo((v) => v + 1)} />
        </View>
      </Row>
      <TextInput
        style={s.input}
        value={note}
        onChangeText={setNote}
        placeholder="Note (lieu, distraction, ce qui a bloqué…)"
        placeholderTextColor={colors.ink3}
        multiline
      />
      <Button small title="Enregistrer la séance" onPress={save} disabled={attempts === 0} />
      {saved ? <Sub>{voice.fun ? voice.praise(attempts) : 'Séance enregistrée dans le carnet.'}</Sub> : null}

      {history.length > 0 ? (
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={s.h2}>5 dernières séances</Text>
          {history.map((h) => (
            <Text key={h.id} style={s.line}>
              {new Date(h.ts).toLocaleDateString('fr-FR')} · {h.ok}/{h.ok + h.ko} (
              {h.ok + h.ko > 0 ? Math.round((h.ok / (h.ok + h.ko)) * 100) : 0}%)
              {h.note ? ` — ${h.note}` : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  h2: { fontSize: 13, fontWeight: '700', color: colors.ink2 },
  line: { ...type.small, color: colors.ink3 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    minHeight: 46,
    color: colors.ink,
    backgroundColor: '#faf8fe',
    outlineStyle: 'none',
  } as never,
});
