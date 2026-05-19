const ServiceOrder = require('../models/ServiceOrder');

// Get all service orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const orders = await ServiceOrder.find({ clientUid: userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders.', error: error.message });
  }
};

// Create a service order (for admin/testing)
exports.createOrder = async (req, res) => {
  try {
    const { clientUid, entityName, serviceType, companyName, status, stage, steps, assignedExpert, expertPhone } = req.body;
    
    if (!clientUid || !serviceType) {
      return res.status(400).json({ message: 'clientUid and serviceType are required.' });
    }

    const order = new ServiceOrder({
      clientUid,
      entityName,
      serviceType,
      companyName,
      status,
      stage,
      steps,
      assignedExpert,
      expertPhone
    });

    await order.save();
    res.status(201).json({ message: 'Service order created successfully!', order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error while creating order.', error: error.message });
  }
};

// Update order stage / steps / status (for admin)
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await ServiceOrder.findByIdAndUpdate(id, updateData, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({ message: 'Order updated successfully!', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error while updating order.', error: error.message });
  }
};
