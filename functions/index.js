const admin = require("firebase-admin");
const twilio = require("twilio");
const functions = require("firebase-functions");

admin.initializeApp();

const {handleIncomingTwilioSms} = require("./handleIncomingTwilioSms");
exports.handleIncomingTwilioSms = handleIncomingTwilioSms;

const {sendSinglePushNotification,
  sendMulticastPushNotification} = require("./sendPushNotificationsTest");
exports.sendSinglePushNotification = sendSinglePushNotification;
exports.sendMulticastPushNotification = sendMulticastPushNotification;


/**
 * Sends an SMS message using Twilio.
 *
 * @param {string} body - The body of the SMS message.
 * @param {string} to - The phone number to send the SMS to.
 * @param {string} sid - The Twilio SID.
 * @param {string} authToken - The Twilio Auth Token.
 * @param {string} identificador - The Twilio Auth Token.
 * @return {Promise<string>} - A promise that resolves to the SID of
 * the sent message.
 * @throws {Error} - Throws an error if the message could not be sent.
 */
async function sendTwilioSms(body, to, sid, authToken, identificador) {
  if (!sid.startsWith("AC")) {
    throw new Error("Invalid Twilio SID: must start with 'AC'");
  }
  const client = twilio(sid, authToken);
  try {
    const message = await client.messages.create({
      body: body || "Este es un mensaje de prueba desde la App",
      from: identificador,
      to: to,
    });
    return message.sid;
  } catch (error) {
    await logError(`Error sendTwilioSms: ${error.message}`);
    throw error;
  }
}

/**
 * Logs an error message to the Firestore 'logs' collection.
 *
 * @param {string} description - The description of the log.
 */
async function logError(description) {
  const logEntry = {
    description: description,
    date: admin.firestore.FieldValue.serverTimestamp(),
  };
  try {
    await admin.firestore().collection("logs").add(logEntry);
  } catch (error) {
    console.error(`Failed to log error: ${error}`);
  }
}

/**
 * Handles actions based on the value of "plataforma".
 *
 * @param {string} plataforma - The value of the "plataforma" field.
 * @param {object} identificador - The identificador of the channel.
 * @param {object} data - The data required for the specific platform.
 * @param {object} contenido - The contenido required for the specific platform.
 * @param {object} destinatario - The destinatario required.
 *
 */
async function handlePlataforma(
    plataforma, identificador, data, contenido, destinatario) {
  switch (plataforma) {
    case "1":
      console.log("Plataforma is 1");
      // Use WhatsApp data
      console.log(`WhatsApp Access Token: ${data.whatsappAccessToken}`);
      break;
    case "2":
      console.log("Plataforma is 2");
      break;
    case "3":
      await sendTwilioSms(
          contenido, destinatario,
          data.twilioSid, data.twilioAuthToken, identificador);
      break;
    default:
      console.log("Unknown plataforma value");
  }
}

/**
 * Trigger that sends an SMS when a new message is added to the
 * 'mensajes' subcollection of the 'chats' collection.
 */
exports.sendOnNewMessage = functions.firestore
    .document("chats/{chatId}/mensajes/{mensajeId}")
    .onCreate(async (snap, context) => {
      try {
        const chatId = context.params.chatId;
        const mensajeId = context.params.mensajeId;

        const chatDoc = await admin.firestore().collection(
            "chats").doc(chatId).get();

        const channelRef = chatDoc.data().channel;
        const contactoRef = chatDoc.data().contacto;
        const channelDoc = await channelRef.get();
        const contactoDoc = await contactoRef.get();
        const mensajeDoc = await admin.firestore().collection(
            `chats/${chatId}/mensajes`).doc(mensajeId).get();

        const destinatario = contactoDoc.data().identificador;
        const contenido = mensajeDoc.data().contenido;
        const plataforma = channelDoc.data().plataforma;
        const identificador = channelDoc.data().identificador;
        const data = {
          twilioAuthToken: channelDoc.data().twilio_auth_token,
          twilioSid: channelDoc.data().twilio_sid,
          whatsappAccessToken: channelDoc.data().whatsapp_acces_token,
        };

        await handlePlataforma(
            plataforma, identificador, data, contenido, destinatario);
      } catch (error) {
        await logError(`Error sendOnNewMessage SMS: ${error.message}`);
      }
    });

