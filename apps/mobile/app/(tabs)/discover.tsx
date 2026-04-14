import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';

const PER_PAGE = 20;
const FAVORITES_KEY = '@appointly/favorites';

// Category filter chips
const CATEGORIES: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'all',       label: 'הכל',         icon: 'sparkles-outline' },
  { key: 'salon',     label: 'סלון',         icon: 'cut-outline' },
  { key: 'barber',    label: 'ברבר',         icon: 'cut-outline' },
  { key: 'nails',     label: 'ציפורניים',    icon: 'gem' },
  { key: 'spa',       label: 'ספא',          icon: 'droplets' },
  { key: 'clinic',    label: 'קליניקה',      icon: 'stethoscope' },
  { key: 'makeup',    label: 'איפור',        icon: 'brush' },
];

export interface SalonItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

// ─── Favorites hook ────────────────────────────────────────────────────────────
export function useFavorites() {
  const [favorites, setFavorites] = useState<SalonItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((raw) => {
        if (raw) setFavorites(JSON.parse(raw) as SalonItem[]);
      })
      .catch(() => {/* no-op */});
  }, []);

  const toggle = useCallback((salon: SalonItem) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === salon.id);
      const next = exists
        ? prev.filter((s) => s.id !== salon.id)
        : [salon, ...prev];
      void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorited = useCallback(
    (id: string) => favorites.some((s) => s.id === id),
    [favorites],
  );

  return { favorites, toggle, isFavorited };
}

// ─── Salon card ───────────────────────────────────────────────────────────────
function SalonCard({
  salon,
  isFavorited,
  onToggleFavorite,
}: {
  salon: SalonItem;
  isFavorited: boolean;
  onToggleFavorite: (salon: SalonItem) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/salon/${salon.slug}` as never)}
    >
      {/* Cover image */}
      <View style={styles.coverWrap}>
        {salon.cover_url ? (
          <Image source={{ uri: salon.cover_url }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Text style={styles.coverFallbackEmoji}>✂️</Text>
          </View>
        )}

        {/* City badge */}
        {salon.city ? (
          <View style={styles.cityBadge}>
            <Icon name="location-sharp" size={10} color={colors.white} />
            <Text style={styles.cityBadgeText}>{salon.city}</Text>
          </View>
        ) : null}

        {/* Heart button */}
        <Pressable
          style={({ pressed }) => [styles.heartBtn, pressed && { opacity: 0.8 }]}
          onPress={() => onToggleFavorite(salon)}
          hitSlop={8}
        >
          <Icon
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorited ? colors.danger : colors.white}
          />
        </Pressable>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            {salon.logo_url ? (
              <Image source={{ uri: salon.logo_url }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Text style={styles.logoFallbackText}>{salon.name.charAt(0)}</Text>
              </View>
            )}
          </View>

          {/* Name + description */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{salon.name}</Text>
            {salon.description ? (
              <Text style={styles.cardDesc} numberOfLines={1}>{salon.description}</Text>
            ) : null}
          </View>
        </View>

        {/* CTA row */}
        <View style={styles.cardCta}>
          <View style={styles.dotRow}>
            <View style={styles.greenDot} />
            <Text style={styles.openText}>פתוח עכשיו</Text>
          </View>
          <View style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>קבע תור</Text>
            <Icon name="chevron-back" size={13} color={colors.white} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.cover, styles.skeleton]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.logo, styles.skeleton]} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '55%' }]} />
            <View style={[styles.skeletonLine, { width: '35%', marginTop: 6 }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Discover tab ─────────────────────────────────────────────────────────────
export default function DiscoverTab() {
  const insets = useSafeAreaInsets();
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggle, isFavorited } = useFavorites();

  function handleQueryChange(text: string) {
    setRawQuery(text);
    setPage(1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setQuery(text), 400);
  }

  // Build search query combining text + category filter
  const searchQuery = [
    query.trim(),
    activeCategory !== 'all' ? CATEGORIES.find((c) => c.key === activeCategory)?.label : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const { data, isLoading } = trpc.salons.search.useQuery({
    query: searchQuery,
    page,
    per_page: PER_PAGE,
  });

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1;
  const hasResults = (data?.items.length ?? 0) > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sticky header */}
      <View style={styles.header}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>גלה עסקים</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={17} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={rawQuery}
            onChangeText={handleQueryChange}
            placeholder="חפש לפי שם, עיר..."
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            returnKeyType="search"
            textAlign="right"
          />
          {rawQuery.length > 0 && (
            <Pressable onPress={() => handleQueryChange('')} hitSlop={8}>
              <Icon name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              style={[styles.chip, activeCategory === cat.key && styles.chipActive]}
              onPress={() => {
                setActiveCategory(cat.key);
                setPage(1);
              }}
            >
              <Icon
                name={cat.icon}
                size={14}
                color={activeCategory === cat.key ? colors.brand[600] : colors.mutedForeground}
              />
              <Text style={[styles.chipLabel, activeCategory === cat.key && styles.chipLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing[8] }]}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </ScrollView>
      ) : !hasResults ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Icon name="business-outline" size={36} color={colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>
            {rawQuery ? `לא נמצאו תוצאות עבור "${rawQuery}"` : 'אין עסקים עדיין'}
          </Text>
          {rawQuery ? (
            <Pressable onPress={() => handleQueryChange('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>נקה חיפוש</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={data?.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SalonCard
              salon={item}
              isFavorited={isFavorited(item.id)}
              onToggleFavorite={toggle}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing[8] }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  style={[styles.pageBtn, styles.pageBtnRow, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Icon name="chevron-forward" size={16} color={page === 1 ? colors.muted : colors.brand[600]} />
                  <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>הקודם</Text>
                </Pressable>
                <Text style={styles.pageLabel}>{page} / {totalPages}</Text>
                <Pressable
                  style={[styles.pageBtn, styles.pageBtnRow, page === totalPages && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>הבא</Text>
                  <Icon name="chevron-back" size={16} color={page === totalPages ? colors.muted : colors.brand[600]} />
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  screenTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[5],
    backgroundColor: colors.surface.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    height: 46,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.foreground,
    height: 46,
  },

  // Category chips
  chipsRow: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  chipLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  chipLabelActive: {
    color: colors.brand[600],
  },

  // Results list
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[4],
  },

  // Salon card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },

  coverWrap: { position: 'relative' },
  cover: {
    width: '100%',
    height: 140,
  },
  coverFallback: {
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackEmoji: { fontSize: 48, opacity: 0.4 },

  cityBadge: {
    position: 'absolute',
    bottom: spacing[2],
    end: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  cityBadgeText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.white,
  },

  heartBtn: {
    position: 'absolute',
    top: spacing[3],
    start: spacing[3],
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: {
    padding: spacing[4],
    gap: spacing[3],
  },
  cardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
  },

  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    ...shadows.card,
  },
  logo: { width: 44, height: 44 },
  logoFallback: {
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.brand[600],
  },

  cardInfo: { flex: 1, gap: spacing[0.5] },
  cardName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },

  cardCta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  openText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.success,
  },
  bookBtn: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[1],
  },
  bookBtnText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.xs,
    color: colors.white,
  },

  // Skeleton
  skeleton: {
    backgroundColor: colors.surface.floating,
  },
  skeletonLines: { flex: 1, gap: spacing[1], paddingStart: spacing[1] },
  skeletonLine: {
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.floating,
    alignSelf: 'flex-end',
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[8],
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface.floating,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  clearSearchBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearSearchText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.foreground,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingVertical: spacing[5],
  },
  pageBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand[600],
  },
  pageBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  pageBtnDisabled: {
    borderColor: colors.border,
    opacity: 0.4,
  },
  pageBtnText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[600],
  },
  pageBtnTextDisabled: {
    color: colors.muted,
  },
  pageLabel: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
