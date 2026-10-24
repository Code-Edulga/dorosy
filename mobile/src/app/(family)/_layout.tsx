import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { childWork } from '../../data/selectors';
import { dayDiff } from '../../lib/dates';
import { TabBar, type TabSpec } from '../../components/TabBar';

export default function FamilyLayout() {
  const { t } = useT();
  const store = useStore();
  const { role, setRole, childId } = store;

  useEffect(() => {
    if (!role || role === 'instructor') setRole('student');
  }, [role, setRole]);

  const dueSoon = childWork(store, childId).filter(
    (w) => w.sub.status === 'pending' && dayDiff(new Date(), w.a.due) >= 0 && dayDiff(new Date(), w.a.due) <= 3,
  ).length;

  const specs: TabSpec[] = [
    { name: 'home', label: t('tabHome'), icon: 'home-outline', iconActive: 'home' },
    { name: 'calendar', label: t('tabCalendar'), icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'assignments', label: t('tabAssignments'), icon: 'document-text-outline', iconActive: 'document-text', badge: dueSoon || undefined },
    { name: 'progress', label: t('tabProgress'), icon: 'stats-chart-outline', iconActive: 'stats-chart' },
    { name: 'assistant', label: t('tabAssistant'), icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  ];

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} specs={specs} />}>
      {specs.map((s) => (
        <Tabs.Screen key={s.name} name={s.name} options={{ title: s.label }} />
      ))}
    </Tabs>
  );
}
