const ServiceOrder = require('../models/ServiceOrder');
const User = require('../models/User');

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

    if (updateData.dealClosedAmount) {
      const clientUser = await User.findById(order.clientUid);
      if (clientUser) {
        clientUser.revenue = (clientUser.revenue || 0) + Number(updateData.dealClosedAmount);
        await clientUser.save();
        console.log(`Added dealClosedAmount ${updateData.dealClosedAmount} to user ${clientUser._id} revenue. New revenue: ${clientUser.revenue}`);
      }
    }

    if (updateData.assignedExpert && updateData.assignedExpert !== 'To be assigned') {
      try {
        const Checklist = require('../models/Checklist');

        // Find the employee by name to get their _id
        const assignedEmployee = await User.findOne({
          owner_name: updateData.assignedExpert
        }).select('_id');

        if (assignedEmployee) {
          // Update all non-completed checklists for this client + service
          const updated = await Checklist.updateMany(
            {
              client_id: order.clientUid,
              service_name: order.serviceType,
              status: { $ne: 'completed' }
            },
            {
              $set: {
                assigned_to: assignedEmployee._id,
                stage: updateData.stage || 'workAssigned'
              }
            }
          );
          console.log(`Cascaded assignment to ${updated.modifiedCount} checklist(s) for ${order.serviceType}`);
        }
      } catch (cascadeErr) {
        // Non-fatal — log but don't fail the order update
        console.error('Warning: Could not cascade assignment to checklist:', cascadeErr.message);
      }
    }

    res.status(200).json({ message: 'Order updated successfully!', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error while updating order.', error: error.message });
  }
};

// Get all service orders belonging to clients of a given company
exports.getCompanyOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required.' });
    }
    const clients = await User.find({ company_id: companyId, role: 'customer' }).select('_id');
    const clientIds = clients.map(client => client._id.toString());
    const orders = await ServiceOrder.find({
      $or: [
        { clientUid: { $in: clientIds } },
        { companyId: companyId }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching company orders:', error);
    res.status(500).json({ message: 'Server error while fetching company orders.', error: error.message });
  }
};

