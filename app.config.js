const config = require('./app.json');
require('dotenv').config();

module.exports = {
  ...config,
  expo: {
    ...config.expo,
    extra: {
      ...(config.expo?.extra || {}),
      plantnetApiKey: process.env.PLANTNET_API_KEY,
    },
  },
};
