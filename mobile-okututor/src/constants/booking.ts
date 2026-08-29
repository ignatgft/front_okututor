/** Booking status constants — single source of truth matching backend enums. */

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BOOKING_STATUS_VALUES: readonly BookingStatus[] = Object.values(BOOKING_STATUS);

/** Returns true if the status string is one we recognise. */
export const isValidBookingStatus = (status: string | null | undefined): boolean =>
  !!status && (BOOKING_STATUS_VALUES as readonly string[]).includes(status);

/** Allowed transitions — backend is the authority, these guard client-side display only. */
export const BOOKING_TRANSITIONS: Partial<Record<BookingStatus, readonly BookingStatus[]>> = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
};