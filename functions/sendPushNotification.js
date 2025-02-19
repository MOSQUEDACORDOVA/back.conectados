const admin = require("firebase-admin");

/**
 * Sends a push notification to all users of a given company.
 *
 * @param {FirebaseFirestore.DocumentReference} empresaRef
 * - The reference to the company document.
 * @param {string} message - The message to be sent in the push notification.
 * @param {string} senderName - The name of the person who sent the message.
 * @throws Will throw an error if the company does not exist or if there
 * is an issue sending the notification.
 */
async function sendPushNotification(empresaRef, message, senderName) {
  try {
    // Obtener el documento de la empresa
    const empresaDoc = await empresaRef.get();
    if (!empresaDoc.exists) {
      throw new Error("La empresa no existe");
    }

    // Obtener las referencias de los usuarios de la empresa
    const usuariosRefs = empresaDoc.data().usuarios;

    // Iterar sobre cada usuario y obtener sus tokens FCM
    for (const usuarioRef of usuariosRefs) {
      const usuarioDoc = await usuarioRef.get();
      if (!usuarioDoc.exists) {
        console.warn(`El usuario ${usuarioRef.id} no existe`);
        continue;
      }

      // Obtener la subcolección de tokens FCM del usuario
      const fcmTokensSnapshot = await usuarioRef.collection("fcm_tokens").get();
      if (fcmTokensSnapshot.empty) {
        console.warn(`El usuario ${usuarioRef.id} no tiene tokens FCM`);
        continue;
      }

      // Enviar una notificación push a cada token
      const tokens = fcmTokensSnapshot.docs.map((doc) => doc.data().fcm_token);
      const payload = {
        notification: {
          title: `${senderName}`,
          body: message,
        },
        tokens: tokens,
      };

      await admin.messaging().sendEachForMulticast(payload);
    }
  } catch (error) {
    console.error("Error al enviar la notificación push:", error);
    throw error;
  }
}

module.exports = {sendPushNotification};
