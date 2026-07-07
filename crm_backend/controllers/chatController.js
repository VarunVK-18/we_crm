const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Checklist = require('../models/Checklist');
const User = require('../models/User');

exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Fetch all messages for the order, sorted by creation date ascending (oldest first)
    const messages = await Message.find({ orderId })
      .populate('senderId', 'owner_name role profile_image') // Populate sender name and role and image
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

exports.getConversations = async (req, res) => {
  try {
    const userCompanyId = req.user.company_id;
    const filter = {};
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    const role = req.user.role;
    if (role === 'filling_staff' || role === 'account_manager') {
      filter.assigned_to = req.user._id;
    } else if (role === 'client_manager') {
      const myClients = await User.find({
        role: 'customer',
        $or: [
          { assigned_to: req.user._id },
          { created_by: req.user._id, assigned_to: null }
        ]
      }).select('_id');
      const myClientIds = myClients.map(c => c._id);
      filter.$or = [
        { assigned_to: req.user._id },
        { client_id: { $in: myClientIds } }
      ];
    }

    // Fetch checklists
    const checklists = await Checklist.find(filter)
      .populate('client_id', 'custom_client_id owner_name company_name email profile_image')
      .populate('assigned_to', 'owner_name email role profile_image')
      .populate('created_by', 'owner_name email role profile_image')
      .lean();

    // Attach latest message and unread count
    const conversations = [];
    for (const cl of checklists) {
      const messages = await Message.find({ orderId: cl._id.toString() })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean();
        
      const unreadCount = await Message.countDocuments({
        orderId: cl._id.toString(),
        senderRole: { $in: ['customer', 'client'] },
        seen: false
      });

      if (messages.length > 0) {
        conversations.push({
          checklist: cl,
          lastMessage: messages[0],
          unreadCount
        });
      }
    }

    // Sort by latest message date
    conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userCompanyId = req.user.company_id;
    const filter = {};
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    const role = req.user.role;
    if (role === 'filling_staff' || role === 'account_manager') {
      filter.assigned_to = req.user._id;
    } else if (role === 'client_manager') {
      const myClients = await User.find({
        role: 'customer',
        $or: [
          { assigned_to: req.user._id },
          { created_by: req.user._id, assigned_to: null }
        ]
      }).select('_id');
      const myClientIds = myClients.map(c => c._id);
      filter.$or = [
        { assigned_to: req.user._id },
        { client_id: { $in: myClientIds } }
      ];
    }

    // Fetch checklists
    const checklists = await Checklist.find(filter).select('_id').lean();
    const checklistIds = checklists.map(c => c._id.toString());

    const count = await Message.countDocuments({
      orderId: { $in: checklistIds },
      senderRole: { $in: ['customer', 'client'] },
      seen: false
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread chat count:', error);
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
    await newMessage.populate('senderId', 'owner_name role profile_image');

    // Handle notifications
    const order = await Checklist.findById(orderId);
    if (order) {
      const isClientSender = (order.client_id && order.client_id.toString() === senderId.toString()) || senderRole === 'customer' || senderRole === 'client';

      if (isClientSender) {
        let notifiedUserIds = new Set();

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
          notifiedUserIds.add(order.assigned_to.toString());
        }
        
        // Notify client manager (creator)
        if (order.created_by && order.created_by.toString() !== senderId.toString() && !notifiedUserIds.has(order.created_by.toString())) {
          await Notification.create({
            client_id: order.created_by,
            title: 'New Message from Client',
            message: `Client sent a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: 'chat',
            order_id: orderId,
            related_data: { messageId: newMessage._id }
          });
          notifiedUserIds.add(order.created_by.toString());
        }

        // Also notify all admins and client managers
        const User = require('../models/User');
        const managers = await User.find({ role: { $in: ['admin', 'client_manager'] } });
        for (const mgr of managers) {
          if (mgr._id.toString() !== senderId.toString() && !notifiedUserIds.has(mgr._id.toString())) {
            await Notification.create({
              client_id: mgr._id,
              title: 'New Message from Client',
              message: `Client sent a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
              type: 'chat',
              order_id: orderId,
              related_data: { messageId: newMessage._id }
            });
            notifiedUserIds.add(mgr._id.toString());
          }
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

