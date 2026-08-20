const FormSchema = require('../models/FormSchema');

// Get all form schemas (Admin)
exports.getAllForms = async (req, res) => {
  try {
    const forms = await FormSchema.find().sort({ createdAt: -1 });
    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching forms' });
  }
};

// Get a specific form schema by service name (Admin / Client)
exports.getFormByServiceName = async (req, res) => {
  try {
    const form = await FormSchema.findOne({ serviceName: req.params.serviceName });
    if (!form) return res.status(404).json({ error: 'Form schema not found' });
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching form' });
  }
};

// Create or update a form schema (Admin)
exports.upsertForm = async (req, res) => {
  try {
    const { serviceName, title, subtitle, fields, crossValidations } = req.body;

    let form = await FormSchema.findOne({ serviceName });

    if (form) {
      // Update existing
      if (title !== undefined) form.title = title;
      if (subtitle !== undefined) form.subtitle = subtitle;
      if (fields !== undefined) {
        form.fields = fields;
        form.markModified('fields');
      }
      if (crossValidations !== undefined) {
        form.crossValidations = crossValidations;
        form.markModified('crossValidations');
      }
      await form.save();
    } else {
      // Create new
      form = new FormSchema({ serviceName, title, subtitle, fields, crossValidations });
      await form.save();
    }

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ error: 'Server error saving form schema', details: error.message });
  }
};

// Delete a form schema (Admin)
exports.deleteForm = async (req, res) => {
  try {
    const form = await FormSchema.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting form' });
  }
};
