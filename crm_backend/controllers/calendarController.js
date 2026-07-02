const ComplianceCalendar = require('../models/ComplianceCalendar');
const Document = require('../models/Document');
const pdfParse = require('pdf-parse');
const { parseComplianceCalendarToJSON } = require('../utils/geminiParser');

// Upload a new calendar PDF
exports.uploadCalendar = async (req, res) => {
  console.log('--- Upload Calendar Request ---');
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.originalname : 'No file');
  console.log('User:', req.user ? req.user._id : 'No user');

  try {
    const { year } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    // Save document
    const document = new Document({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: req.user ? req.user._id : null
    });
    await document.save();

    // Check if calendar for this year exists, if so update it, else create new
    let calendar = await ComplianceCalendar.findOne({ year });
    if (calendar) {
      calendar.documentId = document._id;
      calendar.uploadedBy = req.user ? req.user._id : null;
    } else {
      calendar = new ComplianceCalendar({
        year,
        documentId: document._id,
        uploadedBy: req.user ? req.user._id : null
      });
    }

    // Try to parse PDF and extract events via Gemini AI
    try {
      const pdfData = await pdfParse(req.file.buffer);
      const events = await parseComplianceCalendarToJSON(pdfData.text);
      calendar.events = events;
      console.log(`Successfully parsed ${events.length} compliance events from calendar PDF.`);
    } catch (parseErr) {
      console.error("Error parsing calendar PDF with AI:", parseErr);
      // We don't fail the upload if AI parsing fails, just leave events empty or log it
    }

    await calendar.save();

    res.status(200).json({ message: 'Calendar uploaded and processed successfully', calendar });
  } catch (err) {
    console.error('Error uploading calendar:', err);
    res.status(500).json({ message: 'Error uploading calendar', error: err.message });
  }
};

// Get the latest calendar (highest year, or most recently updated)
exports.getLatestCalendar = async (req, res) => {
  try {
    const calendar = await ComplianceCalendar.findOne().sort({ year: -1, updatedAt: -1 }).populate('documentId');
    if (!calendar) {
      return res.status(404).json({ message: 'No calendar found' });
    }
    res.status(200).json({ calendar });
  } catch (err) {
    console.error('Error fetching latest calendar:', err);
    res.status(500).json({ message: 'Error fetching latest calendar', error: err.message });
  }
};

// Get all calendars
exports.getAllCalendars = async (req, res) => {
  try {
    const calendars = await ComplianceCalendar.find().sort({ year: -1 }).populate('uploadedBy', 'name email');
    res.status(200).json({ calendars });
  } catch (err) {
    console.error('Error fetching calendars:', err);
    res.status(500).json({ message: 'Error fetching calendars', error: err.message });
  }
};

// Delete a calendar by year
exports.deleteCalendar = async (req, res) => {
  try {
    const { year } = req.params;
    const calendar = await ComplianceCalendar.findOneAndDelete({ year });
    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }
    // Also delete the associated document
    if (calendar.documentId) {
      await Document.findByIdAndDelete(calendar.documentId);
    }
    res.status(200).json({ message: 'Calendar deleted successfully' });
  } catch (err) {
    console.error('Error deleting calendar:', err);
    res.status(500).json({ message: 'Error deleting calendar', error: err.message });
  }
};
