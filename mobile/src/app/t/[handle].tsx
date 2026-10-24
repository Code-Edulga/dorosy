// Instructor landing page (PRD MKG-01..06): hero, courses with live seats, testimonials, contact, subscribe CTA.
// In production this is also served as a public web page at dorosy.app/<handle>.

import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { testimonials } from '../../data/mock';
import { courseGroups, instructorByHandle, instructorCourses, seatsLeft } from '../../data/selectors';
import { groupLabel, groupWhere, gradeLabel } from '../../data/format';
import { fmtDate, fmtMoney } from '../../lib/dates';
import { Btn, Card, Divider, Empty, Icon, Row, Screen, Section, Tag, Txt } from '../../components/ui';
import { LangToggle } from '../../components/LangToggle';

export default function InstructorPage() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { t, L, lang, rtl } = useT();
  const s = useStore();
  const who = instructorByHandle(handle);
  if (!who) return <Screen back><Empty text="404" /></Screen>;
  const list = instructorCourses(who.id);
  const quotes = testimonials.filter((q) => q.instructorId === who.id);
  const first = list[0];
  const now = new Date();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        {/* Hero */}
        <View style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <Row justify="space-between" style={{ paddingTop: space.m }}>
              <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.heroBtn} accessibilityRole="button" accessibilityLabel={t('back')}>
                <Icon name="chevron-back" size={20} color="#fff" />
              </Pressable>
              <LangToggle onDark />
            </Row>
            <View style={{ marginTop: space.xl, gap: space.s }}>
              <Txt w="b" color={colors.cyan} style={{ fontSize: 56, lineHeight: 76 }}>
                {L(who.subject)}
              </Txt>
              <Txt w="b" size="title" color="#fff">
                {L(who.name)}
              </Txt>
              <Txt color="#C9D5FA">{L(who.bio)}</Txt>
            </View>
            <Row gap={space.l} style={{ marginTop: space.l }}>
              <Row gap={6}>
                <Icon name="ribbon" size={16} color={colors.sun} flip={false} />
                <Txt size="small" w="m" color="#fff">
                  {t('yearsTeaching', { n: who.years })}
                </Txt>
              </Row>
              <Row gap={6}>
                <Icon name="people" size={16} color={colors.sun} flip={false} />
                <Txt size="small" w="m" color="#fff">
                  {t('studentsCount', { n: who.studentsThisYear })}
                </Txt>
              </Row>
            </Row>
            {first ? (
              <Btn
                label={t('subscribe')}
                variant="sun"
                icon="add-circle"
                full
                style={{ marginTop: space.xl }}
                onPress={() => router.push(`/register/${first.id}`)}
              />
            ) : null}
          </SafeAreaView>
        </View>

        <View style={{ paddingHorizontal: space.l }}>
          {/* Courses, live from the LMS */}
          <Section title={t('courses')}>
            {list.map((c) => {
              const started = c.startsOn <= now;
              return (
                <Card key={c.id}>
                  <Row justify="space-between" align="flex-start" gap={space.m}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt w="b" size="heading">
                        {L(c.title)}
                      </Txt>
                      <Txt size="small" color={colors.inkSoft}>
                        {L(c.track)}
                      </Txt>
                    </View>
                    <View style={{ alignItems: rtl ? 'flex-start' : 'flex-end' }}>
                      <Txt w="b" size="heading" color={colors.blue}>
                        {fmtMoney(c.price)}
                      </Txt>
                      <Txt size="micro" color={colors.inkSoft}>
                        {t('egp')} {t('perMonth')}
                      </Txt>
                    </View>
                  </Row>
                  <Txt size="small" style={{ marginTop: space.m }}>
                    {L(c.pitch)}
                  </Txt>
                  <Row gap={space.s} style={{ marginTop: space.m }} wrap>
                    <Tag label={gradeLabel(c.grade, lang)} tone="neutral" />
                    <Tag label={started ? t('started', { when: fmtDate(c.startsOn, lang) }) : t('startsOn', { when: fmtDate(c.startsOn, lang) })} tone={started ? 'info' : 'sun'} />
                  </Row>
                  <Divider style={{ marginVertical: space.m }} />
                  <View style={{ gap: space.s }}>
                    {courseGroups(c.id).map((g) => {
                      const left = seatsLeft(s, g.id);
                      return (
                        <Row key={g.id} gap={space.m}>
                          <Icon name={g.mode === 'online' ? 'videocam-outline' : 'location-outline'} size={18} color={colors.inkSoft} flip={false} />
                          <View style={{ flex: 1 }}>
                            <Txt size="small" w="m">
                              {groupLabel(g, lang)}
                            </Txt>
                            <Txt size="micro" color={colors.inkSoft}>
                              {groupWhere(g, lang)}
                            </Txt>
                          </View>
                          <Tag label={left ? t('seatsLeft', { n: left }) : t('full')} tone={left === 0 ? 'bad' : left <= 3 ? 'warn' : 'good'} />
                        </Row>
                      );
                    })}
                  </View>
                  <Btn label={t('subscribeIn', { course: L(c.title) })} variant="sun" full style={{ marginTop: space.l }} onPress={() => router.push(`/register/${c.id}`)} />
                </Card>
              );
            })}
          </Section>

          {/* Testimonials */}
          {quotes.length ? (
            <Section title={t('testimonials')}>
              <View style={{ gap: space.s }}>
                {quotes.map((q, i) => (
                  <Card key={i} tone={i === 0 ? 'tint' : 'card'}>
                    <Txt>{L(q.text)}</Txt>
                    <Txt size="small" w="s" color={colors.inkSoft} style={{ marginTop: space.s }}>
                      {L(q.who)}
                    </Txt>
                  </Card>
                ))}
              </View>
            </Section>
          ) : null}

          {/* Contact */}
          <Section title={t('contact')}>
            <Row gap={space.s}>
              <View style={{ flex: 1 }}>
                <Btn label={t('whatsapp')} icon="logo-whatsapp" variant="outline" full onPress={() => Linking.openURL(`https://wa.me/2${who.phone}`).catch(() => {})} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn label={t('call')} icon="call" variant="outline" full onPress={() => Linking.openURL(`tel:+2${who.phone}`).catch(() => {})} />
              </View>
            </Row>
          </Section>

          <Txt size="micro" color={colors.inkMute} center style={{ marginTop: space.xxl }}>
            {t('poweredBy')}
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.blueDeep,
    paddingHorizontal: space.l,
    paddingBottom: space.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
