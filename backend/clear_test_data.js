require('dotenv').config();
const { connectDB } = require('./config/db');
const mongoose = require('mongoose');
const { Order, Estimation, Plant } = require('./models');

async function clearTestData() {
    console.log("🧹 Clearing All Business Data (Including Plants)...");

    try {
        await connectDB();

        console.log(" - Deleting Orders...");
        await Order.deleteMany({});

        console.log(" - Deleting Estimations...");
        await Estimation.deleteMany({});

        console.log(" - Deleting Plants (Catalog)...");
        await Plant.deleteMany({});

        console.log("✅ All data (Orders, Estimations, Plants) cleared successfully!");
    } catch (err) {
        console.error("❌ Error clearing data:", err);
    } finally {
        await mongoose.disconnect();
    }
}

clearTestData();
