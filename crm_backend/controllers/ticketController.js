const Ticket = require('../models/Ticket');

// Create a new support ticket
exports.createTicket = async (req, res) => {
  try {
    const { userId, userName, userEmail, subject, description, category, priority } = req.body;
    
    if (!userId || !userName || !userEmail || !subject || !description) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const ticket = new Ticket({
      userId,
      userName,
      userEmail,
      subject,
      description,
      category: category || 'General Support',
      priority: priority || 'Low'
    });

    await ticket.save();
    res.status(201).json({ message: 'Ticket created successfully!', ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Server error while creating ticket.', error: error.message });
  }
};

// Get all tickets (for admin dashboard)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ message: 'Server error while fetching tickets.', error: error.message });
  }
};

// Get tickets for a specific user
exports.getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const tickets = await Ticket.find({ userId })
      .populate('checklistId', 'service_name details entityName companyName')
      .sort({ createdAt: -1 });
    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Server error while fetching user tickets.', error: error.message });
  }
};

// Update a ticket's status and/or expert
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expert } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    if (status) ticket.status = status;
    if (expert !== undefined) ticket.expert = expert;

    await ticket.save();
    res.status(200).json({ message: 'Ticket updated successfully!', ticket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Server error while updating ticket.', error: error.message });
  }
};
