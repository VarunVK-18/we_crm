const mongoose = require("mongoose");
const Document = require("./crm_backend/models/Document");

mongoose.connect("mongodb://127.0.0.1:27017/we_crm_db").then(async () => {
    const docs = await Document.find().limit(5);
    console.log(docs.map(d => ({id: d._id, filename: d.filename, contentType: d.contentType})));
    mongoose.disconnect();
}).catch(console.error);
