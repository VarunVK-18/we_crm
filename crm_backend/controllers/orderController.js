const ServiceOrder = require('../models/ServiceOrder');
const User = require('../models/User');

// Get all service orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const orders = await ServiceOrder.find({ cleintUid: userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders.', error: error.message });
  }
};

// Create a service order (for admin/testing)
exports.createOrder = async (req, res) => {
  try {
    const { cleintUid, entityName, serviceType, companyName, status, stage, steps, assignedExpert, expertPhone } = req.body;
    
    if (!cleintUid || !serviceType) {
      return res.status(400).json({ message: 'cleintUid and serviceType are required.' });
    }

    const order = new ServiceOrder({
      cleintUid,
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

    if (updateData.assignedNumberOfDirectors) {
      order.details = {
        ...(order.details || {}),
        assignedNumberOfDirectors: updateData.assignedNumberOfDirectors
      };
      order.markModified('details');
      await order.save();
    }

    if (updateData.dealClosedAmount) {
      const cleintUser = await User.findById(order.cleintUid);
      if (cleintUser) {
        cleintUser.revenue = (cleintUser.revenue || 0) + Number(updateData.dealClosedAmount);
        await cleintUser.save();
        console.log(`Added dealClosedAmount ${updateData.dealClosedAmount} to user ${cleintUser._id} revenue. New revenue: ${cleintUser.revenue}`);
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
          // Update all non-completed checklists for this cleint + service
          const updated = await Checklist.updateMany(
            {
              cleint_id: order.cleintUid,
              service_name: order.serviceType,
              status: { $ne: 'completed' }
            },
            {
              $set: {
                assigned_to: assignedEmployee._id,
                stage: updateData.stage || 'workAssigned',
                dealClosedAmount: updateData.dealClosedAmount || 0,
                advanceAmountPaid: updateData.advanceAmountPaid || 0,
                isGstApplicable: updateData.isGstApplicable !== undefined ? updateData.isGstApplicable : true
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

// Get all service orders belonging to cleints of a given company
exports.getCompanyOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required.' });
    }
    let cleintFilter = { company_id: companyId, role: 'customer' };
    if (req.user && req.user.role === 'cleint_manager') {
      cleintFilter.$or = [
        { assigned_to: req.user._id },
        { created_by: req.user._id, assigned_to: null }
      ];
    } else if (req.user && (req.user.role === 'account_manager' || req.user.role === 'filling_staff')) {
      cleintFilter.assigned_to = req.user._id;
    }

    const cleints = await User.find(cleintFilter).select('_id');
    const cleintIds = cleints.map(cleint => cleint._id.toString());
    let orderQuery = {};
    if (req.user && ['cleint_manager', 'account_manager', 'filling_staff'].includes(req.user.role)) {
      // Scoped users ONLY see orders for their authorized cleints
      orderQuery.cleintUid = { $in: cleintIds };
      
      // If the order has an assigned expert, ONLY that expert should see it, 
      // UNLESS it's unassigned, in which case the authorized cleint manager can see it.
      orderQuery.$or = [
        { assignedExpert: req.user.owner_name },
        { assignedExpert: 'To be assigned' },
        { assignedExpert: null },
        { assignedExpert: { $exists: false } }
      ];
    } else {
      // Admin users see all orders for the company OR cleints
      orderQuery.$or = [
        { cleintUid: { $in: cleintIds } },
        { companyId: companyId }
      ];
    }

    const orders = await ServiceOrder.find(orderQuery).sort({ createdAt: -1 });
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

    // Process all dynamically named person files
    Object.keys(files).forEach((fieldName) => {
      if (fieldName.startsWith('person_')) {
        const parts = fieldName.split('_'); // e.g. ["person", "1", "photo"]
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

    // Parse person fields into a directors array
    const directors = [];
    for (let i = 1; i <= 20; i++) {
      if (formData[`person_${i}_fullName`]) {
        directors.push({
          fullName: formData[`person_${i}_fullName`],
          fatherName: formData[`person_${i}_fatherName`],
          dob: formData[`person_${i}_dob`],
          placeOfBirth: formData[`person_${i}_placeOfBirth`],
          education: formData[`person_${i}_education`],
          email: formData[`person_${i}_email`],
          phone: formData[`person_${i}_phone`],
          address: formData[`person_${i}_address`],
          pan: formData[`person_${i}_pan`],
          aadhaar: formData[`person_${i}_aadhaar`],
          din: formData[`person_${i}_din`],
          capital: formData[`person_${i}_capital`],
          profitRatio: formData[`person_${i}_profitRatio`],
          nationality: formData[`person_${i}_nationality`],
          occupation: formData[`person_${i}_occupation`],
          needDsc: formData[`person_${i}_needDsc`],
          designation: formData[`person_${i}_designation`],
          isAuthorized: formData[`person_${i}_isAuthorized`]
        });
      }
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      companyName: formData.companyName,
      businessActivity: formData.businessActivity,
      ownerName: formData.ownerName,
      totalCapital: formData.totalCapital,
      registeredOfficePreference: formData.registeredOfficePreference,
      directors: directors,
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

// Submit LEI Registration Form
exports.submitleiForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.addressProof) uploadedDocs.push({ name: 'Address Proof', fileUrl: files.addressProof[0].path });
    if (files.incorpCert) uploadedDocs.push({ name: 'Incorporation Certificate', fileUrl: files.incorpCert[0].path });
    if (files.panCard) uploadedDocs.push({ name: 'Company PAN Card', fileUrl: files.panCard[0].path });
    if (files.gstCert) uploadedDocs.push({ name: 'GST Certificate', fileUrl: files.gstCert[0].path });
    if (files.auditedFinancials) uploadedDocs.push({ name: 'Audited Financials', fileUrl: files.auditedFinancials[0].path });
    if (files.moaAoa) uploadedDocs.push({ name: 'MOA & AOA', fileUrl: files.moaAoa[0].path });
    if (files.boardResolution) uploadedDocs.push({ name: 'Board Resolution', fileUrl: files.boardResolution[0].path });
    // Legacy field for old ISO-based uploads
    if (files.msmeCertificate) uploadedDocs.push({ name: 'MSME Certificate', fileUrl: files.msmeCertificate[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details — save as both leiForm and lieForm for backward compat
    const updatedDetails = {
      ...order.details,
      leiForm: formData,
      lieForm: formData,
      leiDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'LEI form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting LEI form:', error);
    res.status(500).json({ message: 'Server error while submitting LEI form.', error: error.message });
  }
};


// Submit BIS Registration Form
exports.submitBisForm = async (req, res) => {
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
      bisForm: formData,
      bisDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'BIS form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting BIS form:', error);
    res.status(500).json({ message: 'Server error while submitting BIS form.', error: error.message });
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

// Submit MCA Registration Form
exports.submitMcaForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.coi) uploadedDocs.push({ name: "Certificate of Incorporation", fileUrl: files.coi[0].path });
    if (files.pan) uploadedDocs.push({ name: "PAN Card of the Company", fileUrl: files.pan[0].path });
    if (files.moa) uploadedDocs.push({ name: "Memorandum of Association (MOA)", fileUrl: files.moa[0].path });
    if (files.aoa) uploadedDocs.push({ name: "Articles of Association (AOA)", fileUrl: files.aoa[0].path });
    if (files.bankStatement) uploadedDocs.push({ name: "Last FY Bank statements", fileUrl: files.bankStatement[0].path });
    if (files.salesInvoice) uploadedDocs.push({ name: "Sales Invoice copies of last FY", fileUrl: files.salesInvoice[0].path });
    if (files.purchaseBills) uploadedDocs.push({ name: "Purchase bills of last FY", fileUrl: files.purchaseBills[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      mcaForm: formData,
      mcaDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'MCA form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting MCA form:', error);
    res.status(500).json({ message: 'Server error while submitting MCA form.', error: error.message });
  }
};

// Submit GST Compliance Form
exports.submitGstComplianceForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.bankStatement) {
      uploadedDocs.push({ name: "Last 3 months Bank Statement (Current Account)", fileUrl: files.bankStatement[0].path });
    }

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      gstComplianceForm: formData,
      gstComplianceDocs: uploadedDocs,
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'GST Compliance form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting GST Compliance form:', error);
    res.status(500).json({ message: 'Server error while submitting GST Compliance form.', error: error.message });
  }
};

// Submit Proprietorship Registration Form
exports.submitProprietorshipForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.panCard) uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    if (files.aadhaarCard) uploadedDocs.push({ name: "Aadhaar Card", fileUrl: files.aadhaarCard[0].path });
    if (files.passportPhoto) uploadedDocs.push({ name: "Passport Size Photo", fileUrl: files.passportPhoto[0].path });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    if (files.businessAddressProof) uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      proprietorshipForm: formData,
      proprietorshipDocs: uploadedDocs,
      companyName: formData.businessName, // Ensure business name shows up in tracking
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'Proprietorship form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting Proprietorship form:', error);
    res.status(500).json({ message: 'Server error while submitting Proprietorship form.', error: error.message });
  }
};

// Submit TDS / TAN Registration Form
exports.submitTdsForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.panCard) uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    if (files.businessAddressProof) uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    if (files.incorpCert) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: files.incorpCert[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      tdsForm: formData,
      tdsDocs: uploadedDocs,
      companyName: formData.businessName, // Ensure business name shows up in tracking
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'TDS form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting TDS form:', error);
    res.status(500).json({ message: 'Server error while submitting TDS form.', error: error.message });
  }
};

// Submit PF Registration Form
exports.submitPfForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.panCard) uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    if (files.businessAddressProof) uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    if (files.incorpCert) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: files.incorpCert[0].path });
    if (files.cancelledCheque) uploadedDocs.push({ name: "Cancelled Cheque", fileUrl: files.cancelledCheque[0].path });
    if (files.authSignatoryProof) uploadedDocs.push({ name: "Authorized Signatory ID Proof", fileUrl: files.authSignatoryProof[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      pfForm: formData,
      pfDocs: uploadedDocs,
      companyName: formData.businessName, // Ensure business name shows up in tracking
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'PF form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting PF form:', error);
    res.status(500).json({ message: 'Server error while submitting PF form.', error: error.message });
  }
};

// Submit Patent Registration Form
exports.submitPatentForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.identityProof) uploadedDocs.push({ name: "Identity Proof", fileUrl: files.identityProof[0].path });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    if (files.inventionDescriptionDoc) uploadedDocs.push({ name: "Invention Description", fileUrl: files.inventionDescriptionDoc[0].path });
    if (files.drawingsDiagrams) uploadedDocs.push({ name: "Drawings / Diagrams", fileUrl: files.drawingsDiagrams[0].path });
    if (files.authLetter) uploadedDocs.push({ name: "Authorization Letter", fileUrl: files.authLetter[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      patentForm: formData,
      patentDocs: uploadedDocs,
      companyName: formData.applicantName || formData.inventionTitle, // Track via applicant or title
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'Patent form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting Patent form:', error);
    res.status(500).json({ message: 'Server error while submitting Patent form.', error: error.message });
  }
};

// Submit GST Cancellation Form
exports.submitGstCancellationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.gstCert) uploadedDocs.push({ name: "GST Registration Certificate", fileUrl: files.gstCert[0].path });
    if (files.panCard) uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    if (files.supportDocs) uploadedDocs.push({ name: "Supporting Documents", fileUrl: files.supportDocs[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      gstCancellationForm: formData,
      gstCancellationDocs: uploadedDocs,
      companyName: formData.businessName, // Track via business name
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'GST Cancellation form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting GST Cancellation form:', error);
    res.status(500).json({ message: 'Server error while submitting GST Cancellation form.', error: error.message });
  }
};

// Submit GST Filing Form
exports.submitGstFilingForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.salesReport) uploadedDocs.push({ name: "Sales Report", fileUrl: files.salesReport[0].path });
    if (files.purchaseReport) uploadedDocs.push({ name: "Purchase Report", fileUrl: files.purchaseReport[0].path });
    if (files.gstInvoices) uploadedDocs.push({ name: "GST Invoices", fileUrl: files.gstInvoices[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      gstFilingForm: formData,
      gstFilingDocs: uploadedDocs,
      companyName: formData.businessName, // Track via business name
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'GST Filing form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting GST Filing form:', error);
    res.status(500).json({ message: 'Server error while submitting GST Filing form.', error: error.message });
  }
};

// Submit IEC Form
exports.submitIecForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    const files = req.files || {};
    const uploadedDocs = [];

    if (files.panCard) uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    if (files.cancelledCheque) uploadedDocs.push({ name: "Cancelled Cheque", fileUrl: files.cancelledCheque[0].path });
    if (files.incorpCert) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: files.incorpCert[0].path });

    const Checklist = require('../models/Checklist');
    const order = await Checklist.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order (Checklist) not found.' });
    }

    // Merge form data into order details
    const updatedDetails = {
      ...order.details,
      iecForm: formData,
      iecDocs: uploadedDocs,
      companyName: formData.businessName, // Track via business name
    };

    order.details = updatedDetails;
    order.action_required = false; // Form submitted, action no longer required
    order.markModified('details');

    await order.save();

    res.status(200).json({ message: 'IEC form submitted successfully!', order });
  } catch (error) {
    console.error('Error submitting IEC form:', error);
    res.status(500).json({ message: 'Server error while submitting IEC form.', error: error.message });
  }
};

// Add financial log to an order
exports.addFinancialLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentType, amount, transactionId, paymentTimestamp, isVerified } = req.body;

    const order = await ServiceOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (!order.financialLogs) {
      order.financialLogs = [];
    }

    order.financialLogs.push({
      paymentType,
      amount,
      transactionId,
      paymentTimestamp: paymentTimestamp ? new Date(paymentTimestamp) : new Date(),
      isVerified: Boolean(isVerified)
    });
    
    // Also update advanceAmountPaid automatically
    if (paymentType && paymentType.toLowerCase().includes('advance')) {
      order.advanceAmountPaid = (order.advanceAmountPaid || 0) + Number(amount);
    }

    await order.save();

    // Try to update checklist as well
    try {
      const Checklist = require('../models/Checklist');
      const checklistOrder = await Checklist.findOne({ _id: id });
      if (checklistOrder) {
        if (!checklistOrder.financialLogs) checklistOrder.financialLogs = [];
        checklistOrder.financialLogs.push({
          paymentType,
          amount,
          transactionId,
          paymentTimestamp: paymentTimestamp ? new Date(paymentTimestamp) : new Date(),
          isVerified: Boolean(isVerified)
        });
        if (paymentType && paymentType.toLowerCase().includes('advance')) {
          checklistOrder.advanceAmountPaid = (checklistOrder.advanceAmountPaid || 0) + Number(amount);
        }
        await checklistOrder.save();
      }
    } catch(e) {
      console.error('Checklist log sync error:', e);
    }

    res.status(201).json({ message: 'Financial log added successfully!', order });
  } catch (error) {
    console.error('Error adding financial log:', error);
    res.status(500).json({ message: 'Server error while adding financial log.', error: error.message });
  }
};
