const APP_URL = process.env.APP_URL || "https://askyoursite.in";

module.exports = {
  key: "send_message",
  noun: "Bot Response",
  display: {
    label: "Send Message to Bot",
    description:
      "Sends a message to an AskYourSite bot and returns its AI-generated response. Useful for automating Q&A, form responses, or content generation.",
  },
  operation: {
    inputFields: [
      {
        key: "bot_id",
        label: "Bot",
        required: true,
        type: "string",
        helpText: "The ID of the AskYourSite bot to message.",
      },
      {
        key: "message",
        label: "Message",
        required: true,
        type: "text",
        helpText: "The message to send to the bot.",
      },
      {
        key: "session_id",
        label: "Session ID",
        required: false,
        type: "string",
        helpText:
          "Optional session ID for conversation continuity. Leave blank to start a new session.",
      },
    ],
    perform: {
      url: `${APP_URL}/api/zapier/actions/send-message`,
      method: "POST",
      headers: {
        Authorization: "Bearer {{bundle.authData.api_key}}",
        "Content-Type": "application/json",
      },
      body: {
        bot_id: "{{bundle.inputData.bot_id}}",
        message: "{{bundle.inputData.message}}",
        session_id: "{{bundle.inputData.session_id}}",
      },
    },
    sample: {
      response: "Our refund policy allows returns within 30 days of purchase.",
      session_id: "session-abc123",
    },
  },
};
