import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { colors, fontSize, radius, shadows, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  key: string;
  icon: IconName;
  accentColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    key: 'discover',
    icon: 'search',
    accentColor: colors.brand[600],
    bgColor: colors.brand[50],
    title: 'גלה עסקים בקרבתך',
    subtitle: 'סלונים, מספרות וקליניקות — כולם במקום אחד, מסודרים לפי מיקום ודירוג.',
  },
  {
    key: 'book',
    icon: 'zap',
    accentColor: '#0ea5e9',
    bgColor: '#e0f2fe',
    title: 'קבע תור בשניות',
    subtitle: 'בחר שירות, צוות ושעה — אישור מיידי בוואטסאפ. ללא שיחות, ללא המתנה.',
  },
  {
    key: 'manage',
    icon: 'bar-chart-outline',
    accentColor: '#7c3aed',
    bgColor: '#f5f3ff',
    title: 'נהל את העסק שלך\nמכל מקום',
    subtitle: 'לוח שנה, לקוחות, צוות ואנליטיקס — הכל בכף ידך בכל רגע.',
  },
];

function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Illustration blob */}
      <View style={[styles.illustrationWrap, { backgroundColor: slide.bgColor }]}>
        <View style={[styles.outerRing, { borderColor: slide.accentColor + '30' }]}>
          <View style={[styles.innerRing, { borderColor: slide.accentColor + '60', backgroundColor: slide.bgColor }]}>
            <Icon name={slide.icon} size={64} color={slide.accentColor} />
          </View>
        </View>
        {/* Decorative dots */}
        <View style={[styles.dot, styles.dotTL, { backgroundColor: slide.accentColor + '40' }]} />
        <View style={[styles.dot, styles.dotBR, { backgroundColor: slide.accentColor + '30' }]} />
        <View style={[styles.dotSm, styles.dotTR, { backgroundColor: slide.accentColor + '50' }]} />
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={[styles.slideTitle, { color: colors.foreground }]}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );
}

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dotIndicator,
            i === active
              ? styles.dotIndicatorActive
              : styles.dotIndicatorInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const setHasOnboarded = useAuthStore((s) => s.setHasOnboarded);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList<Slide>>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  function handleViewableItemsChanged({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) {
    if (viewableItems[0]) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  async function handleFinish() {
    await setHasOnboarded();
    router.replace('/auth' as never);
  }

  function handleNext() {
    if (isLast) {
      void handleFinish();
    } else {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }

  function handleSkip() {
    void handleFinish();
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      {!isLast && (
        <Pressable
          style={[styles.skipBtn, { top: insets.top + spacing[4] }]}
          onPress={handleSkip}
          hitSlop={12}
        >
          <Text style={styles.skipText}>דלג</Text>
          <Icon name="chevron-back" size={14} color={colors.muted} />
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => <SlideItem slide={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        style={styles.flatList}
        scrollEventThrottle={16}
      />

      {/* Bottom controls */}
      <View style={styles.bottom}>
        <Dots total={SLIDES.length} active={activeIndex} />

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            pressed && styles.nextBtnPressed,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'התחל עכשיו' : 'הבא'}
          </Text>
          <Icon name="chevron-back" size={20} color={colors.white} />
        </Pressable>

        {isLast && (
          <Pressable onPress={handleSkip} hitSlop={8} style={styles.guestLink}>
            <Text style={styles.guestLinkText}>המשך כאורח</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },

  skipBtn: {
    position: 'absolute',
    start: spacing[5],
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    backgroundColor: colors.surface.floating,
  },
  skipText: {
    fontFamily: 'Heebo_500Medium',
    fontSize: fontSize.sm,
    color: colors.muted,
  },

  flatList: { flex: 1 },

  // Slide
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[8],
    paddingTop: spacing[16],
  },

  illustrationWrap: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
  },
  // Decorative dots
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotSm: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotTL: { top: 16, start: 16 },
  dotBR: { bottom: 20, end: 12 },
  dotTR: { top: 28, end: 24 },

  textWrap: { gap: spacing[3], alignItems: 'center' },
  slideTitle: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize['3xl'],
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  slideSubtitle: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing[2],
  },

  // Bottom
  bottom: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[4],
    alignItems: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
  dotIndicator: {
    height: 8,
    borderRadius: 4,
  },
  dotIndicatorActive: {
    width: 24,
    backgroundColor: colors.brand[600],
  },
  dotIndicatorInactive: {
    width: 8,
    backgroundColor: colors.border,
  },

  nextBtn: {
    width: '100%',
    height: 52,
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    ...shadows.elevated,
    shadowColor: colors.brand[600],
  },
  nextBtnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  nextBtnText: {
    fontFamily: 'Heebo_700Bold',
    fontSize: fontSize.lg,
    color: colors.white,
  },

  guestLink: { paddingVertical: spacing[1] },
  guestLinkText: {
    fontFamily: 'Heebo_400Regular',
    fontSize: fontSize.sm,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
