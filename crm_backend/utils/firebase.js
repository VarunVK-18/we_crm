const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');

// Initialize Firebase Admin
try {
  // Parse the service account JSON from the environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

  initializeApp({
    credential: cert(serviceAccount)
  });
  
  console.log('Firebase Admin Initialized Successfully.');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
}

/**
 * Send a push notification using FCM
 * @param {String} token - The FCM token of the target device
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Optional data payload
 */
const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token) return;

  const message = {
    notification: {
      title,
      body
    },
    data,
    token
  };

  try {
    const response = await getMessaging().send(message);
    console.log('Successfully sent push notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

module.exports = { sendPushNotification };
