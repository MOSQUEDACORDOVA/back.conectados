const functions = require("firebase-functions");

// Function HTTP basic
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.status(200).send("¡Hola, Firebase está funcionando!");
});
