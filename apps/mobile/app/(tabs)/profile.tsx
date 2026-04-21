import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';
import { BugReportButton } from '@/components/BugReportButton';

type MenuRowProps = {
  icon: IconName;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuRow({ icon, label, sublabel, onPress, danger }: MenuRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.menuIconWrap, danger && styles.menuIconWrapDanger]}>
        <Icon
          name={icon}
          size={20}
          color={danger ? colors.danger : colors.brand[600]}
        />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      {!danger && <Icon name="chevron-back" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [bugReportOpen, setBugReportOpen] = useState(false);

  const isGuest = !user || user.role === 'GUEST';
  const isOwner = user?.role === 'SALON_OWNER';
  const isCustomer = user?.role === 'CUSTOMER';

  async function handleLogout() {
    await logout();
    router.replace('/auth' as never);
  }

  // Avatar initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase()
    : '?';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>פרופיל</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + identity card */}
        <View style={styles.identityCard}>
          <View style={[styles.avatar, isOwner && styles.avatarOwner]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.identityName}>
              {isGuest ? 'אורח' : user?.name ?? 'משתמש'}
            </Text>
            <Text style={styles.identityRole}>
              {isGuest
                ? 'גלישה ללא חשבון'
                : isOwner
                ? `בעל עסק · ${user?.email ?? ''}`
                : `לקוח · ${user?.phone ?? ''}`}
            </Text>
          </View>
          {!isGuest && (
            <View style={[styles.roleBadge, isOwner && styles.roleBadgeOwner]}>
              <Icon
                name={isOwner ? 'business-outline' : 'person-outline'}
                size={11}
                color={isOwner ? colors.white : colors.brand[700]}
              />
              <Text style={[styles.roleBadgeText, isOwner && styles.roleBadgeTextOwner]}>
                {isOwner ? 'עסק' : 'לקוח'}
              </Text>
            </View>
          )}
        </View>

        {/* Guest CTA */}
        {isGuest && (
          <View style={styles.guestCard}>
            <Text style={styles.guestCardTitle}>הצטרף עכשיו בחינם</Text>
            <Text style={styles.guestCardSub}>
              צור חשבון כדי לשמור תורים, לנהל עסק ועוד
            </Text>
            <View style={styles.guestBtns}>
              <Pressable
                style={({ pressed }) => [styles.guestBtnPrimary, pressed && { opacity: 0.9 }]}
                onPress={() => router.push('/auth/customer-login' as never)}
              >
                <Text style={styles.guestBtnPrimaryText}>כניסה כלקוח ←</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.guestBtnOutline, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/auth/owner-login' as never)}
              >
                <Text style={styles.guestBtnOutlineText}>בעל עסק</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Owner: business management shortcut */}
        {isOwner && (
          <>
            <SectionHeader title="ניהול עסק" />
            <View style={styles.menuSection}>
              <MenuRow
                icon="calendar-outline"
                label="לוח שנה"
                sublabel="תורים להיום ולמחר"
                onPress={() => router.push('/owner/calendar' as never)}
              />
              <MenuRow
                icon="people-outline"
                label="לקוחות"
                sublabel="רשימת לקוחות וניהול"
                onPress={() => router.push('/owner/clients' as never)}
              />
              <MenuRow
                icon="cut-outline"
                label="שירותים"
                sublabel="ניהול שירותים ומחירים"
                onPress={() => router.push('/owner/services' as never)}
              />
              <MenuRow
                icon="bar-chart-outline"
                label="ניתוח נתונים"
                sublabel="הכנסות, לקוחות, תורים"
                onPress={() => router.push('/owner/analytics' as never)}
              />
            </View>
          </>
        )}

        {/* Customer: quick links */}
        {isCustomer && (
          <>
            <SectionHeader title="הפעילות שלי" />
            <View style={styles.menuSection}>
              <MenuRow
                icon="calendar-outline"
                label="התורים שלי"
                sublabel="קרובים והיסטוריה"
                onPress={() => router.push('/(tabs)/my-appointments' as never)}
              />
              <MenuRow
                icon="search-outline"
                label="גלה עסקים"
                sublabel="סלונים ומספרות בקרבתך"
                onPress={() => router.push('/(tabs)/discover' as never)}
              />
            </View>
          </>
        )}

        {/* App section */}
        <SectionHeader title="אפליקציה" />
        <View style={styles.menuSection}>
          <MenuRow
            icon="language-outline"
            label="שפה"
            sublabel="עברית"
            onPress={() => {/* future i18n settings */}}
          />
          <MenuRow
            icon="notifications-outline"
            label="התראות"
            sublabel="תזכורות ועדכונים"
            onPress={() => {/* future */}}
          />
          <MenuRow
            icon="information-circle-outline"
            label="אודות Appointly"
            sublabel="גרסה 1.0.0"
            onPress={() => {/* future */}}
          />
          <MenuRow
            icon="bug-outline"
            label="דווח על בעיה"
            sublabel="שלח לנו משוב או דיווח על תקלה"
            onPress={() => setBugReportOpen(true)}
          />
        </View>

        {/* Account actions */}
        {!isGuest && (
          <>
            <SectionHeader title="חשבון" />
            <View style={styles.menuSection}>
              <MenuRow
                icon="log-out-outline"
                label="התנתקות"
                onPress={handleLogout}
                danger
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Bug report modal triggered from menu row */}
      <BugReportButton
        open={bugReportOpen}
        onClose={() => setBugReportOpen(false)}
        userId={user?.id}
        userPhone={user?.phone ?? undefined}
      />
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
  },
  screenTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    gap: spacing[3],
  },

  // Identity card
  identityCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.brand[200],
  },
  avatarOwner: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[700],
  },
  avatarText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.brand[700],
  },
  identityText: { flex: 1, gap: 2 },
  identityName: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  identityRole: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  roleBadgeOwner: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[700],
  },
  roleBadgeText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.brand[700],
  },
  roleBadgeTextOwner: { color: colors.white },

  // Guest CTA card
  guestCard: {
    backgroundColor: colors.brand[600],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    gap: spacing[3],
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  guestCardTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.xl,
    color: colors.white,
    textAlign: 'right',
    letterSpacing: -0.3,
  },
  guestCardSub: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.brand[200],
    textAlign: 'right',
    lineHeight: 20,
  },
  guestBtns: {
    flexDirection: 'row-reverse',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  guestBtnPrimary: {
    flex: 1,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnPrimaryText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.base,
    color: colors.brand[600],
  },
  guestBtnOutline: {
    height: 44,
    paddingHorizontal: spacing[5],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnOutlineText: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.base,
    color: colors.white,
  },

  // Section header
  sectionHeader: {
    fontFamily: 'Heebo_600SemiBold',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing[2],
    marginTop: spacing[2],
  },

  // Menu section
  menuSection: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.floating,
  },
  menuRowPressed: { backgroundColor: colors.surface.elevated },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: { backgroundColor: colors.dangerLight },
  menuText: { flex: 1, gap: 2 },
  menuLabel: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'right',
  },
  menuLabelDanger: { color: colors.danger },
  menuSublabel: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'right',
  },
});
