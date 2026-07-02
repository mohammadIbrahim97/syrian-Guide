-- Bookings created before slot consumption existed (slotId IS NULL) never
-- claimed a slot. Mark any free slot on a date such a booking occupies as
-- booked, so the guide's time cannot be sold twice.
UPDATE "AvailabilitySlot" s
SET "isBooked" = true
WHERE s."isBooked" = false
  AND EXISTS (
    SELECT 1
    FROM "Booking" b
    WHERE b."guideId" = s."guideId"
      AND b."slotId" IS NULL
      AND b."date"::date = s."date"
      AND b."status" IN ('PENDING', 'CONFIRMED')
  );
