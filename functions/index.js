const admin = require("firebase-admin");
const {handleIncomingTwilioSms} = require("./handleIncomingTwilioSms");

admin.initializeApp();
exports.handleIncomingTwilioSms = handleIncomingTwilioSms;
