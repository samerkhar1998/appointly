/**
 * English (LTR) string catalogue.
 */
import type { StringKey } from './he';

export const en: Record<StringKey, string> = {
  // App-wide
  app_name: 'Appointly',
  back: 'Back',
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  loading: 'Loading...',
  error_generic: 'Something went wrong. Please try again.',
  retry: 'Retry',

  // Home
  home_title: 'Book an Appointment',
  home_subtitle: 'Enter the salon name to get started',
  home_slug_placeholder: 'Salon name',
  home_cta: 'Continue',
  home_slug_empty: 'Please enter a salon name',

  // Progress steps
  step_service: 'Service',
  step_staff: 'Staff',
  step_datetime: 'Time',
  step_details: 'Details',
  step_otp: 'Verify',
  step_confirmation: 'Confirm',

  // Services step
  services_title: 'Choose a Service',
  services_subtitle: 'What would you like to book?',
  services_empty: 'No services available right now.',
  services_error: 'Error loading services. Please try again.',
  minutes: 'min',

  // Staff step
  staff_title: 'Choose Staff',
  staff_subtitle: 'Who would you like to book with?',
  staff_no_pref: 'No preference',
  staff_no_pref_sub: 'Next available slot',
  staff_empty: 'No staff available right now.',
  staff_error: 'Error loading staff. Please try again.',

  // DateTime step
  datetime_title: 'Choose a Time',
  datetime_subtitle: 'When would you like to come in?',
  datetime_no_slots: 'No available slots on this day.',
  datetime_slots_error: 'Error loading slots. Please try again.',
  datetime_today: 'Today',

  // Details step
  details_title: 'Booking Details',
  details_subtitle: 'Just a few details before we finish',
  details_name_label: 'Full Name',
  details_name_placeholder: 'John Smith',
  details_phone_label: 'Phone Number',
  details_phone_placeholder: '+1 234 567 8900',
  details_email_label: 'Email (optional)',
  details_email_placeholder: 'your@email.com',
  details_cta: 'Continue',
  details_summary: 'Booking Summary',

  // OTP step
  otp_title: 'Phone Verification',
  otp_subtitle: 'We sent a 6-digit code to',
  otp_resend: 'Resend Code',
  otp_resend_in: 'Resend in',
  otp_seconds_suffix: 's',
  otp_verifying: 'Verifying...',
  otp_error: 'Wrong code. Please try again.',
  otp_too_many: 'Too many attempts. Request a new code.',

  // Confirmation step
  confirmation_loading: 'Saving your appointment...',
  confirmation_title: 'Appointment Booked!',
  confirmation_subtitle: 'Confirmation sent via WhatsApp/SMS',
  confirmation_service: 'Service',
  confirmation_date: 'Date',
  confirmation_time: 'Time',
  confirmation_staff: 'Staff',
  confirmation_book_another: 'Book Another',
  confirmation_go_home: 'Go Home',
  confirmation_error: 'Could not save your appointment. Please try again.',
  slot_taken_title: 'Slot no longer available',
  slot_taken_body: 'Someone else just booked this time. Please choose a different slot.',
  slot_taken_cta: 'Choose another time',

  // Cancel page
  cancel_loading: 'Loading appointment details...',
  cancel_title: 'Cancel Appointment',
  cancel_subtitle: 'Are you sure you want to cancel? This cannot be undone.',
  cancel_cta: 'Yes, Cancel Appointment',
  cancel_back: 'No, Go Back',
  cancel_sms: 'Cancel with SMS Code',
  cancel_otp_title: 'Verify Cancellation',
  cancel_otp_subtitle: 'We sent a 6-digit code to',
  cancel_cancelling: 'Cancelling appointment...',
  cancel_success_title: 'Appointment Cancelled',
  cancel_success_subtitle: 'We hope to see you again.',
  cancel_error_title: 'Cannot Cancel',
  cancel_invalid_title: 'Invalid Link',
  cancel_invalid_subtitle: 'The cancellation link is invalid or already used.',
  cancel_window: 'Can cancel up to',
  cancel_window_suffix: 'hours before',
  cancel_resend: 'Resend Code',
  cancel_resend_in: 'Resend in',
  cancel_appt_btn: 'Cancel Appointment',
  cancel_appt_confirm_title: 'Cancel this appointment?',
  cancel_appt_confirm_body: 'This action cannot be undone.',
  cancel_appt_confirm_cta: 'Yes, Cancel',
  cancel_appt_too_late: 'Cannot cancel less than {hours} hours before the appointment.',
  cancel_policy_label: 'Cancellation Policy',
  cancel_policy_value: 'Free cancellation up to {hours} hours before',
  cancel_policy_free: 'Free cancellation anytime',

  // Details labels on cards
  detail_duration: 'min',

  // Discovery screen
  discover_title: 'Discover',
  discover_subtitle: 'Find a salon, barber or clinic and book',
  discover_search_placeholder: 'Search by name or city...',
  discover_empty: 'No businesses found',
  discover_empty_query: 'Try a different search',
  discover_clear: 'Clear Search',
  discover_book: 'Book Now',

  // My Salons screen
  my_salons_title: 'My Salons',
  my_salons_subtitle: 'Enter your phone number to see your salons',
  my_salons_phone_label: 'Phone Number',
  my_salons_search_cta: 'Search',
  my_salons_empty: 'No results found',
  my_salons_empty_sub: 'You haven\'t booked with this number before',
  my_salons_discover_cta: 'Discover New Businesses',
  my_salons_results: 'Businesses you\'ve visited',

  // Invite screen
  invite_private_badge: 'Private Business',
  invite_invited: 'You\'re personally invited',
  invite_cta: 'Book Appointment',
  invite_view_business: 'View Business',
  invite_invalid_title: 'Invalid Link',
  invite_invalid_sub: 'The invite link is invalid or has expired.',

  // Private salon gate (in booking flow)
  booking_private_title: 'Private Business',
  booking_private_sub: 'This business is private. You need a personal invite link from the owner.',
  booking_private_cta: 'Back to Discover',

  // Home updated
  home_discover_cta: 'Discover',
  home_my_salons_cta: 'My Salons',
  home_direct_label: 'Direct Access',

  // Home tab (appointments-aware)
  home_upcoming_title: 'Upcoming Appointments',
  home_no_appointments_title: 'No appointments yet',
  home_no_appointments_sub: 'Discover businesses and book your first appointment',
  home_go_discover: 'Discover Businesses',
  home_phone_prompt: 'Enter your phone number to see your appointments',
  home_save_phone: 'Save',
  home_favorites_title: 'Favorites',

  // My Appointments tab
  my_appointments_title: 'My Appointments',
  my_appointments_upcoming: 'Upcoming',
  my_appointments_past: 'Past',
  my_appointments_empty: 'No appointments found',
  my_appointments_empty_sub: 'You haven\'t booked with this number yet',
  my_appointments_phone_prompt: 'Enter your phone number to see your appointments',

  // Tab bar labels
  tab_home: 'Home',
  tab_discover: 'Discover',
  tab_my_appointments: 'Bookings',
  tab_profile: 'Profile',

  // Onboarding
  onboarding_skip: 'Skip',
  onboarding_next: 'Next',
  onboarding_start: 'Get Started',
  onboarding_guest: 'Continue as Guest',
  onboarding_slide1_title: 'Discover Nearby Businesses',
  onboarding_slide1_sub: 'Salons, barbers and clinics — all in one place.',
  onboarding_slide2_title: 'Book in Seconds',
  onboarding_slide2_sub: 'Pick your service, staff and time — instant WhatsApp confirmation.',
  onboarding_slide3_title: 'Manage Your Business Anywhere',
  onboarding_slide3_sub: 'Calendar, clients, staff and analytics — all in your pocket.',

  // Auth welcome
  auth_tagline: 'The smart appointment management system',
  auth_choose: 'Choose how to continue',
  auth_as_customer: 'I\'m a Customer',
  auth_as_customer_sub: 'Book appointments, view history, discover businesses',
  auth_as_owner: 'I\'m a Business Owner',
  auth_as_owner_sub: 'Manage appointments, staff, services and clients',
  auth_as_guest: 'Continue as Guest',
  auth_as_guest_sub: 'Browse businesses without an account',

  // Customer login
  customer_login_title: 'Customer Login',
  customer_login_subtitle: 'Enter your phone number to receive a verification code',
  customer_otp_title: 'Phone Verification',
  customer_name_title: 'What\'s your name?',
  customer_name_subtitle: 'The name that will appear on your appointments',
  customer_phone_label: 'Phone Number',
  customer_send_otp: 'Send Verification Code',
  customer_sending: 'Sending...',
  customer_phone_error: 'Please enter a valid phone number',
  customer_otp_wrong: 'Wrong code. Please try again.',
  customer_login_cta: 'Log In',
  customer_skip_name: 'Skip (continue without name)',

  // Owner login / register
  owner_login_title: 'Business Owner Login',
  owner_login_subtitle: 'Manage your business — appointments, staff, clients and more',
  owner_email_label: 'Email',
  owner_password_label: 'Password',
  owner_login_cta: 'Log In',
  owner_login_error: 'Incorrect email or password',
  owner_register_link: 'Create a new business account',
  owner_register_title: 'Create Business Account',
  owner_register_subtitle: 'Fill in the details and get started in a minute',
  owner_name_label: 'Full Name',
  owner_salon_name_label: 'Business Name',
  owner_phone_label: 'Phone (optional)',
  owner_password_hint: 'Password (at least 8 characters)',
  owner_register_cta: 'Create Account',
  owner_creating: 'Creating account...',
  owner_register_error_exists: 'This email is already registered. Try logging in.',
  owner_register_error_generic: 'Could not create account. Try again.',
  owner_already_have_account: 'Already have an account? Log in',

  // Profile tab
  profile_title: 'Profile',
  profile_guest: 'Guest',
  profile_guest_browse: 'Browsing without account',
  profile_join_title: 'Join for Free',
  profile_join_sub: 'Create an account to save appointments and manage your business',
  profile_create_account: 'Create Account',
  profile_login: 'Log In',
  profile_section_business: 'Business Management',
  profile_section_activity: 'My Activity',
  profile_section_app: 'App',
  profile_section_account: 'Account',
  profile_logout: 'Log Out',
  profile_language: 'Language',
  profile_notifications: 'Notifications',
  profile_about: 'About Appointly',

  // Discover
  discover_open_now: 'Open Now',
  discover_category_all: 'All',

  // Salon Profile screen
  salon_profile_book_cta: 'Book Appointment',
  salon_profile_services_title: 'Services',
  salon_profile_staff_title: 'Our Team',
  salon_profile_hours_title: 'Opening Hours',
  salon_profile_no_services: 'No services available',
  salon_profile_no_staff: 'No team information',
  salon_profile_closed: 'Closed',

  // Day names
  day_sun: 'Sunday',
  day_mon: 'Monday',
  day_tue: 'Tuesday',
  day_wed: 'Wednesday',
  day_thu: 'Thursday',
  day_fri: 'Friday',
  day_sat: 'Saturday',

  // Appointment status labels
  status_pending: 'Pending',
  status_confirmed: 'Confirmed',
  status_completed: 'Completed',
  status_no_show: 'No Show',

  // Owner screens
  owner_calendar_title: 'Calendar',
  owner_calendar_today: 'Today',
  owner_calendar_no_appointments: 'No appointments today',
  owner_clients_title: 'Clients',
  owner_clients_empty: 'No clients yet',
  owner_services_title: 'Services',
  owner_services_empty: 'No services yet',
  owner_analytics_title: 'Analytics',
  owner_analytics_appointments: 'Appointments This Month',
  owner_analytics_revenue: 'Revenue This Month',
  owner_analytics_top_service: 'Top Service',
  owner_analytics_no_data: 'No data yet',
};
