import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { Icon } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

type SalonHour = {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

type SalonService = {
  id: string;
  name: string;
  description: string | null;
  duration_mins: number;
  price: unknown;
};

type SalonStaff = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
};

type SalonProfile = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_public: boolean;
  cancellation_window_hours: number;
  hours: SalonHour[];
  services: SalonService[];
  staff: SalonStaff[];
};

const DAY_NAMES: Record<number, string> = {
  0: t('day_sun'),
  1: t('day_mon'),
  2: t('day_tue'),
  3: t('day_wed'),
  4: t('day_thu'),
  5: t('day_fri'),
  6: t('day_sat'),
};

function ServiceRow({
  name,
  description,
  duration_mins,
  price,
}: {
  name: string;
  description: string | null;
  duration_mins: number;
  price: unknown;
}) {
  const priceNum = typeof price === 'object' && price !== null && 'toNumber' in price
    ? (price as { toNumber: () => number }).toNumber()
    : Number(price);

  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{name}</Text>
        {description ? (
          <Text style={styles.serviceDesc} numberOfLines={2}>{description}</Text>
        ) : null}
        <Text style={styles.serviceMeta}>{duration_mins} {t('minutes')}</Text>
      </View>
      <View style={styles.priceTag}>
        <Text style={styles.priceText}>
          {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(priceNum)}
        </Text>
      </View>
    </View>
  );
}

function StaffChip({
  display_name,
  bio,
  avatar_url,
}: {
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
}) {
  const initials = display_name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('');

  return (
    <View style={styles.staffChip}>
      <View style={styles.staffAvatar}>
        {avatar_url ? (
          <Image source={{ uri: avatar_url }} style={styles.staffAvatarImg} />
        ) : (
          <Text style={styles.staffInitials}>{initials}</Text>
        )}
      </View>
      <Text style={styles.staffName}>{display_name}</Text>
      {bio ? (
        <Text style={styles.staffBio} numberOfLines={2}>{bio}</Text>
      ) : null}
    </View>
  );
}

export default function SalonProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();

  const { data: salon, isLoading, isError } = trpc.salons.getPublicProfile.useQuery(
    { slug: slug ?? '' },
    { enabled: !!slug },
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand[600]} size="large" />
      </View>
    );
  }

  if (isError || !salon) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('error_generic')}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t('back')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover / hero */}
        <View style={styles.hero}>
          {salon.cover_url ? (
            <Image source={{ uri: salon.cover_url }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}

          {/* Back button overlay */}
          <Pressable
            onPress={() => router.back()}
            style={[styles.backOverlay, { top: insets.top + spacing[3] }]}
            hitSlop={8}
          >
            <Text style={styles.backOverlayText}>→</Text>
          </Pressable>

          {/* Logo */}
          <View style={[styles.logoWrap, { bottom: -32 }]}>
            {salon.logo_url ? (
              <Image source={{ uri: salon.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>{salon.name.charAt(0)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Identity */}
        <View style={styles.identity}>
          <Text style={styles.salonName}>{salon.name}</Text>
          {salon.city ? (
            <Text style={styles.salonCity}>📍 {salon.city}</Text>
          ) : null}
          {salon.description ? (
            <Text style={styles.salonDesc}>{salon.description}</Text>
          ) : null}
        </View>

        {/* Hours */}
        {salon.hours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('salon_profile_hours_title')}</Text>
            <View style={styles.hoursCard}>
              {(salon.hours as SalonHour[]).map((h: SalonHour) => (
                <View key={h.id} style={styles.hoursRow}>
                  <Text style={styles.hoursTime}>
                    {h.is_closed ? t('salon_profile_closed') : `${h.open_time} – ${h.close_time}`}
                  </Text>
                  <Text style={[styles.hoursDay, h.is_closed && styles.hoursDayClosed]}>
                    {DAY_NAMES[h.day_of_week] ?? ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('salon_profile_services_title')}</Text>
          {salon.services.length === 0 ? (
            <Text style={styles.emptyNote}>{t('salon_profile_no_services')}</Text>
          ) : (
            <View style={styles.servicesCard}>
              {(salon.services as SalonService[]).map((svc: SalonService, idx: number) => (
                <View key={svc.id}>
                  <ServiceRow
                    name={svc.name}
                    description={svc.description}
                    duration_mins={svc.duration_mins}
                    price={svc.price}
                  />
                  {idx < salon.services.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Cancellation policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cancel_policy_label')}</Text>
          <View style={styles.policyCard}>
            <Icon name="calendar-outline" size={18} color={colors.brand[600]} />
            <Text style={styles.policyText}>
              {(salon as unknown as SalonProfile).cancellation_window_hours === 0
                ? t('cancel_policy_free')
                : t('cancel_policy_value').replace(
                    '{hours}',
                    String((salon as unknown as SalonProfile).cancellation_window_hours),
                  )}
            </Text>
          </View>
        </View>

        {/* Staff */}
        {salon.staff.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('salon_profile_staff_title')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.staffScroll}
            >
              {(salon.staff as SalonStaff[]).map((s: SalonStaff) => (
                <StaffChip
                  key={s.id}
                  display_name={s.display_name}
                  bio={s.bio}
                  avatar_url={s.avatar_url}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
          onPress={() => router.push(`/book/${salon.slug}` as never)}
        >
          <Text style={styles.ctaBtnText}>{t('salon_profile_book_cta')}</Text>
          <Text style={styles.ctaBtnArrow}>←</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing[4],
  },
  errorText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
  },
  backBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.brand[600],
    borderRadius: radius.full,
  },
  backBtnText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.white,
  },

  // Hero / cover
  hero: {
    height: 220,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 220,
  },
  coverPlaceholder: {
    backgroundColor: colors.brand[700],
  },
  backOverlay: {
    position: 'absolute',
    end: spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOverlayText: {
    fontSize: 20,
    color: colors.white,
    fontFamily: 'Heebo_700Bold',
  },
  logoWrap: {
    position: 'absolute',
    start: spacing[5],
    ...shadows.elevated,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: colors.white,
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    color: colors.white,
  },

  // Identity block
  identity: {
    marginTop: 44,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[1.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  salonName: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  salonCity: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },
  salonDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 22,
    marginTop: spacing[1],
  },

  // Sections
  section: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[3],
  },
  sectionTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.3,
  },
  emptyNote: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'right',
  },

  // Hours card
  hoursCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    ...shadows.card,
  },
  hoursRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.floating,
  },
  hoursDay: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlign: 'right',
  },
  hoursDayClosed: { color: colors.muted },
  hoursTime: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
  },

  // Services card
  servicesCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    ...shadows.card,
  },
  serviceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  serviceInfo: { flex: 1, gap: spacing[0.5] },
  serviceName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  serviceDesc: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 17,
  },
  serviceMeta: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'right',
  },
  priceTag: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  priceText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.brand[700],
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.surface.floating,
  },

  // Cancellation policy card
  policyCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  policyText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.brand[700],
    textAlign: 'right',
    flex: 1,
  },

  // Staff horizontal scroll
  staffScroll: {
    gap: spacing[3],
    paddingEnd: spacing[5],
  },
  staffChip: {
    width: 120,
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
    ...shadows.card,
  },
  staffAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  staffAvatarImg: { width: 56, height: 56 },
  staffInitials: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.brand[700],
  },
  staffName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlign: 'center',
  },
  staffBio: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Sticky CTA bar
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    ...shadows.floating,
  },
  ctaBtn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    gap: spacing[3],
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  ctaBtnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaBtnText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.white,
    letterSpacing: -0.3,
  },
  ctaBtnArrow: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.brand[200],
  },
});
