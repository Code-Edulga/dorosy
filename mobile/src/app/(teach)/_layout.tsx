import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { TabBar, type TabSpec } from '../../components/TabBar';

export default function TeachLayout() {
  const { t } = useT();
  const { role, setRole, handoffs } = useStore();

  useEffect(() => {
    if (role !== 'instructor') setRole('instructor');
  }, [role, setRole]);

  const open = handoffs.filter((h) => !h.reply).length;

  const specs: TabSpec[] = [
    { name: 'dashboard', label: t('tabDashboard'), icon: 'grid-outline', iconActive: 'grid' },
    { name: 'students', label: t('tabStudents'), icon: 'people-outline', iconActive: 'people' },
    { name: 'schedule', label: t('tabSchedule'), icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'inbox', label: t('tabInbox'), icon: 'chatbubbles-outline', iconActive: 'chatbubbles', badge: open || undefined },
    { name: 'revenue', label: t('tabRevenue'), icon: 'wallet-outline', iconActive: 'wallet' },
  ];

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} specs={specs} />}>
      {specs.map((s) => (
        <Tabs.Screen key={s.name} name={s.name} options={{ title: s.label }} />
      ))}
    </Tabs>
  );
}
