'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

interface SalonCardProps {
  slug: string;
  name: string;
  description?: string | null;
  city?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  // Optional: pre-fill booking with client token
  clientToken?: string;
  // Optional: grant private-salon access via invite token
  inviteToken?: string;
}

// Generates the booking URL, optionally appending client or invite tokens.
// slug: salon URL slug
// clientToken: pre-fills client details and skips OTP
// inviteToken: grants access to a private salon
function buildBookingUrl(slug: string, clientToken?: string, inviteToken?: string): string {
  const params = new URLSearchParams();
  if (clientToken) params.set('client', clientToken);
  if (inviteToken) params.set('invite', inviteToken);
  const qs = params.toString();
  return `/book/${slug}${qs ? `?${qs}` : ''}`;
}

// Renders a salon discovery card with cover image, logo, name, city, and a booking CTA.
// Used on the discovery homepage and the "My Salons" page.
export function SalonCard({
  slug,
  name,
  description,
  city,
  logo_url,
  cover_url,
  clientToken,
  inviteToken,
}: SalonCardProps) {
  const t = useTranslations('discovery');
  const locale = useLocale();
  const ArrowIcon = locale === 'en' ? ArrowRight : ArrowLeft;
  const bookingUrl = buildBookingUrl(slug, clientToken, inviteToken);

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden flex flex-col group hover:shadow-elevated transition-shadow duration-200">
      {/* Cover image */}
      <div className="relative h-36 bg-gradient-to-br from-brand-50 to-brand-100 shrink-0">
        {cover_url ? (
          <Image
            src={cover_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-brand-200/50 flex items-center justify-center">
              <span className="text-2xl font-bold text-brand-600 select-none">
                {name.charAt(0)}
              </span>
            </div>
          </div>
        )}

        {/* Logo badge */}
        {logo_url && (
          <div className="absolute bottom-0 translate-y-1/2 start-4 w-12 h-12 rounded-xl border-2 border-white shadow-card overflow-hidden bg-white">
            <Image
              src={logo_url}
              alt={`לוגו ${name}`}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 flex flex-col flex-1 ${logo_url ? 'pt-8' : ''}`}>
        <h3 className="font-bold text-foreground tracking-tight leading-snug">{name}</h3>

        {city && (
          <p className="text-xs text-muted mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {city}
          </p>
        )}

        {description && (
          <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2 flex-1">
            {description}
          </p>
        )}

        <Link href={bookingUrl} className="mt-4 block">
          <Button
            size="sm"
            className="w-full gap-1.5 group-hover:gap-2.5 transition-[gap] duration-200"
          >
            {t('book_cta')}
            <ArrowIcon className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
