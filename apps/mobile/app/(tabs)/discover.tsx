import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

const PER_PAGE = 20;

interface SalonItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

// A single salon result card — tapping opens the Salon Profile screen.
function SalonListItem({ salon }: { salon: SalonItem }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => router.push(`/salon/${salon.slug}` as never)}
    >
      {/* Logo */}
      <View style={styles.logo}>
        {salon.logo_url ? (
          <Image source={{ uri: salon.logo_url }} style={styles.logoImage} />
        ) : (
          <Text style={styles.logoFallback}>{salon.name.charAt(0)}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {salon.name}
        </Text>
        {salon.city ? (
          <Text style={styles.itemCity} numberOfLines={1}>
            📍 {salon.city}
          </Text>
        ) : null}
        {salon.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>
            {salon.description}
          </Text>
        ) : null}
      </View>

      {/* CTA */}
      <View style={styles.itemCta}>
        <Text style={styles.ctaText}>{t('discover_book')}</Text>
      </View>
    </Pressable>
  );
}

// Skeleton row while loading
function SkeletonRow() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonLogo} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { width: '55%' }]} />
        <View style={[styles.skeletonLine, { width: '35%', marginTop: 6 }]} />
      </View>
    </View>
  );
}

export default function DiscoverTab() {
  const insets = useSafeAreaInsets();
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(text: string) {
    setRawQuery(text);
    setPage(1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setQuery(text), 400);
  }

  const { data, isLoading } = trpc.salons.search.useQuery({
    query: query.trim() || undefined,
    page,
    per_page: PER_PAGE,
  });

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{t('discover_title')}</Text>
        <Text style={styles.subtitle}>{t('discover_subtitle')}</Text>

        {/* Search input */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={rawQuery}
            onChangeText={handleQueryChange}
            placeholder={t('discover_search_placeholder')}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            returnKeyType="search"
            textAlign="right"
          />
          {rawQuery.length > 0 && (
            <Pressable onPress={() => handleQueryChange('')} hitSlop={8}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : !data?.items.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyTitle}>{t('discover_empty')}</Text>
          {query ? (
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleQueryChange('')}
              style={styles.emptyBtn}
            >
              {t('discover_clear')}
            </Button>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SalonListItem salon={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing[8] },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  הקודם
                </Button>
                <Text style={styles.pageLabel}>
                  {page} / {totalPages}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  הבא
                </Button>
              </View>
            ) : null
          }
        />
      )}

      {isLoading && (
        <ActivityIndicator
          style={styles.loader}
          color={colors.brand[600]}
          size="small"
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
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  screenTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    height: 44,
    gap: spacing[2],
  },
  searchIcon: { fontSize: 14, color: colors.muted },
  searchInput: {
    flex: 1,
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.foreground,
    height: 44,
  },
  clearIcon: { fontSize: 12, color: colors.muted, padding: spacing[1] },

  list: { paddingTop: spacing[2], paddingHorizontal: spacing[4] },
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
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoImage: { width: 52, height: 52, borderRadius: radius.lg },
  logoFallback: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.brand[600],
  },

  itemInfo: { flex: 1, gap: spacing[0.5] },
  itemName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  itemCity: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  itemDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'right',
    lineHeight: 17,
    marginTop: spacing[0.5],
  },

  itemCta: {
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

  skeletonList: { padding: spacing[4], gap: spacing[1] },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  skeletonLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  skeletonLines: { flex: 1, gap: spacing[1] },
  skeletonLine: {
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    alignSelf: 'flex-end',
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
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyBtn: { marginTop: spacing[2] },

  loader: { position: 'absolute', bottom: spacing[8], alignSelf: 'center' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingVertical: spacing[5],
  },
  pageLabel: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
