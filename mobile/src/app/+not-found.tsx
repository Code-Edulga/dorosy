import React from 'react';
import { router } from 'expo-router';
import { useT } from '../i18n';
import { Empty, Screen } from '../components/ui';

export default function NotFound() {
  const { t } = useT();
  return (
    <Screen back>
      <Empty text={t('noResults')} action={t('tabHome')} onAction={() => router.replace('/')} />
    </Screen>
  );
}
