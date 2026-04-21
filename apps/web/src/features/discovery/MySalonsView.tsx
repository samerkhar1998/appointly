'use client';

import { useState } from 'react';
import { Phone, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SalonCard } from './SalonCard';

// Client view for the "My Salons" page.
// The user enters their phone number and we fetch all active salons
// they have a non-removed SalonClient record with.
export function MySalonsView() {
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  const { data, isLoading, isError } = trpc.salonClients.getByPhone.useQuery(
    { phone: submittedPhone },
    { enabled: !!submittedPhone },
  );

  // Normalise and submit the phone number on form submission.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalised = phone.trim();
    if (normalised.length >= 7) {
      setSubmittedPhone(normalised);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="max-w-sm mx-auto text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
            <Building2 className="h-6 w-6 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">
            העסקים שלי
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            הכנס את מספר הטלפון שלך כדי לראות את כל בתי העסק שהשתמשת בהם
          </p>
        </div>

        {/* Phone lookup form */}
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex gap-2 mb-10">
          <div className="relative flex-1">
            <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+972501234567"
              className="ps-9 h-11"
              autoComplete="tel"
            />
          </div>
          <Button
            type="submit"
            disabled={phone.trim().length < 7 || isLoading}
            className="h-11 shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'חפש'}
          </Button>
        </form>

        {/* Results */}
        {submittedPhone && (
          <>
            {isError && (
              <p className="text-center text-sm text-muted">
                שגיאה בטעינת הנתונים. אנא נסה שוב.
              </p>
            )}

            {data && data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="font-medium text-foreground">לא נמצאו עסקים</p>
                <p className="text-sm text-muted mt-1">
                  לא מצאנו עסקים המשויכים למספר {submittedPhone}
                </p>
                <Link href="/" className="mt-4">
                  <Button variant="outline" size="sm">
                    גלה עסקים חדשים
                  </Button>
                </Link>
              </div>
            )}

            {data && data.length > 0 && (
              <div>
                <p className="text-sm text-muted mb-4 text-center">
                  נמצאו {data.length} עסקים עבור {submittedPhone}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.map((item) => (
                    <SalonCard
                      key={item.client_token}
                      slug={item.salon.slug}
                      name={item.salon.name}
                      city={item.salon.city}
                      logo_url={item.salon.logo_url}
                      clientToken={item.client_token}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
