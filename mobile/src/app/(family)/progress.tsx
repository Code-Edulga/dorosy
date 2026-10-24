import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import {
  childAttendanceRate,
  childAverage,
  childById,
  childCourseIds,
  childHistory,
  childWork,
  courseById,
} from '../../data/selectors';
import { Bar, Card, Divider, Icon, Row, Screen, Section, Stat, Txt } from '../../components/ui';
import { ScoreBars } from '../../components/ScoreBars';

export default function Progress() {
  const { t, L } = useT();
  const s = useStore();
  const child = childById(s.childId);
  const missing = childWork(s, s.childId).filter((w) => w.sub.status === 'pending' && w.a.due < new Date()).length;
  const att = childAttendanceRate(s, s.childId);

  return (
    <Screen title={t('progressTitle')} subtitle={`${L(child.name)} — ${t('progressBody')}`}>
      <Card>
        <Row gap={space.l}>
          <Stat label={t('attendanceRate')} value={`${Math.round(att * 100)}%`} color={colors.cyan} />
          <Stat label={t('avgScore')} value={`${childAverage(child)}%`} color={colors.blue} />
          <Stat label={t('missingWork')} value={String(missing)} color={missing ? colors.bad : colors.ink} />
        </Row>
      </Card>

      {childCourseIds(s, s.childId).map((cid) => {
        const pts = childHistory(child, cid).slice(-5);
        const c = courseById(cid);
        const delta = pts.length > 1 ? pts[pts.length - 1].pct - pts[0].pct : 0;
        const trend = delta > 4 ? 'up' : delta < -4 ? 'down' : 'flat';
        const cAtt = childAttendanceRate(s, s.childId, cid);
        return (
          <Section key={cid} title={L(c.title)}>
            <Card onPress={() => router.push(`/course/${cid}`)}>
              <Row justify="space-between">
                <Row gap={6}>
                  <Icon
                    name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
                    size={18}
                    color={trend === 'up' ? colors.good : trend === 'down' ? colors.bad : colors.inkSoft}
                  />
                  <Txt w="s" size="small" color={trend === 'up' ? colors.good : trend === 'down' ? colors.bad : colors.inkSoft}>
                    {t(trend === 'up' ? 'trendUp' : trend === 'down' ? 'trendDown' : 'trendFlat')}
                  </Txt>
                </Row>
                <Txt size="small" color={colors.inkSoft}>
                  {t('lastFive')}
                </Txt>
              </Row>
              {pts.length ? <ScoreBars points={pts} /> : null}
              <Divider style={{ marginVertical: space.l }} />
              <View style={{ gap: 6 }}>
                <Row justify="space-between">
                  <Txt size="small" color={colors.inkSoft}>
                    {t('attendanceRate')}
                  </Txt>
                  <Txt size="small" w="s">
                    {Math.round(cAtt * 100)}%
                  </Txt>
                </Row>
                <Bar value={cAtt} />
              </View>
            </Card>
          </Section>
        );
      })}
    </Screen>
  );
}
