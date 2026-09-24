const mongoose = require('mongoose');

async function mergeOptionalDocuments() {
  await mongoose.connect('mongodb://127.0.0.1:27017/we_crm');
  const db = mongoose.connection.db;
  
  const schemas = await db.collection('formschemas').find({}).toArray();
  let updatedCount = 0;

  for (const schema of schemas) {
    if (!schema.fields) continue;

    const optionalDocIndex = schema.fields.findIndex(f => 
      f.type === 'group' && 
      f.label && 
      f.label.toLowerCase().includes('optional') && 
      f.label.toLowerCase().includes('document')
    );

    if (optionalDocIndex !== -1) {
      // Find the main documents group
      const mainDocIndex = schema.fields.findIndex(f => 
        f.type === 'group' && 
        f.label && 
        f.label.toLowerCase().includes('document') && 
        !f.label.toLowerCase().includes('optional')
      );

      if (mainDocIndex !== -1) {
        const optionalGroup = schema.fields[optionalDocIndex];
        const mainGroup = schema.fields[mainDocIndex];
        
        // Append optional subFields to main group's subFields
        if (optionalGroup.subFields && optionalGroup.subFields.length > 0) {
          // Ensure optional fields are required: false
          const optionalFields = optionalGroup.subFields.map(f => {
            f.required = false;
            return f;
          });
          
          mainGroup.subFields = mainGroup.subFields || [];
          mainGroup.subFields.push(...optionalFields);
        }

        // Remove the optional group
        schema.fields.splice(optionalDocIndex, 1);

        // Save it back to DB
        await db.collection('formschemas').updateOne(
          { _id: schema._id },
          { $set: { fields: schema.fields } }
        );
        updatedCount++;
        console.log(`Merged documents for service: ${schema.serviceName}`);
      } else {
        // If there's an optional documents group but no main one, maybe just rename it?
        console.log(`Found optional group but no main document group for: ${schema.serviceName}. Renaming it to Documents.`);
        schema.fields[optionalDocIndex].label = 'Documents';
        schema.fields[optionalDocIndex].name = 'documents_group';
        await db.collection('formschemas').updateOne(
          { _id: schema._id },
          { $set: { fields: schema.fields } }
        );
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} schemas.`);
  process.exit(0);
}

mergeOptionalDocuments().catch(err => {
  console.error(err);
  process.exit(1);
});
