import { PrismaClient, ConfirmationMode, CancellationMethod } from '../src/generated/client/index.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

// Hashes a password with scrypt (same algorithm used by the auth router).
// Returns "salt_hex:hash_hex".
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type HourRow = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

type StaffDef = {
  name: string;
  bio: string;
  email: string;
  phone: string;
  work_days: number[];
  start_time: string;
  end_time: string;
};

type ServiceDef = {
  name: string;
  duration_mins: number;
  price: number;
};

type CategoryDef = {
  name: string;
  icon: string;
  services: ServiceDef[];
};

type BusinessDef = {
  owner_email: string;
  owner_phone: string;
  owner_name: string;
  salon_name: string;
  slug: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  plan_id: string;
  confirmation_mode: ConfirmationMode;
  cancellation_method: CancellationMethod;
  cancellation_window_hours: number;
  booking_slot_interval_mins: number;
  hours: HourRow[];
  categories: CategoryDef[];
  staff: StaffDef[];
};

// ── Business factory ───────────────────────────────────────────────────────────

// Creates or updates all records for a single business:
// owner User, Salon, SalonSettings, SalonHours, staff Users/Members/Staff/Schedules,
// Categories, and Services.  Fully idempotent — safe to run multiple times.
async function createBusiness(def: BusinessDef): Promise<void> {
  // 1. Owner user
  const owner = await prisma.user.upsert({
    where: { email: def.owner_email },
    update: {},
    create: {
      email: def.owner_email,
      phone: def.owner_phone,
      name: def.owner_name,
      password_hash: await hashPassword('password123'),
      global_role: 'SALON_OWNER',
    },
  });

  // 2. Salon
  const salon = await prisma.salon.upsert({
    where: { slug: def.slug },
    update: {},
    create: {
      name: def.salon_name,
      slug: def.slug,
      description: def.description,
      phone: def.phone,
      address: def.address,
      city: def.city,
      timezone: 'Asia/Jerusalem',
      is_active: true,
      is_public: true,
      plan_id: def.plan_id,
    },
  });

  // 3. Settings
  await prisma.salonSettings.upsert({
    where: { salon_id: salon.id },
    update: {},
    create: {
      salon_id: salon.id,
      confirmation_mode: def.confirmation_mode,
      cancellation_method: def.cancellation_method,
      cancellation_window_hours: def.cancellation_window_hours,
      booking_slot_interval_mins: def.booking_slot_interval_mins,
    },
  });

  // 4. Hours
  for (const h of def.hours) {
    await prisma.salonHours.upsert({
      where: { salon_id_day_of_week: { salon_id: salon.id, day_of_week: h.day_of_week } },
      update: {},
      create: { salon_id: salon.id, ...h },
    });
  }

  // 5. Owner as first salon member + staff
  const ownerMember = await prisma.salonMember.upsert({
    where: { user_id_salon_id: { user_id: owner.id, salon_id: salon.id } },
    update: {},
    create: { user_id: owner.id, salon_id: salon.id, role: 'OWNER', is_active: true },
  });

  await prisma.staff.upsert({
    where: { salon_member_id: ownerMember.id },
    update: {},
    create: {
      salon_member_id: ownerMember.id,
      display_name: def.owner_name,
      bio: def.staff[0]?.bio ?? null,
      is_bookable: true,
    },
  });

  // Schedule for the owner-staff (uses first staff def's schedule)
  if (def.staff[0]) {
    const ownerStaff = await prisma.staff.findUniqueOrThrow({ where: { salon_member_id: ownerMember.id } });
    for (const day of def.staff[0].work_days) {
      await prisma.staffSchedule.upsert({
        where: { staff_id_day_of_week: { staff_id: ownerStaff.id, day_of_week: day } },
        update: {},
        create: {
          staff_id: ownerStaff.id,
          day_of_week: day,
          start_time: def.staff[0].start_time,
          end_time: def.staff[0].end_time,
          is_working: true,
        },
      });
    }
  }

  // 6. Additional staff members (index 1+)
  for (const staffDef of def.staff.slice(1)) {
    const staffUser = await prisma.user.upsert({
      where: { email: staffDef.email },
      update: {},
      create: {
        email: staffDef.email,
        phone: staffDef.phone,
        name: staffDef.name,
        password_hash: await hashPassword('password123'),
        global_role: 'SALON_OWNER',
      },
    });

    const staffMember = await prisma.salonMember.upsert({
      where: { user_id_salon_id: { user_id: staffUser.id, salon_id: salon.id } },
      update: {},
      create: { user_id: staffUser.id, salon_id: salon.id, role: 'STAFF', is_active: true },
    });

    const staffRecord = await prisma.staff.upsert({
      where: { salon_member_id: staffMember.id },
      update: {},
      create: {
        salon_member_id: staffMember.id,
        display_name: staffDef.name,
        bio: staffDef.bio,
        is_bookable: true,
      },
    });

    for (const day of staffDef.work_days) {
      await prisma.staffSchedule.upsert({
        where: { staff_id_day_of_week: { staff_id: staffRecord.id, day_of_week: day } },
        update: {},
        create: {
          staff_id: staffRecord.id,
          day_of_week: day,
          start_time: staffDef.start_time,
          end_time: staffDef.end_time,
          is_working: true,
        },
      });
    }
  }

  // 7. Categories and services
  for (const [catIdx, catDef] of def.categories.entries()) {
    const category = await prisma.category.upsert({
      where: { salon_id_name: { salon_id: salon.id, name: catDef.name } },
      update: {},
      create: {
        salon_id: salon.id,
        name: catDef.name,
        icon: catDef.icon,
        sort_order: catIdx,
      },
    });

    for (const [svcIdx, svcDef] of catDef.services.entries()) {
      const existing = await prisma.service.findFirst({
        where: { salon_id: salon.id, name: svcDef.name },
      });
      if (!existing) {
        await prisma.service.create({
          data: {
            salon_id: salon.id,
            category_id: category.id,
            name: svcDef.name,
            duration_mins: svcDef.duration_mins,
            price: svcDef.price,
            currency: 'ILS',
            is_active: true,
            sort_order: svcIdx,
          },
        });
      }
    }
  }

  console.log(`  ✅ ${def.salon_name} (${def.slug}) — ${def.staff.length} staff`);
}

// ── Standard hour templates ────────────────────────────────────────────────────

// Sun–Thu 09:00–20:00, Fri 09:00–14:00, Sat closed.
const israeliStandardHours: HourRow[] = [
  { day_of_week: 0, open_time: '09:00', close_time: '20:00', is_closed: false },
  { day_of_week: 1, open_time: '09:00', close_time: '20:00', is_closed: false },
  { day_of_week: 2, open_time: '09:00', close_time: '20:00', is_closed: false },
  { day_of_week: 3, open_time: '09:00', close_time: '20:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00', close_time: '20:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00', close_time: '14:00', is_closed: false },
  { day_of_week: 6, open_time: '09:00', close_time: '20:00', is_closed: true  },
];

// Sun–Thu 10:00–21:00, Fri 09:00–15:00, Sat closed.
const eveningHours: HourRow[] = [
  { day_of_week: 0, open_time: '10:00', close_time: '21:00', is_closed: false },
  { day_of_week: 1, open_time: '10:00', close_time: '21:00', is_closed: false },
  { day_of_week: 2, open_time: '10:00', close_time: '21:00', is_closed: false },
  { day_of_week: 3, open_time: '10:00', close_time: '21:00', is_closed: false },
  { day_of_week: 4, open_time: '10:00', close_time: '21:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00', close_time: '15:00', is_closed: false },
  { day_of_week: 6, open_time: '09:00', close_time: '20:00', is_closed: true  },
];

// Mon–Thu open, Fri short, Sun + Sat closed.
const weekdayOnlyHours: HourRow[] = [
  { day_of_week: 0, open_time: '09:00', close_time: '20:00', is_closed: true  },
  { day_of_week: 1, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 2, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 3, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00', close_time: '19:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00', close_time: '13:00', is_closed: false },
  { day_of_week: 6, open_time: '09:00', close_time: '20:00', is_closed: true  },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // ── Plans ──────────────────────────────────────────────────────────────────
  const freePlan = await prisma.plan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      display_name: 'Free',
      price_monthly: 0,
      price_yearly: 0,
      max_staff: 1,
      max_services: 5,
      max_monthly_bookings: 50,
      allow_products: false,
      allow_promos: false,
      allow_analytics: false,
      allow_multi_staff: false,
      allow_custom_wa: false,
      allow_api_access: false,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: {
      name: 'PRO',
      display_name: 'Pro',
      price_monthly: 149,
      price_yearly: 1490,
      max_staff: 10,
      max_services: 50,
      max_monthly_bookings: 500,
      allow_products: true,
      allow_promos: true,
      allow_analytics: true,
      allow_multi_staff: true,
      allow_custom_wa: true,
      allow_api_access: false,
    },
  });

  console.log('✅ Plans:', freePlan.name, proPlan.name);
  console.log('🏪 Creating businesses...');

  // ── 1. Demo Salon — Hair, Tel Aviv ─────────────────────────────────────────
  await createBusiness({
    owner_email: 'owner@demo-salon.co.il',
    owner_phone: '+972501234567',
    owner_name: 'דנה כהן',
    salon_name: 'סלון דמו',
    slug: 'demo-salon',
    description: 'סלון שיער מוביל בתל אביב עם שנות ניסיון בעיצוב שיער',
    phone: '+972501234567',
    address: 'דיזנגוף 100',
    city: 'תל אביב',
    plan_id: proPlan.id,
    confirmation_mode: 'AUTO',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 24,
    booking_slot_interval_mins: 15,
    hours: israeliStandardHours,
    staff: [
      {
        name: 'דנה כהן',
        bio: 'ספרית ראשית עם 10 שנות ניסיון בצביעה ועיצוב שיער',
        email: 'owner@demo-salon.co.il',
        phone: '+972501234567',
        work_days: [0, 1, 2, 3, 4],
        start_time: '09:00',
        end_time: '18:00',
      },
      {
        name: 'יעל לוי',
        bio: 'מומחית לטיפולי שיער ופן',
        email: 'yael@demo-salon.co.il',
        phone: '+972521234568',
        work_days: [0, 1, 2, 3, 4, 5],
        start_time: '10:00',
        end_time: '19:00',
      },
    ],
    categories: [
      {
        name: 'שיער',
        icon: '✂️',
        services: [
          { name: 'תספורת', duration_mins: 45, price: 120 },
          { name: 'צבע והיילייטס', duration_mins: 120, price: 350 },
          { name: 'פן ועיצוב', duration_mins: 30, price: 80 },
          { name: 'קרטין', duration_mins: 150, price: 500 },
        ],
      },
    ],
  });

  // ── 2. Kafri Barber — Barbershop, Tel Aviv ─────────────────────────────────
  await createBusiness({
    owner_email: 'owner@kafri-barber.co.il',
    owner_phone: '+972502345678',
    owner_name: 'אבי מזרחי',
    salon_name: 'ספר כפרי',
    slug: 'kafri-barber',
    description: 'ספריית גברים קלאסית — תספורת, זקן וטיפוח גברי ברמה הגבוהה ביותר',
    phone: '+972502345678',
    address: 'בן יהודה 55',
    city: 'תל אביב',
    plan_id: proPlan.id,
    confirmation_mode: 'AUTO',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 4,
    booking_slot_interval_mins: 30,
    hours: israeliStandardHours,
    staff: [
      {
        name: 'אבי מזרחי',
        bio: 'ספר ותיק עם התמחות בגזירות קלאסיות ועיצוב זקן',
        email: 'owner@kafri-barber.co.il',
        phone: '+972502345678',
        work_days: [0, 1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '19:00',
      },
      {
        name: 'עומר פרץ',
        bio: 'מומחה לעיצוב זקן ותספורות מודרניות',
        email: 'omer@kafri-barber.co.il',
        phone: '+972532345679',
        work_days: [0, 1, 2, 3, 4],
        start_time: '10:00',
        end_time: '20:00',
      },
    ],
    categories: [
      {
        name: 'תספורת',
        icon: '💈',
        services: [
          { name: 'תספורת גברים', duration_mins: 30, price: 80 },
          { name: 'עיצוב זקן', duration_mins: 20, price: 50 },
          { name: 'תספורת + זקן', duration_mins: 45, price: 110 },
          { name: 'גילוח קלאסי בסכין', duration_mins: 30, price: 70 },
        ],
      },
    ],
  });

  // ── 3. Nails Studio — Nail & Beauty, Jerusalem ─────────────────────────────
  await createBusiness({
    owner_email: 'owner@nails-studio-jlm.co.il',
    owner_phone: '+972503456789',
    owner_name: 'שירה כץ',
    salon_name: 'סטודיו ציפורניים ירושלים',
    slug: 'nails-studio-jlm',
    description: 'סטודיו ציפורניים מקצועי — מניקור, פדיקור ועיצוב ג\'ל בירושלים',
    phone: '+972503456789',
    address: 'יפו 42',
    city: 'ירושלים',
    plan_id: freePlan.id,
    confirmation_mode: 'MANUAL',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 24,
    booking_slot_interval_mins: 15,
    hours: weekdayOnlyHours,
    staff: [
      {
        name: 'שירה כץ',
        bio: 'טכנאית ציפורניים מוסמכת עם 7 שנות ניסיון',
        email: 'owner@nails-studio-jlm.co.il',
        phone: '+972503456789',
        work_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
      },
    ],
    categories: [
      {
        name: 'ידיים',
        icon: '💅',
        services: [
          { name: 'מניקור קלאסי', duration_mins: 45, price: 90 },
          { name: 'ג\'ל ידיים', duration_mins: 60, price: 150 },
          { name: 'עיצוב + ציור', duration_mins: 90, price: 200 },
        ],
      },
      {
        name: 'רגליים',
        icon: '🦶',
        services: [
          { name: 'פדיקור קלאסי', duration_mins: 60, price: 120 },
          { name: 'ג\'ל רגליים', duration_mins: 75, price: 170 },
        ],
      },
    ],
  });

  // ── 4. BeautyLab Haifa — Full Beauty, Haifa ────────────────────────────────
  await createBusiness({
    owner_email: 'owner@beauty-lab-haifa.co.il',
    owner_phone: '+972504567890',
    owner_name: 'נועה בן-דוד',
    salon_name: 'BeautyLab חיפה',
    slug: 'beauty-lab-haifa',
    description: 'מרכז יופי מלא בחיפה — שיער, ציפורניים ועיצוב גבות תחת קורת גג אחת',
    phone: '+972504567890',
    address: 'הנמל 12',
    city: 'חיפה',
    plan_id: proPlan.id,
    confirmation_mode: 'AUTO',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 48,
    booking_slot_interval_mins: 15,
    hours: eveningHours,
    staff: [
      {
        name: 'נועה בן-דוד',
        bio: 'מנהלת הסלון ומומחית לטיפולי שיער',
        email: 'owner@beauty-lab-haifa.co.il',
        phone: '+972504567890',
        work_days: [0, 1, 2, 3, 4],
        start_time: '10:00',
        end_time: '20:00',
      },
      {
        name: 'טל גולדשטיין',
        bio: 'טכנאית ציפורניים ומעצבת גבות',
        email: 'tal@beauty-lab-haifa.co.il',
        phone: '+972524567891',
        work_days: [0, 1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
      },
      {
        name: 'מורן שפירו',
        bio: 'ספרית מנוסה המתמחה בצבעים ועיצוב יצירתי',
        email: 'moran@beauty-lab-haifa.co.il',
        phone: '+972534567892',
        work_days: [1, 2, 3, 4, 5],
        start_time: '11:00',
        end_time: '21:00',
      },
    ],
    categories: [
      {
        name: 'שיער',
        icon: '✂️',
        services: [
          { name: 'תספורת נשים', duration_mins: 60, price: 150 },
          { name: 'צבע שורשים', duration_mins: 90, price: 250 },
          { name: 'פן מקצועי', duration_mins: 45, price: 100 },
          { name: 'הארות מלאות', duration_mins: 150, price: 450 },
        ],
      },
      {
        name: 'גבות ועיצוב פנים',
        icon: '👁️',
        services: [
          { name: 'עיצוב גבות', duration_mins: 30, price: 70 },
          { name: 'הסרת שיער בשעווה', duration_mins: 45, price: 90 },
        ],
      },
    ],
  });

  // ── 5. Studio Cut Ra'anana — Hair Studio ───────────────────────────────────
  await createBusiness({
    owner_email: 'owner@studio-cut-ra.co.il',
    owner_phone: '+972505678901',
    owner_name: 'איתי כהן',
    salon_name: 'סטודיו קאט',
    slug: 'studio-cut-ra',
    description: 'סלון שיער בוטיק ברעננה עם דגש על חווית לקוח אישית',
    phone: '+972505678901',
    address: 'אחד העם 23',
    city: 'רעננה',
    plan_id: freePlan.id,
    confirmation_mode: 'AUTO',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 12,
    booking_slot_interval_mins: 30,
    hours: israeliStandardHours,
    staff: [
      {
        name: 'איתי כהן',
        bio: 'ספר ראשי, בוגר אקדמיית ויدال ססון לונדון',
        email: 'owner@studio-cut-ra.co.il',
        phone: '+972505678901',
        work_days: [0, 1, 2, 3, 4],
        start_time: '09:00',
        end_time: '18:00',
      },
      {
        name: 'הילה סבן',
        bio: 'מעצבת שיער עם התמחות בתכנים ובעיצוב כלות',
        email: 'hila@studio-cut-ra.co.il',
        phone: '+972545678902',
        work_days: [0, 1, 3, 4, 5],
        start_time: '10:00',
        end_time: '19:00',
      },
    ],
    categories: [
      {
        name: 'שיער',
        icon: '✂️',
        services: [
          { name: 'תספורת + פן', duration_mins: 60, price: 160 },
          { name: 'צבע מלא', duration_mins: 120, price: 320 },
          { name: 'עיצוב לאירוע', duration_mins: 90, price: 280 },
          { name: 'תספורת ילדים', duration_mins: 30, price: 70 },
        ],
      },
    ],
  });

  // ── 6. Central Barber Herzliya — Barbershop ────────────────────────────────
  await createBusiness({
    owner_email: 'owner@central-barber-herzliya.co.il',
    owner_phone: '+972506789012',
    owner_name: 'רוני אזולאי',
    salon_name: 'ספריית המרכז',
    slug: 'central-barber-herzliya',
    description: 'ספריית גברים פרימיום בהרצליה — אווירת ספריה קלאסית עם שירות מעולה',
    phone: '+972506789012',
    address: 'סוקולוב 88',
    city: 'הרצליה',
    plan_id: proPlan.id,
    confirmation_mode: 'AUTO',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 2,
    booking_slot_interval_mins: 30,
    hours: israeliStandardHours,
    staff: [
      {
        name: 'רוני אזולאי',
        bio: 'ספר ראשי, מומחה לגזירות פייד ועיצוב זקן מורכב',
        email: 'owner@central-barber-herzliya.co.il',
        phone: '+972506789012',
        work_days: [0, 1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '19:00',
      },
      {
        name: 'לירון דיין',
        bio: 'מתמחה בתספורות ספורטיביות ועיצוב עכשווי',
        email: 'liron@central-barber-herzliya.co.il',
        phone: '+972526789013',
        work_days: [0, 1, 2, 3, 4],
        start_time: '10:00',
        end_time: '20:00',
      },
      {
        name: 'גל וייס',
        bio: 'ספר עם התמחות בתספורות ילדים ונוער',
        email: 'gal@central-barber-herzliya.co.il',
        phone: '+972536789014',
        work_days: [1, 2, 3, 4, 5],
        start_time: '11:00',
        end_time: '20:00',
      },
    ],
    categories: [
      {
        name: 'תספורת',
        icon: '💈',
        services: [
          { name: 'תספורת גברים', duration_mins: 30, price: 90 },
          { name: 'פייד קלאסי', duration_mins: 45, price: 110 },
          { name: 'עיצוב זקן', duration_mins: 25, price: 60 },
          { name: 'חבילה מלאה', duration_mins: 60, price: 160 },
          { name: 'תספורת ילדים', duration_mins: 20, price: 55 },
        ],
      },
    ],
  });

  // ── 7. Glow Skin Clinic — Skincare, Tel Aviv ───────────────────────────────
  await createBusiness({
    owner_email: 'owner@glow-skin-tlv.co.il',
    owner_phone: '+972507890123',
    owner_name: 'מאיה שלמה',
    salon_name: 'Glow Skin קליניקה',
    slug: 'glow-skin-tlv',
    description: 'קליניקת עור מקצועית בתל אביב — טיפולי פנים, ניקוי עמוק ועיצוב גבות',
    phone: '+972507890123',
    address: 'רוטשילד 80',
    city: 'תל אביב',
    plan_id: proPlan.id,
    confirmation_mode: 'MANUAL',
    cancellation_method: 'MAGIC_LINK',
    cancellation_window_hours: 48,
    booking_slot_interval_mins: 15,
    hours: weekdayOnlyHours,
    staff: [
      {
        name: 'מאיה שלמה',
        bio: 'קוסמטיקאית קלינית מוסמכת עם 12 שנות ניסיון',
        email: 'owner@glow-skin-tlv.co.il',
        phone: '+972507890123',
        work_days: [1, 2, 3, 4],
        start_time: '09:00',
        end_time: '18:00',
      },
      {
        name: 'ריקי בר',
        bio: 'מומחית לטיפולי פנים ולייזר',
        email: 'riki@glow-skin-tlv.co.il',
        phone: '+972547890124',
        work_days: [1, 2, 3, 4, 5],
        start_time: '10:00',
        end_time: '19:00',
      },
    ],
    categories: [
      {
        name: 'טיפולי פנים',
        icon: '✨',
        services: [
          { name: 'ניקוי עמוק', duration_mins: 60, price: 280 },
          { name: 'טיפול אנטי-אייג\'ינג', duration_mins: 75, price: 380 },
          { name: 'מיקרודרמה', duration_mins: 45, price: 220 },
          { name: 'פילינג כימי', duration_mins: 60, price: 320 },
        ],
      },
      {
        name: 'עיצוב גבות',
        icon: '👁️',
        services: [
          { name: 'עיצוב + צביעה', duration_mins: 45, price: 120 },
          { name: 'מיקרובליידינג ייעוץ', duration_mins: 30, price: 0 },
        ],
      },
    ],
  });

  console.log('\n🎉 Seed complete! 7 businesses created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
