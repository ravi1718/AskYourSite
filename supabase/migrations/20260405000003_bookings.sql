-- Confirmed Calendly bookings.
-- Populated by the Calendly webhook (invitee.created event).
-- Used by Zapier bookings trigger and the booking.confirmed event.

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  invitee_name TEXT,
  invitee_email TEXT NOT NULL,
  meeting_title TEXT,
  meeting_time TIMESTAMPTZ,
  calendly_event_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_assistant ON bookings(assistant_id, created_at DESC);

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid());
