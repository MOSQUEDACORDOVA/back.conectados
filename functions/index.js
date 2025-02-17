const functions = require("firebase-functions");

// Primera función: Hola Mundo
exports.handleIncomingSms = functions.https.onRequest((req, res) => {
  res.status(200).send("¡Hola, esta es la función Twilio!");
});
// Segunda función: Adiós Mundo
exports.goodbyeWorld = functions.https.onRequest((req, res) => {
  res.status(200).send("¡Adiós, esta es la función goodbyeWorld!");
});
