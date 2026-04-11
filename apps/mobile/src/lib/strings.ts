/**
 * Hebrew UI strings — all user-facing copy lives here.
 * Never hardcode Hebrew text in components; always reference a key from this file.
 */

export const he = {
  // App-wide
  app_name: 'Appointly',
  back: 'חזור',
  save: 'שמור',
  cancel: 'ביטול',
  confirm: 'אישור',
  loading: 'טוען...',
  error_generic: 'אירעה שגיאה. אנא נסה שוב.',
  retry: 'נסה שוב',

  // Home
  home_title: 'קביעת תור',
  home_subtitle: 'הכנס את שם הסלון כדי להתחיל',
  home_slug_placeholder: 'שם הסלון (slug)',
  home_cta: 'המשך',
  home_slug_empty: 'אנא הכנס שם סלון',

  // Progress steps
  step_service: 'שירות',
  step_staff: 'צוות',
  step_datetime: 'מועד',
  step_details: 'פרטים',
  step_otp: 'אימות',
  step_confirmation: 'אישור',

  // Services step
  services_title: 'בחר שירות',
  services_subtitle: 'איזה שירות תרצה לקבוע?',
  services_empty: 'אין שירותים זמינים כרגע.',
  services_error: 'שגיאה בטעינת השירותים. אנא נסה שוב.',
  minutes: 'דקות',

  // Staff step
  staff_title: 'בחר איש צוות',
  staff_subtitle: 'עם מי תרצה לקבוע את התור?',
  staff_no_pref: 'ללא העדפה',
  staff_no_pref_sub: 'הזמן הפנוי המוקדם ביותר',
  staff_empty: 'אין אנשי צוות זמינים כרגע.',
  staff_error: 'שגיאה בטעינת אנשי הצוות. אנא נסה שוב.',

  // DateTime step
  datetime_title: 'בחר מועד',
  datetime_subtitle: 'מתי תרצה להגיע?',
  datetime_no_slots: 'אין מקומות פנויים ביום זה.',
  datetime_slots_error: 'שגיאה בטעינת מועדים. אנא נסה שוב.',
  datetime_today: 'היום',

  // Details step
  details_title: 'פרטי הזמנה',
  details_subtitle: 'כמה פרטים לפני שנסיים',
  details_name_label: 'שם מלא',
  details_name_placeholder: 'ישראל ישראלי',
  details_phone_label: 'מספר טלפון',
  details_phone_placeholder: '050-0000000',
  details_email_label: 'אימייל (אופציונלי)',
  details_email_placeholder: 'your@email.com',
  details_cta: 'המשך',
  details_summary: 'סיכום התור',

  // OTP step
  otp_title: 'אימות טלפון',
  otp_subtitle: 'שלחנו קוד 6 ספרות למספר',
  otp_resend: 'שלח קוד חדש',
  otp_resend_in: 'שלח שוב בעוד',
  otp_seconds_suffix: 'ש׳',
  otp_verifying: 'מאמת...',
  otp_error: 'קוד שגוי. אנא נסה שוב.',
  otp_too_many: 'יותר מדי ניסיונות. בקש קוד חדש.',

  // Confirmation step
  confirmation_loading: 'שומר את התור...',
  confirmation_title: 'התור נקבע!',
  confirmation_subtitle: 'אישור ישלח בוואטסאפ/SMS',
  confirmation_service: 'שירות',
  confirmation_date: 'תאריך',
  confirmation_time: 'שעה',
  confirmation_staff: 'איש צוות',
  confirmation_book_another: 'קבע תור נוסף',
  confirmation_error: 'לא ניתן לשמור את התור. אנא נסה שוב.',

  // Cancel page
  cancel_loading: 'טוען פרטי תור...',
  cancel_title: 'ביטול תור',
  cancel_subtitle: 'האם אתה בטוח שברצונך לבטל? פעולה זו אינה הפיכה.',
  cancel_cta: 'כן, בטל את התור',
  cancel_back: 'לא, חזור',
  cancel_sms: 'ביטול עם קוד SMS',
  cancel_otp_title: 'אימות ביטול',
  cancel_otp_subtitle: 'שלחנו קוד 6 ספרות למספר',
  cancel_cancelling: 'מבטל את התור...',
  cancel_success_title: 'התור בוטל בהצלחה',
  cancel_success_subtitle: 'נשמח לראות אותך שוב.',
  cancel_error_title: 'לא ניתן לבטל',
  cancel_invalid_title: 'קישור לא תקף',
  cancel_invalid_subtitle: 'הקישור לביטול אינו תקף או שכבר שומש.',
  cancel_window: 'ביטול אפשרי עד',
  cancel_window_suffix: 'שעות לפני התור',
  cancel_resend: 'שלח קוד חדש',
  cancel_resend_in: 'שלח שוב בעוד',

  // Details labels on cards
  detail_duration: 'דקות',
} as const;

export type StringKey = keyof typeof he;

/** Simple translation helper — returns the Hebrew string for a key. */
export function t(key: StringKey): string {
  return he[key];
}
