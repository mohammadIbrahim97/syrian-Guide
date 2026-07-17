-- Index the per-user unpaid-booking lookup. The checkout route counts a user's
-- PENDING bookings on every request to enforce the cap that stops one account
-- from locking the marketplace's inventory for free.
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");
