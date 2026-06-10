const fs = require('fs');
let code = fs.readFileSync('controllers/authController.js', 'utf8');

const newFuncs = `

const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const User = require('../models/User');
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

    const Document = require('../models/Document');
    const doc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: user._id
    });

    user.profile_image = \`api/documents/\${doc._id}\`;
    await user.save();

    res.status(200).json({ success: true, message: 'Profile image uploaded successfully', profile_image: user.profile_image });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const User = require('../models/User');
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profile_image = '';
    await user.save();

    res.status(200).json({ success: true, message: 'Profile image removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
`;

code = code.replace(/module\.exports = \{([\s\S]*?)\};/, (match, p1) => {
  let exportsList = p1.split(',').map(s => s.trim()).filter(Boolean);
  if (!exportsList.includes('uploadProfileImage')) exportsList.push('uploadProfileImage');
  if (!exportsList.includes('removeProfileImage')) exportsList.push('removeProfileImage');
  return newFuncs + '\nmodule.exports = {\n  ' + exportsList.join(',\n  ') + '\n};';
});

fs.writeFileSync('controllers/authController.js', code);
console.log('Fixed authController.js');
