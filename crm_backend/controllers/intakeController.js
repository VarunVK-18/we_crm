const User = require('../models/User');
const BucketRequest = require('../models/BucketRequest');

// @desc    Receive client onboarding data from DealVoice / Softrate Sales CRM
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
      companyId,           // WE_CRM_COMPANYID from env
      companyName,
      ownerName,
      phone,
      email,
      address,
      serviceName,         // The service they signed up for (e.g. "GST Registration")
      dealvoiceClientId,
      softrateClientId,    // Softrate CL-series client ID (e.g. CL1000)
      entityName,          // Secondary entity name (only present for Add Entity requests)

      // Full company metadata from Sales CRM
      businessType,
      cin,
      incorporationDate,
      companyEmail,
      roc,
      registrationNumber,
      companyOrigin,
      classOfCompany,
      companyCategory,
      companySubcategory,
      authorisedCapital,
      paidupCapital,
      totalObligationOfContribution,
      addressType,
      mainDivisionNo,
      streetAddressLine1,
      streetAddressLine2,
      city,
      state,
      postalCode,

      // Directors array — each entry is one director
      directors,  // Array<{ firstName, lastName, din, email, phone, mobileNumber, permanentAddress*, presentAddress* }>
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
        custom_client_id: softrateClientId || null,
        owner_name: ownerName || companyName || 'New Client',
        email: email.trim(),
        phone: phone || '',
        role: 'customer',
        company_name: companyName || '',
        business_type: businessType || '',
        address: address || '',
        onboarding_status: 'Prospect',
        services: [serviceName],

        // Company fields
        cin: cin || '',
        incorporation_date: incorporationDate ? new Date(incorporationDate) : null,
        company_email: companyEmail || '',
        roc: roc || '',
        registration_number: registrationNumber || '',
        company_origin: companyOrigin || '',
        class_of_company: classOfCompany || '',
        company_category: companyCategory || '',
        company_subcategory: companySubcategory || '',
        authorised_capital: authorisedCapital || '',
        paidup_capital: paidupCapital || '',
        total_obligation_of_contribution: totalObligationOfContribution || '',
        address_type: addressType || '',
        main_division_no: mainDivisionNo || '',
        street_address_line_1: streetAddressLine1 || '',
        street_address_line_2: streetAddressLine2 || '',
        city: city || '',
        state: state || '',
        postal_code: postalCode || '',

        // Directors
        directors: buildDirectorsArray(directors),
      });
      isNew = true;
    } else {
      // Add the service if not already present
      if (!clientUser.services.includes(serviceName)) {
        clientUser.services.push(serviceName);
      }

      // Safe merge — only fill in blank/missing company fields, never overwrite existing data
      if (!clientUser.custom_client_id && softrateClientId) clientUser.custom_client_id = softrateClientId;
      if (!clientUser.business_type && businessType) clientUser.business_type = businessType;
      if (!clientUser.cin && cin) clientUser.cin = cin;
      if (!clientUser.incorporation_date && incorporationDate) {
        try { clientUser.incorporation_date = new Date(incorporationDate); } catch (e) {}
      }
      if (!clientUser.company_email && companyEmail) clientUser.company_email = companyEmail;
      if (!clientUser.roc && roc) clientUser.roc = roc;
      if (!clientUser.registration_number && registrationNumber) clientUser.registration_number = registrationNumber;
      if (!clientUser.company_origin && companyOrigin) clientUser.company_origin = companyOrigin;
      if (!clientUser.class_of_company && classOfCompany) clientUser.class_of_company = classOfCompany;
      if (!clientUser.company_category && companyCategory) clientUser.company_category = companyCategory;
      if (!clientUser.company_subcategory && companySubcategory) clientUser.company_subcategory = companySubcategory;
      if (!clientUser.authorised_capital && authorisedCapital) clientUser.authorised_capital = authorisedCapital;
      if (!clientUser.paidup_capital && paidupCapital) clientUser.paidup_capital = paidupCapital;
      if (!clientUser.total_obligation_of_contribution && totalObligationOfContribution) clientUser.total_obligation_of_contribution = totalObligationOfContribution;
      if (!clientUser.address_type && addressType) clientUser.address_type = addressType;
      if (!clientUser.main_division_no && mainDivisionNo) clientUser.main_division_no = mainDivisionNo;
      if (!clientUser.street_address_line_1 && streetAddressLine1) clientUser.street_address_line_1 = streetAddressLine1;
      if (!clientUser.street_address_line_2 && streetAddressLine2) clientUser.street_address_line_2 = streetAddressLine2;
      if (!clientUser.city && city) clientUser.city = city;
      if (!clientUser.state && state) clientUser.state = state;
      if (!clientUser.postal_code && postalCode) clientUser.postal_code = postalCode;

      // Merge directors — add any incoming director not already present (match by DIN, then by name)
      if (Array.isArray(directors) && directors.length > 0) {
        if (!clientUser.directors) clientUser.directors = [];
        for (const incoming of buildDirectorsArray(directors)) {
          const alreadyExists = clientUser.directors.some(existing => {
            if (incoming.din && existing.din) return existing.din === incoming.din;
            return (
              (existing.firstName || '').toLowerCase() === (incoming.firstName || '').toLowerCase() &&
              (existing.lastName || '').toLowerCase() === (incoming.lastName || '').toLowerCase()
            );
          });
          if (!alreadyExists) {
            clientUser.directors.push(incoming);
          }
        }
        clientUser.markModified('directors');
      }

      await clientUser.save();
    }

    // --- Handle secondary entity addition (from Add Entity flow) ---
    if (entityName && entityName.trim()) {
      const trimmedEntity = entityName.trim();
      const alreadyExists = (clientUser.client_entities || []).some(
        (e) => e.entityName.trim().toLowerCase() === trimmedEntity.toLowerCase()
      );
      if (!alreadyExists) {
        if (!clientUser.client_entities) clientUser.client_entities = [];
        clientUser.client_entities.push({ entityName: trimmedEntity, entityType: 'Company', pan: '', gstin: '' });
        clientUser.markModified('client_entities');
        await clientUser.save();
        console.log(`[Intake] Added entity "${trimmedEntity}" to client ${clientUser.email}`);
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

/**
 * Transform incoming directors array from Sales CRM into WE-CRM User.directors schema.
 * Handles both already-structured entries and raw flat objects.
 */
function buildDirectorsArray(directors) {
  if (!Array.isArray(directors) || directors.length === 0) return [];
  return directors
    .filter(d => d && (d.firstName || d.din))
    .map(d => ({
      firstName: String(d.firstName || '').trim(),
      lastName: String(d.lastName || '').trim(),
      role: String(d.role || '').trim(),
      isAuthSignatory: d.isAuthSignatory || 'No',
      email: String(d.email || '').trim(),
      phone: String(d.phone || d.mobileNumber || '').trim(),
      mobileNumber: String(d.mobileNumber || d.phone || '').trim(),
      din: String(d.din || '').trim(),
      pan: String(d.pan || '').trim(),
      aadhaar: String(d.aadhaar || '').trim(),
      dob: String(d.dob || '').trim(),
      permanentAddressLine1: String(d.permanentAddressLine1 || '').trim(),
      permanentAddressLine2: String(d.permanentAddressLine2 || '').trim(),
      permanentCity: String(d.permanentCity || '').trim(),
      permanentState: String(d.permanentState || '').trim(),
      permanentPincode: String(d.permanentPincode || '').trim(),
      presentAddressLine1: String(d.presentAddressLine1 || '').trim(),
      presentAddressLine2: String(d.presentAddressLine2 || '').trim(),
      presentCity: String(d.presentCity || '').trim(),
      presentState: String(d.presentState || '').trim(),
      presentPincode: String(d.presentPincode || '').trim(),
    }));
}

module.exports = { onboardFromDealVoice };
