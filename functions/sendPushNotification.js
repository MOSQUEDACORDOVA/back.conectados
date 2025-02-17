const admin = require("firebase-admin");

/**
 * Sends a push notification to all users of a given company.
 *
 * @param {DocumentReference} empresaRef - A reference to the company document.
 * @param {string} message - The message to be sent in the notification.
 * @return {Promise<void>} - A promise that resolves when the notification
 * has been sent.
 * @throws {Error} - Throws an error if there is an issue sending the
 * notification.
 */
async function sendPushNotification(empresaRef, message) {
  try {
    // Obtener la empresa
    const empresaDoc = await empresaRef.get();
    if (!empresaDoc.exists) {
      console.error("La empresa no existe");
      return;
    }

    // Obtener las referencias de los usuarios
    const usuariosRefs = empresaDoc.data().usuarios;

    // Obtener los tokens de FCM de todos los usuarios
    const tokens = [];
    for (const usuarioRef of usuariosRefs) {
      const fcmTokensSnapshot = await usuarioRef.collection("fcmToken").get();
      fcmTokensSnapshot.forEach((doc) => {
        tokens.push(doc.data().fcm_token);
      });
    }

    if (tokens.length === 0) {
      console.log("No hay tokens de FCM para enviar la notificación");
      return;
    }

    // Enviar la notificación a todos los tokens
    const payload = {
      notification: {
        title: "Nuevo mensaje",
        body: message,
      },
    };

    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log("Notificación enviada:", response);
  } catch (error) {
    console.error("Error al enviar la notificación push:", error);
  }
}

module.exports = {sendPushNotification};
