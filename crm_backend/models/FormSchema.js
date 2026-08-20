const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'pan_number'
  label: { type: String, required: true }, // e.g., 'PAN Number'
  type: { 
    type: String, 
    enum: ['text', 'number', 'email', 'file', 'dropdown', 'date', 'phone', 'group', 'array', 'checkbox'], 
    required: true 
  },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // Used only if type is 'dropdown'
  allowedExtensions: [{ type: String }], // Used only if type is 'file'
  description: { type: String }, // Optional help text for the user
  visibilityCondition: { type: mongoose.Schema.Types.Mixed }, // e.g., { field: 'alreadyDirector', equals: 'No' }
  arrayConfig: {
    minItems: { type: Number },
    maxItems: { type: Number },
    dynamicCountRef: { type: String } // e.g., 'assignedNumberOfDirectors'
  }
}, { _id: false });

// Self-referencing subFields to support nested arrays/groups
fieldSchema.add({
  subFields: [fieldSchema]
});

const crossValidationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'sumEquals'
  fields: [{ type: String }], // e.g., ['shareholding']
  value: { type: mongoose.Schema.Types.Mixed }, // e.g., 100
  message: { type: String } // e.g., 'Total shareholding must be exactly 100%'
}, { _id: false });

const formSchemaSchema = new mongoose.Schema({
  serviceName: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  title: { type: String }, 
  subtitle: { type: String },
  fields: [fieldSchema],
  crossValidations: [crossValidationSchema]
}, { timestamps: true });

module.exports = mongoose.model('FormSchema', formSchemaSchema);
