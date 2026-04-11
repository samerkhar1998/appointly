// Client-side auth utilities
// Server-side auth is handled in packages/api/src/context.ts

export function getAuthHeaders(): Record<string, string> {
  // Cookies are sent automatically by the browser (httpOnly)
  return {};
}
