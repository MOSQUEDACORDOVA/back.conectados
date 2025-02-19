const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.sendSinglePushNotification =
functions.https.onRequest(async (req, res) => {
  // Lista de tokens hardcodeados
  // eslint-disable-next-line max-len
  const userToken = "ceo5zkruTW28tE3hLSfpE4:APA91bEm8uRgzJvJTPROZozOYbDbBAMy39YawarT86mHwdl_5BgBnKncxNuyHbEZun_miRt22fMjLl8EKU63BSBTllMubAlc9OSfKvrxHAIDhXZxEb8Cenw";

  const message = {
    notification: {
      title: "Un solo token",
      body: "Cuerpo de la notificación",
    },
    token: userToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notificaciones enviadas con éxito:", response);
    res.status(200).send("Notificaciones enviadas con éxito");
  } catch (error) {
    console.error("Error al enviar las notificaciones:", error);
    res.status(500).send("Error al enviar las notificaciones");
  }
});

exports.sendMulticastPushNotification =
functions.https.onRequest(async (req, res) => {
  // Lista de tokens a los que enviarás el mensaje
  const tokens = [
    // eslint-disable-next-line max-len
    "ceo5zkruTW28tE3hLSfpE4:APA91bEm8uRgzJvJTPROZozOYbDbBAMy39YawarT86mHwdl_5BgBnKncxNuyHbEZun_miRt22fMjLl8EKU63BSBTllMubAlc9OSfKvrxHAIDhXZxEb8Cenw",
    "token-2-aqui",
    "token-3-aqui",
  ];

  // Mensaje que se enviará a todos los tokens
  const message = {
    notification: {
      title: "¡Mensaje Multicast!",
      body: "Este es un mensaje enviado a varios dispositivos.",
    },
    tokens: tokens,
  };

  try {
    // Envía el mensaje a todos los tokens
    const response = await admin.messaging().sendEachForMulticast(message);

    // Verifica si hubo fallos
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.error("Tokens que fallaron:", failedTokens);
    }

    console.log("Notificaciones enviadas con éxito:", response.successCount);
    res.status(200).send(`Notificaciones enviadas: ${response.successCount}`);
  } catch (error) {
    console.error("Error al enviar las notificaciones:", error);
    res.status(500).send("Error al enviar las notificaciones");
  }
});
