/**
 * Auth store — persists session across app restarts via AsyncStorage.
 *
 * Roles:
 *  - GUEST        → browsing only, no phone stored
 *  - CUSTOMER     → phone verified via OTP; can see their appointments
 *  - SALON_OWNER  → email/password JWT; sees owner dashboard
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'GUEST' | 'CUSTOMER' | 'SALON_OWNER';

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
};

type AuthStore = {
  /** Whether the user has completed the onboarding slides. */
  hasOnboarded: boolean;
  /** null = not logged in (guest) */
  user: AuthUser | null;
  /** JWT token for owner API calls — null for guests/customers */
  token: string | null;
  /** True while AsyncStorage is being read on first mount */
  isLoading: boolean;

  // Actions
  setHasOnboarded: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginAsCustomer: (phone: string, name: string) => Promise<void>;
  loginAsOwner: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Load persisted session on app start */
  hydrate: () => Promise<void>;
};

const STORAGE_KEYS = {
  HAS_ONBOARDED: '@appointly/has_onboarded',
  USER: '@appointly/auth_user',
  TOKEN: '@appointly/auth_token',
  PHONE: '@appointly/customer_phone',
} as const;

export const useAuthStore = create<AuthStore>((set) => ({
  hasOnboarded: false,
  user: null,
  token: null,
  isLoading: true,

  setHasOnboarded: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    set({ hasOnboarded: true });
  },

  loginAsGuest: async () => {
    const guest: AuthUser = { id: 'guest', name: 'אורח', email: null, phone: null, role: 'GUEST' };
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guest));
    set({ user: guest, token: null });
  },

  loginAsCustomer: async (phone, name) => {
    const user: AuthUser = {
      id: phone,
      name,
      email: null,
      phone,
      role: 'CUSTOMER',
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.PHONE, phone);
    set({ user, token: null });
  },

  loginAsOwner: async (user, token) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    set({ user, token });
  },

  logout: async () => {
    // Keep HAS_ONBOARDED so post-logout the user lands on /auth (not onboarding again).
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.PHONE,
    ]);
    set({ user: null, token: null });
  },

  hydrate: async () => {
    try {
      const [onboarded, userRaw, token] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      ]);

      set({
        hasOnboarded: onboarded === 'true',
        user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
        token: token ?? null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
