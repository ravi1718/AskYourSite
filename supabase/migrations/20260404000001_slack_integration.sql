-- slack_alert_log: rate-limit + dedup table for Slack notifications
-- Used to ensure max 1 alert per event type per session (lead/buying intent)
-- and max 1 alert per unique question per day (unanswered dedup via question_hash)

create table if not exists public.slack_alert_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  assistant_id   uuid not null references public.assistants(id) on delete cascade,
  session_id     text not null,
  alert_type     text not null check (alert_type in ('lead_captured', 'buying_intent', 'unanswered')),
  question_hash  text,          -- sha256 hex of normalized question (unanswered only)
  sent_at        timestamptz not null default now()
);

-- Fast lookup: did we already send this alert type for this session?
create index if not exists idx_slack_alert_log_session_type
  on public.slack_alert_log(session_id, alert_type);

-- Fast lookup: did we already send this unanswered alert today?
create index if not exists idx_slack_alert_log_user_type_hash
  on public.slack_alert_log(user_id, alert_type, question_hash, sent_at);

-- RLS: only service role reads/writes (admin client only, no direct user access)
alter table public.slack_alert_log enable row level security;

-- No user-facing policies — all access via service role key (admin client)
