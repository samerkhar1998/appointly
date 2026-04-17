import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { colors, fontSize, spacing } from '@/lib/theme';

type TabConfig = {
  name: string;
  label: string;
  iconActive: IconName;
  iconInactive: IconName;
};

// Customer tabs — reversed so RN renders them right-to-left visually.
// RN v6 hardcodes flexDirection:'row' and ignores I18nManager in the tab bar.
const CUSTOMER_TABS: TabConfig[] = [
  { name: 'profile',         label: 'פרופיל',  iconActive: 'person',            iconInactive: 'person-outline' },
  { name: 'my-appointments', label: 'תורים',   iconActive: 'calendar',          iconInactive: 'calendar-outline' },
  { name: 'discover',        label: 'גלה',     iconActive: 'search',            iconInactive: 'search-outline' },
  { name: 'index',           label: 'בית',     iconActive: 'home',              iconInactive: 'home-outline' },
];

// Owner tabs — reversed for the same RTL reason.
const OWNER_TABS: TabConfig[] = [
  { name: 'profile',          label: 'פרופיל',   iconActive: 'person',       iconInactive: 'person-outline' },
  { name: 'owner-services',   label: 'שירותים',  iconActive: 'cut',          iconInactive: 'cut-outline' },
  { name: 'owner-clients',    label: 'לקוחות',   iconActive: 'people',       iconInactive: 'people-outline' },
  { name: 'owner-calendar',   label: 'לוח שנה',  iconActive: 'calendar',     iconInactive: 'calendar-outline' },
];

// All possible tab screen names so hidden ones can be explicitly suppressed.
const ALL_TAB_NAMES = [
  'index', 'discover', 'my-appointments',
  'owner-calendar', 'owner-clients', 'owner-services',
  'profile',
];

function TabIcon({
  iconActive,
  iconInactive,
  label,
  focused,
}: {
  iconActive: IconName;
  iconInactive: IconName;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon
        name={focused ? iconActive : iconInactive}
        size={22}
        color={focused ? colors.brand[600] : colors.muted}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

// TabsLayout — renders role-appropriate bottom tabs.
// Owners see Calendar / Clients / Services / Profile.
// Customers and guests see Home / Discover / Appointments / Profile.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const isOwner = user?.role === 'SALON_OWNER';
  const visibleTabs = isOwner ? OWNER_TABS : CUSTOMER_TABS;
  const visibleNames = new Set(visibleTabs.map((t) => t.name));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing[3] },
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      {/* Visible tabs for the current role */}
      {visibleTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconActive={tab.iconActive}
                iconInactive={tab.iconInactive}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}

      {/* Hidden tabs — registered so Expo Router doesn't 404, but not shown */}
      {ALL_TAB_NAMES.filter((name) => !visibleNames.has(name)).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ tabBarButton: () => null }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 72,
    paddingTop: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: 12,
    minWidth: 56,
  },
  iconWrapActive: {
    backgroundColor: colors.brand[50],
  },
  label: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.brand[600],
    fontFamily: 'Heebo_600SemiBold',
  },
});
