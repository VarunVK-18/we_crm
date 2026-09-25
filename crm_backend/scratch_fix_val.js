const mongoose = require('mongoose');

mongoose.connect('mongodb://193.203.161.48:27018/').then(async () => {
  console.log('Connected to DB');

  const FormSchemaModel = mongoose.model('FormSchema', new mongoose.Schema({}, { strict: false }));
  
  const forms = await FormSchemaModel.find({});
  let updatedCount = 0;

  for (let form of forms) {
    let modified = false;
    let formObj = form.toObject();

    const processFields = (fields) => {
      if (!fields) return;
      for (let field of fields) {
        let nameLower = (field.name || '').toLowerCase();
        let labelLower = (field.label || '').toLowerCase();

        // Detailed Business Activity (min 20 chars)
        if ((nameLower.includes('activity') || labelLower.includes('activity') ||
            nameLower.includes('nature') || labelLower.includes('nature') ||
            nameLower.includes('description') || labelLower.includes('description')) &&
            nameLower !== 'signature' && labelLower !== 'signature' && field.type !== 'file'
            ) {
          
          // THIS is the correct string for Javascript's `new RegExp()` in the frontend!
          field.validation.pattern = "^[a-zA-Z0-9\\s\\.,\\-\\/&'()]{20,}$";
          field.validation.message = 'Minimum 20 characters. Only alphanumeric, spaces, and basic punctuation allowed.';
          modified = true;
        }

        if (field.subFields) processFields(field.subFields);
        if (field.arrayConfig && field.subFields) processFields(field.subFields);
      }
    };

    processFields(formObj.fields);

    if (modified) {
      await FormSchemaModel.updateOne({ _id: form._id }, { $set: { fields: formObj.fields } });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} forms!`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
