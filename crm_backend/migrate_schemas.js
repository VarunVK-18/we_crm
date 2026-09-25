require('dotenv').config();
const mongoose = require('mongoose');
const FormSchema = require('./models/FormSchema');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const schemas = await FormSchema.find();
    console.log(`Found ${schemas.length} schemas to process.`);

    for (const schema of schemas) {
      if (!schema.fields) continue;

      let detailsFields = [];
      let documentFields = [];

      for (const field of schema.fields) {
        if (field.type === 'file') {
          documentFields.push(field);
        } else if (field.type === 'group') {
          // Flatten group subFields
          const isDocGroup = field.name.toLowerCase().includes('document') || field.label.toLowerCase().includes('document') || field.label.toLowerCase().includes('attachment');
          if (isDocGroup) {
             if (field.subFields) {
                field.subFields.forEach(sub => documentFields.push(sub));
             }
          } else {
             if (field.subFields) {
                field.subFields.forEach(sub => {
                   if (sub.type === 'file') documentFields.push(sub);
                   else detailsFields.push(sub);
                });
             }
          }
        } else {
          detailsFields.push(field);
        }
      }

      const newFields = [
        {
          name: 'section_details',
          label: 'Details',
          type: 'group',
          subFields: detailsFields,
          required: false
        },
        {
          name: 'section_documents',
          label: 'Documents',
          type: 'group',
          subFields: documentFields,
          required: false
        }
      ];

      schema.fields = newFields;
      schema.markModified('fields');
      await schema.save();
      console.log(`Updated schema: ${schema.serviceName}`);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

migrate();
