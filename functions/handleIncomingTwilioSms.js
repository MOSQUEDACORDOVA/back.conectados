/* eslint-disable max-len */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const {sendPushNotification} = require("./sendPushNotification");

exports.handleIncomingTwilioSms = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Extraer los datos del SMS de Twilio
      const {Body, From, To} = req.body;

      // Verificar si el número "To" está registrado en la colección "channels"
      const channelsRef = admin.firestore().collection("channels");
      const channelSnapshot = await channelsRef.where(
          "identificador", "==", To).get();

      if (channelSnapshot.empty) {
        // Si el número "To" no está registrado, responder con un error
        res.status(400).send(
            "El número "+To+" no está registrado en la colección 'channels'");
        return;
      }

      // Obtener la referencia de la empresa desde el documento del channel
      const channelDoc = channelSnapshot.docs[0];
      const empresaRef = channelDoc.data().empresa;

      // Verificar si el número "From" está registrado en la colección "contactos"
      const contactosRef = admin.firestore().collection("contactos");
      const contactSnapshot = await contactosRef.where(
          "identificador", "==", From).get();

      let contactoRef;
      if (contactSnapshot.empty) {
        // Si no está registrado, crear un nuevo contacto
        const newContact = {
          identificador: From,
          plataforma: "3",
          empresa: empresaRef,
        };
        const contactDocRef = await contactosRef.add(newContact);
        contactoRef = contactDocRef;
      } else {
        contactoRef = contactSnapshot.docs[0].ref;
      }

      // Gestionar los chats
      const chatsRef = admin.firestore().collection("chats");
      const chatSnapshot = await chatsRef.where(
          "contacto", "==", contactoRef).get();

      let chatDocRef;
      if (chatSnapshot.empty) {
        // Si no existe un chat con el mismo contacto, crear un nuevo chat
        const newChat = {
          channel: channelDoc.ref,
          contacto: contactoRef,
          empresa: empresaRef,
          estado_registro: 1,
          last_update: admin.firestore.FieldValue.serverTimestamp(),
          unread_messages: 1,
        };
        const newChatDocRef = await chatsRef.add(newChat);
        chatDocRef = newChatDocRef;
      } else {
        // Si existe un chat con el mismo contacto, actualizar los campos
        const chatDoc = chatSnapshot.docs[0];
        await chatDoc.ref.update({
          last_update: admin.firestore.FieldValue.serverTimestamp(),
          unread_messages: admin.firestore.FieldValue.increment(1),
        });
        chatDocRef = chatDoc.ref;
      }

      // Crear un nuevo objeto de datos para la subcolección "mensajes"
      const messageData = {
        contenido: Body,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        remitente: 2,
      };

      // Insertar los datos en la subcolección "mensajes" del chat correspondiente
      await chatDocRef.collection("mensajes").add(messageData);

      // Enviar notificación push a todos los usuarios de la empresa
      try {
        await sendPushNotification(empresaRef, Body);
      } catch (error) {
        console.error("Error al enviar la notificación push:", error);
        res.status(500).send("Error al enviar la notificación push");
        return;
      }

      // Responder a Twilio que todo está bien
      res.status(200).send("<Response></Response>");
    } catch (error) {
      console.error("Error al procesar el SMS:", error);
      res.status(500).send("Error al procesar el mensaje");
    }
  });
});
