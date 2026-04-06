const APP_URL = process.env.APP_URL || "https://askyoursite.in";

module.exports = {
  key: "new_conversation",
  noun: "Conversation",
  display: {
    label: "New Conversation Started",
    description: "Triggers when a visitor sends their first message to your AskYourSite chatbot.",
  },
  operation: {
    perform: (z, bundle) => {
      if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
        return [bundle.cleanedRequest.data];
      }
      return z.request({ url: `${APP_URL}/api/zapier/triggers/conversations`, headers: { Authorization: `Bearer ${bundle.authData.api_key}` } }).then(r => r.data);
    },
    sample: {
      id: "sample-conv-1",
      bot_id: "sample-bot-1",
      bot_name: "My Website Bot",
      first_message: "What are your pricing plans?",
      session_id: "session-abc",
      started_at: new Date().toISOString(),
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "bot_id", label: "Bot ID" },
      { key: "bot_name", label: "Bot Name" },
      { key: "first_message", label: "First Message" },
      { key: "session_id", label: "Session ID" },
      { key: "started_at", label: "Started At", type: "datetime" },
    ],
    performSubscribe: {
      url: `${APP_URL}/api/zapier/hooks/subscribe`,
      method: "POST",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}", "Content-Type": "application/json" },
      body: { target_url: "{{bundle.targetUrl}}", trigger_event: "conversation.started" },
    },
    performUnsubscribe: {
      url: `${APP_URL}/api/zapier/hooks/unsubscribe`,
      method: "DELETE",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}", "Content-Type": "application/json" },
      body: { target_url: "{{bundle.targetUrl}}" },
    },
    performList: {
      url: `${APP_URL}/api/zapier/triggers/conversations`,
      method: "GET",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}" },
    },
  },
};
