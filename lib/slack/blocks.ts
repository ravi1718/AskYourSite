// Block Kit message builders for all Slack alert types.
// Each function returns a blocks array ready to POST to a Slack webhook.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.askyoursite.in";

function formatTimestamp(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

// ─── Lead Captured ────────────────────────────────────────────────────────────

export function leadBlock(params: {
  botName: string;
  leadName: string | null;
  leadEmail: string;
  firstMessage: string;
  pageUrl: string;
  conversationId: string;
}): object[] {
  const { botName, leadName, leadEmail, firstMessage, pageUrl, conversationId } = params;
  return [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*🎯 New Lead — ${botName}*` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${leadName || "Anonymous"}` },
        { type: "mrkdwn", text: `*Email:*\n${leadEmail}` },
        { type: "mrkdwn", text: `*First asked:*\n_${firstMessage || "—"}_` },
        { type: "mrkdwn", text: `*Page:*\n${pageUrl || "—"}` },
        { type: "mrkdwn", text: `*Time:*\n${formatTimestamp()}` },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Conversation" },
          url: `${APP_URL}/dashboard/conversations/${conversationId}`,
          style: "primary",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Reply by Email" },
          url: `mailto:${leadEmail}`,
        },
      ],
    },
  ];
}

// ─── Buying Intent ────────────────────────────────────────────────────────────

export function buyingIntentBlock(params: {
  botName: string;
  visitorMessage: string;
  botResponse: string;
  pageUrl: string;
  conversationId: string;
}): object[] {
  const { botName, visitorMessage, botResponse, pageUrl, conversationId } = params;
  const truncatedResponse = botResponse.length > 200
    ? botResponse.substring(0, 200) + "…"
    : botResponse;

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*🔥 Buying Intent — ${botName}*\nA visitor is asking about pricing or plans.`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Their message:*\n_${visitorMessage}_` },
        { type: "mrkdwn", text: `*Bot replied:*\n_${truncatedResponse}_` },
        { type: "mrkdwn", text: `*Page:*\n${pageUrl || "—"}` },
        { type: "mrkdwn", text: `*Time:*\n${formatTimestamp()}` },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Live Conversation" },
          url: `${APP_URL}/dashboard/conversations/${conversationId}`,
          style: "primary",
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "💡 Jump in and reply personally — buying intent converts 3x higher with a human response.",
        },
      ],
    },
  ];
}

// ─── Unanswered Question ──────────────────────────────────────────────────────

export function unansweredBlock(params: {
  botName: string;
  botId: string;
  question: string;
  count: number;
  conversationId: string;
}): object[] {
  const { botName, botId, question, count, conversationId } = params;
  return [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*❓ Unanswered Question — ${botName}*` },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Your bot couldn't answer this:\n\n*"${question}"*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_This question has been asked ${count} time(s) today._`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Add Answer to Bot" },
          url: `${APP_URL}/dashboard/assistants/${botId}`,
          style: "primary",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "View Conversation" },
          url: `${APP_URL}/dashboard/conversations/${conversationId}`,
        },
      ],
    },
  ];
}

// ─── Test Notification ────────────────────────────────────────────────────────

export function testBlock(botName: string, enabledAlerts: string[]): object[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*✅ AskYourSite is connected!*\nYou'll receive alerts in this channel when important things happen on your website.",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Bot:*\n${botName}` },
        {
          type: "mrkdwn",
          text: `*Alerts enabled:*\n${enabledAlerts.length > 0 ? enabledAlerts.join(", ") : "None"}`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: "Sent from AskYourSite · askyoursite.in" },
      ],
    },
  ];
}
