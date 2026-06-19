const Certificate = require('../models/Certificate');
const Checklist = require('../models/Checklist');
const ServiceOrder = require('../models/ServiceOrder');
const User = require('../models/User');

const getStatus = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return { status: 'Expired', daysRemaining };
  if (daysRemaining <= 7) return { status: 'Critical', daysRemaining };
  if (daysRemaining <= 30) return { status: 'Action Required', daysRemaining };
  if (daysRemaining <= 90) return { status: 'Due Soon', daysRemaining };
  if (daysRemaining <= 365) return { status: 'Renewal Upcoming', daysRemaining };
  return { status: 'Active', daysRemaining };
};

exports.getClientCertificates = async (req, res) => {
  try {
    const { clientId } = req.params;
    const certificates = await Certificate.find({ client_id: clientId });
    
    // Add dynamic daysRemaining and status to response
    const enrichedCerts = certificates.map(cert => {
      const { status, daysRemaining } = getStatus(cert.expiryDate);
      
      // We can also update the database status if it has changed, but returning dynamic is usually sufficient.
      // If it's explicitly in "Renewal Processing", maybe preserve that state.
      let finalStatus = cert.renewalStatus === 'Renewal Processing' ? 'Renewal Processing' : status;

      return {
        ...cert.toObject(),
        daysRemaining,
        renewalStatus: finalStatus
      };
    });

    res.status(200).json({ success: true, certificates: enrichedCerts });
  } catch (err) {
    console.error('Error fetching client certificates:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.renewCertificate = async (req, res) => {
  try {
    const { id } = req.params; // Certificate ID
    
    const cert = await Certificate.findById(id).populate('client_id');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    const user = cert.client_id;
    
    // Prevent duplicate renewals
    if (cert.renewalStatus === 'Renewal Processing') {
      return res.status(400).json({ success: false, message: 'Renewal request already in progress' });
    }

    const serviceName = `${cert.serviceName} Renewal`;
    
    // Create new checklist for the renewal
    const newChecklist = new Checklist({
      company_id: user.company_id,
      client_id: user._id,
      service_name: serviceName,
      created_by: user.created_by || user._id, // typically the client manager
      status: 'pending',
      stage: 'quotePending',
      items: [
        {
          title: 'Renewal Request Received',
          description: `Client requested renewal for ${cert.serviceName} (${cert.certificateNumber})`,
          label: 'Renewal Request Received',
          isChecked: true,
          checkedAt: new Date()
        }
      ],
      details: {
        entityName: cert.entityName,
        requestType: 'Renewal',
        badge: 'RENEW',
        certificateNumber: cert.certificateNumber,
        originalExpiryDate: cert.expiryDate,
        requestDate: new Date()
      }
    });

    await newChecklist.save();

    // Create ServiceOrder
    const newOrder = new ServiceOrder({
      clientUid: user._id.toString(),
      companyId: user.company_id,
      entityName: cert.entityName,
      serviceType: serviceName,
      companyName: user.company_name,
      status: 'active',
      stage: 'reqReceived',
      details: {
        requestType: 'Renewal',
        badge: 'RENEW',
        certificateNumber: cert.certificateNumber,
        originalExpiryDate: cert.expiryDate,
        requestDate: new Date()
      }
    });

    await newOrder.save();

    // Update certificate status
    cert.renewalStatus = 'Renewal Processing';
    cert.latestRenewalChecklistId = newChecklist._id;
    await cert.save();

    res.status(200).json({ success: true, message: 'Renewal request submitted successfully' });
  } catch (err) {
    console.error('Error submitting renewal request:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCertificate = async (req, res) => {
  try {
    const { client_id, entityName, serviceName, certificateNumber, issueDate, expiryDate, renewalRequired } = req.body;
    
    const cert = new Certificate({
      client_id,
      entityName,
      serviceName,
      certificateNumber,
      issueDate,
      expiryDate,
      renewalRequired
    });

    await cert.save();
    res.status(201).json({ success: true, certificate: cert });
  } catch (err) {
    console.error('Error creating certificate:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
