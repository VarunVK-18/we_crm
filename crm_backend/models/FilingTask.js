const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const FilingTaskSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // Filling Staff
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Account Manager / Admin
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Pending Documents', 'Under Review', 'Approved', 'Rejected', 'Pending', 'Completed', 'Query Raised'],
    default: 'Not Started'
  },
  documents: [DocumentSchema],
  comments: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('FilingTask', FilingTaskSchema);
