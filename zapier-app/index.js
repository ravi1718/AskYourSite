const { version } = require("zapier-platform-core");
const authentication = require("./authentication");

const leads = require("./triggers/leads");
const conversations = require("./triggers/conversations");
const unanswered = require("./triggers/unanswered");
const bookings = require("./triggers/bookings");

const addTraining = require("./creates/addTraining");
const sendMessage = require("./creates/sendMessage");

const App = {
  version: require("./package.json").version,
  platformVersion: version,

  authentication,

  beforeRequest: [
    (request, z, bundle) => {
      // API key is already set in each trigger/create definition via headers.
      // This hook is here as an extension point for future middleware.
      return request;
    },
  ],

  afterResponse: [],

  resources: {},

  triggers: {
    [leads.key]: leads,
    [conversations.key]: conversations,
    [unanswered.key]: unanswered,
    [bookings.key]: bookings,
  },

  creates: {
    [addTraining.key]: addTraining,
    [sendMessage.key]: sendMessage,
  },

  searches: {},
};

module.exports = App;
