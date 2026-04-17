/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/discover` | `/(tabs)/my-appointments` | `/(tabs)/owner-calendar` | `/(tabs)/owner-clients` | `/(tabs)/owner-services` | `/(tabs)/profile` | `/_sitemap` | `/auth` | `/auth/` | `/auth/customer-login` | `/auth/owner-login` | `/auth/owner-register` | `/book/[slug]/` | `/book/[slug]/confirmation` | `/book/[slug]/datetime` | `/book/[slug]/details` | `/book/[slug]/otp` | `/book/[slug]/staff` | `/discover` | `/my-appointments` | `/my-salons` | `/onboarding` | `/owner-calendar` | `/owner-clients` | `/owner-services` | `/owner/analytics` | `/owner/calendar` | `/owner/clients` | `/owner/services` | `/profile`;
      DynamicRoutes: `/book/${Router.SingleRoutePart<T>}` | `/cancel/${Router.SingleRoutePart<T>}` | `/invite/${Router.SingleRoutePart<T>}` | `/salon/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/book/[slug]` | `/cancel/[token]` | `/invite/[token]` | `/salon/[slug]`;
    }
  }
}
