const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Fetch all messages for the order, sorted by creation date ascending (oldest first)
    const messages = await Message.find({ orderId })
      .populate('senderId', 'owner_name role') // Populate sender name and role
      .sort({ createdAt: 1 })
      .lean();
      
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { senderId, senderRole, content } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({ success: false, message: 'senderId and content are required' });
    }

    const newMessage = new Message({
      orderId,
      senderId,
      senderRole: senderRole || 'client',
      content
    });

    await newMessage.save();
    
    // Populate sender details before returning
    await newMessage.populate('senderId', 'owner_name role');

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { viewerRole } = req.body; // e.g., 'client' or 'staff'
    
    // We want to mark as seen all messages sent by someone OTHER than the viewer
    // If client is viewing, mark staff/admin messages as seen.
    // If staff is viewing, mark client messages as seen.
    const query = { orderId, seen: false };
    if (viewerRole === 'client') {
      query.senderRole = { $in: ['staff', 'admin'] };
    } else {
      query.senderRole = 'client';
    }

    await Message.updateMany(query, { $set: { seen: true } });

    res.status(200).json({ success: true, message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
