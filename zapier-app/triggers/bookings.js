const APP_URL = process.env.APP_URL || "https://askyoursite.in";

module.exports = {
  key: "booking_confirmed",
  noun: "Booking",
  display: {
    label: "Booking Confirmed",
    description:
      "Triggers when a visitor books a meeting via the Calendly integration in your AskYourSite chatbot.",
  },
  operation: {
    perform: (z, bundle) => {
      if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
        return [bundle.cleanedRequest.data];
      }
      return z.request({ url: `${APP_URL}/api/zapier/triggers/bookings`, headers: { Authorization: `Bearer ${bundle.authData.api_key}` } }).then(r => r.data);
    },
    sample: {
      id: "sample-book-1",
      bot_id: "sample-bot-1",
      bot_name: "My Website Bot",
      invitee_name: "Alice Johnson",
      invitee_email: "alice@company.com",
      meeting_title: "30-min Product Demo",
      meeting_time: new Date().toISOString(),
      calendly_event_url: "https://calendly.com/events/sample",
      booked_at: new Date().toISOString(),
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "bot_id", label: "Bot ID" },
      { key: "bot_name", label: "Bot Name" },
      { key: "invitee_name", label: "Invitee Name" },
      { key: "invitee_email", label: "Invitee Email" },
      { key: "meeting_title", label: "Meeting Title" },
      { key: "meeting_time", label: "Meeting Time", type: "datetime" },
      { key: "calendly_event_url", label: "Calendly Event URL" },
      { key: "booked_at", label: "Booked At", type: "datetime" },
    ],
    performSubscribe: {
      url: `${APP_URL}/api/zapier/hooks/subscribe`,
      method: "POST",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}", "Content-Type": "application/json" },
      body: { target_url: "{{bundle.targetUrl}}", trigger_event: "booking.confirmed" },
    },
    performUnsubscribe: {
      url: `${APP_URL}/api/zapier/hooks/unsubscribe`,
      method: "DELETE",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}", "Content-Type": "application/json" },
      body: { target_url: "{{bundle.targetUrl}}" },
    },
    performList: {
      url: `${APP_URL}/api/zapier/triggers/bookings`,
      method: "GET",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}" },
    },
  },
};
