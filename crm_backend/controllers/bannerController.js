const Banner = require('../models/Banner');
const Document = require('../models/Document');

// @desc    Get all active banners (public or client)
// @route   GET /api/banners
// @access  Public or Private
const getBanners = async (req, res) => {
  try {
    // Both clients and admins can fetch banners
    // Admins might want to see all banners, but for now we'll support query param
    const filter = {};
    if (req.query.all !== 'true') {
      filter.isActive = true;
      const now = new Date();
      filter.$or = [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } }
      ];
    }
    
    const banners = await Banner.find(filter).sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private (Admin)
const createBanner = async (req, res) => {
  try {
    const { title, targetUrl, isActive, theme, subtitle, buttonText, startDate, endDate, targetAudience, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Banner image is required' });
    }

    const f = req.files[0];
    const doc = await Document.create({
      filename: f.originalname,
      contentType: f.mimetype,
      data: f.buffer,
      uploadedBy: req.user._id
    });

    const imageUrl = `/api/documents/${doc._id}`;

    const banner = await Banner.create({
      title,
      targetUrl: targetUrl || '',
      theme: theme || 'light',
      subtitle: subtitle || '',
      buttonText: buttonText || 'Learn More',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetAudience: targetAudience || 'All',
      priority: priority ? parseInt(priority, 10) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      imageUrl,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private (Admin)
const updateBanner = async (req, res) => {
  try {
    const { title, targetUrl, isActive, theme, subtitle, buttonText, startDate, endDate, targetAudience, priority } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (title !== undefined) banner.title = title;
    if (targetUrl !== undefined) banner.targetUrl = targetUrl;
    if (isActive !== undefined) banner.isActive = isActive;
    if (theme !== undefined) banner.theme = theme;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;
    if (targetAudience !== undefined) banner.targetAudience = targetAudience;
    if (priority !== undefined) banner.priority = parseInt(priority, 10);

    if (req.files && req.files.length > 0) {
      const f = req.files[0];
      const doc = await Document.create({
        filename: f.originalname,
        contentType: f.mimetype,
        data: f.buffer,
        uploadedBy: req.user._id
      });
      banner.imageUrl = `/api/documents/${doc._id}`;
    }

    await banner.save();

    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await banner.deleteOne();
    res.json({ success: true, message: 'Banner removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Increment click count
// @route   POST /api/banners/:id/click
// @access  Public
const incrementClick = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    banner.clickCount = (banner.clickCount || 0) + 1;
    await banner.save();
    res.json({ success: true, clickCount: banner.clickCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  incrementClick
};
