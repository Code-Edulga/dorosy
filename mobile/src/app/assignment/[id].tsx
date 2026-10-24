import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { assessments } from '../../data/mock';
import { childWork, courseById } from '../../data/selectors';
import { fmtDayLabel, fmtRelDay, fmtTime } from '../../lib/dates';
import { AlignStart, Btn, Card, Icon, Notice, Row, Screen, Section, Tag, Txt } from '../../components/ui';
import { WorkIcon } from '../../components/WorkIcon';
import type { StringKey } from '../../i18n/strings';

const KIND: Record<string, StringKey> = { homework: 'kindHomework', quiz: 'kindQuiz', exam: 'kindExam' };

export default function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, L, lang, rtl } = useT();
  const s = useStore();
  const a = assessments.find((x) => x.id === id)!;
  const w = childWork(s, s.childId).find((x) => x.a.id === id);
  const sub = w?.sub;
  const [answer, setAnswer] = useState('');
  const [photos, setPhotos] = useState(0);
  const isStudent = s.role !== 'parent';
  const late = a.due < new Date();

  return (
    <Screen
      back
      title={L(a.title)}
      subtitle={L(courseById(a.courseId).title)}
      footer={
        sub?.status === 'pending' && a.kind === 'homework' && isStudent ? (
          <Btn label={t('submit')} icon="cloud-upload" full disabled={!answer.trim() && !photos} onPress={() => s.submitWork(a.id, s.childId, answer)} />
        ) : undefined
      }
    >
      <Card>
        <Row gap={space.m}>
          <WorkIcon kind={a.kind} size={44} />
          <View style={{ flex: 1, gap: 4 }}>
            <AlignStart>
              <Tag label={t(KIND[a.kind])} tone={a.kind === 'exam' ? 'sun' : a.kind === 'quiz' ? 'info' : 'neutral'} />
            </AlignStart>
            <Txt size="small" color={late && sub?.status === 'pending' ? colors.bad : colors.inkSoft}>
              {a.kind === 'exam'
                ? t('examOn', { when: `${fmtDayLabel(a.due, lang)} ${fmtTime(a.due, lang)}` })
                : late && sub?.status === 'pending'
                  ? t('dueOverdue')
                  : t('dueIn', { when: `${fmtRelDay(a.due, lang)}${lang === 'ar' ? '، ' : ', '}${fmtTime(a.due, lang)}` })}
            </Txt>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Txt size="micro" color={colors.inkSoft}>
              {t('score')}
            </Txt>
            <Txt w="b" size="heading">
              {sub?.status === 'graded' ? `${sub.score}/${a.max}` : `—/${a.max}`}
            </Txt>
          </View>
        </Row>
      </Card>

      {sub?.status === 'graded' && sub.feedback ? (
        <Section title={t('feedback')}>
          <Card tone="tint">
            <Row gap={space.s} align="flex-start">
              <Icon name="chatbox-ellipses" size={18} color={colors.blue} flip={false} />
              <Txt style={{ flex: 1 }}>{L(sub.feedback)}</Txt>
            </Row>
          </Card>
        </Section>
      ) : null}

      {sub?.status === 'submitted' ? (
        <View style={{ marginTop: space.l, gap: space.m }}>
          <Notice
            text={`${t('submitted')}. ${t('awaitingGrade')} — ${sub.submittedAt ? t('submittedOn', { when: fmtRelDay(sub.submittedAt, lang) }) : ''}`}
            tone="info"
            icon="time"
          />
          {sub.answer ? (
            <Card>
              <Txt size="small">{sub.answer}</Txt>
            </Card>
          ) : null}
        </View>
      ) : null}

      {sub?.status === 'pending' && a.kind === 'homework' ? (
        isStudent ? (
          <Section title={t('submit')}>
            <Txt size="small" color={colors.inkSoft}>
              {t('submitHint')}
            </Txt>
            <Row gap={space.s} wrap>
              {Array.from({ length: photos }, (_, i) => (
                <View key={i} style={styles.photo}>
                  <Icon name="image" size={22} color={colors.blue} flip={false} />
                </View>
              ))}
              <Pressable onPress={() => setPhotos((n) => n + 1)} style={[styles.photo, styles.addPhoto]} accessibilityRole="button" accessibilityLabel={t('addPhoto')}>
                <Icon name="camera" size={22} color={colors.inkSoft} flip={false} />
                <Txt size="micro" color={colors.inkSoft} center>
                  {t('addPhoto')}
                </Txt>
              </Pressable>
            </Row>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder={t('writeAnswer')}
              placeholderTextColor={colors.inkMute}
              multiline
              style={[styles.answer, { textAlign: rtl ? 'right' : 'left' }]}
            />
          </Section>
        ) : (
          <View style={{ marginTop: space.l }}>
            <Notice text={t('parentReadOnly')} tone="neutral" icon="information-circle" />
          </View>
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: 84, height: 84, borderRadius: radius.control, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  addPhoto: { backgroundColor: colors.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute, gap: 2 },
  answer: {
    minHeight: 120,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: space.m,
    fontFamily: font.r,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});
