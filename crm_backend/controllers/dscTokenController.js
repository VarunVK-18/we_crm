const DscToken = require('../models/DscToken');
const DscTokenLog = require('../models/DscTokenLog');
const Checklist = require('../models/Checklist');
const User = require('../models/User');

// Get current DSC Token status
exports.getTokenStatus = async (req, res) => {
  try {
    let tokenDoc = await DscToken.findOne();
    if (!tokenDoc) {
      tokenDoc = await DscToken.create({});
    }
    res.status(200).json(tokenDoc);
  } catch (error) {
    console.error('Error fetching DSC Token status:', error);
    res.status(500).json({ message: 'Server error fetching DSC Token status.' });
  }
};

// Purchase Tokens (Super Admin only)
exports.purchaseTokens = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid purchase amount.' });
    }

    let tokenDoc = await DscToken.findOne();
    if (!tokenDoc) {
      tokenDoc = await DscToken.create({});
    }

    tokenDoc.availableTokens += amount;
    tokenDoc.totalPurchased += amount;
    await tokenDoc.save();

    // Log the transaction
    await DscTokenLog.create({
      serviceType: 'Purchase',
      applicantName: 'Admin',
      companyName: 'Wealth Empires',
      tokensAdded: amount,
      remainingBalance: tokenDoc.availableTokens,
      processedBy: req.user._id
    });

    res.status(200).json({ message: `Successfully purchased ${amount} DSC Tokens.`, data: tokenDoc });
  } catch (error) {
    console.error('Error purchasing DSC Tokens:', error);
    res.status(500).json({ message: 'Server error purchasing DSC Tokens.' });
  }
};

// Get Token Logs (Pagination)
exports.getTokenLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await DscTokenLog.find()
      .populate('processedBy', 'name owner_name email role')
      .populate({
        path: 'checklistId',
        model: 'Checklist',
        select: 'custom_service_id client_id',
        populate: {
          path: 'client_id',
          model: 'User',
          select: 'custom_client_id owner_name company_name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DscTokenLog.countDocuments();

    res.status(200).json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalLogs: total
    });
  } catch (error) {
    console.error('Error fetching DSC Token logs:', error);
    res.status(500).json({ message: 'Server error fetching DSC Token logs.' });
  }
};

// Update Warning Limit
exports.updateWarningLimit = async (req, res) => {
  try {
    const { warningLimit } = req.body;
    if (warningLimit === undefined || warningLimit < 0) {
      return res.status(400).json({ message: 'Invalid warning limit.' });
    }

    let tokenDoc = await DscToken.findOne();
    if (!tokenDoc) {
      tokenDoc = await DscToken.create({});
    }

    tokenDoc.warningLimit = warningLimit;
    await tokenDoc.save();

    res.status(200).json({ message: 'Warning limit updated successfully.', data: tokenDoc });
  } catch (error) {
    console.error('Error updating warning limit:', error);
    res.status(500).json({ message: 'Server error updating warning limit.' });
  }
};
