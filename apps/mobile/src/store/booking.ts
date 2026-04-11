import { create } from 'zustand';

export type BookingState = {
  // Salon
  salon_id: string;
  salon_name: string;
  salon_timezone: string;
  salon_slug: string;

  // Service
  service_id: string;
  service_name: string;
  service_duration: number;
  service_price: number;

  // Staff
  staff_id: string | null;
  staff_name: string | null;

  // Slot
  start_datetime: string;

  // Customer
  customer_name: string;
  customer_phone: string;
  customer_email: string;

  // Verification
  verification_token: string;

  // Result
  appointment_id: string;
  cancel_token: string;
};

type BookingStore = {
  booking: Partial<BookingState>;
  setBooking: (updates: Partial<BookingState>) => void;
  resetBooking: (salonDefaults: Pick<BookingState, 'salon_id' | 'salon_name' | 'salon_timezone' | 'salon_slug'>) => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  booking: {},

  setBooking: (updates) =>
    set((state) => ({
      booking: { ...state.booking, ...updates },
    })),

  resetBooking: (salonDefaults) =>
    set({ booking: salonDefaults }),
}));
