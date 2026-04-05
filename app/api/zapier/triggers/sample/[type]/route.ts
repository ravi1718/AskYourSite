import { NextRequest, NextResponse } from "next/server";

const NOW = new Date().toISOString();

// Hardcoded sample data per trigger type.
// Zapier calls this during Zap setup to show example fields — no auth required.
const SAMPLES: Record<string, object[]> = {
  leads: [
    { id: "sample-lead-1", bot_id: "sample-bot-1", bot_name: "My Website Bot", lead_name: "Jane Doe", lead_email: "jane@company.com", lead_phone: null, session_id: "session-abc", captured_at: NOW },
    { id: "sample-lead-2", bot_id: "sample-bot-1", bot_name: "My Website Bot", lead_name: "John Smith", lead_email: "john@startup.io", lead_phone: "+1-555-0100", session_id: "session-def", captured_at: NOW },
    { id: "sample-lead-3", bot_id: "sample-bot-1", bot_name: "My Website Bot", lead_name: null, lead_email: "anon@example.com", lead_phone: null, session_id: "session-ghi", captured_at: NOW },
  ],
  conversations: [
    { id: "sample-conv-1", bot_id: "sample-bot-1", bot_name: "My Website Bot", first_message: "What are your pricing plans?", session_id: "session-abc", started_at: NOW },
    { id: "sample-conv-2", bot_id: "sample-bot-1", bot_name: "My Website Bot", first_message: "Do you offer a free trial?", session_id: "session-def", started_at: NOW },
    { id: "sample-conv-3", bot_id: "sample-bot-1", bot_name: "My Website Bot", first_message: "How do I integrate with Shopify?", session_id: "session-ghi", started_at: NOW },
  ],
  unanswered: [
    { id: "sample-unans-1", bot_id: "sample-bot-1", bot_name: "My Website Bot", question: "Do you integrate with Salesforce?", conversation_id: "session-abc", asked_at: NOW },
    { id: "sample-unans-2", bot_id: "sample-bot-1", bot_name: "My Website Bot", question: "What is your SLA for enterprise customers?", conversation_id: "session-def", asked_at: NOW },
    { id: "sample-unans-3", bot_id: "sample-bot-1", bot_name: "My Website Bot", question: "Can I export my data as CSV?", conversation_id: "session-ghi", asked_at: NOW },
  ],
  bookings: [
    { id: "sample-book-1", bot_id: "sample-bot-1", bot_name: "My Website Bot", invitee_name: "Alice Johnson", invitee_email: "alice@company.com", meeting_title: "30-min Product Demo", meeting_time: NOW, calendly_event_url: "https://calendly.com/events/sample", booked_at: NOW },
    { id: "sample-book-2", bot_id: "sample-bot-1", bot_name: "My Website Bot", invitee_name: "Bob Williams", invitee_email: "bob@startup.io", meeting_title: "15-min Intro Call", meeting_time: NOW, calendly_event_url: "https://calendly.com/events/sample2", booked_at: NOW },
    { id: "sample-book-3", bot_id: "sample-bot-1", bot_name: "My Website Bot", invitee_name: "Carol Davis", invitee_email: "carol@enterprise.com", meeting_title: "Enterprise Discovery", meeting_time: NOW, calendly_event_url: "https://calendly.com/events/sample3", booked_at: NOW },
  ],
};

// GET /api/zapier/triggers/sample/[type] — no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const samples = SAMPLES[type];
  if (!samples) {
    return NextResponse.json({ error: "Unknown trigger type" }, { status: 404 });
  }
  return NextResponse.json(samples);
}
