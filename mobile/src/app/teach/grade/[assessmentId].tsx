// Grading (PRD LMS-07/08, AI-04): enter scores by roster; for work with an answer key the assistant
// drafts scores, and nothing reaches students or parents until the instructor publishes.

import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, font, radius, space } from '../../../theme/tokens';
import { useT } from '../../../i18n';
import { useStore } from '../../../data/store';
import { assessments } from '../../../data/mock';
import { courseById, courseRoster, groupById } from '../../../data/selectors';
import { groupLabel } from '../../../data/format';
import { Avatar, Btn, Card, Icon, Notice, Row, Screen, Section, Txt } from '../../../components/ui';

export default function Grade() {
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { t, L, lang } = useT();
  const s = useStore();
  const a = assessments.find((x) => x.id === assessmentId)!;
  const roster = courseRoster(s, a.courseId);
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(s.grades[a.id] ?? {}).map(([k, v]) => [k, String(v)])),
  );
  const [published, setPublished] = useState(s.publishedGrades.includes(a.id));

  // Draft: each student's recent level, scaled to this assessment's maximum.
  const draft = useMemo(
    () => Object.fromEntries(roster.map((r) => [r.id, Math.round((r.scores[r.scores.length - 1] / 100) * a.max)])),
    [roster, a.max],
  );

  const filled = roster.filter((r) => scores[r.id] !== undefined && scores[r.id] !== '').length;
  const invalid = roster.some((r) => {
    const v = scores[r.id];
    if (v === undefined || v === '') return false;
    const n = Number(v);
    return Number.isNaN(n) || n < 0 || n > a.max;
  });

  const publish = () => {
    const out: Record<string, number> = {};
    roster.forEach((r) => {
      const v = scores[r.id];
      if (v !== undefined && v !== '') out[r.id] = Number(v);
    });
    s.saveGrades(a.id, out, true);
    setPublished(true);
  };

  return (
    <Screen
      back
      title={L(a.title)}
      subtitle={`${t('gradeTitle')} — ${L(courseById(a.courseId).title)}`}
      footer={
        published ? (
          <Btn label={t('done')} full onPress={() => router.back()} />
        ) : (
          <Btn label={`${t('publishGrades')} (${filled}/${roster.length})`} full disabled={!filled || invalid} onPress={publish} />
        )
      }
    >
      {published ? (
        <View style={{ marginBottom: space.l }}>
          <Notice text={t('gradesPublished')} />
        </View>
      ) : null}

      {a.hasAnswerKey && !published ? (
        <Card tone="tint">
          <Row gap={space.s} align="flex-start">
            <Icon name="sparkles" size={18} color={colors.blue} flip={false} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt w="s">{t('aiDraft')}</Txt>
              <Txt size="small" color={colors.inkSoft}>
                {t('aiDraftBody')}
              </Txt>
            </View>
          </Row>
          <View style={{ marginTop: space.m }}>
            <Btn small label={t('acceptDraft')} icon="checkmark-done" variant="outline" onPress={() => setScores(Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, String(v)])))} />
          </View>
        </Card>
      ) : null}

      <Section title={t('enterScores')}>
        <Card style={{ paddingVertical: space.xs }}>
          {roster.map((r, i) => {
            const v = scores[r.id] ?? '';
            const n = Number(v);
            const bad = v !== '' && (Number.isNaN(n) || n < 0 || n > a.max);
            return (
              <Row key={r.id} gap={space.m} style={[{ paddingVertical: space.s + 2 }, i ? styles.sep : null]}>
                <Avatar name={L(r.name)} size={34} />
                <View style={{ flex: 1 }}>
                  <Txt w="m" numberOfLines={1}>
                    {L(r.name)}
                  </Txt>
                  <Txt size="micro" color={colors.inkMute}>
                    {groupLabel(groupById(r.groupId), lang)}
                  </Txt>
                </View>
                {/* Scores read left to right: "17 / 20". */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TextInput
                    value={v}
                    editable={!published}
                    onChangeText={(x) => setScores((m) => ({ ...m, [r.id]: x.replace(/[^\d.]/g, '') }))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={colors.inkMute}
                    accessibilityLabel={`${L(r.name)} ${t('score')}`}
                    style={[styles.score, bad && { borderColor: colors.bad, color: colors.bad }, v !== '' && !bad && draft[r.id] === n && styles.drafted]}
                  />
                  <Txt size="small" color={colors.inkSoft} style={{ writingDirection: 'ltr' }}>
                    / {a.max}
                  </Txt>
                </View>
              </Row>
            );
          })}
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  score: {
    width: 56,
    height: 40,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.line,
    textAlign: 'center',
    fontFamily: font.s,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  drafted: { backgroundColor: colors.blueTint, borderColor: '#BFD0F7' },
});
