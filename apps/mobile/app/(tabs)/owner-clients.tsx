import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

type SalonClient = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  total_visits: number;
  last_visit_at: string | null;
  is_blocked: boolean;
};

// Renders a single client card with avatar, contact info, and visit count.
function ClientCard({ client }: { client: SalonClient }) {
  const initials = client.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.clientCard, client.is_blocked && styles.clientCardBlocked]}>
      <View style={[styles.avatar, client.is_blocked && styles.avatarBlocked]}>
        <Text style={[styles.avatarText, client.is_blocked && styles.avatarTextBlocked]}>
          {initials}
        </Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
        <View style={styles.clientMeta}>
          <Icon name="phone-outline" size={11} color={colors.mutedForeground} />
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>
        {client.is_blocked && (
          <View style={styles.blockedBadge}>
            <Text style={styles.blockedBadgeText}>חסום</Text>
          </View>
        )}
      </View>
      <View style={styles.clientStat}>
        <Text style={styles.statNum}>{client.total_visits}</Text>
        <Text style={styles.statLabel}>ביקורים</Text>
      </View>
    </View>
  );
}

// Skeleton placeholder while loading.
function SkeletonCard() {
  return (
    <View style={styles.clientCard}>
      <View style={[styles.avatar, styles.skeleton]} />
      <View style={styles.clientInfo}>
        <View style={[styles.skeletonLine, { width: '55%', height: 14 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 11, marginTop: 5 }]} />
      </View>
    </View>
  );
}

// Owner Clients tab — searchable list of all salon clients.
// Fetches the owner's salon then loads the client list with optional search.
export default function OwnerClientsTab() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');

  const { data: salon } = trpc.salons.getMySalon.useQuery(undefined, {
    enabled: !!user && user.role === 'SALON_OWNER',
  });

  const { data, isLoading, isError } = trpc.salonClients.list.useQuery(
    { salon_id: salon?.id ?? '', search: search.trim() || undefined },
    { enabled: !!salon?.id },
  );

  const clients = (data?.items ?? []) as SalonClient[];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header — no back button in tab context */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('owner_clients_title')}</Text>
        {!isLoading && data ? (
          <Text style={styles.headerSub}>{data.total} לקוחות</Text>
        ) : null}
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={16} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="חפש לפי שם, טלפון..."
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          textAlign="right"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Icon name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.listWrap}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </View>
        ) : isError ? (
          <View style={styles.empty}>
            <Icon name="close-circle" size={36} color={colors.muted} />
            <Text style={styles.emptyText}>{t('error_generic')}</Text>
          </View>
        ) : clients.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="people-outline" size={36} color={colors.brand[400]} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'לא נמצאו לקוחות' : t('owner_clients_empty')}
            </Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {clients.map((c) => <ClientCard key={c.id} client={c} />)}
          </View>
        )}
      </ScrollView>
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
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    height: 44,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.foreground,
    height: 44,
  },

  content: { paddingHorizontal: spacing[4], gap: spacing[2] },
  listWrap: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },

  clientCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.floating,
  },
  clientCardBlocked: { opacity: 0.6 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brand[200],
  },
  avatarBlocked: { backgroundColor: colors.border, borderColor: colors.border },
  avatarText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.base,
    color: colors.brand[700],
  },
  avatarTextBlocked: { color: colors.muted },
  clientInfo: { flex: 1, gap: 3 },
  clientName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  clientMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[1],
  },
  clientPhone: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  blockedBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  blockedBadgeText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: 10,
    color: colors.danger,
  },
  clientStat: { alignItems: 'center', gap: 2, minWidth: 36 },
  statNum: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.brand[600],
  },
  statLabel: { fontFamily: 'Heebo_400Regular', fontSize: 10, color: colors.muted },

  skeleton: { backgroundColor: colors.border },
  skeletonLine: {
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    alignSelf: 'flex-end',
  },

  empty: { alignItems: 'center', paddingVertical: spacing[16], gap: spacing[3] },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
});
