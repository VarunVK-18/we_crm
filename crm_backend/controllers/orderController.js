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
                stage: updateData.stage || 'workAssigned',
                dealClosedAmount: updateData.dealClosedAmount || 0,
                advanceAmountPaid: updateData.advanceAmountPaid || 0
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

// Submit DPIIT Form
exports.submitDpiitForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;
    
    // Process uploaded files if any
    const files = req.files || {};
    const uploadedDocs = [];

    if (files.incorpCert) {
      uploadedDocs.push({ name: 'Incorporation Certificate', fileUrl: files.incorpCert[0].path });
    }
    if (files.pan) {
      uploadedDocs.push({ name: 'Company PAN', fileUrl: files.pan[0].path });
    }
    if (files.logo) {
      uploadedDocs.push({ name: 'Company Logo', fileUrl: files.logo[0].path });
    }
    if (files.pitchDeck) {
      uploadedDocs.push({ name: 'Pitch Deck', fileUrl: files.pitchDeck[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      dpiitForm: formData,
      dpiitDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'DPIIT form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting DPIIT form:', error);
    res.status(500).json({ message: 'Server error while submitting DPIIT form.', error: error.message });
  }
};

// Submit Private Limited Incorporation Form
exports.submitIncorpForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body; // company fields + directors JSON string

    // Process uploaded files if any
    const files = req.files || {};
    const uploadedDocs = [];

    // Company files
    if (files.officeProof) {
      uploadedDocs.push({ name: 'Registered Office Proof', fileUrl: files.officeProof[0].path });
    }

    // Director files are dynamically named: director_1_photo, director_1_signature, etc.
    Object.keys(files).forEach((fieldName) => {
      if (fieldName.startsWith('director_')) {
        const parts = fieldName.split('_'); // e.g. ["director", "1", "photo"]
        const personIndex = parts[1];
        const docType = parts.slice(2).join('_');
        uploadedDocs.push({
          name: `Person ${personIndex} - ${docType.toUpperCase()}`,
          fileUrl: files[fieldName][0].path,
        });
      }
    });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Parse the directors string back to JSON
    let directorsParsed = [];
    if (formData.directors) {
      try {
        directorsParsed = JSON.parse(formData.directors);
      } catch (e) {
        console.error('Error parsing directors JSON:', e);
      }
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      companyName: formData.companyName,
      businessActivity: formData.businessActivity,
      officePreference: formData.officePreference,
      ownerName: formData.ownerName,
      companyEmail: formData.companyEmail,
      companyPhone: formData.companyPhone,
      paidUpCapital: formData.paidUpCapital,
      valuePerShare: formData.valuePerShare,
      numberOfShares: formData.numberOfShares,
      directors: directorsParsed,
      incorpDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'Incorporation form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting Incorp form:', error);
    res.status(500).json({ message: 'Server error while submitting Incorp form.', error: error.message });
  }
};

// Submit Trademark Registration Form
exports.submitTrademarkForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body; 

    // Process uploaded files if any
    const files = req.files || {};
    const uploadedDocs = [];

    if (files.udyamCert) {
      uploadedDocs.push({ name: 'UDYAM MSME Certificate', fileUrl: files.udyamCert[0].path });
    }
    if (files.trademarkLogo) {
      uploadedDocs.push({ name: 'Trademark Logo', fileUrl: files.trademarkLogo[0].path });
    }
    if (files.signature) {
      uploadedDocs.push({ name: 'Signature with Name', fileUrl: files.signature[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      trademarkForm: formData,
      trademarkDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'Trademark form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting Trademark form:', error);
    res.status(500).json({ message: 'Server error while submitting Trademark form.', error: error.message });
  }
};

// Submit LLP Incorporation Form
exports.submitLlpForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.officeProof) {
      uploadedDocs.push({ name: 'Registered Office Proof', fileUrl: files.officeProof[0].path });
    }
    if (files.paymentScreenshot) {
      uploadedDocs.push({ name: 'Payment Screenshot', fileUrl: files.paymentScreenshot[0].path });
    }

    // Process up to 2 persons' files
    for (let i = 1; i <= 2; i++) {
      if (files[`person_${i}_photo`]) {
        uploadedDocs.push({ name: `Person ${i} Photo`, fileUrl: files[`person_${i}_photo`][0].path });
      }
      if (files[`person_${i}_signature`]) {
        uploadedDocs.push({ name: `Person ${i} Signature`, fileUrl: files[`person_${i}_signature`][0].path });
      }
      if (files[`person_${i}_addressProof`]) {
        uploadedDocs.push({ name: `Person ${i} Address Proof`, fileUrl: files[`person_${i}_addressProof`][0].path });
      }
      if (files[`person_${i}_aadhaar`]) {
        uploadedDocs.push({ name: `Person ${i} Aadhaar`, fileUrl: files[`person_${i}_aadhaar`][0].path });
      }
      if (files[`person_${i}_pan`]) {
        uploadedDocs.push({ name: `Person ${i} PAN`, fileUrl: files[`person_${i}_pan`][0].path });
      }
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      llpForm: formData,
      llpDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'LLP form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting LLP form:', error);
    res.status(500).json({ message: 'Server error while submitting LLP form.', error: error.message });
  }
};

// Submit MSME Certification Form
exports.submitMsmeForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.companyPan) {
      uploadedDocs.push({ name: "Company's PAN Card", fileUrl: files.companyPan[0].path });
    }
    if (files.ownerAadhaar) {
      uploadedDocs.push({ name: "Owner's Aadhaar Card", fileUrl: files.ownerAadhaar[0].path });
    }
    if (files.ownerPassbook) {
      uploadedDocs.push({ name: "Owner's Bank Passbook", fileUrl: files.ownerPassbook[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      msmeForm: formData,
      msmeDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'MSME form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting MSME form:', error);
    res.status(500).json({ message: 'Server error while submitting MSME form.', error: error.message });
  }
};

// Submit GST Registration Form
exports.submitGstForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.photo) {
      uploadedDocs.push({ name: "Applicant Photo", fileUrl: files.photo[0].path });
    }
    if (files.ebBill) {
      uploadedDocs.push({ name: "Latest EB Bill", fileUrl: files.ebBill[0].path });
    }
    if (files.houseTaxReceipt) {
      uploadedDocs.push({ name: "House Tax Receipt (Own)", fileUrl: files.houseTaxReceipt[0].path });
    }
    if (files.rentalAgreement) {
      uploadedDocs.push({ name: "Rental Agreement (Rent)", fileUrl: files.rentalAgreement[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      gstForm: formData,
      gstDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'GST form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting GST form:', error);
    res.status(500).json({ message: 'Server error while submitting GST form.', error: error.message });
  }
};

// Submit ISO Registration Form
exports.submitIsoForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.msmeCertificate) {
      uploadedDocs.push({ name: "MSME Certificate", fileUrl: files.msmeCertificate[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      isoForm: formData,
      isoDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'ISO form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting ISO form:', error);
    res.status(500).json({ message: 'Server error while submitting ISO form.', error: error.message });
  }
};

// Submit FSSAI Registration Form
exports.submitFssaiForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.aadhaarCard) {
      uploadedDocs.push({ name: "Aadhaar Card", fileUrl: files.aadhaarCard[0].path });
    }
    if (files.panCard) {
      uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    }
    if (files.passportPhoto) {
      uploadedDocs.push({ name: "Passport Size Photo", fileUrl: files.passportPhoto[0].path });
    }
    if (files.businessAddressProof) {
      uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      fssaiForm: formData,
      fssaiDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'FSSAI form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting FSSAI form:', error);
    res.status(500).json({ message: 'Server error while submitting FSSAI form.', error: error.message });
  }
};

// Submit DSC Registration Form
exports.submitDscForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.applicantPan) {
      uploadedDocs.push({ name: "Applicant PAN Card", fileUrl: files.applicantPan[0].path });
    }
    if (files.applicantAadhaar) {
      uploadedDocs.push({ name: "Applicant Aadhaar Card", fileUrl: files.applicantAadhaar[0].path });
    }
    if (files.applicantPhoto) {
      uploadedDocs.push({ name: "Applicant Photo", fileUrl: files.applicantPhoto[0].path });
    }
    if (files.certificateOfIncorporation) {
      uploadedDocs.push({ name: "Certificate of Incorporation", fileUrl: files.certificateOfIncorporation[0].path });
    }
    if (files.organizationPan) {
      uploadedDocs.push({ name: "Organization PAN", fileUrl: files.organizationPan[0].path });
    }
    if (files.gstCertificate) {
      uploadedDocs.push({ name: "GST Certificate", fileUrl: files.gstCertificate[0].path });
    }
    if (files.msmeCertificate) {
      uploadedDocs.push({ name: "MSME Certificate", fileUrl: files.msmeCertificate[0].path });
    }
    if (files.otherDirectorPan) {
      uploadedDocs.push({ name: "Other Director PAN", fileUrl: files.otherDirectorPan[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      dscForm: formData,
      dscDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'DSC form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting DSC form:', error);
    res.status(500).json({ message: 'Server error while submitting DSC form.', error: error.message });
  }
};
