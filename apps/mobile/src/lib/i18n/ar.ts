/**
 * Arabic (RTL) string catalogue.
 */
import type { StringKey } from './he';

export const ar: Record<StringKey, string> = {
  // App-wide
  app_name: 'Appointly',
  back: 'رجوع',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  loading: 'جاري التحميل...',
  error_generic: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
  retry: 'حاول مجددًا',

  // Home
  home_title: 'حجز موعد',
  home_subtitle: 'أدخل اسم الصالون للبدء',
  home_slug_placeholder: 'اسم الصالون',
  home_cta: 'متابعة',
  home_slug_empty: 'يرجى إدخال اسم الصالون',

  // Progress steps
  step_service: 'الخدمة',
  step_staff: 'الموظف',
  step_datetime: 'الموعد',
  step_details: 'التفاصيل',
  step_otp: 'التحقق',
  step_confirmation: 'تأكيد',

  // Services step
  services_title: 'اختر خدمة',
  services_subtitle: 'ما الخدمة التي تريد حجزها؟',
  services_empty: 'لا توجد خدمات متاحة حاليًا.',
  services_error: 'خطأ في تحميل الخدمات. يرجى المحاولة مرة أخرى.',
  minutes: 'دقيقة',

  // Staff step
  staff_title: 'اختر موظفًا',
  staff_subtitle: 'مع من تريد حجز موعدك؟',
  staff_no_pref: 'بدون تفضيل',
  staff_no_pref_sub: 'أقرب موعد متاح',
  staff_empty: 'لا يوجد موظفون متاحون حاليًا.',
  staff_error: 'خطأ في تحميل الموظفين. يرجى المحاولة مرة أخرى.',

  // DateTime step
  datetime_title: 'اختر موعدًا',
  datetime_subtitle: 'متى تريد الحضور؟',
  datetime_no_slots: 'لا توجد مواعيد متاحة في هذا اليوم.',
  datetime_slots_error: 'خطأ في تحميل المواعيد. يرجى المحاولة مرة أخرى.',
  datetime_today: 'اليوم',

  // Details step
  details_title: 'تفاصيل الحجز',
  details_subtitle: 'بعض التفاصيل قبل الانتهاء',
  details_name_label: 'الاسم الكامل',
  details_name_placeholder: 'محمد أحمد',
  details_phone_label: 'رقم الهاتف',
  details_phone_placeholder: '050-0000000',
  details_email_label: 'البريد الإلكتروني (اختياري)',
  details_email_placeholder: 'your@email.com',
  details_cta: 'متابعة',
  details_summary: 'ملخص الموعد',

  // OTP step
  otp_title: 'التحقق من الهاتف',
  otp_subtitle: 'أرسلنا رمزًا مكونًا من 6 أرقام إلى',
  otp_resend: 'إعادة إرسال الرمز',
  otp_resend_in: 'أعد الإرسال خلال',
  otp_seconds_suffix: 'ث',
  otp_verifying: 'جاري التحقق...',
  otp_error: 'رمز خاطئ. يرجى المحاولة مرة أخرى.',
  otp_too_many: 'محاولات كثيرة جدًا. اطلب رمزًا جديدًا.',

  // Confirmation step
  confirmation_loading: 'جاري حفظ الموعد...',
  confirmation_title: 'تم الحجز!',
  confirmation_subtitle: 'سيصلك تأكيد عبر واتساب/رسالة نصية',
  confirmation_service: 'الخدمة',
  confirmation_date: 'التاريخ',
  confirmation_time: 'الوقت',
  confirmation_staff: 'الموظف',
  confirmation_book_another: 'احجز موعدًا آخر',
  confirmation_go_home: 'العودة للرئيسية',
  confirmation_error: 'تعذر حفظ الموعد. يرجى المحاولة مرة أخرى.',

  // Cancel page
  cancel_loading: 'جاري تحميل تفاصيل الموعد...',
  cancel_title: 'إلغاء الموعد',
  cancel_subtitle: 'هل أنت متأكد من الإلغاء؟ لا يمكن التراجع عن هذه العملية.',
  cancel_cta: 'نعم، ألغِ الموعد',
  cancel_back: 'لا، رجوع',
  cancel_sms: 'إلغاء برمز SMS',
  cancel_otp_title: 'التحقق من الإلغاء',
  cancel_otp_subtitle: 'أرسلنا رمزًا مكونًا من 6 أرقام إلى',
  cancel_cancelling: 'جاري إلغاء الموعد...',
  cancel_success_title: 'تم إلغاء الموعد',
  cancel_success_subtitle: 'نأمل رؤيتك مرة أخرى.',
  cancel_error_title: 'تعذر الإلغاء',
  cancel_invalid_title: 'رابط غير صالح',
  cancel_invalid_subtitle: 'رابط الإلغاء غير صالح أو تم استخدامه مسبقًا.',
  cancel_window: 'يمكن الإلغاء حتى',
  cancel_window_suffix: 'ساعات قبل الموعد',
  cancel_resend: 'إعادة إرسال الرمز',
  cancel_resend_in: 'أعد الإرسال خلال',
  cancel_appt_btn: 'إلغاء الموعد',
  cancel_appt_confirm_title: 'إلغاء هذا الموعد؟',
  cancel_appt_confirm_body: 'لا يمكن التراجع عن هذا الإجراء.',
  cancel_appt_confirm_cta: 'نعم، إلغاء',
  cancel_appt_too_late: 'لا يمكن الإلغاء قبل أقل من {hours} ساعة من الموعد.',
  cancel_policy_label: 'سياسة الإلغاء',
  cancel_policy_value: 'إلغاء مجاني حتى {hours} ساعة قبل الموعد',
  cancel_policy_free: 'إلغاء مجاني في أي وقت',

  // Details labels on cards
  detail_duration: 'دقيقة',

  // Discovery screen
  discover_title: 'اكتشف الأعمال',
  discover_subtitle: 'ابحث عن صالون أو حلاقة وأحجز موعدًا',
  discover_search_placeholder: 'ابحث بالاسم أو المدينة...',
  discover_empty: 'لا توجد نتائج',
  discover_empty_query: 'حاول بحثًا آخر',
  discover_clear: 'مسح البحث',
  discover_book: 'احجز موعدًا',

  // My Salons screen
  my_salons_title: 'صالوناتي',
  my_salons_subtitle: 'أدخل رقم هاتفك لعرض صالوناتك',
  my_salons_phone_label: 'رقم الهاتف',
  my_salons_search_cta: 'بحث',
  my_salons_empty: 'لا توجد نتائج',
  my_salons_empty_sub: 'لم تحجز مواعيد بهذا الرقم من قبل',
  my_salons_discover_cta: 'اكتشف أعمالًا جديدة',
  my_salons_results: 'الأعمال التي زرتها',

  // Invite screen
  invite_private_badge: 'عمل خاص',
  invite_invited: 'تمت دعوتك شخصيًا',
  invite_cta: 'احجز موعدًا',
  invite_view_business: 'عرض العمل',
  invite_invalid_title: 'رابط غير صالح',
  invite_invalid_sub: 'رابط الدعوة غير صالح أو انتهت صلاحيته.',

  // Private salon gate (in booking flow)
  booking_private_title: 'عمل خاص',
  booking_private_sub: 'هذا العمل خاص. تحتاج إلى رابط دعوة شخصي من صاحب العمل.',
  booking_private_cta: 'العودة للاستكشاف',

  // Home updated
  home_discover_cta: 'اكتشف الأعمال',
  home_my_salons_cta: 'صالوناتي',
  home_direct_label: 'دخول مباشر للعمل',

  // Home tab (appointments-aware)
  home_upcoming_title: 'المواعيد القادمة',
  home_no_appointments_title: 'لا توجد مواعيد بعد',
  home_no_appointments_sub: 'اكتشف الأعمال واحجز موعدك الأول',
  home_go_discover: 'اكتشف الأعمال',
  home_phone_prompt: 'أدخل رقم هاتفك لعرض مواعيدك',
  home_save_phone: 'حفظ',
  home_favorites_title: 'المفضلة',

  // My Appointments tab
  my_appointments_title: 'مواعيدي',
  my_appointments_upcoming: 'المواعيد القادمة',
  my_appointments_past: 'المواعيد السابقة',
  my_appointments_empty: 'لا توجد مواعيد',
  my_appointments_empty_sub: 'لم تحجز مواعيد بهذا الرقم بعد',
  my_appointments_phone_prompt: 'أدخل رقم هاتفك لعرض مواعيدك',

  // Tab bar labels
  tab_home: 'الرئيسية',
  tab_discover: 'استكشاف',
  tab_my_appointments: 'مواعيد',
  tab_profile: 'الملف',

  // Onboarding
  onboarding_skip: 'تخطي',
  onboarding_next: 'التالي',
  onboarding_start: 'ابدأ الآن',
  onboarding_guest: 'متابعة كضيف',
  onboarding_slide1_title: 'اكتشف الأعمال القريبة',
  onboarding_slide1_sub: 'صالونات وحلاقون وعيادات — كل شيء في مكان واحد.',
  onboarding_slide2_title: 'احجز موعدًا في ثوانٍ',
  onboarding_slide2_sub: 'اختر الخدمة والموظف والوقت — تأكيد فوري عبر واتساب.',
  onboarding_slide3_title: 'أدر عملك من أي مكان',
  onboarding_slide3_sub: 'التقويم والعملاء والموظفون والتحليلات — كل شيء في متناول يدك.',

  // Auth welcome
  auth_tagline: 'النظام الذكي لإدارة المواعيد',
  auth_choose: 'اختر كيف تريد المتابعة',
  auth_as_customer: 'أنا عميل',
  auth_as_customer_sub: 'احجز مواعيد وتصفح الأعمال',
  auth_as_owner: 'أنا صاحب عمل',
  auth_as_owner_sub: 'أدر المواعيد والموظفين والعملاء',
  auth_as_guest: 'متابعة كضيف',
  auth_as_guest_sub: 'تصفح الأعمال بدون حساب',

  // Customer login
  customer_login_title: 'تسجيل الدخول كعميل',
  customer_login_subtitle: 'أدخل رقم هاتفك للحصول على رمز التحقق',
  customer_otp_title: 'التحقق من الهاتف',
  customer_name_title: 'ما اسمك؟',
  customer_name_subtitle: 'الاسم الذي سيظهر في مواعيدك',
  customer_phone_label: 'رقم الهاتف',
  customer_send_otp: 'إرسال رمز التحقق',
  customer_sending: 'جاري الإرسال...',
  customer_phone_error: 'يرجى إدخال رقم هاتف صحيح',
  customer_otp_wrong: 'رمز خاطئ. يرجى المحاولة مرة أخرى.',
  customer_login_cta: 'دخول',
  customer_skip_name: 'تخطي (متابعة بدون اسم)',

  // Owner login / register
  owner_login_title: 'دخول أصحاب الأعمال',
  owner_login_subtitle: 'أدر عملك — مواعيد وموظفون وعملاء',
  owner_email_label: 'البريد الإلكتروني',
  owner_password_label: 'كلمة المرور',
  owner_login_cta: 'دخول',
  owner_login_error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  owner_register_link: 'إنشاء حساب تجاري جديد',
  owner_register_title: 'إنشاء حساب تجاري',
  owner_register_subtitle: 'أدخل التفاصيل وابدأ خلال دقيقة',
  owner_name_label: 'الاسم الكامل',
  owner_salon_name_label: 'اسم العمل',
  owner_phone_label: 'الهاتف (اختياري)',
  owner_password_hint: 'كلمة المرور (8 أحرف على الأقل)',
  owner_register_cta: 'إنشاء حساب',
  owner_creating: 'جاري إنشاء الحساب...',
  owner_register_error_exists: 'هذا البريد الإلكتروني مسجل. حاول تسجيل الدخول.',
  owner_register_error_generic: 'تعذر إنشاء الحساب. حاول مرة أخرى.',
  owner_already_have_account: 'لديك حساب بالفعل؟ تسجيل الدخول',

  // Profile tab
  profile_title: 'الملف الشخصي',
  profile_guest: 'ضيف',
  profile_guest_browse: 'تصفح بدون حساب',
  profile_join_title: 'انضم الآن مجانًا',
  profile_join_sub: 'أنشئ حسابًا لحفظ المواعيد وإدارة عملك',
  profile_create_account: 'إنشاء حساب',
  profile_login: 'تسجيل الدخول',
  profile_section_business: 'إدارة العمل',
  profile_section_activity: 'نشاطي',
  profile_section_app: 'التطبيق',
  profile_section_account: 'الحساب',
  profile_logout: 'تسجيل الخروج',
  profile_language: 'اللغة',
  profile_notifications: 'الإشعارات',
  profile_about: 'حول Appointly',

  // Discover
  discover_open_now: 'مفتوح الآن',
  discover_category_all: 'الكل',

  // Salon Profile screen
  salon_profile_book_cta: 'احجز موعدًا',
  salon_profile_services_title: 'الخدمات',
  salon_profile_staff_title: 'فريقنا',
  salon_profile_hours_title: 'ساعات العمل',
  salon_profile_no_services: 'لا توجد خدمات متاحة',
  salon_profile_no_staff: 'لا توجد معلومات عن الفريق',
  salon_profile_closed: 'مغلق',

  // Day names
  day_sun: 'الأحد',
  day_mon: 'الاثنين',
  day_tue: 'الثلاثاء',
  day_wed: 'الأربعاء',
  day_thu: 'الخميس',
  day_fri: 'الجمعة',
  day_sat: 'السبت',

  // Appointment status labels
  status_pending: 'في الانتظار',
  status_confirmed: 'مؤكد',
  status_completed: 'مكتمل',
  status_no_show: 'لم يحضر',

  // Owner screens
  owner_calendar_title: 'التقويم',
  owner_calendar_today: 'اليوم',
  owner_calendar_no_appointments: 'لا توجد مواعيد اليوم',
  owner_clients_title: 'العملاء',
  owner_clients_empty: 'لا يوجد عملاء بعد',
  owner_services_title: 'الخدمات',
  owner_services_empty: 'لا توجد خدمات بعد',
  owner_analytics_title: 'التحليلات',
  owner_analytics_appointments: 'المواعيد هذا الشهر',
  owner_analytics_revenue: 'الإيرادات هذا الشهر',
  owner_analytics_top_service: 'الخدمة الأكثر طلبًا',
  owner_analytics_no_data: 'لا توجد بيانات بعد',
};
