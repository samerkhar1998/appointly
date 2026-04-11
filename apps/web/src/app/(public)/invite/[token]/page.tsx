import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, CalendarPlus, Lock } from 'lucide-react';
import { db } from '@appointly/db';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

interface Props {
  params: { token: string };
}

// Resolves the invite token to a salon, returning null if invalid or expired.
async function resolveInvite(token: string) {
  const invite = await db.salonInvite.findUnique({
    where: { token },
    include: {
      salon: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          city: true,
          logo_url: true,
          cover_url: true,
          is_active: true,
        },
      },
    },
  });

  if (!invite) return null;
  if (invite.expires_at && invite.expires_at < new Date()) return null;
  if (!invite.salon.is_active) return null;

  return invite;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invite = await resolveInvite(params.token);
  return {
    title: invite ? `הזמנה — ${invite.salon.name}` : 'הזמנה לא תקפה',
  };
}

// Invite landing page — shown when a client follows a private-salon invite link.
// Validates the token server-side; on success shows salon info + "Book Now" CTA.
export default async function InvitePage({ params }: Props) {
  const invite = await resolveInvite(params.token);

  if (!invite) notFound();

  const { salon, token } = invite;
  const bookingUrl = `/book/${salon.slug}?invite=${token}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-elevated overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Cover */}
          <div className="relative h-36 bg-gradient-to-br from-brand-50 to-brand-100">
            {salon.cover_url ? (
              <Image
                src={salon.cover_url}
                alt={salon.name}
                fill
                className="object-cover"
                sizes="384px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-brand-200 select-none">
                  {salon.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* Private badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium">
              <Lock className="h-3 w-3" />
              עסק פרטי — הוזמנת אישית
            </div>

            {/* Logo + name */}
            <div className="flex items-center gap-3">
              {salon.logo_url ? (
                <div className="relative w-12 h-12 rounded-xl border border-border overflow-hidden shrink-0 bg-white">
                  <Image
                    src={salon.logo_url}
                    alt={`לוגו ${salon.name}`}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-brand-600">{salon.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="font-bold text-foreground tracking-tight text-lg leading-tight">
                  {salon.name}
                </h1>
                {salon.city && (
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {salon.city}
                  </p>
                )}
              </div>
            </div>

            {salon.description && (
              <p className="text-sm text-muted leading-relaxed">{salon.description}</p>
            )}

            <Link href={bookingUrl} className="block">
              <Button className="w-full gap-2 h-11">
                <CalendarPlus className="h-4 w-4" />
                קבע תור
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          הוזמנת על ידי בית העסק לגשת לדף הזמנה זה
        </p>
      </div>
    </div>
  );
}
