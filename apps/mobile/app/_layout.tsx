import { useEffect, useState } from 'react';
import { I18nManager, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
  Heebo_700Bold,
} from '@expo-google-fonts/heebo';
import { trpc, createTrpcClient } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/lib/theme';
import { BugReportButton } from '@/components/BugReportButton';

// ─── RTL — runs before any UI renders ─────────────────────────────────────────
// This app targets the Israeli market and is always RTL regardless of device
// locale. forceRTL updates I18nManager.isRTL synchronously on the JS side so
// React Navigation reads the correct value before rendering the tab bar.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// ─── Root redirect ─────────────────────────────────────────────────────────────
// Handles the initial route on app launch only.
// Once the user is past the launch (navigating within the app), this component
// returns null so it doesn't compete with in-app navigation calls.
function RootRedirect() {
  const { hasOnboarded, isLoading, user } = useAuthStore();

  // While AsyncStorage is hydrating, show a blank splash to prevent flicker.
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.white }} />;
  }

  // First-ever launch — show the 3-slide onboarding carousel.
  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // Onboarding seen but no auth decision made yet (or after logout).
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Guests go to Discover; Home requires a saved phone to be useful.
  if (user.role === 'GUEST') {
    return <Redirect href="/(tabs)/discover" />;
  }

  // Authenticated owner — open calendar tab directly.
  if (user.role === 'SALON_OWNER') {
    return <Redirect href="/(tabs)/owner-calendar" />;
  }

  // Authenticated customer — open profile tab.
  return <Redirect href="/(tabs)/profile" />;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  }));
  const [trpcClient] = useState(() => createTrpcClient());
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!fontsLoaded) return null;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <BugReportButton />
          <RootRedirect />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="onboarding"
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="owner/calendar" options={{ animation: 'slide_from_left' }} />
            <Stack.Screen name="owner/clients" options={{ animation: 'slide_from_left' }} />
            <Stack.Screen name="owner/services" options={{ animation: 'slide_from_left' }} />
            <Stack.Screen name="owner/analytics" options={{ animation: 'slide_from_left' }} />
            <Stack.Screen name="salon/[slug]" options={{ animation: 'slide_from_left' }} />
            <Stack.Screen name="invite/[token]" />
            <Stack.Screen name="book/[slug]" />
            <Stack.Screen name="cancel/[token]" />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
