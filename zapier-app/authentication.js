const APP_URL = process.env.APP_URL || "https://app.askyoursite.in";

const authentication = {
  type: "custom",
  test: {
    url: `${APP_URL}/api/zapier/auth/test`,
    method: "GET",
    headers: { Authorization: "Bearer {{bundle.authData.api_key}}" },
  },
  fields: [
    {
      key: "api_key",
      label: "API Key",
      required: true,
      type: "password",
      helpText:
        "Find your API key in the AskYourSite dashboard under Settings → API Keys. It starts with `ask_live_`.",
    },
  ],
  connectionLabel: "{{bundle.inputData.email}}",
};

module.exports = authentication;
