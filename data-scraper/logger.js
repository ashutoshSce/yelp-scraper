const axios = require('axios');

module.exports = class Logger {

  sendMessageToSlack(message) {
    axios.post(process.env.SLACK_CHANNEL_WEBHOOK, {
      text: process.env.APP_NAME + ' ' + process.env.APP_ENV + ' Message: ' + message
    });
  }

}