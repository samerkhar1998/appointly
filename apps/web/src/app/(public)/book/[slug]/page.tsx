import { notFound } from 'next/navigation';
import { BookingFlow } from '@/features/booking/BookingFlow';
import { Toaster } from '@/components/ui/toaster';
import { db } from '@appointly/db';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const salon = await db.salon.findUnique({ where: { slug: params.slug, is_active: true } });
  return {
    title: salon ? `קביעת תור — ${salon.name}` : 'קביעת תור',
  };
}

export default async function BookingPage({ params }: Props) {
  const salon = await db.salon.findUnique({
    where: { slug: params.slug, is_active: true },
    select: {
      id: true,
      name: true,
      timezone: true,
      logo_url: true,
    },
  });

  if (!salon) notFound();

  return (
    <>
      <BookingFlow
        salonSlug={params.slug}
        salonId={salon.id}
        salonName={salon.name}
        salonTimezone={salon.timezone}
        logoUrl={salon.logo_url}
      />
      <Toaster />
    </>
  );
}
