const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Checklist = require('../models/Checklist');

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

    // Handle notifications
    const order = await Checklist.findById(orderId);
    if (order) {
      const isClientSender = (order.client_id && order.client_id.toString() === senderId.toString()) || senderRole === 'customer' || senderRole === 'client';

      if (isClientSender) {
        // Sent by client, notify assigned filing staff
        if (order.assigned_to && order.assigned_to.toString() !== senderId.toString()) {
          await Notification.create({
            client_id: order.assigned_to,
            title: 'New Message from Client',
            message: `Client sent a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: 'chat',
            order_id: orderId,
            related_data: { messageId: newMessage._id }
          });
        }
        
        // Notify client manager
        if (order.created_by && order.assigned_to?.toString() !== order.created_by.toString() && order.created_by.toString() !== senderId.toString()) {
          await Notification.create({
            client_id: order.created_by,
            title: 'New Message from Client',
            message: `Client sent a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: 'chat',
            order_id: orderId,
            related_data: { messageId: newMessage._id }
          });
        }
      } else {
        // Sent by staff/admin, notify client
        if (order.client_id && order.client_id.toString() !== senderId.toString()) {
          await Notification.create({
            client_id: order.client_id,
            title: 'New Message from Expert',
            message: `Your expert sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: 'chat',
            order_id: orderId,
            related_data: { messageId: newMessage._id }
          });
        }
      }
    }

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
    // If client/director is viewing, mark staff/admin messages as seen.
    // If staff/admin is viewing, mark client/director messages as seen.
    const query = { orderId, seen: false };
    
    const isClientSide = viewerRole === 'client' || (viewerRole && viewerRole.startsWith('director_'));
    
    if (isClientSide) {
      query.senderRole = { $nin: ['client', new RegExp('^director_')] };
    } else {
      query.$or = [
        { senderRole: 'client' },
        { senderRole: { $regex: /^director_/ } }
      ];
    }

    await Message.updateMany(query, { $set: { seen: true } });

    res.status(200).json({ success: true, message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
