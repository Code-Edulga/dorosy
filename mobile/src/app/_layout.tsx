import React from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { I18nProvider } from '../i18n';
import { StoreProvider } from '../data/store';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  const [loaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;

  const app = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'slide_from_right' }} />
  );

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          {Platform.OS === 'web' ? (
            // On the web preview, show the app at phone width.
            <View style={{ flex: 1, backgroundColor: '#E3E9F3', alignItems: 'center' }}>
              <View style={{ flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.paper, overflow: 'hidden' }}>{app}</View>
            </View>
          ) : (
            app
          )}
        </StoreProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
