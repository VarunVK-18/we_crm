const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged-in client
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ client_id: req.user._id })
      .populate('order_id', 'service_name company_name')
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark all notifications as read for the logged-in client
// @route   PUT /api/notifications/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { client_id: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Clear all notifications for the logged-in client
// @route   DELETE /api/notifications
// @access  Private
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ client_id: req.user._id });
    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Clear a specific notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.clearNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndDelete({ _id: id, client_id: req.user._id });
    res.status(200).json({ success: true, message: 'Notification cleared' });
  } catch (error) {
    console.error('Error clearing notification:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
