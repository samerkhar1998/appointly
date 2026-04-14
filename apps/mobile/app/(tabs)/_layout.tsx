import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, spacing } from '@/lib/theme';
import { t } from '@/lib/strings';

// Tab bar icon — rendered as a simple emoji badge
function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
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
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label={t('tab_home')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label={t('tab_discover')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-appointments"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📅" label={t('tab_my_appointments')} focused={focused} />
          ),
        }}
      />
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
    gap: 2,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: colors.brand[50],
  },
  emoji: { fontSize: 20 },
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
