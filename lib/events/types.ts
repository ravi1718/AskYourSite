export type AysEvent = {
  "lead.captured": {
    userId: string;
    botId: string;
    botName: string;
    lead: { name: string | null; email: string; phone: string | null };
    sessionId: string;
    pageUrl: string;
    firstMessage?: string;
    timestamp: string;
  };
  "conversation.started": {
    userId: string;
    botId: string;
    botName: string;
    firstMessage: string;
    sessionId: string;
    pageUrl: string;
    visitorCountry?: string;
    timestamp: string;
  };
  "question.unanswered": {
    userId: string;
    botId: string;
    botName: string;
    question: string;
    questionHash: string;
    sessionId: string;
    timestamp: string;
  };
  "booking.confirmed": {
    userId: string;
    botId: string;
    botName: string;
    meetingTime: string;
    meetingTitle: string;
    inviteeName: string;
    inviteeEmail: string;
    calendlyEventUrl: string;
    sessionId: string;
    timestamp: string;
  };
  "intent.detected": {
    userId: string;
    botId: string;
    botName: string;
    intentType: "buying" | "booking";
    visitorMessage: string;
    botResponse?: string;
    sessionId: string;
    pageUrl?: string;
    timestamp: string;
  };
};

export type EventName = keyof AysEvent;
