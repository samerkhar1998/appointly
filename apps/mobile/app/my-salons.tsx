import { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

// A single row showing a salon the user has visited, with a "Book" CTA.
// Navigates to the booking flow with the client_token pre-filled.
function MySalonItem({
  salon,
  clientToken,
}: {
  salon: { slug: string; name: string; city: string | null; logo_url: string | null };
  clientToken: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => router.push(`/book/${salon.slug}?client=${clientToken}` as never)}
    >
      <View style={styles.logo}>
        {salon.logo_url ? (
          <Image source={{ uri: salon.logo_url }} style={styles.logoImage} />
        ) : (
          <Text style={styles.logoFallback}>{salon.name.charAt(0)}</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
        {salon.city ? (
          <Text style={styles.city} numberOfLines={1}>📍 {salon.city}</Text>
        ) : null}
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>{t('discover_book')}</Text>
      </View>
    </Pressable>
  );
}

// My Salons screen — the user enters their phone number and we surface every salon
// they have an active SalonClient record with (non-removed).
export default function MySalonsScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  const { data, isLoading, isError } = trpc.salonClients.getByPhone.useQuery(
    { phone: submittedPhone },
    { enabled: !!submittedPhone },
  );

  // Validates and submits the phone number.
  function handleSearch() {
    const normalised = phone.trim();
    if (normalised.length < 7) return;
    setSubmittedPhone(normalised);
  }

  const hasResults = !!data && data.length > 0;
  const showEmpty = !!submittedPhone && !isLoading && !isError && data?.length === 0;

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('my_salons_title')} showBack />

      {/* Subtitle + phone input */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>{t('my_salons_subtitle')}</Text>

        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Input
              label=""
              placeholder="+972501234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoComplete="tel"
            />
          </View>
          <Button
            onPress={handleSearch}
            disabled={phone.trim().length < 7}
            loading={isLoading}
            size="md"
            style={styles.searchBtn}
          >
            {t('my_salons_search_cta')}
          </Button>
        </View>
      </View>

      {/* Results */}
      {isError && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{t('error_generic')}</Text>
        </View>
      )}

      {showEmpty && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyTitle}>{t('my_salons_empty')}</Text>
          <Text style={styles.emptySub}>{t('my_salons_empty_sub')}</Text>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push('/discover' as never)}
            style={styles.emptyBtn}
          >
            {t('my_salons_discover_cta')}
          </Button>
        </View>
      )}

      {hasResults && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.client_token}
          renderItem={({ item }) => (
            <MySalonItem salon={item.salon} clientToken={item.client_token} />
          )}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>{t('my_salons_results')}</Text>
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing[8] },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[1],
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing[2],
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  inputWrap: { flex: 1 },
  searchBtn: { marginBottom: 2 },

  feedback: { padding: spacing[6], alignItems: 'center' },
  feedbackText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },

  sectionLabel: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing[2],
    marginTop: spacing[4],
    paddingHorizontal: spacing[2],
  },

  list: { paddingHorizontal: spacing[4] },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[2] },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    gap: spacing[3],
  },
  itemPressed: { opacity: 0.8 },

  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoImage: { width: 48, height: 48, borderRadius: radius.lg },
  logoFallback: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.brand[600],
  },

  info: { flex: 1, gap: spacing[0.5] },
  name: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  city: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },

  cta: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  ctaText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.xs,
    color: colors.white,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[8],
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyBtn: { marginTop: spacing[2] },
});
