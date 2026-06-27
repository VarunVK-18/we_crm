const User = require('../models/User');
const BucketRequest = require('../models/BucketRequest');

// @desc    Receive client onboarding data from DealVoice
// @route   POST /api/intake/onboard
// @access  Protected by WE_CRM_ACCESS key in Authorization header
const onboardFromDealVoice = async (req, res) => {
  try {
    const authKey = req.headers['authorization'] || req.headers['x-we-crm-access'];
    const expectedKey = process.env.WE_CRM_ACCESS;

    if (!expectedKey || authKey !== expectedKey) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const {
      companyId,       // WE_CRM_COMPANYID from env
      companyName,
      ownerName,
      phone,
      email,
      address,
      businessType,
      serviceName,     // The service they signed up for (e.g. "GST Registration")
      dealvoiceClientId
    } = req.body;

    if (!companyId || !email || !serviceName) {
      return res.status(400).json({ success: false, message: 'companyId, email, and serviceName are required.' });
    }

    // Find or create the client user in WE-CRM
    let clientUser = await User.findOne({ email: email.trim() });
    let isNew = false;

    if (!clientUser) {
      clientUser = await User.create({
        company_id: companyId,
        owner_name: ownerName || companyName || 'New Client',
        email: email.trim(),
        phone: phone || '',
        role: 'customer',
        company_name: companyName || '',
        business_type: businessType || '',
        address: address || '',
        onboarding_status: 'Prospect',
        services: [serviceName]
      });
      isNew = true;
    } else {
      // Add the service if not already present
      if (!clientUser.services.includes(serviceName)) {
        clientUser.services.push(serviceName);
        await clientUser.save();
      }
    }

    // Create a BucketRequest so all client managers are notified
    const existing = await BucketRequest.findOne({
      company_id: companyId,
      client_id: clientUser._id,
      service_name: serviceName,
      status: { $in: ['open', 'claimed_by_manager', 'assigned'] }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Client already has an active bucket request for this service.',
        clientId: clientUser._id,
        bucketRequestId: existing._id,
        isNew: false
      });
    }

    const bucketReq = await BucketRequest.create({
      company_id: companyId,
      client_id: clientUser._id,
      service_name: serviceName,
      status: 'open',
      source: 'dealvoice',
      client_name: ownerName || companyName || '',
      client_phone: phone || '',
      client_email: email.trim(),
      client_company_name: companyName || '',
      dealvoice_client_id: dealvoiceClientId || ''
    });

    res.status(201).json({
      success: true,
      message: 'Client onboarded successfully. Bucket request created for client managers.',
      clientId: clientUser._id,
      bucketRequestId: bucketReq._id,
      isNew
    });
  } catch (err) {
    console.error('Intake onboard error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { onboardFromDealVoice };
