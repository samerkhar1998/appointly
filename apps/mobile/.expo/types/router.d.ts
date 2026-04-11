/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/book/[slug]/` | `/book/[slug]/confirmation` | `/book/[slug]/datetime` | `/book/[slug]/details` | `/book/[slug]/otp` | `/book/[slug]/staff`;
      DynamicRoutes: `/book/${Router.SingleRoutePart<T>}` | `/cancel/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/book/[slug]` | `/cancel/[token]`;
    }
  }
}
