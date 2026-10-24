// Paymob checkout returns here through the backend. On iOS the auth session catches the link before the router
// sees it. On Android and web it lands here, so step back to the screen that opened checkout; that screen
// already has the result. If the app was restarted meanwhile, open billing and let it check the payment.

import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../theme/tokens';

export default function PaymentReturn() {
  const { payment } = useLocalSearchParams<{ payment?: string }>();

  useEffect(() => {
    // On web this page is the checkout popup: hand the URL to the opener, which closes it.
    if (Platform.OS === 'web' && WebBrowser.maybeCompleteAuthSession().type === 'success') return;
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/billing', params: payment ? { payment } : {} });
  }, [payment]);

  return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
}
