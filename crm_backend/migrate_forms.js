const { MongoClient } = require('mongodb');

async function migrate() {
  const localClient = new MongoClient('mongodb://127.0.0.1:27017');
  const remoteClient = new MongoClient('mongodb://193.203.161.48:27018');

  try {
    await localClient.connect();
    await remoteClient.connect();

    const localDb = localClient.db('we_crm');
    const remoteDb = remoteClient.db('test');

    const localForms = await localDb.collection('formschemas').find({}).toArray();
    console.log('Found ' + localForms.length + ' forms in local DB.');

    for (const form of localForms) {
      delete form._id;
      await remoteDb.collection('formschemas').updateOne(
        { serviceName: form.serviceName },
        { $set: form },
        { upsert: true }
      );
    }

    console.log('Successfully migrated all forms to the remote database!');
  } catch (error) {
    console.error('Error migrating forms:', error);
  } finally {
    await localClient.close();
    await remoteClient.close();
  }
}

migrate();
