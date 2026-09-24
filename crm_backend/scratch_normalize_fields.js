const mongoose = require('mongoose');
require('dotenv').config();

async function normalizeForms() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  const schemas = await db.collection('formschemas').find({}).toArray();
  let updatedCount = 0;

  for (const schema of schemas) {
    if (!schema.fields) continue;

    let modified = false;

    // 1. Find all document groups
    const docGroups = [];
    const otherFields1 = [];
    for (const f of schema.fields) {
      if (f.type === 'group' && (f.name.toLowerCase().includes('document') || f.label.toLowerCase().includes('document'))) {
        docGroups.push(f);
      } else {
        otherFields1.push(f);
      }
    }

    if (docGroups.length > 0) {
      // Merge all document groups into one
      const mergedDocs = {
        name: 'documents',
        label: 'Document Uploads',
        type: 'group',
        required: false,
        options: [],
        allowedExtensions: [],
        subFields: []
      };

      for (const g of docGroups) {
        if (g.subFields && g.subFields.length > 0) {
          // If the group label contained 'optional', mark all its fields as not required
          const isOptionalGroup = g.label.toLowerCase().includes('optional');
          for (const sf of g.subFields) {
            if (isOptionalGroup) {
              sf.required = false;
            }
            // Avoid duplicates
            if (!mergedDocs.subFields.find(existing => existing.name === sf.name)) {
              mergedDocs.subFields.push(sf);
            }
          }
        }
      }
      
      // If we made changes to grouping
      if (docGroups.length > 1 || docGroups[0].name !== 'documents' || docGroups[0].label !== 'Document Uploads') {
        modified = true;
      }
      otherFields1.push(mergedDocs);
    }

    // 2. Find all declaration/verification groups
    const declGroups = [];
    const otherFields2 = [];
    for (const f of otherFields1) {
      if (f.type === 'group' && (
          f.name.toLowerCase().includes('declaration') || 
          f.label.toLowerCase().includes('declaration') ||
          f.name.toLowerCase().includes('verification') || 
          f.label.toLowerCase().includes('verification')
      )) {
        declGroups.push(f);
      } else {
        otherFields2.push(f);
      }
    }

    if (declGroups.length > 0) {
      // Merge all declaration groups into one
      const mergedDecl = {
        name: 'declaration',
        label: 'Declaration',
        type: 'group',
        required: false,
        options: [],
        allowedExtensions: [],
        subFields: []
      };

      for (const g of declGroups) {
        if (g.subFields && g.subFields.length > 0) {
          for (const sf of g.subFields) {
            // Avoid duplicates
            if (!mergedDecl.subFields.find(existing => existing.name === sf.name)) {
              mergedDecl.subFields.push(sf);
            }
          }
        }
      }

      if (declGroups.length > 1 || declGroups[0].name !== 'declaration' || declGroups[0].label !== 'Declaration') {
        modified = true;
      }
      otherFields2.push(mergedDecl);
    }

    if (modified) {
      await db.collection('formschemas').updateOne(
        { _id: schema._id },
        { $set: { fields: otherFields2 } }
      );
      updatedCount++;
      console.log(`Normalized schema for: ${schema.serviceName}`);
    }
  }

  console.log(`Updated ${updatedCount} schemas.`);
  process.exit(0);
}

normalizeForms().catch(err => {
  console.error(err);
  process.exit(1);
});
