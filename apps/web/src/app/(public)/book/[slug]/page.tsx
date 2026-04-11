import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { BookingFlow } from '@/features/booking/BookingFlow';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { db } from '@appointly/db';

interface Props {
  params: { slug: string };
  searchParams: { client?: string; invite?: string };
}

export async function generateMetadata({ params }: Props) {
  const salon = await db.salon.findUnique({ where: { slug: params.slug, is_active: true } });
  return {
    title: salon ? `קביעת תור — ${salon.name}` : 'קביעת תור',
  };
}

// Validates an invite token against the given salon.
// Returns true if the token is valid and grants access.
async function isValidInviteToken(salonId: string, token: string): Promise<boolean> {
  const invite = await db.salonInvite.findUnique({ where: { token } });
  if (!invite) return false;
  if (invite.salon_id !== salonId) return false;
  if (invite.expires_at && invite.expires_at < new Date()) return false;
  return true;
}

export default async function BookingPage({ params, searchParams }: Props) {
  const salon = await db.salon.findUnique({
    where: { slug: params.slug, is_active: true },
    select: {
      id: true,
      name: true,
      timezone: true,
      logo_url: true,
      is_public: true,
    },
  });

  if (!salon) notFound();

  // For private salons, require either a valid client token or a valid invite token.
  if (!salon.is_public) {
    const hasClientToken = !!searchParams.client;
    const hasValidInvite = searchParams.invite
      ? await isValidInviteToken(salon.id, searchParams.invite)
      : false;

    if (!hasClientToken && !hasValidInvite) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mx-auto">
              <Lock className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-foreground">
                {salon.name}
              </h1>
              <p className="text-muted text-sm mt-2 leading-relaxed">
                עסק זה הוא פרטי. כדי לקבוע תור תצטרך קישור הזמנה אישי מבעל העסק.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                חזרה לחיפוש עסקים
              </Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <BookingFlow
        salonSlug={params.slug}
        salonId={salon.id}
        salonName={salon.name}
        salonTimezone={salon.timezone}
        logoUrl={salon.logo_url}
        clientToken={searchParams.client ?? null}
      />
      <Toaster />
    </>
  );
}
