const APP_URL = process.env.APP_URL || "https://askyoursite.in";

module.exports = {
  key: "unanswered_question",
  noun: "Unanswered Question",
  display: {
    label: "Unanswered Question",
    description:
      "Triggers when your AskYourSite bot couldn't answer a visitor's question. Use this to alert your team or add new content to your bot.",
  },
  operation: {
    perform: (z, bundle) => [bundle.cleanedRequest.data],
    sample: {
      id: "sample-unans-1",
      bot_id: "sample-bot-1",
      bot_name: "My Website Bot",
      question: "Do you integrate with Salesforce?",
      conversation_id: "session-abc",
      asked_at: new Date().toISOString(),
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "bot_id", label: "Bot ID" },
      { key: "bot_name", label: "Bot Name" },
      { key: "question", label: "Question" },
      { key: "conversation_id", label: "Conversation ID" },
      { key: "asked_at", label: "Asked At", type: "datetime" },
    ],
    performSubscribe: {
      url: `${APP_URL}/api/zapier/hooks/subscribe`,
      method: "POST",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}", "Content-Type": "application/json" },
      body: { target_url: "{{bundle.targetUrl}}", trigger_event: "question.unanswered" },
    },
    performUnsubscribe: {
      url: `${APP_URL}/api/zapier/hooks/unsubscribe`,
      method: "DELETE",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}", "Content-Type": "application/json" },
      body: { target_url: "{{bundle.targetUrl}}" },
    },
    performList: {
      url: `${APP_URL}/api/zapier/triggers/unanswered`,
      method: "GET",
      headers: { Authorization: "Bearer {{bundle.authData.api_key}}" },
    },
  },
};
