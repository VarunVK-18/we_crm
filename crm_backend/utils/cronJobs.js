const cron = require('node-cron');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Checklist = require('../models/Checklist');
const ComplianceTask = require('../models/ComplianceTask');

// Run daily at 15:37 (3:37 PM)
cron.schedule('44 15 * * *', async () => {
  try {
    console.log('Running daily certificate, document & compliance expiry check...');
    const now = new Date();

    // 1. Certificate Expiry Checks
    const certificates = await Certificate.find({ status: { $ne: 'Completed' } }); 
    for (const cert of certificates) {
      if (!cert.expiryDate) continue;
      
      const expiry = new Date(cert.expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let notificationMessage = '';
      if (daysRemaining === 90) notificationMessage = `${cert.serviceName} expires in 90 days. Renewal upcoming.`;
      else if (daysRemaining === 30) notificationMessage = `${cert.serviceName} expires in 30 days. Renewal action is required.`;
      else if (daysRemaining === 10) notificationMessage = `${cert.serviceName} expires in 10 days.`;
      else if (daysRemaining === 7) notificationMessage = `${cert.serviceName} expires in 7 days. Critical action required.`;
      else if (daysRemaining === 1) notificationMessage = `${cert.serviceName} expires tomorrow!`;
      else if (daysRemaining === 0) notificationMessage = `${cert.serviceName} has expired today!`;
      else if (daysRemaining === -1 || daysRemaining === -5 || daysRemaining === -10 || daysRemaining === -30) {
        notificationMessage = `${cert.serviceName} is overdue for renewal by ${Math.abs(daysRemaining)} days!`;
      }

      if (notificationMessage && cert.client_id) {
        await Notification.create({
          client_id: cert.client_id,
          title: 'Certificate Renewal',
          message: notificationMessage,
          type: 'status_update'
        });
      }
    }

    // 2. Checklist Final Documents Expiry Checks
    const checklists = await Checklist.find({ "final_documents.expiry_date": { $exists: true, $ne: null } });
    for (const cl of checklists) {
      if (!cl.final_documents || cl.final_documents.length === 0) continue;
      
      for (const doc of cl.final_documents) {
        if (!doc.expiry_date) continue;
        
        const expiry = new Date(doc.expiry_date);
        const diffTime = expiry.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let docMessage = '';
        if (daysRemaining === 10) {
          docMessage = `Your document '${doc.name}' for service '${cl.service_name}' will expire in 10 days.`;
        } else if (daysRemaining === 0) {
          docMessage = `Your document '${doc.name}' for service '${cl.service_name}' expires today!`;
        } else if (daysRemaining < 0 && (daysRemaining === -1 || daysRemaining % 5 === 0)) {
          docMessage = `Your document '${doc.name}' for service '${cl.service_name}' is overdue by ${Math.abs(daysRemaining)} days!`;
        }

        if (docMessage && cl.client_id) {
          await Notification.create({
            client_id: cl.client_id,
            title: 'Document Expiry Alert',
            message: docMessage,
            type: 'status_update'
          });
        }
      }
    }

    // 3. Compliance Tasks (Upcoming Filings & Actions Required)
    const complianceTasks = await ComplianceTask.find({ status: { $ne: 'Completed' } });
    for (const task of complianceTasks) {
      if (!task.dueDate) continue;

      const expiry = new Date(task.dueDate);
      const diffTime = expiry.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let taskMessage = '';
      if (daysRemaining === 30) taskMessage = `Compliance task '${task.title}' is due in 30 days.`;
      else if (daysRemaining === 10) taskMessage = `Compliance task '${task.title}' is due in exactly 10 days.`;
      else if (daysRemaining === 7) taskMessage = `Action Required: '${task.title}' is due in 7 days!`;
      else if (daysRemaining === 1) taskMessage = `Urgent: Compliance task '${task.title}' is due tomorrow!`;
      else if (daysRemaining === 0) taskMessage = `Compliance task '${task.title}' is due TODAY!`;
      else if (daysRemaining < 0 && (daysRemaining === -1 || daysRemaining % 5 === 0)) {
        taskMessage = `Compliance task '${task.title}' is OVERDUE by ${Math.abs(daysRemaining)} days!`;
      }

      if (taskMessage && task.clientUid) {
        await Notification.create({
          client_id: task.clientUid,
          title: 'Compliance Alert',
          message: taskMessage,
          type: 'status_update'
        });

        // Optionally update the task status based on days remaining
        if (daysRemaining < 0 && task.status !== 'Overdue') {
          task.status = 'Overdue';
          task.warning_status = 'Overdue';
          await task.save();
        } else if (daysRemaining === 1 && task.status !== 'Critical') {
          task.warning_status = 'Due Tomorrow';
          await task.save();
        }
      }
    }
  } catch (err) {
    console.error('Error in cron job:', err);
  }
});
