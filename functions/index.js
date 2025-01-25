const functions = require("firebase-functions");

// Primera función: Hola Mundo
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.status(200).send("¡Hola, esta es la función helloWorld!");
});
// Segunda función: Adiós Mundo
exports.goodbyeWorld = functions.https.onRequest((req, res) => {
  res.status(200).send("¡Adiós, esta es la función goodbyeWorld!");
});
