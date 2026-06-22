const cron = require('node-cron');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily certificate expiry check...');
    const certificates = await Certificate.find({ status: { $ne: 'Completed' } }); // Adjust depending on if you want to check renewed ones
    
    const now = new Date();

    for (const cert of certificates) {
      if (!cert.expiryDate) continue;
      
      // Calculate days remaining
      const expiry = new Date(cert.expiryDate);
      const diffTime = expiry - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let notificationMessage = '';

      if (daysRemaining === 90) {
        notificationMessage = `${cert.serviceName} expires in 90 days. Renewal upcoming.`;
      } else if (daysRemaining === 30) {
        notificationMessage = `${cert.serviceName} expires in 30 days. Renewal action is required.`;
      } else if (daysRemaining === 7) {
        notificationMessage = `${cert.serviceName} expires in 7 days. Critical action required.`;
      } else if (daysRemaining === 1) {
        notificationMessage = `${cert.serviceName} expires tomorrow!`;
      } else if (daysRemaining === 0) {
        notificationMessage = `${cert.serviceName} has expired today!`;
      }

      if (notificationMessage) {
        // Create notification
        await Notification.create({
          user_id: cert.client_id,
          title: 'Certificate Renewal',
          message: notificationMessage,
          type: 'compliance',
          is_read: false
        });
      }
    }
  } catch (err) {
    console.error('Error in cron job:', err);
  }
});
