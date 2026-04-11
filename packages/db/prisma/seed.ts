import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Plans ─────────────────────────────────────────────────────────────────
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

  console.log('✅ Plans created:', freePlan.name, proPlan.name);

  // ── Owner user ─────────────────────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo-salon.co.il' },
    update: {},
    create: {
      email: 'owner@demo-salon.co.il',
      phone: '+972501234567',
      name: 'Demo Owner',
      // bcrypt hash of "password123" — replace before production
      password_hash: '$2b$10$rQJ5A.8/AqnOQhU1VYQhieBR9Xk7v2pA5O9V3vLU3ROBLXTiGpz2y',
      global_role: 'SALON_OWNER',
    },
  });

  // ── Salon ─────────────────────────────────────────────────────────────────
  const salon = await prisma.salon.upsert({
    where: { slug: 'demo-salon' },
    update: {},
    create: {
      name: 'Demo Salon',
      slug: 'demo-salon',
      description: 'The best salon in town',
      phone: '+972501234567',
      address: 'Dizengoff 100',
      city: 'Tel Aviv',
      timezone: 'Asia/Jerusalem',
      is_active: true,
      plan_id: proPlan.id,
    },
  });

  // ── SalonSettings ─────────────────────────────────────────────────────────
  await prisma.salonSettings.upsert({
    where: { salon_id: salon.id },
    update: {},
    create: {
      salon_id: salon.id,
      confirmation_mode: 'AUTO',
      cancellation_method: 'MAGIC_LINK',
      cancellation_window_hours: 24,
      booking_slot_interval_mins: 15,
    },
  });

  // ── Salon hours (Sun–Thu open, Fri short, Sat closed) ────────────────────
  const hours = [
    { day_of_week: 0, open_time: '09:00', close_time: '20:00', is_closed: false }, // Sun
    { day_of_week: 1, open_time: '09:00', close_time: '20:00', is_closed: false }, // Mon
    { day_of_week: 2, open_time: '09:00', close_time: '20:00', is_closed: false }, // Tue
    { day_of_week: 3, open_time: '09:00', close_time: '20:00', is_closed: false }, // Wed
    { day_of_week: 4, open_time: '09:00', close_time: '20:00', is_closed: false }, // Thu
    { day_of_week: 5, open_time: '09:00', close_time: '14:00', is_closed: false }, // Fri
    { day_of_week: 6, open_time: '09:00', close_time: '20:00', is_closed: true },  // Sat
  ];

  for (const h of hours) {
    await prisma.salonHours.upsert({
      where: { salon_id_day_of_week: { salon_id: salon.id, day_of_week: h.day_of_week } },
      update: {},
      create: { salon_id: salon.id, ...h },
    });
  }

  // ── SalonMember (owner) ───────────────────────────────────────────────────
  const member = await prisma.salonMember.upsert({
    where: { user_id_salon_id: { user_id: owner.id, salon_id: salon.id } },
    update: {},
    create: {
      user_id: owner.id,
      salon_id: salon.id,
      role: 'OWNER',
      is_active: true,
    },
  });

  // ── Staff ─────────────────────────────────────────────────────────────────
  const staff = await prisma.staff.upsert({
    where: { salon_member_id: member.id },
    update: {},
    create: {
      salon_member_id: member.id,
      display_name: 'Dana Cohen',
      bio: 'Senior stylist with 10 years experience',
      is_bookable: true,
    },
  });

  console.log('✅ Salon + staff created:', salon.slug, staff.display_name);

  // ── Staff schedule (Sun–Thu) ───────────────────────────────────────────────
  const workDays = [0, 1, 2, 3, 4];
  for (const day of workDays) {
    await prisma.staffSchedule.upsert({
      where: { staff_id_day_of_week: { staff_id: staff.id, day_of_week: day } },
      update: {},
      create: {
        staff_id: staff.id,
        day_of_week: day,
        start_time: '09:00',
        end_time: '18:00',
        is_working: true,
      },
    });
  }

  // ── Category ──────────────────────────────────────────────────────────────
  const category = await prisma.category.upsert({
    where: { salon_id_name: { salon_id: salon.id, name: 'Hair' } },
    update: {},
    create: {
      salon_id: salon.id,
      name: 'Hair',
      icon: '✂️',
      sort_order: 0,
    },
  });

  // ── Services ──────────────────────────────────────────────────────────────
  const services = [
    { name: 'Haircut', duration_mins: 45, price: 120 },
    { name: 'Color & Highlights', duration_mins: 120, price: 350 },
    { name: 'Blowout', duration_mins: 30, price: 80 },
  ];

  for (const [i, svc] of services.entries()) {
    const existing = await prisma.service.findFirst({
      where: { salon_id: salon.id, name: svc.name },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          salon_id: salon.id,
          category_id: category.id,
          name: svc.name,
          duration_mins: svc.duration_mins,
          price: svc.price,
          currency: 'ILS',
          is_active: true,
          sort_order: i,
        },
      });
    }
  }

  console.log('✅ Services created');
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
