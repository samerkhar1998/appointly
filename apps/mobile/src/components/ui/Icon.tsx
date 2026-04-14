/**
 * Centralized icon component — backed by lucide-react-native (SVG) instead of
 * font-based Ionicons. The `name` prop accepts the same Ionicons-style names that
 * the rest of the app already uses, and maps them to the corresponding Lucide icon.
 *
 * Usage:
 *   <Icon name="home" size={24} color={colors.brand[600]} />
 *   <Icon name="calendar-outline" />  ← defaults to 24px foreground color
 */

import {
  BarChart2,
  Bell,
  Brush,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Droplets,
  Eye,
  EyeOff,
  Gem,
  Globe,
  Heart,
  Home,
  Info,
  Lock,
  LogOut,
  MapPin,
  MoreHorizontal,
  Phone,
  Scissors,
  Search,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
} from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { colors } from '@/lib/theme';

// ─── Icon name → Lucide component map ────────────────────────────────────────
// Supports filled variants (e.g. "home") and outline variants ("home-outline").
// Both map to the same Lucide icon since Lucide controls stroke width via props.

type LucideIcon = ComponentType<LucideProps>;

const ICON_MAP: Record<string, LucideIcon> = {
  // Navigation / tabs
  'home':                      Home,
  'home-outline':               Home,
  'search':                    Search,
  'search-outline':             Search,
  'calendar':                  Calendar,
  'calendar-outline':           Calendar,
  'person':                    User,
  'person-outline':             User,

  // Chevrons
  'chevron-back':               ChevronLeft,
  'chevron-forward':            ChevronRight,
  'chevron-down':               ChevronDown,
  'chevron-up':                 ChevronUp,

  // Business / brand
  'cut':                       Scissors,
  'cut-outline':                Scissors,
  'business-outline':           Building2,
  'sparkles-outline':           Sparkles,

  // Auth / security
  'eye-outline':                Eye,
  'eye-off-outline':            EyeOff,
  'lock-closed-outline':        Lock,
  'lock-outline':               Lock,

  // Contact / device
  'phone-portrait-outline':     Smartphone,
  'phone-outline':              Phone,

  // Location
  'location-sharp':             MapPin,
  'location-outline':           MapPin,

  // Social / people
  'people-outline':             Users,
  'star':                      Star,
  'star-outline':               Star,
  'heart':                     Heart,
  'heart-outline':              Heart,

  // Data / analytics
  'bar-chart-outline':          BarChart2,
  'trending-up':                TrendingUp,

  // Finance
  'wallet-outline':             Wallet,

  // Time
  'time-outline':               Clock,

  // Settings / app
  'language-outline':           Globe,
  'notifications-outline':      Bell,
  'information-circle-outline': Info,
  'log-out-outline':            LogOut,

  // UI helpers
  'close-circle':               XCircle,
  'close':                      X,
  'ellipsis-horizontal':        MoreHorizontal,

  // Category / discover filter icons
  'gem':                        Gem,
  'droplets':                   Droplets,
  'stethoscope':                Stethoscope,
  'brush':                      Brush,
  'zap':                        Zap,

  // Greeting (used as friendly "name" step icon)
  'hand-left-outline':          Sparkles,
};

// ─── Filled variants use thicker stroke to simulate "filled" look ─────────────
const FILLED_VARIANTS = new Set([
  'home', 'search', 'calendar', 'person', 'cut', 'star',
]);

// ─── Public types ─────────────────────────────────────────────────────────────
export type IconName = keyof typeof ICON_MAP;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function Icon({ name, size = 24, color = colors.foreground }: IconProps) {
  const LucideComponent = ICON_MAP[name];

  if (!LucideComponent) {
    if (__DEV__) {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  const strokeWidth = FILLED_VARIANTS.has(name) ? 2.5 : 1.75;

  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}
