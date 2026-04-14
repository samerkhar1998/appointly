import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { colors, fontSize, spacing } from '@/lib/theme';

type TabConfig = {
  name: string;
  label: string;
  iconActive: IconName;
  iconInactive: IconName;
};

// Reversed so React Navigation v6 renders them right-to-left visually.
// RN v6 hardcodes flexDirection:'row' in the items container and ignores I18nManager,
// so reversing the array is the only reliable way to get RTL order in the tab bar.
const TABS: TabConfig[] = [
  { name: 'profile',         label: 'פרופיל',  iconActive: 'person',            iconInactive: 'person-outline' },
  { name: 'my-appointments', label: 'תורים',   iconActive: 'calendar',          iconInactive: 'calendar-outline' },
  { name: 'discover',        label: 'גלה',     iconActive: 'search',            iconInactive: 'search-outline' },
  { name: 'index',           label: 'בית',     iconActive: 'home',              iconInactive: 'home-outline' },
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

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

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
      {TABS.map((tab) => (
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
