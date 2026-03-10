const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');
const { init } = require('../models/review.js');

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("MongoDB connection successful")
}).catch(err => {
    console.log("MongoDB connection error:", err);
});

async function main() {
    await mongoose.connect(MONGO_URL);

}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: '69947ebc59aeabd0531b86d8' }));
    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");

};

initDB();


