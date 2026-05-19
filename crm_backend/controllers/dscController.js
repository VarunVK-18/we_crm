const DscOrder = require('../models/DscOrder');

// Get all DSC orders for a user
exports.getUserDscOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const orders = await DscOrder.find({ clientUid: userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching user DSC orders:', error);
    res.status(500).json({ message: 'Server error while fetching DSC orders.', error: error.message });
  }
};

// Create a DSC order
exports.createDscOrder = async (req, res) => {
  try {
    const { clientUid, name, type, stage, progress, isCompleted } = req.body;
    
    if (!clientUid || !name) {
      return res.status(400).json({ message: 'clientUid and name are required.' });
    }

    const order = new DscOrder({
      clientUid,
      name,
      type,
      stage,
      progress,
      isCompleted
    });

    await order.save();
    res.status(201).json({ message: 'DSC order created successfully!', order });
  } catch (error) {
    console.error('Error creating DSC order:', error);
    res.status(500).json({ message: 'Server error while creating DSC order.', error: error.message });
  }
};

// Update DSC order
exports.updateDscOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await DscOrder.findByIdAndUpdate(id, updateData, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'DSC Order not found.' });
    }

    res.status(200).json({ message: 'DSC Order updated successfully!', order });
  } catch (error) {
    console.error('Error updating DSC order:', error);
    res.status(500).json({ message: 'Server error while updating DSC order.', error: error.message });
  }
};
