'use client';

import { useEffect, useState } from 'react';
import { StepServices } from './steps/StepServices';
import { StepStaff } from './steps/StepStaff';
import { StepDateTime } from './steps/StepDateTime';
import { StepDetails } from './steps/StepDetails';
import { StepOTP } from './steps/StepOTP';
import { StepConfirmation } from './steps/StepConfirmation';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/use-toast';
import { Scissors } from 'lucide-react';

const CUSTOMER_STORAGE_KEY = 'appointly:customer';

type SavedCustomer = {
  name: string;
  phone: string;
  email: string;
};

// Reads previously-saved customer details from localStorage.
function loadSavedCustomer(): SavedCustomer | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedCustomer) : null;
  } catch {
    return null;
  }
}

// Persists customer details so the Details step is pre-filled on next visit.
function saveCustomer(data: SavedCustomer) {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in private browsing — fail silently
  }
}

export type BookingState = {
  salon_id: string;
  salon_name: string;
  salon_timezone: string;
  service_id: string;
  service_name: string;
  service_duration: number;
  service_price: number;
  staff_id: string | null;
  staff_name: string | null;
  start_datetime: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  verification_token: string;
  appointment_id: string;
  cancel_token: string;
};

type Step = 'services' | 'staff' | 'datetime' | 'details' | 'otp' | 'confirmation';

const STEPS: Step[] = ['services', 'staff', 'datetime', 'details', 'otp', 'confirmation'];

const STEP_LABELS: Record<Step, string> = {
  services: 'שירות',
  staff: 'צוות',
  datetime: 'מועד',
  details: 'פרטים',
  otp: 'אימות',
  confirmation: 'אישור',
};

interface BookingFlowProps {
  salonSlug: string;
  salonId: string;
  salonName: string;
  salonTimezone: string;
  logoUrl?: string | null;
  /** Client pre-fill token from ?client= query param */
  clientToken?: string | null;
}

export function BookingFlow({
  salonSlug: _salonSlug,
  salonId,
  salonName,
  salonTimezone,
  logoUrl,
  clientToken,
}: BookingFlowProps) {
  const [step, setStep] = useState<Step>('services');
  const [booking, setBooking] = useState<Partial<BookingState>>(() => {
    // Pre-fill from localStorage on first render (skips re-typing on repeat visits)
    const saved = loadSavedCustomer();
    return {
      salon_id: salonId,
      salon_name: salonName,
      salon_timezone: salonTimezone,
      customer_name: saved?.name ?? '',
      customer_phone: saved?.phone ?? '',
      customer_email: saved?.email ?? '',
    };
  });

  // Pre-fill customer details from client token (takes priority over localStorage)
  const { data: clientData } = trpc.salonClients.getByToken.useQuery(
    { client_token: clientToken! },
    { enabled: !!clientToken },
  );

  useEffect(() => {
    if (clientData) {
      setBooking((prev) => ({
        ...prev,
        customer_name: clientData.name,
        customer_phone: clientData.phone,
        customer_email: clientData.email ?? '',
      }));
    }
  }, [clientData]);

  const currentStepIndex = STEPS.indexOf(step);
  // Progress bar excludes 'confirmation'
  const visibleSteps = STEPS.filter((s) => s !== 'confirmation');

  function advance(updates: Partial<BookingState>) {
    const next = STEPS[currentStepIndex + 1];
    setBooking((prev) => ({ ...prev, ...updates }));
    if (next) setStep(next);
  }

  function back() {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev);
  }

  // Called when the server returns CONFLICT on appointment creation.
  // Clears the selected slot and sends the user back to pick a new time,
  // showing a toast so they understand why they were redirected.
  function handleSlotTaken() {
    setBooking((prev) => ({ ...prev, start_datetime: '', staff_id: null }));
    setStep('datetime');
    toast({
      title: 'המועד שבחרת כבר תפוס',
      description: 'לקוח אחר קבע את אותו התור. אנא בחר מועד אחר.',
      variant: 'destructive',
    });
  }

  // If client token is present, skip OTP when we reach that step.
  // Also persists customer details to localStorage so the form is pre-filled next time.
  function advanceFromDetails(details: Partial<BookingState>) {
    const next = clientToken ? 'confirmation' : 'otp';
    setBooking((prev) => ({ ...prev, ...details }));
    setStep(next);
    if (details.customer_name && details.customer_phone) {
      saveCustomer({
        name: details.customer_name,
        phone: details.customer_phone,
        email: details.customer_email ?? '',
      });
    }
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% -10%, rgba(124,58,237,0.10) 0%, transparent 65%)`,
      }}
    >
      {/* Salon identity bar — not sticky, just contextual branding */}
      <div className="bg-white border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={salonName} className="h-9 w-9 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shrink-0">
              <Scissors className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-base tracking-tighter text-foreground truncate">{salonName}</h1>
            <p className="text-xs text-muted">קביעת תור</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {step !== 'confirmation' && (
        <div className="bg-white border-b border-border">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex">
              {visibleSteps.map((s, i) => {
                const isDone = currentStepIndex > i;
                const isActive = s === step;
                return (
                  <div key={s} className="flex-1 relative">
                    <div
                      className={`h-0.5 w-full transition-colors duration-250 ${
                        isDone || isActive ? 'bg-brand-600' : 'bg-border'
                      }`}
                    />
                    <div className="py-2 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-250 ${
                          isDone
                            ? 'bg-brand-600 text-white'
                            : isActive
                            ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-600'
                            : 'bg-surface-floating text-muted'
                        }`}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          isActive ? 'text-brand-700' : 'text-muted'
                        }`}
                      >
                        {STEP_LABELS[s]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'services' && (
          <StepServices
            salonId={salonId}
            onSelect={(service) =>
              advance({
                service_id: service.id,
                service_name: service.name,
                service_duration: service.duration_mins,
                service_price: Number(service.price),
              })
            }
          />
        )}

        {step === 'staff' && (
          <StepStaff
            salonId={salonId}
            serviceId={booking.service_id ?? undefined}
            onSelect={(staff) =>
              advance({
                staff_id: staff?.id ?? null,
                staff_name: staff?.display_name ?? null,
              })
            }
            onBack={back}
          />
        )}

        {step === 'datetime' && booking.service_id && (
          <StepDateTime
            salonId={salonId}
            serviceId={booking.service_id}
            staffId={booking.staff_id ?? null}
            timezone={salonTimezone}
            onSelect={(slot) =>
              advance({ start_datetime: slot.start, staff_id: slot.staff_id })
            }
            onBack={back}
          />
        )}

        {step === 'details' && (
          <StepDetails
            booking={booking}
            onSubmit={(details) => advanceFromDetails(details)}
            onBack={back}
          />
        )}

        {step === 'otp' && booking.customer_phone && (
          <StepOTP
            salonId={salonId}
            phone={booking.customer_phone}
            onVerified={(token) => advance({ verification_token: token })}
            onBack={back}
          />
        )}

        {step === 'confirmation' && (
          <StepConfirmation
            booking={booking as BookingState}
            salonTimezone={salonTimezone}
            onSlotTaken={handleSlotTaken}
          />
        )}
      </div>
    </div>
  );
}
