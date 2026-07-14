const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Checklist = require('../models/Checklist');
const User = require('../models/User');
const ComplianceTask = require('../models/ComplianceTask');

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

    // Fetch compliance tasks
    const complianceFilter = {};
    if (userCompanyId) complianceFilter.companyId = userCompanyId;
    if (role === 'filling_staff' || role === 'account_manager') {
      complianceFilter.assigned_staff_id = req.user._id;
    } else if (role === 'client_manager') {
      complianceFilter.$or = [
        { assigned_staff_id: req.user._id },
        { clientUid: { $in: myClientIds } }
      ];
    }

    const complianceTasks = await ComplianceTask.find(complianceFilter)
      .populate('clientUid', 'custom_client_id owner_name company_name email profile_image')
      .lean();

    const clientUidsMap = new Map();
    complianceTasks.forEach(task => {
      if (task.clientUid && task.clientUid._id) {
        clientUidsMap.set(task.clientUid._id.toString(), task.clientUid);
      }
    });

    // Attach latest message and unread count
    const conversations = [];
    
    // Checklist Conversations
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
          type: 'checklist',
          checklist: cl,
          lastMessage: messages[0],
          unreadCount
        });
      }
    }

    // Compliance Conversations
    for (const [uidStr, clientObj] of clientUidsMap.entries()) {
      const complianceOrderId = 'compliance_' + uidStr;
      const messages = await Message.find({ orderId: complianceOrderId })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean();
        
      const unreadCount = await Message.countDocuments({
        orderId: complianceOrderId,
        senderRole: { $in: ['customer', 'client'] },
        seen: false
      });

      if (messages.length > 0) {
        conversations.push({
          type: 'compliance',
          checklist: {
            _id: complianceOrderId,
            service_name: "Compliance",
            client_id: clientObj
          },
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

    // Fetch checklists and compliance tasks for order IDs
    const checklists = await Checklist.find(filter).select('_id').lean();
    const checklistIds = checklists.map(c => c._id.toString());

    let complianceOrderIds = [];
    if (role === 'filling_staff' || role === 'account_manager' || role === 'client_manager' || role === 'admin' || role === 'manager') {
      const complianceFilter = {};
      if (userCompanyId) complianceFilter.companyId = userCompanyId;
      if (role === 'filling_staff' || role === 'account_manager') {
        complianceFilter.assigned_staff_id = req.user._id;
      } else if (role === 'client_manager') {
        complianceFilter.$or = [
          { assigned_staff_id: req.user._id },
          { clientUid: { $in: myClientIds } }
        ];
      }
      const complianceTasks = await ComplianceTask.find(complianceFilter).select('clientUid').lean();
      const uniqueUids = [...new Set(complianceTasks.map(t => t.clientUid ? t.clientUid.toString() : null).filter(Boolean))];
      complianceOrderIds = uniqueUids.map(uid => 'compliance_' + uid);
    }

    const allOrderIds = [...checklistIds, ...complianceOrderIds];

    const count = await Message.countDocuments({
      orderId: { $in: allOrderIds },
      senderRole: { $in: ['customer', 'client'] },
      seen: false
    });

    const mentionCount = await Message.countDocuments({
      orderId: { $in: allOrderIds },
      senderRole: { $in: ['customer', 'client'] },
      seen: false,
      mentions: { $in: [req.user.role, req.user._id.toString()] }
    });

    res.status(200).json({ success: true, count, mentionCount });
  } catch (error) {
    console.error('Error fetching unread chat count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { senderId, senderRole, content, mentions } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({ success: false, message: 'senderId and content are required' });
    }

    const newMessage = new Message({
      orderId,
      senderId,
      senderRole: senderRole || 'client',
      content,
      mentions: mentions || []
    });

    await newMessage.save();
    
    // Populate sender details before returning
    await newMessage.populate('senderId', 'owner_name role profile_image');

    // Handle notifications based on mentions
    const order = await Checklist.findById(orderId);
    if (order && mentions && mentions.length > 0) {
      let notifiedUserIds = new Set();
      const User = require('../models/User');

      for (const mention of mentions) {
        if (mention === 'customer' || mention === 'client') {
          if (order.client_id && order.client_id.toString() !== senderId.toString() && !notifiedUserIds.has(order.client_id.toString())) {
            await Notification.create({
              client_id: order.client_id,
              title: 'New Mention in Chat',
              message: `You were mentioned: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
              type: 'chat',
              order_id: orderId,
              related_data: { messageId: newMessage._id }
            });
            notifiedUserIds.add(order.client_id.toString());
          }
        } else {
          // mention is a staff role (admin, client_manager, filling_staff, etc.)
          const staffMembers = await User.find({ role: mention });
          for (const staff of staffMembers) {
            if (staff._id.toString() !== senderId.toString() && !notifiedUserIds.has(staff._id.toString())) {
              await Notification.create({
                client_id: staff._id,
                title: 'New Mention in Chat',
                message: `You were mentioned: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                type: 'chat',
                order_id: orderId,
                related_data: { messageId: newMessage._id }
              });
              notifiedUserIds.add(staff._id.toString());
            }
          }
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

