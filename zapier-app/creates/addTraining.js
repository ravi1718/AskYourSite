const APP_URL = process.env.APP_URL || "https://askyoursite.in";

module.exports = {
  key: "add_training",
  noun: "Training Content",
  display: {
    label: "Add Training Content to Bot",
    description:
      "Adds text content to a bot's knowledge base. Use this to automatically train your bot when new blog posts, help articles, or product updates are published.",
  },
  operation: {
    inputFields: [
      {
        key: "bot_id",
        label: "Bot",
        required: true,
        type: "string",
        helpText: "The ID of the AskYourSite bot to train.",
      },
      {
        key: "content",
        label: "Content",
        required: true,
        type: "text",
        helpText: "The text content to add to the bot's knowledge base.",
      },
      {
        key: "source_label",
        label: "Source Label",
        required: false,
        type: "string",
        helpText: 'A label for this content (e.g. "Blog post: How to use our product").',
      },
      {
        key: "replace_existing",
        label: "Replace Existing",
        required: false,
        type: "boolean",
        default: "false",
        helpText: "If true, replaces any previously added content with the same source label.",
      },
    ],
    perform: {
      url: `${APP_URL}/api/zapier/actions/add-training`,
      method: "POST",
      headers: {
        Authorization: "Bearer {{bundle.authData.api_key}}",
        "Content-Type": "application/json",
      },
      body: {
        bot_id: "{{bundle.inputData.bot_id}}",
        content: "{{bundle.inputData.content}}",
        source_label: "{{bundle.inputData.source_label}}",
        replace_existing: "{{bundle.inputData.replace_existing}}",
      },
    },
    sample: {
      success: true,
      chunks_added: 4,
      bot_id: "sample-bot-1",
    },
  },
};
