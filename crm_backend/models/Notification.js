const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'document_request', 'status_update'],
    required: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    required: false
  },
  related_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

NotificationSchema.post('save', async function (doc, next) {
  try {
    // Dynamically load User and firebase utility inside the hook to avoid circular dependencies
    const User = mongoose.model('User');
    const { sendPushNotification } = require('../utils/firebase');

    // Find the user to get their FCM token
    const user = await User.findById(doc.client_id);
    
    if (user && user.fcm_token) {
      // Send the push notification using the details from the database notification
      await sendPushNotification(
        user.fcm_token,
        doc.title,
        doc.message,
        {
          notificationId: doc._id.toString(),
          type: doc.type,
          orderId: doc.order_id ? doc.order_id.toString() : ''
        }
      );
    }
    next();
  } catch (error) {
    console.error('Error in Notification post-save hook for FCM:', error);
    next();
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
