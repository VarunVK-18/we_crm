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

    if (updateData.team_id) {
      console.log(`[ORDER ASSIGN] Assigning to team ${updateData.team_id} for order ${order._id}`);
      try {
        const BucketRequest = require('../models/BucketRequest');
        const Checklist = require('../models/Checklist');
        const ChecklistTemplate = require('../models/ChecklistTemplate');
        
        console.log(`[ORDER ASSIGN] Querying BucketRequest: company_id=${order.companyId}, client_id=${order.clientUid}, service_name=${order.serviceType}`);
        
        let bucketReq = await BucketRequest.findOne({ 
          company_id: order.companyId, 
          client_id: order.clientUid, 
          service_name: order.serviceType, 
          status: 'open' 
        });

        if (!bucketReq) {
          console.log(`[ORDER ASSIGN] BucketRequest not found for ${order.serviceType}. Creating one on the fly...`);
          bucketReq = await BucketRequest.create({
            company_id: order.companyId,
            client_id: order.clientUid,
            service_name: order.serviceType,
            status: 'open',
            source: 'we-crm', // or 'we-crm-old', it will instantly be claimed anyway
            client_name: order.entityName || '',
          });
        }

        console.log(`[ORDER ASSIGN] Proceeding with BucketRequest ${bucketReq._id}`);
        let finalItems = [];
        try {
          const template = await ChecklistTemplate.findOne({
            company_id: order.companyId,
            service_name: bucketReq.service_name
          });
          if (template && template.items && template.items.length > 0) {
            finalItems = template.items.map(item => ({
              title: item.title, description: item.description, label: item.title, isChecked: false
            }));
          }
        } catch (e) { }

        if (finalItems.length === 0 || finalItems[0].title !== 'Client Form Filling') {
          finalItems.unshift({ title: 'Client Form Filling', description: 'Ensure the client has submitted all necessary initial forms and details.', label: 'Client Form Filling', isChecked: false });
        }

        let custom_service_id = null;
        try {
          custom_service_id = await getNextServiceId(order.companyId);
        } catch (e) { console.error('Failed to generate custom_service_id', e); }

        const checklist = await Checklist.create({
          company_id: order.companyId,
          custom_service_id,
          client_id: bucketReq.client_id,
          service_name: bucketReq.service_name,
          assigned_to: req.user._id,
          created_by: req.user._id,
          items: finalItems,
          status: 'pending',
          stage: 'quotePending',
          notes: '',
          dealClosedAmount: Number(updateData.dealClosedAmount) || 0,
          advanceAmountPaid: Number(updateData.advanceAmountPaid) || 0
        });

        bucketReq.status = 'claimed_by_manager';
        bucketReq.claimed_by = req.user._id;
        bucketReq.team_id = updateData.team_id;
        bucketReq.claimed_at = new Date();
        bucketReq.checklist_id = checklist._id;
        await bucketReq.save();
        console.log(`[ORDER ASSIGN] Bucket Request assigned to team ${updateData.team_id}`);
      } catch (err) {
        console.error('Error assigning Bucket Request to team:', err);
      }
    } else if (updateData.assignedExpert && updateData.assignedExpert !== 'To be assigned') {
      try {
        const Checklist = require('../models/Checklist');

        // Find the employee by name to get their _id
        const assignedEmployee = await User.findOne({
          owner_name: updateData.assignedExpert
        }).select('_id');

        if (assignedEmployee) {
          const updateFields = {
            assigned_to: assignedEmployee._id,
            stage: updateData.stage || 'workAssigned',
            dealClosedAmount: updateData.dealClosedAmount || 0,
            advanceAmountPaid: updateData.advanceAmountPaid || 0,
            isGstApplicable: updateData.isGstApplicable !== undefined ? updateData.isGstApplicable : true
          };
          
          if (updateData.recommended_plan) {
             updateFields.recommended_plan = updateData.recommended_plan;
          }

          // Update all non-completed checklists for this cleint + service
          const updated = await Checklist.updateMany(
            {
              client_id: order.clientUid,
              service_name: order.serviceType,
              status: { $ne: 'completed' }
            },
            {
              $set: updateFields
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
    if (req.user && req.user.role === 'client_manager') {
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
    if (req.user && ['client_manager', 'account_manager', 'filling_staff'].includes(req.user.role)) {
      // Scoped users ONLY see orders for their authorized cleints
      orderQuery.clientUid = { $in: cleintIds };
      
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
        { clientUid: { $in: cleintIds } },
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
    } else if (req.body.incorpCert_existing) {
      uploadedDocs.push({ name: 'Incorporation Certificate', fileUrl: req.body.incorpCert_existing });
    }
    if (files.pan) {
      uploadedDocs.push({ name: 'Company PAN', fileUrl: files.pan[0].path });
    } else if (req.body.pan_existing) {
      uploadedDocs.push({ name: 'Company PAN', fileUrl: req.body.pan_existing });
    }
    if (files.logo) {
      uploadedDocs.push({ name: 'Company Logo', fileUrl: files.logo[0].path });
    } else if (req.body.logo_existing) {
      uploadedDocs.push({ name: 'Company Logo', fileUrl: req.body.logo_existing });
    }
    if (files.pitchDeck) {
      uploadedDocs.push({ name: 'Pitch Deck', fileUrl: files.pitchDeck[0].path });
    } else if (req.body.pitchDeck_existing) {
      uploadedDocs.push({ name: 'Pitch Deck', fileUrl: req.body.pitchDeck_existing });
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
    } else if (req.body.officeProof_existing) {
      uploadedDocs.push({ name: 'Registered Office Proof', fileUrl: req.body.officeProof_existing });
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
    } else if (req.body.udyamCert_existing) {
      uploadedDocs.push({ name: 'UDYAM MSME Certificate', fileUrl: req.body.udyamCert_existing });
    }
    if (files.trademarkLogo) {
      uploadedDocs.push({ name: 'Trademark Logo', fileUrl: files.trademarkLogo[0].path });
    } else if (req.body.trademarkLogo_existing) {
      uploadedDocs.push({ name: 'Trademark Logo', fileUrl: req.body.trademarkLogo_existing });
    }
    if (files.signature) {
      uploadedDocs.push({ name: 'Signature with Name', fileUrl: files.signature[0].path });
    } else if (req.body.signature_existing) {
      uploadedDocs.push({ name: 'Signature with Name', fileUrl: req.body.signature_existing });
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
    } else if (req.body.officeProof_existing) {
      uploadedDocs.push({ name: 'Registered Office Proof', fileUrl: req.body.officeProof_existing });
    }
    if (files.paymentScreenshot) {
      uploadedDocs.push({ name: 'Payment Screenshot', fileUrl: files.paymentScreenshot[0].path });
    } else if (req.body.paymentScreenshot_existing) {
      uploadedDocs.push({ name: 'Payment Screenshot', fileUrl: req.body.paymentScreenshot_existing });
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
    } else if (req.body.companyPan_existing) {
      uploadedDocs.push({ name: "Company's PAN Card", fileUrl: req.body.companyPan_existing });
    }
    if (files.ownerAadhaar) {
      uploadedDocs.push({ name: "Owner's Aadhaar Card", fileUrl: files.ownerAadhaar[0].path });
    } else if (req.body.ownerAadhaar_existing) {
      uploadedDocs.push({ name: "Owner's Aadhaar Card", fileUrl: req.body.ownerAadhaar_existing });
    }
    if (files.ownerPassbook) {
      uploadedDocs.push({ name: "Owner's Bank Passbook", fileUrl: files.ownerPassbook[0].path });
    } else if (req.body.ownerPassbook_existing) {
      uploadedDocs.push({ name: "Owner's Bank Passbook", fileUrl: req.body.ownerPassbook_existing });
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
    } else if (req.body.photo_existing) {
      uploadedDocs.push({ name: "Applicant Photo", fileUrl: req.body.photo_existing });
    }
    if (files.ebBill) {
      uploadedDocs.push({ name: "Latest EB Bill", fileUrl: files.ebBill[0].path });
    } else if (req.body.ebBill_existing) {
      uploadedDocs.push({ name: "Latest EB Bill", fileUrl: req.body.ebBill_existing });
    }
    if (files.houseTaxReceipt) {
      uploadedDocs.push({ name: "House Tax Receipt (Own)", fileUrl: files.houseTaxReceipt[0].path });
    } else if (req.body.houseTaxReceipt_existing) {
      uploadedDocs.push({ name: "House Tax Receipt (Own)", fileUrl: req.body.houseTaxReceipt_existing });
    }
    if (files.rentalAgreement) {
      uploadedDocs.push({ name: "Rental Agreement (Rent)", fileUrl: files.rentalAgreement[0].path });
    } else if (req.body.rentalAgreement_existing) {
      uploadedDocs.push({ name: "Rental Agreement (Rent)", fileUrl: req.body.rentalAgreement_existing });
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
    } else if (req.body.msmeCertificate_existing) {
      uploadedDocs.push({ name: "MSME Certificate", fileUrl: req.body.msmeCertificate_existing });
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
    else if (req.body.addressProof_existing) uploadedDocs.push({ name: 'Address Proof', fileUrl: req.body.addressProof_existing });
    if (files.incorpCert) uploadedDocs.push({ name: 'Incorporation Certificate', fileUrl: files.incorpCert[0].path });
    else if (req.body.incorpCert_existing) uploadedDocs.push({ name: 'Incorporation Certificate', fileUrl: req.body.incorpCert_existing });
    if (files.panCard) uploadedDocs.push({ name: 'Company PAN Card', fileUrl: files.panCard[0].path });
    else if (req.body.panCard_existing) uploadedDocs.push({ name: 'Company PAN Card', fileUrl: req.body.panCard_existing });
    if (files.gstCert) uploadedDocs.push({ name: 'GST Certificate', fileUrl: files.gstCert[0].path });
    else if (req.body.gstCert_existing) uploadedDocs.push({ name: 'GST Certificate', fileUrl: req.body.gstCert_existing });
    if (files.auditedFinancials) uploadedDocs.push({ name: 'Audited Financials', fileUrl: files.auditedFinancials[0].path });
    else if (req.body.auditedFinancials_existing) uploadedDocs.push({ name: 'Audited Financials', fileUrl: req.body.auditedFinancials_existing });
    if (files.moaAoa) uploadedDocs.push({ name: 'MOA & AOA', fileUrl: files.moaAoa[0].path });
    else if (req.body.moaAoa_existing) uploadedDocs.push({ name: 'MOA & AOA', fileUrl: req.body.moaAoa_existing });
    if (files.boardResolution) uploadedDocs.push({ name: 'Board Resolution', fileUrl: files.boardResolution[0].path });
    else if (req.body.boardResolution_existing) uploadedDocs.push({ name: 'Board Resolution', fileUrl: req.body.boardResolution_existing });
    // Legacy field for old ISO-based uploads
    if (files.msmeCertificate) uploadedDocs.push({ name: 'MSME Certificate', fileUrl: files.msmeCertificate[0].path });
    else if (req.body.msmeCertificate_existing) uploadedDocs.push({ name: 'MSME Certificate', fileUrl: req.body.msmeCertificate_existing });

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
    } else if (req.body.msmeCertificate_existing) {
      uploadedDocs.push({ name: "MSME Certificate", fileUrl: req.body.msmeCertificate_existing });
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
    } else if (req.body.aadhaarCard_existing) {
      uploadedDocs.push({ name: "Aadhaar Card", fileUrl: req.body.aadhaarCard_existing });
    }
    if (files.panCard) {
      uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    } else if (req.body.panCard_existing) {
      uploadedDocs.push({ name: "PAN Card", fileUrl: req.body.panCard_existing });
    }
    if (files.passportPhoto) {
      uploadedDocs.push({ name: "Passport Size Photo", fileUrl: files.passportPhoto[0].path });
    } else if (req.body.passportPhoto_existing) {
      uploadedDocs.push({ name: "Passport Size Photo", fileUrl: req.body.passportPhoto_existing });
    }
    if (files.businessAddressProof) {
      uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    } else if (req.body.businessAddressProof_existing) {
      uploadedDocs.push({ name: "Business Address Proof", fileUrl: req.body.businessAddressProof_existing });
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
    } else if (req.body.applicantPan_existing) {
      uploadedDocs.push({ name: "Applicant PAN Card", fileUrl: req.body.applicantPan_existing });
    }
    if (files.applicantAadhaar) {
      uploadedDocs.push({ name: "Applicant Aadhaar Card", fileUrl: files.applicantAadhaar[0].path });
    } else if (req.body.applicantAadhaar_existing) {
      uploadedDocs.push({ name: "Applicant Aadhaar Card", fileUrl: req.body.applicantAadhaar_existing });
    }
    if (files.applicantPhoto) {
      uploadedDocs.push({ name: "Applicant Photo", fileUrl: files.applicantPhoto[0].path });
    } else if (req.body.applicantPhoto_existing) {
      uploadedDocs.push({ name: "Applicant Photo", fileUrl: req.body.applicantPhoto_existing });
    }
    if (files.certificateOfIncorporation) {
      uploadedDocs.push({ name: "Certificate of Incorporation", fileUrl: files.certificateOfIncorporation[0].path });
    } else if (req.body.certificateOfIncorporation_existing) {
      uploadedDocs.push({ name: "Certificate of Incorporation", fileUrl: req.body.certificateOfIncorporation_existing });
    }
    if (files.organizationPan) {
      uploadedDocs.push({ name: "Organization PAN", fileUrl: files.organizationPan[0].path });
    } else if (req.body.organizationPan_existing) {
      uploadedDocs.push({ name: "Organization PAN", fileUrl: req.body.organizationPan_existing });
    }
    if (files.gstCertificate) {
      uploadedDocs.push({ name: "GST Certificate", fileUrl: files.gstCertificate[0].path });
    } else if (req.body.gstCertificate_existing) {
      uploadedDocs.push({ name: "GST Certificate", fileUrl: req.body.gstCertificate_existing });
    }
    if (files.msmeCertificate) {
      uploadedDocs.push({ name: "MSME Certificate", fileUrl: files.msmeCertificate[0].path });
    } else if (req.body.msmeCertificate_existing) {
      uploadedDocs.push({ name: "MSME Certificate", fileUrl: req.body.msmeCertificate_existing });
    }
    if (files.otherDirectorPan) {
      uploadedDocs.push({ name: "Other Director PAN", fileUrl: files.otherDirectorPan[0].path });
    } else if (req.body.otherDirectorPan_existing) {
      uploadedDocs.push({ name: "Other Director PAN", fileUrl: req.body.otherDirectorPan_existing });
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
    else if (req.body.coi_existing) uploadedDocs.push({ name: "Certificate of Incorporation", fileUrl: req.body.coi_existing });
    if (files.pan) uploadedDocs.push({ name: "PAN Card of the Company", fileUrl: files.pan[0].path });
    else if (req.body.pan_existing) uploadedDocs.push({ name: "PAN Card of the Company", fileUrl: req.body.pan_existing });
    if (files.moa) uploadedDocs.push({ name: "Memorandum of Association (MOA)", fileUrl: files.moa[0].path });
    else if (req.body.moa_existing) uploadedDocs.push({ name: "Memorandum of Association (MOA)", fileUrl: req.body.moa_existing });
    if (files.aoa) uploadedDocs.push({ name: "Articles of Association (AOA)", fileUrl: files.aoa[0].path });
    else if (req.body.aoa_existing) uploadedDocs.push({ name: "Articles of Association (AOA)", fileUrl: req.body.aoa_existing });
    if (files.bankStatement) uploadedDocs.push({ name: "Last FY Bank statements", fileUrl: files.bankStatement[0].path });
    else if (req.body.bankStatement_existing) uploadedDocs.push({ name: "Last FY Bank statements", fileUrl: req.body.bankStatement_existing });
    if (files.salesInvoice) uploadedDocs.push({ name: "Sales Invoice copies of last FY", fileUrl: files.salesInvoice[0].path });
    else if (req.body.salesInvoice_existing) uploadedDocs.push({ name: "Sales Invoice copies of last FY", fileUrl: req.body.salesInvoice_existing });
    if (files.purchaseBills) uploadedDocs.push({ name: "Purchase bills of last FY", fileUrl: files.purchaseBills[0].path });
    else if (req.body.purchaseBills_existing) uploadedDocs.push({ name: "Purchase bills of last FY", fileUrl: req.body.purchaseBills_existing });

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

    let turnoverCategory = formData.annualTurnover || '';
    let recommendedPlan = '';
    let recommendedFee = 0;

    if (turnoverCategory === 'Less than ₹20 Lakhs') {
      recommendedPlan = 'Startup Plan';
      recommendedFee = 25000;
    } else if (turnoverCategory === 'Greater than ₹20 Lakhs and Less than ₹50 Lakhs') {
      recommendedPlan = 'Business Plan';
      recommendedFee = 35000;
    } else if (turnoverCategory === 'Greater than ₹50 Lakhs') {
      recommendedPlan = 'Corporate Plan';
      recommendedFee = 50000;
    }

    if (turnoverCategory) {
      order.turnover_category = turnoverCategory;
      order.recommended_plan = recommendedPlan;
      order.recommended_fee = recommendedFee;
    }

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
    } else if (req.body.bankStatement_existing) {
      uploadedDocs.push({ name: "Last 3 months Bank Statement (Current Account)", fileUrl: req.body.bankStatement_existing });
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

    let turnoverCategory = formData.annualTurnover || '';
    let recommendedPlan = '';
    let recommendedFee = 0;

    if (turnoverCategory === 'Less than ₹20 Lakhs') {
      recommendedPlan = 'Startup Plan';
      recommendedFee = 25000;
    } else if (turnoverCategory === 'Greater than ₹20 Lakhs and Less than ₹50 Lakhs') {
      recommendedPlan = 'Business Plan';
      recommendedFee = 35000;
    } else if (turnoverCategory === 'Greater than ₹50 Lakhs') {
      recommendedPlan = 'Corporate Plan';
      recommendedFee = 50000;
    }

    if (turnoverCategory) {
      order.turnover_category = turnoverCategory;
      order.recommended_plan = recommendedPlan;
      order.recommended_fee = recommendedFee;
    }

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
    else if (req.body.panCard_existing) uploadedDocs.push({ name: "PAN Card", fileUrl: req.body.panCard_existing });
    if (files.aadhaarCard) uploadedDocs.push({ name: "Aadhaar Card", fileUrl: files.aadhaarCard[0].path });
    else if (req.body.aadhaarCard_existing) uploadedDocs.push({ name: "Aadhaar Card", fileUrl: req.body.aadhaarCard_existing });
    if (files.passportPhoto) uploadedDocs.push({ name: "Passport Size Photo", fileUrl: files.passportPhoto[0].path });
    else if (req.body.passportPhoto_existing) uploadedDocs.push({ name: "Passport Size Photo", fileUrl: req.body.passportPhoto_existing });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    else if (req.body.addressProof_existing) uploadedDocs.push({ name: "Address Proof", fileUrl: req.body.addressProof_existing });
    if (files.businessAddressProof) uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    else if (req.body.businessAddressProof_existing) uploadedDocs.push({ name: "Business Address Proof", fileUrl: req.body.businessAddressProof_existing });

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
    else if (req.body.panCard_existing) uploadedDocs.push({ name: "PAN Card", fileUrl: req.body.panCard_existing });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    else if (req.body.addressProof_existing) uploadedDocs.push({ name: "Address Proof", fileUrl: req.body.addressProof_existing });
    if (files.businessAddressProof) uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    else if (req.body.businessAddressProof_existing) uploadedDocs.push({ name: "Business Address Proof", fileUrl: req.body.businessAddressProof_existing });
    if (files.incorpCert) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: files.incorpCert[0].path });
    else if (req.body.incorpCert_existing) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: req.body.incorpCert_existing });

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
    else if (req.body.panCard_existing) uploadedDocs.push({ name: "PAN Card", fileUrl: req.body.panCard_existing });
    if (files.businessAddressProof) uploadedDocs.push({ name: "Business Address Proof", fileUrl: files.businessAddressProof[0].path });
    else if (req.body.businessAddressProof_existing) uploadedDocs.push({ name: "Business Address Proof", fileUrl: req.body.businessAddressProof_existing });
    if (files.incorpCert) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: files.incorpCert[0].path });
    else if (req.body.incorpCert_existing) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: req.body.incorpCert_existing });
    if (files.cancelledCheque) uploadedDocs.push({ name: "Cancelled Cheque", fileUrl: files.cancelledCheque[0].path });
    else if (req.body.cancelledCheque_existing) uploadedDocs.push({ name: "Cancelled Cheque", fileUrl: req.body.cancelledCheque_existing });
    if (files.authSignatoryProof) uploadedDocs.push({ name: "Authorized Signatory ID Proof", fileUrl: files.authSignatoryProof[0].path });
    else if (req.body.authSignatoryProof_existing) uploadedDocs.push({ name: "Authorized Signatory ID Proof", fileUrl: req.body.authSignatoryProof_existing });

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
    else if (req.body.identityProof_existing) uploadedDocs.push({ name: "Identity Proof", fileUrl: req.body.identityProof_existing });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    else if (req.body.addressProof_existing) uploadedDocs.push({ name: "Address Proof", fileUrl: req.body.addressProof_existing });
    if (files.inventionDescriptionDoc) uploadedDocs.push({ name: "Invention Description", fileUrl: files.inventionDescriptionDoc[0].path });
    else if (req.body.inventionDescriptionDoc_existing) uploadedDocs.push({ name: "Invention Description", fileUrl: req.body.inventionDescriptionDoc_existing });
    if (files.drawingsDiagrams) uploadedDocs.push({ name: "Drawings / Diagrams", fileUrl: files.drawingsDiagrams[0].path });
    else if (req.body.drawingsDiagrams_existing) uploadedDocs.push({ name: "Drawings / Diagrams", fileUrl: req.body.drawingsDiagrams_existing });
    if (files.authLetter) uploadedDocs.push({ name: "Authorization Letter", fileUrl: files.authLetter[0].path });
    else if (req.body.authLetter_existing) uploadedDocs.push({ name: "Authorization Letter", fileUrl: req.body.authLetter_existing });

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
    else if (req.body.gstCert_existing) uploadedDocs.push({ name: "GST Registration Certificate", fileUrl: req.body.gstCert_existing });
    if (files.panCard) uploadedDocs.push({ name: "PAN Card", fileUrl: files.panCard[0].path });
    else if (req.body.panCard_existing) uploadedDocs.push({ name: "PAN Card", fileUrl: req.body.panCard_existing });
    if (files.supportDocs) uploadedDocs.push({ name: "Supporting Documents", fileUrl: files.supportDocs[0].path });
    else if (req.body.supportDocs_existing) uploadedDocs.push({ name: "Supporting Documents", fileUrl: req.body.supportDocs_existing });

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
    else if (req.body.salesReport_existing) uploadedDocs.push({ name: "Sales Report", fileUrl: req.body.salesReport_existing });
    if (files.purchaseReport) uploadedDocs.push({ name: "Purchase Report", fileUrl: files.purchaseReport[0].path });
    else if (req.body.purchaseReport_existing) uploadedDocs.push({ name: "Purchase Report", fileUrl: req.body.purchaseReport_existing });
    if (files.gstInvoices) uploadedDocs.push({ name: "GST Invoices", fileUrl: files.gstInvoices[0].path });
    else if (req.body.gstInvoices_existing) uploadedDocs.push({ name: "GST Invoices", fileUrl: req.body.gstInvoices_existing });

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
    else if (req.body.panCard_existing) uploadedDocs.push({ name: "PAN Card", fileUrl: req.body.panCard_existing });
    if (files.addressProof) uploadedDocs.push({ name: "Address Proof", fileUrl: files.addressProof[0].path });
    else if (req.body.addressProof_existing) uploadedDocs.push({ name: "Address Proof", fileUrl: req.body.addressProof_existing });
    if (files.cancelledCheque) uploadedDocs.push({ name: "Cancelled Cheque", fileUrl: files.cancelledCheque[0].path });
    else if (req.body.cancelledCheque_existing) uploadedDocs.push({ name: "Cancelled Cheque", fileUrl: req.body.cancelledCheque_existing });
    if (files.incorpCert) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: files.incorpCert[0].path });
    else if (req.body.incorpCert_existing) uploadedDocs.push({ name: "Incorporation Certificate", fileUrl: req.body.incorpCert_existing });

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
    
    // Note: We no longer add to advanceAmountPaid here because updateOrder already sets it to the exact value.
    await order.save();

    // Try to update checklist as well
    try {
      const Checklist = require('../models/Checklist');
      const checklists = await Checklist.find({ 
        cleint_id: order.cleintUid,
        service_name: order.serviceType,
        status: { $ne: 'completed' }
      });
      
      for (let checklistOrder of checklists) {
        if (!checklistOrder.financialLogs) checklistOrder.financialLogs = [];
        checklistOrder.financialLogs.push({
          paymentType,
          amount,
          transactionId,
          paymentTimestamp: paymentTimestamp ? new Date(paymentTimestamp) : new Date(),
          isVerified: Boolean(isVerified)
        });
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

