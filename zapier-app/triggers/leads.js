const APP_URL = process.env.APP_URL || "https://app.askyoursite.in";

module.exports = {
  key: "new_lead",
  noun: "Lead",
  display: {
    label: "New Lead Captured",
    description:
      "Triggers when a visitor submits their contact information (name/email) in your AskYourSite chatbot.",
  },
  operation: {
    // Called when Zapier receives an incoming webhook payload
    perform: (z, bundle) => [bundle.cleanedRequest.data],
    // Sample data for Zap setup
    sample: {
      id: "sample-lead-1",
      bot_id: "sample-bot-1",
      bot_name: "My Website Bot",
      lead_name: "Jane Doe",
      lead_email: "jane@company.com",
      lead_phone: null,
      session_id: "session-abc",
      captured_at: new Date().toISOString(),
    },
    outputFields: [
      { key: "id", label: "Lead ID" },
      { key: "bot_id", label: "Bot ID" },
      { key: "bot_name", label: "Bot Name" },
      { key: "lead_name", label: "Lead Name" },
      { key: "lead_email", label: "Lead Email" },
      { key: "lead_phone", label: "Lead Phone" },
      { key: "session_id", label: "Session ID" },
      { key: "captured_at", label: "Captured At", type: "datetime" },
    ],
    // REST hook — Zapier notifies us immediately (preferred over polling)
    performSubscribe: {
      url: `${APP_URL}/api/zapier/hooks/subscribe`,
      method: "POST",
      headers: {
        Authorization: "Bearer {{bundle.authData.api_key}}",
        "Content-Type": "application/json",
      },
      body: { target_url: "{{bundle.targetUrl}}", trigger_event: "lead.captured" },
    },
    performUnsubscribe: {
      url: `${APP_URL}/api/zapier/hooks/unsubscribe`,
      method: "DELETE",
      headers: {
        Authorization: "Bearer {{bundle.authData.api_key}}",
        "Content-Type": "application/json",
      },
      body: { target_url: "{{bundle.targetUrl}}" },
    },
    performList: {
      url: `${APP_URL}/api/zapier/triggers/leads`,
      method: "GET",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}" },
    },
  },
};
