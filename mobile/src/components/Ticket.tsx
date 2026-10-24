// The one bold element: the next session, drawn as a tutoring-centre ticket stub.
// Deep blue body with the time in sun yellow; a perforated tear line; a cyan stub with where to go.

import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/tokens';
import { useT } from '../i18n';
import { Btn, Row, Tag, Txt } from './ui';
import { fmtClock, fmtDayLabel, fmtDuration, fmtTime } from '../lib/dates';
import { courseById, groupById, instructorOfCourse } from '../data/selectors';
import { groupWhere } from '../data/format';
import type { Session } from '../data/types';

export function Ticket({ session, bg = colors.paper }: { session: Session; bg?: string }) {
  const { t, L, lang } = useT();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const g = groupById(session.groupId);
  const c = courseById(session.courseId);
  const who = instructorOfCourse(c.id);
  const live = now >= session.start && now <= session.end;
  const countdown = live ? t('startsNow') : t('startsIn', { t: fmtDuration(session.start.getTime() - now.getTime(), lang) });

  const openMap = () => {
    const q = encodeURIComponent(`${g.place?.en ?? ''} ${g.area?.en ?? ''} Cairo`);
    const url = Platform.OS === 'ios' ? `maps:0,0?q=${q}` : `https://maps.google.com/?q=${q}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View accessibilityRole="summary" accessibilityLabel={`${t('nextSession')}: ${L(c.title)}, ${fmtDayLabel(session.start, lang, now)} ${fmtTime(session.start, lang)}`}>
      <View style={styles.body}>
        <Row justify="space-between">
          <Txt w="m" size="small" color="#B9C8F5">
            {t('nextSession')}
          </Txt>
          {g.mode === 'online' ? <Tag label={t('online')} tone="info" icon="videocam" /> : null}
        </Row>
        <Row align="flex-end" gap={space.m} style={{ marginTop: space.s }}>
          <Row gap={6} align="flex-end">
            <Txt w="b" size="display" color={colors.sun} style={{ fontSize: 44, lineHeight: 54 }}>
              {fmtClock(session.start, lang).hm}
            </Txt>
            <Txt w="s" color={colors.sun} style={{ marginBottom: 8 }}>
              {fmtClock(session.start, lang).suffix}
            </Txt>
          </Row>
          <Txt w="m" color="#fff" style={{ marginBottom: 8 }}>
            {fmtDayLabel(session.start, lang, now)}
          </Txt>
        </Row>
        <Txt w="b" size="heading" color="#fff">
          {L(c.title)}
        </Txt>
        <Txt size="small" color="#C9D5FA">
          {L(session.topic)} — {L(who.name)}
        </Txt>
        <Txt w="m" size="small" color={live ? colors.sun : '#9FB3EE'} style={{ marginTop: space.s }}>
          {countdown}
        </Txt>
      </View>

      <View style={styles.tearWrap}>
        <View style={[styles.notch, { left: -12, backgroundColor: bg }]} />
        <View style={styles.tear}>
          {Array.from({ length: 24 }, (_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>
        <View style={[styles.notch, { right: -12, backgroundColor: bg }]} />
      </View>

      <View style={styles.stub}>
        <Row justify="space-between" gap={space.m}>
          <View style={{ flex: 1 }}>
            <Txt w="s" size="small" color={colors.ink} numberOfLines={2}>
              {groupWhere(g, lang)}
            </Txt>
          </View>
          {g.mode === 'online' ? (
            <Btn small label={t('joinOnline')} icon="videocam" variant="primary" onPress={() => {}} />
          ) : (
            <Btn small label={t('openMap')} icon="navigate" variant="primary" onPress={openMap} />
          )}
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.blueDeep,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: space.l + 4,
    paddingTop: space.l,
    paddingBottom: space.l,
  },
  tearWrap: { height: 0, position: 'relative', zIndex: 2 },
  tear: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: -1,
    height: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dash: { width: 7, height: 2, borderRadius: 1, backgroundColor: '#7FD9E5' },
  notch: { position: 'absolute', top: -12, width: 24, height: 24, borderRadius: 12 },
  stub: {
    backgroundColor: colors.cyanTint,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    paddingHorizontal: space.l + 4,
    paddingVertical: space.m + 2,
    borderTopWidth: 0,
  },
});
