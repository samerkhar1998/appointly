/**
 * Hebrew (RTL) string catalogue — the master locale.
 * All other locales must have the same keys.
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
  cancel_appt_btn: 'ביטול תור',
  cancel_appt_confirm_title: 'לבטל את התור?',
  cancel_appt_confirm_body: 'פעולה זו אינה הפיכה.',
  cancel_appt_confirm_cta: 'כן, בטל',
  cancel_appt_too_late: 'לא ניתן לבטל פחות מ-{hours} שעות לפני התור.',
  cancel_policy_label: 'מדיניות ביטול',
  cancel_policy_value: 'ביטול חינם עד {hours} שעות לפני התור',
  cancel_policy_free: 'ביטול ללא עלות',

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
  invite_view_business: 'צפה בעסק',
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
  home_favorites_title: 'מועדפים',

  // My Appointments tab
  my_appointments_title: 'התורים שלי',
  my_appointments_upcoming: 'תורים קרובים',
  my_appointments_past: 'תורים קודמים',
  my_appointments_empty: 'לא נמצאו תורים',
  my_appointments_empty_sub: 'עדיין לא קבעת תורים עם מספר זה',
  my_appointments_phone_prompt: 'הכנס מספר טלפון לצפייה בתורים שלך',

  // Tab bar labels
  tab_home: 'בית',
  tab_discover: 'גלה',
  tab_my_appointments: 'תורים',
  tab_profile: 'פרופיל',

  // Onboarding
  onboarding_skip: 'דלג',
  onboarding_next: 'הבא',
  onboarding_start: 'התחל עכשיו',
  onboarding_guest: 'המשך כאורח',
  onboarding_slide1_title: 'גלה עסקים בקרבתך',
  onboarding_slide1_sub: 'סלונים, מספרות וקליניקות — כולם במקום אחד, מסודרים לפי מיקום ודירוג.',
  onboarding_slide2_title: 'קבע תור בשניות',
  onboarding_slide2_sub: 'בחר שירות, צוות ושעה — אישור מיידי בוואטסאפ. ללא שיחות, ללא המתנה.',
  onboarding_slide3_title: 'נהל את העסק שלך מכל מקום',
  onboarding_slide3_sub: 'לוח שנה, לקוחות, צוות ואנליטיקס — הכל בכף ידך בכל רגע.',

  // Auth welcome
  auth_tagline: 'המערכת החכמה לניהול תורים',
  auth_choose: 'בחר כיצד להמשיך',
  auth_as_customer: 'אני לקוח',
  auth_as_customer_sub: 'קבע תורים, צפה בהיסטוריה, גלה עסקים',
  auth_as_owner: 'אני בעל עסק',
  auth_as_owner_sub: 'נהל תורים, צוות, שירותים ולקוחות',
  auth_as_guest: 'המשך כאורח',
  auth_as_guest_sub: 'גלה עסקים ללא חשבון',

  // Customer login
  customer_login_title: 'כניסה כלקוח',
  customer_login_subtitle: 'הזן מספר טלפון לקבלת קוד אימות',
  customer_otp_title: 'אימות טלפון',
  customer_name_title: 'מה שמך?',
  customer_name_subtitle: 'השם שיופיע בתורים שלך',
  customer_phone_label: 'מספר טלפון',
  customer_send_otp: 'שלח קוד אימות',
  customer_sending: 'שולח...',
  customer_phone_error: 'נא להזין מספר טלפון תקין',
  customer_otp_wrong: 'קוד שגוי. אנא נסה שוב.',
  customer_login_cta: 'כניסה',
  customer_skip_name: 'דלג (המשך ללא שם)',

  // Owner login / register
  owner_login_title: 'כניסה לבעלי עסקים',
  owner_login_subtitle: 'נהל את העסק שלך — תורים, צוות, לקוחות ועוד',
  owner_email_label: 'אימייל',
  owner_password_label: 'סיסמה',
  owner_login_cta: 'כניסה',
  owner_login_error: 'אימייל או סיסמה שגויים',
  owner_register_link: 'צור חשבון עסקי חדש',
  owner_register_title: 'צור חשבון עסקי',
  owner_register_subtitle: 'מלא את הפרטים וצא לדרך תוך דקה',
  owner_name_label: 'שם מלא',
  owner_salon_name_label: 'שם העסק',
  owner_phone_label: 'טלפון (אופציונלי)',
  owner_password_hint: 'סיסמה (8 תווים לפחות)',
  owner_register_cta: 'צור חשבון',
  owner_creating: 'יוצר חשבון...',
  owner_register_error_exists: 'אימייל זה כבר רשום. נסה להתחבר.',
  owner_register_error_generic: 'לא ניתן ליצור חשבון. נסה שוב.',
  owner_already_have_account: 'כבר יש לך חשבון? כניסה',

  // Profile tab
  profile_title: 'פרופיל',
  profile_guest: 'אורח',
  profile_guest_browse: 'גלישה ללא חשבון',
  profile_join_title: 'הצטרף עכשיו בחינם',
  profile_join_sub: 'צור חשבון כדי לשמור תורים, לנהל עסק ועוד',
  profile_create_account: 'יצירת חשבון',
  profile_login: 'כניסה',
  profile_section_business: 'ניהול עסק',
  profile_section_activity: 'הפעילות שלי',
  profile_section_app: 'אפליקציה',
  profile_section_account: 'חשבון',
  profile_logout: 'התנתקות',
  profile_language: 'שפה',
  profile_notifications: 'התראות',
  profile_about: 'אודות Appointly',

  // Discover
  discover_open_now: 'פתוח עכשיו',
  discover_category_all: 'הכל',

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

  // Owner screens
  owner_calendar_title: 'לוח שנה',
  owner_calendar_today: 'היום',
  owner_calendar_no_appointments: 'אין תורים היום',
  owner_clients_title: 'לקוחות',
  owner_clients_empty: 'אין לקוחות עדיין',
  owner_services_title: 'שירותים',
  owner_services_empty: 'אין שירותים עדיין',
  owner_analytics_title: 'ניתוח נתונים',
  owner_analytics_appointments: 'תורים החודש',
  owner_analytics_revenue: 'הכנסות החודש',
  owner_analytics_top_service: 'שירות מוביל',
  owner_analytics_no_data: 'אין נתונים עדיין',
} as const;

export type StringKey = keyof typeof he;
