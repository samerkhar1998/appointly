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
  confirmation_go_home: 'חזרה לדף הבית',
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

  // Discovery screen
  discover_title: 'גלה עסקים',
  discover_subtitle: 'מצא סלון, מספרה או קליניקה וקבע תור',
  discover_search_placeholder: 'חפש לפי שם או עיר...',
  discover_empty: 'לא נמצאו עסקים',
  discover_empty_query: 'נסה חיפוש אחר',
  discover_clear: 'נקה חיפוש',
  discover_book: 'קבע תור',

  // My Salons screen
  my_salons_title: 'העסקים שלי',
  my_salons_subtitle: 'הכנס מספר טלפון לצפייה בעסקים שלך',
  my_salons_phone_label: 'מספר טלפון',
  my_salons_search_cta: 'חפש',
  my_salons_empty: 'לא נמצאו עסקים',
  my_salons_empty_sub: 'לא קבעת תורים עם מספר זה בעבר',
  my_salons_discover_cta: 'גלה עסקים חדשים',
  my_salons_results: 'עסקים שביקרת',

  // Invite screen
  invite_private_badge: 'עסק פרטי',
  invite_invited: 'הוזמנת אישית',
  invite_cta: 'קבע תור',
  invite_invalid_title: 'קישור לא תקף',
  invite_invalid_sub: 'קישור ההזמנה לא תקף או שפג תוקפו.',

  // Private salon gate (in booking flow)
  booking_private_title: 'עסק פרטי',
  booking_private_sub: 'עסק זה פרטי. כדי לקבוע תור תצטרך קישור הזמנה אישי מבעל העסק.',
  booking_private_cta: 'חזור לגילוי עסקים',

  // Home updated
  home_discover_cta: 'גלה עסקים',
  home_my_salons_cta: 'העסקים שלי',
  home_direct_label: 'כניסה ישירה לעסק',

  // Home tab (appointments-aware)
  home_upcoming_title: 'תורים קרובים',
  home_no_appointments_title: 'עדיין אין תורים',
  home_no_appointments_sub: 'גלה עסקים וקבע את התור הראשון שלך',
  home_go_discover: 'גלה עסקים',
  home_phone_prompt: 'הכנס מספר טלפון כדי לראות את התורים שלך',
  home_save_phone: 'שמור',

  // My Appointments tab
  my_appointments_title: 'התורים שלי',
  my_appointments_upcoming: 'תורים קרובים',
  my_appointments_past: 'תורים קודמים',
  my_appointments_empty: 'לא נמצאו תורים',
  my_appointments_empty_sub: 'עדיין לא קבעת תורים עם מספר זה',
  my_appointments_phone_prompt: 'הכנס מספר טלפון לצפייה בתורים שלך',

  // Tab bar labels
  tab_home: 'בית',
  tab_discover: 'גלה עסקים',
  tab_my_appointments: 'התורים שלי',

  // Salon Profile screen
  salon_profile_book_cta: 'קבע תור',
  salon_profile_services_title: 'שירותים',
  salon_profile_staff_title: 'הצוות שלנו',
  salon_profile_hours_title: 'שעות פעילות',
  salon_profile_no_services: 'אין שירותים זמינים',
  salon_profile_no_staff: 'אין מידע על הצוות',
  salon_profile_closed: 'סגור',

  // Day names (Hebrew short)
  day_sun: 'ראשון',
  day_mon: 'שני',
  day_tue: 'שלישי',
  day_wed: 'רביעי',
  day_thu: 'חמישי',
  day_fri: 'שישי',
  day_sat: 'שבת',

  // Appointment status labels
  status_pending: 'ממתין לאישור',
  status_confirmed: 'מאושר',
  status_completed: 'הושלם',
  status_no_show: 'לא הגיע',
} as const;

export type StringKey = keyof typeof he;

/** Simple translation helper — returns the Hebrew string for a key. */
export function t(key: StringKey): string {
  return he[key];
}
